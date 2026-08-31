-- =============================================================================
-- Migration 005 — Bid Submission Domain
-- Tables: bids, bid_documents, bid_hashes, bid_submissions
-- =============================================================================

-- ── bids ──────────────────────────────────────────────────────────────────────
-- Core bid record. Links a company to a tender.
-- bid_amount_paisa is ENCRYPTED at the application layer (AES-GCM).
-- The raw amount is NEVER stored in plaintext — only ciphertext.
-- Bids use a "sealed envelope" model: content is locked at submission time.
CREATE TABLE IF NOT EXISTS bids (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id             UUID        NOT NULL REFERENCES tenders(id) ON DELETE RESTRICT,
  company_id            UUID        NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  created_by            UUID        NOT NULL REFERENCES users(id),
  bid_reference         VARCHAR(100) NOT NULL UNIQUE, -- human-readable bid ref
  bid_amount_enc        TEXT,                          -- AES-GCM ciphertext of amount in paisa
  bid_amount_currency   CHAR(3)     NOT NULL DEFAULT 'INR',
  technical_proposal    TEXT,                          -- ciphertext of technical document path
  financial_proposal    TEXT,                          -- ciphertext of financial document path
  cover_letter          TEXT,                          -- ciphertext
  completion_days       INTEGER,                       -- proposed delivery period in days
  status                bid_status  NOT NULL DEFAULT 'draft',
  disqualification_reason TEXT,
  submitted_at          TIMESTAMPTZ,
  withdrawn_at          TIMESTAMPTZ,
  encryption_key_id     TEXT,                          -- KMS key reference for this bid
  metadata              JSONB       NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A company can only have ONE active (non-withdrawn, non-disqualified) bid per tender.
  -- This is enforced by the partial unique index below in migration 011.
  CONSTRAINT chk_bid_completion_days CHECK (completion_days IS NULL OR completion_days > 0)
);

COMMENT ON TABLE bids IS 'Core bid records. Bid amounts and proposals are encrypted at application layer.';
COMMENT ON COLUMN bids.bid_amount_enc IS 'AES-GCM ciphertext of the bid amount in paisa. Decrypted only during evaluation by authorized users.';
COMMENT ON COLUMN bids.encryption_key_id IS 'Reference to KMS key. Different bids may use different key versions for rotation support.';

-- ── bid_documents ─────────────────────────────────────────────────────────────
-- Individual files attached to a bid (technical proposal, financial spreadsheet, etc.)
CREATE TABLE IF NOT EXISTS bid_documents (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id          UUID            NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  uploaded_by     UUID            NOT NULL REFERENCES users(id),
  document_type   document_type   NOT NULL,
  file_name       VARCHAR(500)    NOT NULL,
  file_size_bytes BIGINT          NOT NULL,
  mime_type       VARCHAR(100)    NOT NULL,
  storage_key     TEXT            NOT NULL UNIQUE,  -- object storage path
  sha256_hash     CHAR(64)        NOT NULL,          -- hex-encoded SHA-256
  is_encrypted    BOOLEAN         NOT NULL DEFAULT TRUE,
  encryption_key_id TEXT,
  description     TEXT,
  metadata        JSONB           NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bid_documents IS 'Files attached to a bid. Files are stored in object storage; hash proves integrity.';

-- ── bid_hashes ────────────────────────────────────────────────────────────────
-- Cryptographic integrity record for each bid version.
-- Captures the SHA-256 of a canonical serialization of the bid's content at a point in time.
-- Any post-submission modification is detectable by recomputing and comparing.
CREATE TABLE IF NOT EXISTS bid_hashes (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id          UUID          NOT NULL REFERENCES bids(id) ON DELETE RESTRICT,
  version         INTEGER       NOT NULL DEFAULT 1,
  hash_algorithm  VARCHAR(20)   NOT NULL DEFAULT 'SHA-256',
  -- Canonical hash covers: bid fields + sorted document hashes + submission timestamp
  content_hash    CHAR(64)      NOT NULL,   -- hex SHA-256 of canonical bid JSON
  hash_input_json TEXT          NOT NULL,   -- the exact JSON string that was hashed (for verification)
  signed_by       UUID          REFERENCES users(id),  -- officer who verified the hash
  signed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_bid_hash_version UNIQUE (bid_id, version)
);

COMMENT ON TABLE bid_hashes IS 'Immutable integrity record. One row per bid version. Hash proves content has not been tampered with.';
COMMENT ON COLUMN bid_hashes.content_hash IS 'SHA-256 of the canonical bid JSON. Must be recomputable at any time.';
COMMENT ON COLUMN bid_hashes.hash_input_json IS 'Exact string that was hashed. Stored for independent verification.';

-- ── bid_submissions ───────────────────────────────────────────────────────────
-- A formal submission event. When a bidder clicks "Submit", a row is inserted here.
-- This is the "sealed envelope" event — after this, the bid content is locked.
-- Only ONE non-withdrawn submission per bid is allowed (enforced by partial unique index).
CREATE TABLE IF NOT EXISTS bid_submissions (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id            UUID              NOT NULL REFERENCES bids(id) ON DELETE RESTRICT,
  submitted_by      UUID              NOT NULL REFERENCES users(id),
  submission_type   submission_type   NOT NULL DEFAULT 'initial',
  bid_hash_id       UUID              NOT NULL REFERENCES bid_hashes(id), -- snapshot at submission
  ip_address        INET,                                                  -- submitter IP
  user_agent        TEXT,
  declaration_accepted BOOLEAN        NOT NULL DEFAULT FALSE, -- bidder confirmed accuracy
  receipt_token     TEXT              NOT NULL UNIQUE,        -- cryptographic receipt
  notes             TEXT,
  submitted_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  is_withdrawn      BOOLEAN           NOT NULL DEFAULT FALSE,
  withdrawn_at      TIMESTAMPTZ,
  withdrawn_by      UUID              REFERENCES users(id),
  withdrawal_reason TEXT
);

COMMENT ON TABLE bid_submissions IS 'Sealed bid submission events. A submission locks the bid. One active submission per bid.';
COMMENT ON COLUMN bid_submissions.receipt_token IS 'Cryptographically unique receipt given to bidder as proof of submission.';
COMMENT ON COLUMN bid_submissions.bid_hash_id IS 'Points to the exact hash snapshot at time of submission. Any subsequent change is detectable.';
