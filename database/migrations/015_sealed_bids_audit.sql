-- =============================================================================
-- Migration 015 — Sealed Bids Cryptographic Audit & Tamper Tracking
-- Tables modified: bids
-- Tables created: tamper_audit_logs
-- Enforces cryptographic sealing, immutable locking, and tamper detection.
-- =============================================================================

-- ── 1. Enhance bids with sealing and verification columns ────────────────────
ALTER TABLE bids
  ADD COLUMN IF NOT EXISTS is_locked         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS integrity_status VARCHAR(50) NOT NULL DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS unsealed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unsealed_by       UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS canonical_hash    CHAR(64),
  ADD COLUMN IF NOT EXISTS receipt_token     VARCHAR(200);

COMMENT ON COLUMN bids.is_locked IS 'Set to TRUE immediately upon formal submission. Locked bids cannot be updated or replaced.';
COMMENT ON COLUMN bids.integrity_status IS 'Cryptographic tamper check outcome: verified, tampered, or pending.';
COMMENT ON COLUMN bids.unsealed_at IS 'Timestamp when authorized officer unsealed bid values after deadline cutoff.';
COMMENT ON COLUMN bids.unsealed_by IS 'User ID of the authorized officer who triggered the unsealing event.';
COMMENT ON COLUMN bids.canonical_hash IS 'SHA-256 hash of the canonical JSON representation computed at submission time.';
COMMENT ON COLUMN bids.receipt_token IS 'Cryptographically unique submission receipt token issued to the bidder.';

-- ── 2. Create tamper_audit_logs for recording verification attempts ──────────
CREATE TABLE IF NOT EXISTS tamper_audit_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id          UUID        NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  checked_by      UUID        REFERENCES users(id),
  original_hash   CHAR(64)    NOT NULL,
  calculated_hash CHAR(64)    NOT NULL,
  status          VARCHAR(20) NOT NULL, -- 'MATCH' or 'MISMATCH'
  details         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tamper_audit_logs IS 'Immutable audit records of all SHA-256 tamper verification checks on submitted bids.';

-- ── 3. Performance & Tamper Audit Indexes ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bids_is_locked ON bids (is_locked);
CREATE INDEX IF NOT EXISTS idx_bids_integrity_status ON bids (integrity_status);
CREATE INDEX IF NOT EXISTS idx_bids_receipt_token ON bids (receipt_token);
CREATE INDEX IF NOT EXISTS idx_tamper_audit_bid ON tamper_audit_logs (bid_id, created_at DESC);
