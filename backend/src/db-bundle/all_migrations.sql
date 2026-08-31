-- >>> BEGIN 001_extensions.sql <<<
-- =============================================================================
-- Migration 001 — PostgreSQL Extensions
-- ProcureAI Phase 2 Database Architecture
-- =============================================================================

-- pgcrypto: gen_random_uuid(), crypt(), digest() — UUIDs + hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- uuid-ossp: uuid_generate_v4() — alternate UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pg_trgm: trigram indexes for fuzzy text search on tender titles / company names
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- citext: case-insensitive text type for emails
CREATE EXTENSION IF NOT EXISTS "citext";

-- >>> END 001_extensions.sql <<<

-- >>> BEGIN 002_enums.sql <<<
-- =============================================================================
-- Migration 002 — ENUM Types
-- ProcureAI Phase 2 Database Architecture
-- All state-machine values are enforced at the PostgreSQL level.
-- =============================================================================

-- ── User / Identity ──────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM (
  'pending_verification',   -- registered but email/identity not confirmed
  'active',                 -- fully verified, can use platform
  'suspended',              -- temporarily disabled by admin
  'deactivated'             -- permanently disabled
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Company ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE company_status AS ENUM (
  'pending_review',         -- documents submitted, awaiting KYC approval
  'verified',               -- KYC passed, can submit bids
  'rejected',               -- KYC failed
  'suspended',              -- blocked by compliance
  'deactivated'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM (
  'pending',                -- uploaded, not yet reviewed
  'approved',
  'rejected',
  'expired'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
  'registration_certificate',
  'tax_clearance',
  'audited_financials',
  'director_id',
  'bank_statement',
  'iso_certification',
  'other'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Tender ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE tender_status AS ENUM (
  'draft',                  -- being authored, not published
  'published',              -- open for bids
  'clarification',          -- Q&A period, bids on hold
  'closed',                 -- deadline passed, no new bids
  'under_evaluation',       -- AI + human evaluation in progress
  'awarded',                -- winner selected
  'cancelled'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tender_category AS ENUM (
  'infrastructure',
  'information_technology',
  'healthcare',
  'education',
  'defense',
  'agriculture',
  'energy',
  'transport',
  'environment',
  'other'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE requirement_type AS ENUM (
  'financial',              -- minimum turnover, net worth etc.
  'technical',              -- certifications, experience
  'legal',                  -- registration, compliance
  'capacity'                -- manpower, equipment
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE criteria_type AS ENUM (
  'technical',
  'financial',
  'experience',
  'delivery_timeline',
  'quality',
  'social_impact',
  'environmental'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Bid ───────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE bid_status AS ENUM (
  'draft',                  -- being composed, not submitted
  'submitted',              -- formally submitted (sealed)
  'withdrawn',              -- voluntarily withdrawn before close
  'disqualified',           -- failed eligibility
  'under_evaluation',       -- actively being scored
  'shortlisted',
  'rejected',
  'awarded'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_type AS ENUM (
  'initial',                -- first submission
  'revision',               -- allowed amendment before deadline
  'final'                   -- explicitly marked final by bidder
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── AI Pipeline ───────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE eligibility_status AS ENUM (
  'pass',
  'fail',
  'waived',                 -- manually waived by officer with reason
  'not_applicable'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE evaluation_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',                 -- AI pipeline error
  'cancelled'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recommendation_type AS ENUM (
  'award',
  'reject',
  'shortlist',
  'request_clarification',
  'flag_for_review'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_category AS ENUM (
  'financial',
  'compliance',
  'capacity',
  'experience',
  'conflict_of_interest',
  'data_integrity',
  'bid_manipulation'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE anomaly_type AS ENUM (
  'price_collusion',        -- bids suspiciously similar across companies
  'bid_clustering',         -- multiple bids cluster near the estimate
  'shill_bidding',          -- same entity bidding under different companies
  'document_tampering',     -- hash mismatch on documents
  'abnormal_low_bid',       -- far below market rate (potential dumping)
  'abnormal_high_bid',
  'late_surge',             -- sudden bid pattern change near deadline
  'other'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE anomaly_severity AS ENUM (
  'informational',
  'warning',
  'critical'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Decision ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE decision_type AS ENUM (
  'award',
  'reject',
  'defer',                  -- defer to committee / legal review
  'cancel_tender',
  're_tender'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE override_reason_type AS ENUM (
  'ai_error',               -- AI produced incorrect result
  'additional_information', -- officer has info AI did not
  'policy_exception',       -- government policy override
  'emergency',              -- emergency procurement rules
  'committee_directive',    -- higher authority instruction
  'other'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Observability ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
  -- identity
  'user_registered', 'user_verified', 'user_suspended', 'user_login', 'user_logout',
  -- company
  'company_created', 'company_verified', 'company_suspended', 'document_uploaded', 'document_approved',
  -- tender
  'tender_created', 'tender_published', 'tender_closed', 'tender_cancelled',
  -- bid
  'bid_created', 'bid_submitted', 'bid_withdrawn', 'bid_disqualified',
  -- AI pipeline
  'eligibility_check_run', 'ai_evaluation_started', 'ai_evaluation_completed',
  'ai_recommendation_generated',
  -- decision
  'decision_made', 'decision_overridden',
  -- system
  'anomaly_detected', 'risk_flag_raised', 'schema_migrated'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
  'tender_published',
  'bid_received',
  'bid_status_changed',
  'eligibility_result',
  'evaluation_completed',
  'decision_made',
  'document_expiry_warning',
  'anomaly_alert',
  'system_alert'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'sms'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed',
  'read'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- >>> END 002_enums.sql <<<

-- >>> BEGIN 003_identity.sql <<<
-- =============================================================================
-- Migration 003 — Identity & Access Domain
-- Tables: roles, users, companies, company_documents
-- =============================================================================

-- ── roles ─────────────────────────────────────────────────────────────────────
-- Predefined system roles. Not extensible by users (no UI CRUD).
-- Permissions are enforced at the application layer using role codes.
CREATE TABLE IF NOT EXISTS roles (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50)   NOT NULL UNIQUE,  -- e.g. 'GOVT_OFFICER', 'BIDDER'
  name        VARCHAR(100)  NOT NULL,
  description TEXT,
  permissions JSONB         NOT NULL DEFAULT '[]', -- array of permission strings
  is_system   BOOLEAN       NOT NULL DEFAULT FALSE, -- cannot be deleted if TRUE
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'System roles. Permissions are stored as a JSON array of strings for forward-compatible RBAC.';
COMMENT ON COLUMN roles.code IS 'Machine-readable role identifier used in application code.';
COMMENT ON COLUMN roles.permissions IS 'JSON array of permission strings e.g. ["tender:read","bid:evaluate"]';

-- ── users ─────────────────────────────────────────────────────────────────────
-- All platform principals: government officers, evaluators, bidder representatives, admins.
-- Bidder reps are linked to a company. Officer/evaluator users have company_id NULL.
-- Password hash is stored; raw password NEVER persisted.
CREATE TABLE IF NOT EXISTS users (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id             UUID          NOT NULL REFERENCES roles(id),
  company_id          UUID,                        -- FK added after companies table exists
  email               CITEXT        NOT NULL UNIQUE,
  password_hash       TEXT          NOT NULL,       -- bcrypt hash, min cost 12
  full_name           VARCHAR(200)  NOT NULL,
  phone_number        TEXT,                         -- encrypted at application layer
  employee_id         VARCHAR(100),                 -- govt employee ID (officers only)
  department          VARCHAR(200),                 -- government department (officers only)
  designation         VARCHAR(200),                 -- job title
  status              user_status   NOT NULL DEFAULT 'pending_verification',
  email_verified_at   TIMESTAMPTZ,
  last_login_at       TIMESTAMPTZ,
  failed_login_count  INTEGER       NOT NULL DEFAULT 0,
  locked_until        TIMESTAMPTZ,                  -- brute-force lockout
  avatar_url          TEXT,
  metadata            JSONB         NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'All platform users. Bidder reps have company_id set. Government users have employee_id/department.';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash at cost 12. Never store plaintext.';
COMMENT ON COLUMN users.phone_number IS 'Stored encrypted (AES-GCM) at application layer.';
COMMENT ON COLUMN users.metadata IS 'Arbitrary key-value pairs for future extensibility (e.g. 2FA config, notification prefs).';

-- ── companies ─────────────────────────────────────────────────────────────────
-- Registered bidder entities. A company must be "verified" before submitting bids.
-- Financial figures are stored as BIGINT representing paisa (1 INR = 100 paisa)
-- to avoid floating-point rounding in monetary calculations.
CREATE TABLE IF NOT EXISTS companies (
  id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by              UUID            NOT NULL REFERENCES users(id),
  registration_number     VARCHAR(100)    NOT NULL UNIQUE,  -- official company reg no.
  name                    VARCHAR(300)    NOT NULL,
  legal_name              VARCHAR(300)    NOT NULL,
  industry                VARCHAR(100),
  address_line1           TEXT            NOT NULL,
  address_line2           TEXT,
  city                    VARCHAR(100)    NOT NULL,
  state                   VARCHAR(100)    NOT NULL,
  country                 VARCHAR(100)    NOT NULL DEFAULT 'India',
  postal_code             VARCHAR(20)     NOT NULL,
  website                 TEXT,
  annual_turnover_paisa   BIGINT,                   -- most recent audited figure, encrypted
  net_worth_paisa         BIGINT,                   -- encrypted at application layer
  employee_count          INTEGER,
  years_in_operation      INTEGER,
  status                  company_status  NOT NULL DEFAULT 'pending_review',
  verified_at             TIMESTAMPTZ,
  verified_by             UUID            REFERENCES users(id),
  rejection_reason        TEXT,
  metadata                JSONB           NOT NULL DEFAULT '{}',
  encryption_key_id       TEXT,                     -- references key in external KMS
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE companies IS 'Registered bidder companies. Must be verified before submitting bids.';
COMMENT ON COLUMN companies.annual_turnover_paisa IS 'Stored in paisa (1 INR = 100 paisa) to avoid float rounding. Encrypted at app layer.';
COMMENT ON COLUMN companies.encryption_key_id IS 'Reference to KMS key used to encrypt sensitive financial fields.';

-- ── Add company_id FK back to users now that companies table exists ───────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_company') THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE SET NULL;
  END IF;
END $$;

-- ── company_documents ─────────────────────────────────────────────────────────
-- KYC / compliance documents attached to a company.
-- The actual file is stored in object storage (S3/GCS); only the reference lives here.
CREATE TABLE IF NOT EXISTS company_documents (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID            NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by     UUID            NOT NULL REFERENCES users(id),
  document_type   document_type   NOT NULL,
  file_name       VARCHAR(500)    NOT NULL,
  file_size_bytes BIGINT          NOT NULL,
  mime_type       VARCHAR(100)    NOT NULL,
  storage_key     TEXT            NOT NULL UNIQUE, -- object storage path/key
  sha256_hash     CHAR(64)        NOT NULL,        -- hex-encoded SHA-256 of file content
  status          document_status NOT NULL DEFAULT 'pending',
  valid_from      DATE,
  valid_until     DATE,                            -- NULL = no expiry
  reviewed_by     UUID            REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  metadata        JSONB           NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE company_documents IS 'KYC/compliance documents. File stored in object storage; only reference + hash here.';
COMMENT ON COLUMN company_documents.sha256_hash IS 'Hex-encoded SHA-256. Used to detect tampering after upload.';
COMMENT ON COLUMN company_documents.storage_key IS 'Object storage key (e.g. S3 key). Should not contain PII directly.';

-- >>> END 003_identity.sql <<<

-- >>> BEGIN 004_procurement.sql <<<
-- =============================================================================
-- Migration 004 — Procurement Lifecycle Domain
-- Tables: tenders, tender_requirements, tender_evaluation_criteria
-- =============================================================================

-- ── tenders ───────────────────────────────────────────────────────────────────
-- A tender is a government request for bids on a specific procurement.
-- Budget figures stored in paisa (1 INR = 100 paisa) — BIGINT, no float rounding.
CREATE TABLE IF NOT EXISTS tenders (
  id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by              UUID            NOT NULL REFERENCES users(id),
  reference_number        VARCHAR(100)    NOT NULL UNIQUE, -- official tender reference
  title                   VARCHAR(500)    NOT NULL,
  description             TEXT            NOT NULL,
  category                tender_category NOT NULL,
  department              VARCHAR(300)    NOT NULL,        -- issuing government department
  estimated_budget_paisa  BIGINT,                          -- indicative budget (may be hidden from bidders)
  budget_is_public        BOOLEAN         NOT NULL DEFAULT FALSE,
  currency                CHAR(3)         NOT NULL DEFAULT 'INR',
  submission_start_at     TIMESTAMPTZ     NOT NULL,
  submission_deadline_at  TIMESTAMPTZ     NOT NULL,
  evaluation_deadline_at  TIMESTAMPTZ,
  project_start_date      DATE,
  project_duration_days   INTEGER,
  status                  tender_status   NOT NULL DEFAULT 'draft',
  published_at            TIMESTAMPTZ,
  closed_at               TIMESTAMPTZ,
  awarded_at              TIMESTAMPTZ,
  awarded_to_bid_id       UUID,                            -- FK added after bids table
  cancellation_reason     TEXT,
  contact_email           CITEXT,
  contact_phone           TEXT,
  documents               JSONB           NOT NULL DEFAULT '[]', -- array of {name, storage_key, sha256}
  tags                    TEXT[]          NOT NULL DEFAULT '{}',
  metadata                JSONB           NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_tender_deadline_after_start
    CHECK (submission_deadline_at > submission_start_at),
  CONSTRAINT chk_tender_budget_positive
    CHECK (estimated_budget_paisa IS NULL OR estimated_budget_paisa > 0)
);

COMMENT ON TABLE tenders IS 'Government procurement tenders. Central entity of the platform.';
COMMENT ON COLUMN tenders.reference_number IS 'Official government reference number. Must be unique per tender.';
COMMENT ON COLUMN tenders.estimated_budget_paisa IS 'Stored in paisa. May be hidden from bidders (budget_is_public=false).';
COMMENT ON COLUMN tenders.documents IS 'JSON array of tender documents stored in object storage: [{name, storage_key, sha256, uploaded_at}]';

-- ── tender_requirements ───────────────────────────────────────────────────────
-- Mandatory eligibility requirements that bidders MUST meet to qualify.
-- Each requirement is independently checked during eligibility screening.
CREATE TABLE IF NOT EXISTS tender_requirements (
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id       UUID              NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  requirement_type requirement_type NOT NULL,
  title           VARCHAR(300)      NOT NULL,
  description     TEXT              NOT NULL,
  is_mandatory    BOOLEAN           NOT NULL DEFAULT TRUE,  -- FALSE = preferred but not disqualifying
  threshold_value NUMERIC(20, 4),                           -- numeric threshold if applicable
  threshold_unit  VARCHAR(50),                              -- 'INR', 'years', 'employees', etc.
  verification_method TEXT,                                 -- how officer verifies compliance
  sort_order      INTEGER           NOT NULL DEFAULT 0,
  metadata        JSONB             NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tender_requirements IS 'Eligibility requirements per tender. Mandatory ones disqualify non-compliant bidders.';
COMMENT ON COLUMN tender_requirements.threshold_value IS 'Numeric threshold e.g. 50000000.00 for "minimum 5 Cr turnover".';

-- ── tender_evaluation_criteria ────────────────────────────────────────────────
-- Weighted scoring criteria used by AI and human evaluators.
-- All weights within a tender MUST sum to exactly 100 (enforced by app layer + trigger).
CREATE TABLE IF NOT EXISTS tender_evaluation_criteria (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id       UUID            NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  criteria_type   criteria_type   NOT NULL,
  name            VARCHAR(300)    NOT NULL,
  description     TEXT,
  weight          NUMERIC(5, 2)   NOT NULL,    -- percentage weight, e.g. 40.00
  max_score       NUMERIC(5, 2)   NOT NULL DEFAULT 100.00,
  scoring_rubric  JSONB           NOT NULL DEFAULT '{}', -- {score: description} mapping
  is_ai_scored    BOOLEAN         NOT NULL DEFAULT TRUE,
  sort_order      INTEGER         NOT NULL DEFAULT 0,
  metadata        JSONB           NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_criteria_weight_positive CHECK (weight > 0),
  CONSTRAINT chk_criteria_weight_max      CHECK (weight <= 100),
  CONSTRAINT chk_criteria_max_score       CHECK (max_score > 0)
);

COMMENT ON TABLE tender_evaluation_criteria IS 'Weighted scoring criteria. All weights per tender must sum to 100.';
COMMENT ON COLUMN tender_evaluation_criteria.scoring_rubric IS 'JSON object: {"90": "Excellent — full compliance", "70": "Good — minor gaps", ...}';
COMMENT ON COLUMN tender_evaluation_criteria.is_ai_scored IS 'If FALSE, this criterion is scored manually by human evaluator only.';

-- >>> END 004_procurement.sql <<<

-- >>> BEGIN 005_bids.sql <<<
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

-- >>> END 005_bids.sql <<<

-- >>> BEGIN 006_ai_pipeline.sql <<<
-- =============================================================================
-- Migration 006 — AI Pipeline Domain
-- Tables: eligibility_results, ai_evaluations, ai_scores, ai_recommendations
-- =============================================================================

-- ── eligibility_results ───────────────────────────────────────────────────────
-- Per-requirement eligibility check result for each bid.
-- One row per (bid, requirement) pair — full matrix of bid × requirement results.
-- A bid is disqualified if ANY mandatory requirement returns 'fail' and is not 'waived'.
CREATE TABLE IF NOT EXISTS eligibility_results (
  id                    UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id                UUID                NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  requirement_id        UUID                NOT NULL REFERENCES tender_requirements(id) ON DELETE CASCADE,
  checked_by_user       UUID                REFERENCES users(id), -- NULL = automated check
  status                eligibility_status  NOT NULL,
  score                 NUMERIC(5, 2),                            -- 0-100 if quantifiable
  evidence_summary      TEXT,                                     -- what was found / verified
  verification_notes    TEXT,                                     -- officer's notes
  waiver_reason         TEXT,                                     -- if status = 'waived'
  waived_by             UUID                REFERENCES users(id),
  checked_at            TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  metadata              JSONB               NOT NULL DEFAULT '{}',

  CONSTRAINT uq_eligibility_bid_requirement UNIQUE (bid_id, requirement_id)
);

COMMENT ON TABLE eligibility_results IS 'Per-requirement pass/fail for each bid. One row per (bid, requirement) pair.';
COMMENT ON COLUMN eligibility_results.waiver_reason IS 'Mandatory if status = waived. Records the justification for the waiver.';

-- ── ai_evaluations ────────────────────────────────────────────────────────────
-- One row per AI evaluation run per tender.
-- A tender may be re-evaluated (different model version, additional bids).
-- Each evaluation run produces N ai_scores (one per criteria) and ONE ai_recommendation per bid.
CREATE TABLE IF NOT EXISTS ai_evaluations (
  id                UUID                NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id         UUID                NOT NULL REFERENCES tenders(id) ON DELETE RESTRICT,
  triggered_by      UUID                REFERENCES users(id), -- NULL = auto-triggered
  model_name        VARCHAR(100)        NOT NULL,             -- e.g. 'procureai-eval-v1'
  model_version     VARCHAR(50)         NOT NULL,             -- semantic version
  model_config      JSONB               NOT NULL DEFAULT '{}', -- hyperparameters used
  status            evaluation_status   NOT NULL DEFAULT 'pending',
  bids_evaluated    INTEGER             NOT NULL DEFAULT 0,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  error_message     TEXT,
  runtime_seconds   NUMERIC(8, 2),
  metadata          JSONB               NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_evaluations IS 'AI evaluation run per tender. Produces ai_scores and ai_recommendations for all eligible bids.';
COMMENT ON COLUMN ai_evaluations.model_config IS 'Reproducibility: exact config snapshot used for the run.';

-- ── ai_scores ─────────────────────────────────────────────────────────────────
-- Per-criteria AI score for a specific bid in a specific evaluation run.
-- One row per (evaluation, bid, criteria) triple.
-- Separating scores from the evaluation run allows partial re-scoring.
CREATE TABLE IF NOT EXISTS ai_scores (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id     UUID          NOT NULL REFERENCES ai_evaluations(id) ON DELETE CASCADE,
  bid_id            UUID          NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  criteria_id       UUID          NOT NULL REFERENCES tender_evaluation_criteria(id) ON DELETE CASCADE,
  raw_score         NUMERIC(5, 2) NOT NULL,           -- 0–max_score
  weighted_score    NUMERIC(7, 4) NOT NULL,            -- raw_score * weight / 100
  confidence        NUMERIC(4, 3),                     -- 0.000–1.000 AI confidence
  explanation       TEXT          NOT NULL,             -- human-readable AI rationale
  evidence_refs     JSONB         NOT NULL DEFAULT '[]', -- [{source, excerpt, relevance_score}]
  flags             TEXT[]        NOT NULL DEFAULT '{}', -- e.g. ['missing_data', 'low_confidence']
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_ai_score_eval_bid_criteria UNIQUE (evaluation_id, bid_id, criteria_id),
  CONSTRAINT chk_ai_score_raw             CHECK (raw_score >= 0),
  CONSTRAINT chk_ai_score_confidence      CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

COMMENT ON TABLE ai_scores IS 'Per-criterion AI scores for each bid in an evaluation run. Enables granular explainability.';
COMMENT ON COLUMN ai_scores.explanation IS 'Narrative explanation for this criterion score. Mandatory for transparency.';
COMMENT ON COLUMN ai_scores.evidence_refs IS 'Array of evidence references: [{source: "bid_doc", excerpt: "...", relevance: 0.92}]';
COMMENT ON COLUMN ai_scores.flags IS 'Array of warning flags raised for this score: missing_data, low_confidence, requires_review.';

-- ── ai_recommendations ────────────────────────────────────────────────────────
-- Final AI recommendation per bid per evaluation run.
-- ONE recommendation per (evaluation, bid) pair.
-- Provides an overall recommendation with total score and reasoning summary.
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id       UUID                  NOT NULL REFERENCES ai_evaluations(id) ON DELETE CASCADE,
  bid_id              UUID                  NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  recommendation      recommendation_type   NOT NULL,
  total_score         NUMERIC(6, 2)         NOT NULL,  -- sum of all weighted_scores
  rank                INTEGER,                          -- rank among all bids for this tender
  confidence          NUMERIC(4, 3)         NOT NULL,  -- 0.000–1.000
  reasoning_summary   TEXT                  NOT NULL,  -- high-level narrative
  key_strengths       TEXT[]                NOT NULL DEFAULT '{}',
  key_weaknesses      TEXT[]                NOT NULL DEFAULT '{}',
  concerns            TEXT[]                NOT NULL DEFAULT '{}',
  bias_check_passed   BOOLEAN               NOT NULL DEFAULT TRUE,
  bias_check_notes    TEXT,
  metadata            JSONB                 NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_ai_recommendation_eval_bid UNIQUE (evaluation_id, bid_id),
  CONSTRAINT chk_ai_rec_confidence CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT chk_ai_rec_rank       CHECK (rank IS NULL OR rank > 0)
);

COMMENT ON TABLE ai_recommendations IS 'Final AI recommendation per bid per evaluation. One row per (evaluation, bid).';
COMMENT ON COLUMN ai_recommendations.bias_check_passed IS 'Whether the recommendation passed the fairness/bias audit check.';
COMMENT ON COLUMN ai_recommendations.rank IS '1 = top-ranked bid. NULL if ranking not yet computed.';

-- >>> END 006_ai_pipeline.sql <<<

-- >>> BEGIN 007_risk_anomaly.sql <<<
-- =============================================================================
-- Migration 007 — Risk & Anomaly Detection Domain
-- Tables: risk_assessments, anomaly_results
-- =============================================================================

-- ── risk_assessments ──────────────────────────────────────────────────────────
-- Per-bid risk profile generated by the AI pipeline.
-- Multiple risk flags can exist per bid (one row per risk category per bid).
-- Aggregated risk level determines if a bid needs additional scrutiny.
CREATE TABLE IF NOT EXISTS risk_assessments (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id            UUID          NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  evaluation_id     UUID          REFERENCES ai_evaluations(id) ON DELETE SET NULL,
  assessed_by       UUID          REFERENCES users(id),  -- NULL = automated
  risk_category     risk_category NOT NULL,
  risk_level        risk_level    NOT NULL,
  title             VARCHAR(300)  NOT NULL,
  description       TEXT          NOT NULL,
  evidence          JSONB         NOT NULL DEFAULT '{}',  -- supporting data
  mitigation_notes  TEXT,
  is_resolved       BOOLEAN       NOT NULL DEFAULT FALSE,
  resolved_by       UUID          REFERENCES users(id),
  resolved_at       TIMESTAMPTZ,
  resolution_notes  TEXT,
  metadata          JSONB         NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE risk_assessments IS 'Risk flags per bid per category. Multiple risks can exist per bid.';
COMMENT ON COLUMN risk_assessments.evidence IS 'Supporting evidence JSON: {source, excerpt, confidence, data_points[]}';
COMMENT ON COLUMN risk_assessments.is_resolved IS 'Set to TRUE when a human officer reviews and dismisses or addresses the risk.';

-- ── anomaly_results ───────────────────────────────────────────────────────────
-- Cross-bid anomaly detection results. Anomalies are tender-level, not bid-level.
-- Detected by comparing bids ACROSS the tender (collusion, clustering, etc.)
-- May reference multiple bids via the `affected_bid_ids` array.
CREATE TABLE IF NOT EXISTS anomaly_results (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id         UUID              NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  evaluation_id     UUID              REFERENCES ai_evaluations(id) ON DELETE SET NULL,
  detected_by       UUID              REFERENCES users(id),  -- NULL = automated
  anomaly_type      anomaly_type      NOT NULL,
  severity          anomaly_severity  NOT NULL,
  title             VARCHAR(300)      NOT NULL,
  description       TEXT              NOT NULL,
  affected_bid_ids  UUID[]            NOT NULL DEFAULT '{}',  -- bids involved
  detection_data    JSONB             NOT NULL DEFAULT '{}',  -- raw detection evidence
  confidence_score  NUMERIC(4, 3),                            -- 0.000–1.000
  is_confirmed      BOOLEAN,                                  -- NULL = pending review
  reviewed_by       UUID              REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  review_notes      TEXT,
  escalated_to      UUID              REFERENCES users(id),   -- if escalated
  escalated_at      TIMESTAMPTZ,
  metadata          JSONB             NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_anomaly_confidence
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

COMMENT ON TABLE anomaly_results IS 'Cross-bid anomaly detection results at tender level. NULL is_confirmed = pending human review.';
COMMENT ON COLUMN anomaly_results.affected_bid_ids IS 'Array of bid UUIDs involved in the anomaly. Used for cross-referencing without FK overhead.';
COMMENT ON COLUMN anomaly_results.is_confirmed IS 'NULL = not yet reviewed. TRUE = confirmed anomaly. FALSE = dismissed false positive.';

-- >>> END 007_risk_anomaly.sql <<<

-- >>> BEGIN 008_decisions.sql <<<
-- =============================================================================
-- Migration 008 — Human Decision Domain
-- Tables: government_decisions, decision_overrides
-- =============================================================================

-- ── government_decisions ──────────────────────────────────────────────────────
-- The authoritative human decision on a tender's outcome.
-- ONE decision per tender (enforced by unique index below).
-- A government officer must make the final decision, even when following AI recommendation.
-- This embodies: "AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS."
CREATE TABLE IF NOT EXISTS government_decisions (
  id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id             UUID            NOT NULL REFERENCES tenders(id) ON DELETE RESTRICT,
  decided_by            UUID            NOT NULL REFERENCES users(id),
  ai_recommendation_id  UUID            REFERENCES ai_recommendations(id),  -- NULL if AI not run
  decision              decision_type   NOT NULL,
  awarded_bid_id        UUID            REFERENCES bids(id),  -- set when decision = 'award'
  rationale             TEXT            NOT NULL,             -- mandatory justification
  followed_ai           BOOLEAN         NOT NULL,             -- did officer follow AI recommendation?
  ai_agreement_score    NUMERIC(4, 3),                        -- 0–1, how closely decision matched AI
  committee_approval    BOOLEAN         NOT NULL DEFAULT FALSE,
  committee_ref         VARCHAR(200),                         -- official committee reference
  appeal_deadline_at    TIMESTAMPTZ,                          -- deadline for vendors to appeal
  is_final              BOOLEAN         NOT NULL DEFAULT FALSE,
  effective_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  metadata              JSONB           NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_decision_award_bid
    CHECK (decision != 'award' OR awarded_bid_id IS NOT NULL),
  CONSTRAINT chk_decision_ai_agreement
    CHECK (ai_agreement_score IS NULL OR (ai_agreement_score >= 0 AND ai_agreement_score <= 1))
);

-- One final decision per tender
CREATE UNIQUE INDEX IF NOT EXISTS uq_government_decision_tender
  ON government_decisions(tender_id)
  WHERE is_final = TRUE;

COMMENT ON TABLE government_decisions IS 'Authoritative human decision per tender. Embodies: HUMANS DECIDE.';
COMMENT ON COLUMN government_decisions.followed_ai IS 'Explicit flag: did the officer follow the AI recommendation? Enables governance analytics.';
COMMENT ON COLUMN government_decisions.rationale IS 'Mandatory written justification. Must reference specific criteria and evidence.';
COMMENT ON COLUMN government_decisions.ai_agreement_score IS 'Quantified agreement between human decision and AI recommendation (0=fully disagreed, 1=fully agreed).';

-- ── decision_overrides ────────────────────────────────────────────────────────
-- When an officer overrides the AI recommendation, a detailed record is REQUIRED.
-- This creates accountability and enables future model improvement.
-- Only relevant when followed_ai = FALSE on the parent government_decision.
CREATE TABLE IF NOT EXISTS decision_overrides (
  id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id       UUID                  NOT NULL UNIQUE REFERENCES government_decisions(id) ON DELETE CASCADE,
  override_by       UUID                  NOT NULL REFERENCES users(id),
  reason_type       override_reason_type  NOT NULL,
  reason_detail     TEXT                  NOT NULL,   -- detailed justification (min 100 chars enforced at app layer)
  ai_score_at_time  NUMERIC(6, 2),                    -- AI total score for the rejected recommendation
  human_score       NUMERIC(6, 2),                    -- officer's own scoring
  supporting_docs   JSONB                 NOT NULL DEFAULT '[]', -- [{name, storage_key}]
  reviewed_by       UUID                  REFERENCES users(id),  -- compliance reviewer
  reviewed_at       TIMESTAMPTZ,
  is_approved       BOOLEAN,                           -- NULL = pending compliance review
  compliance_notes  TEXT,
  created_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE decision_overrides IS 'Mandatory record when officer overrides AI recommendation. One-to-one with government_decisions.';
COMMENT ON COLUMN decision_overrides.reason_detail IS 'Detailed justification. Application enforces minimum 100 character requirement.';
COMMENT ON COLUMN decision_overrides.is_approved IS 'NULL = pending compliance review. TRUE = override approved. FALSE = override flagged.';

-- >>> END 008_decisions.sql <<<

-- >>> BEGIN 009_observability.sql <<<
-- =============================================================================
-- Migration 009 — Observability Domain
-- Tables: audit_logs, notifications
-- Also preserves Phase 1 service_health_log
-- =============================================================================

-- ── audit_logs ────────────────────────────────────────────────────────────────
-- IMMUTABLE append-only audit trail of all system actions.
-- NO UPDATE or DELETE is ever issued on this table.
-- Row security policy (Phase 3) will enforce this at DB level.
-- actor_id may be NULL for system-generated events.
-- target_* allows logging actions against any entity type.
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID          REFERENCES users(id) ON DELETE SET NULL,  -- who did it
  action          audit_action  NOT NULL,
  target_type     VARCHAR(100)  NOT NULL,   -- table name: 'tenders', 'bids', etc.
  target_id       UUID,                     -- PK of the affected row
  target_ref      VARCHAR(200),             -- human-readable reference (tender ref no, bid ref)
  previous_state  JSONB,                    -- snapshot BEFORE the change (for diffs)
  new_state       JSONB,                    -- snapshot AFTER the change
  ip_address      INET,
  user_agent      TEXT,
  session_id      TEXT,
  correlation_id  TEXT,                     -- trace ID for distributed request tracing
  metadata        JSONB         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  -- Intentionally NO updated_at — this table is append-only
);

COMMENT ON TABLE audit_logs IS 'IMMUTABLE append-only audit trail. Never UPDATE or DELETE. Embodies: SYSTEM AUDITS.';
COMMENT ON COLUMN audit_logs.previous_state IS 'Full JSON snapshot of the row BEFORE the action. NULL for creation events.';
COMMENT ON COLUMN audit_logs.new_state IS 'Full JSON snapshot of the row AFTER the action. NULL for deletion events.';
COMMENT ON COLUMN audit_logs.correlation_id IS 'Distributed trace ID for correlating events across microservices.';

-- Prevent accidental updates/deletes via trigger
CREATE OR REPLACE FUNCTION fn_audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is immutable — UPDATE and DELETE are not permitted (action=%, target_id=%)',
    OLD.action, OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON audit_logs;
CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log_immutable();

-- ── notifications ─────────────────────────────────────────────────────────────
-- System notifications delivered to users via in-app, email, or SMS.
-- Allows future multi-channel fan-out without schema changes.
CREATE TABLE IF NOT EXISTS notifications (
  id                UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type notification_type       NOT NULL,
  channel           notification_channel    NOT NULL DEFAULT 'in_app',
  status            notification_status     NOT NULL DEFAULT 'pending',
  subject           VARCHAR(500)            NOT NULL,
  body              TEXT                    NOT NULL,
  -- Optional references to the entity that triggered the notification
  related_tender_id UUID                    REFERENCES tenders(id) ON DELETE SET NULL,
  related_bid_id    UUID                    REFERENCES bids(id) ON DELETE SET NULL,
  priority          SMALLINT                NOT NULL DEFAULT 0,  -- 0=normal, 1=high, 2=critical
  send_after_at     TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  read_at           TIMESTAMPTZ,
  failed_reason     TEXT,
  retry_count       SMALLINT                NOT NULL DEFAULT 0,
  metadata          JSONB                   NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_notification_priority CHECK (priority BETWEEN 0 AND 2),
  CONSTRAINT chk_notification_retries  CHECK (retry_count >= 0)
);

COMMENT ON TABLE notifications IS 'Multi-channel notification queue. Supports in_app, email, and SMS delivery.';
COMMENT ON COLUMN notifications.priority IS '0=normal, 1=high, 2=critical. Higher priority notifications are processed first.';
COMMENT ON COLUMN notifications.send_after_at IS 'Earliest time to send. Enables scheduled/delayed notifications.';

-- ── service_health_log (Phase 1 — preserved) ─────────────────────────────────
-- Originally created in Phase 1. Kept for infrastructure health monitoring.
CREATE TABLE IF NOT EXISTS service_health_log (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100)  NOT NULL,
  status       VARCHAR(50)   NOT NULL DEFAULT 'healthy',
  message      TEXT,
  metadata     JSONB         NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE service_health_log IS 'Phase 1 infrastructure health log. Preserved for backward compatibility.';

-- >>> END 009_observability.sql <<<

-- >>> BEGIN 010_indexes.sql <<<
-- =============================================================================
-- Migration 010 — Performance Indexes
-- All indexes are named with the convention: idx_{table}_{columns}
-- Covering indexes and partial indexes used where appropriate.
-- =============================================================================

-- ── roles ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);

-- ── users ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_role_id         ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id      ON users(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_status          ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email           ON users(email);  -- citext index
CREATE INDEX IF NOT EXISTS idx_users_last_login      ON users(last_login_at DESC NULLS LAST);

-- ── companies ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_companies_status          ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_by      ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_verified_at     ON companies(verified_at DESC NULLS LAST)
  WHERE verified_at IS NOT NULL;
-- Trigram index for fuzzy company name search
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm       ON companies USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_reg_number      ON companies(registration_number);

-- ── company_documents ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_company_docs_company_id   ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_docs_status       ON company_documents(status);
CREATE INDEX IF NOT EXISTS idx_company_docs_valid_until  ON company_documents(valid_until)
  WHERE valid_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_docs_type         ON company_documents(document_type);

-- ── tenders ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tenders_status            ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_created_by        ON tenders(created_by);
CREATE INDEX IF NOT EXISTS idx_tenders_category          ON tenders(category);
CREATE INDEX IF NOT EXISTS idx_tenders_deadline          ON tenders(submission_deadline_at);
-- Partial index: active tenders only (most frequent query pattern)
CREATE INDEX IF NOT EXISTS idx_tenders_active            ON tenders(submission_deadline_at, category)
  WHERE status IN ('published', 'clarification');
-- Trigram index for full-text search on tender titles
CREATE INDEX IF NOT EXISTS idx_tenders_title_trgm        ON tenders USING GIN (title gin_trgm_ops);
-- GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_tenders_tags              ON tenders USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_tenders_ref_number        ON tenders(reference_number);

-- ── tender_requirements ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tender_reqs_tender_id     ON tender_requirements(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_reqs_type          ON tender_requirements(requirement_type);
CREATE INDEX IF NOT EXISTS idx_tender_reqs_mandatory     ON tender_requirements(tender_id, is_mandatory);

-- ── tender_evaluation_criteria ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_criteria_tender_id        ON tender_evaluation_criteria(tender_id);
CREATE INDEX IF NOT EXISTS idx_criteria_type             ON tender_evaluation_criteria(criteria_type);

-- ── bids ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bids_tender_id            ON bids(tender_id);
CREATE INDEX IF NOT EXISTS idx_bids_company_id           ON bids(company_id);
CREATE INDEX IF NOT EXISTS idx_bids_created_by           ON bids(created_by);
CREATE INDEX IF NOT EXISTS idx_bids_status               ON bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_tender_company       ON bids(tender_id, company_id);
-- Covering index for tender evaluation queries
CREATE INDEX IF NOT EXISTS idx_bids_tender_status        ON bids(tender_id, status)
  INCLUDE (company_id, created_at);

-- ── bid_documents ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bid_docs_bid_id           ON bid_documents(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_docs_type             ON bid_documents(document_type);

-- ── bid_hashes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bid_hashes_bid_id         ON bid_hashes(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_hashes_content        ON bid_hashes(content_hash);

-- ── bid_submissions ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bid_submissions_bid_id    ON bid_submissions(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_by        ON bid_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_at        ON bid_submissions(submitted_at DESC);

-- ── eligibility_results ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_eligibility_bid_id        ON eligibility_results(bid_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_req_id        ON eligibility_results(requirement_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_status        ON eligibility_results(bid_id, status);

-- ── ai_evaluations ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_evals_tender_id        ON ai_evaluations(tender_id);
CREATE INDEX IF NOT EXISTS idx_ai_evals_status           ON ai_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_ai_evals_created          ON ai_evaluations(created_at DESC);
-- Most recent completed evaluation per tender
CREATE INDEX IF NOT EXISTS idx_ai_evals_tender_completed ON ai_evaluations(tender_id, completed_at DESC NULLS LAST)
  WHERE status = 'completed';

-- ── ai_scores ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_scores_evaluation_id   ON ai_scores(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_bid_id          ON ai_scores(bid_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_criteria_id     ON ai_scores(criteria_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_eval_bid        ON ai_scores(evaluation_id, bid_id);

-- ── ai_recommendations ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_recs_evaluation_id     ON ai_recommendations(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_bid_id            ON ai_recommendations(bid_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_recommendation    ON ai_recommendations(recommendation);
-- Ranking query: top-ranked bids per evaluation
CREATE INDEX IF NOT EXISTS idx_ai_recs_rank              ON ai_recommendations(evaluation_id, rank ASC NULLS LAST)
  WHERE rank IS NOT NULL;

-- ── risk_assessments ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_risk_bid_id               ON risk_assessments(bid_id);
CREATE INDEX IF NOT EXISTS idx_risk_category             ON risk_assessments(risk_category);
CREATE INDEX IF NOT EXISTS idx_risk_level                ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_unresolved           ON risk_assessments(bid_id, risk_level)
  WHERE is_resolved = FALSE;

-- ── anomaly_results ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_anomaly_tender_id         ON anomaly_results(tender_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_type              ON anomaly_results(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_severity          ON anomaly_results(severity);
-- Pending review anomalies
CREATE INDEX IF NOT EXISTS idx_anomaly_pending           ON anomaly_results(severity, created_at DESC)
  WHERE is_confirmed IS NULL;
-- GIN index on affected_bid_ids array for bid-to-anomaly lookups
CREATE INDEX IF NOT EXISTS idx_anomaly_affected_bids     ON anomaly_results USING GIN (affected_bid_ids);

-- ── government_decisions ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_decisions_tender_id       ON government_decisions(tender_id);
CREATE INDEX IF NOT EXISTS idx_decisions_decided_by      ON government_decisions(decided_by);
CREATE INDEX IF NOT EXISTS idx_decisions_type            ON government_decisions(decision);
CREATE INDEX IF NOT EXISTS idx_decisions_effective_at    ON government_decisions(effective_at DESC);

-- ── decision_overrides ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_overrides_decision_id     ON decision_overrides(decision_id);
CREATE INDEX IF NOT EXISTS idx_overrides_pending_review  ON decision_overrides(created_at DESC)
  WHERE is_approved IS NULL;

-- ── audit_logs ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_actor_id            ON audit_logs(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_action              ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_target              ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at          ON audit_logs(created_at DESC);
-- Correlation ID for distributed tracing
CREATE INDEX IF NOT EXISTS idx_audit_correlation         ON audit_logs(correlation_id)
  WHERE correlation_id IS NOT NULL;

-- ── notifications ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notif_user_id             ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_status              ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notif_send_after          ON notifications(send_after_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notif_user_unread         ON notifications(user_id, created_at DESC)
  WHERE status != 'read';

-- ── service_health_log ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shl_service_name          ON service_health_log(service_name);
CREATE INDEX IF NOT EXISTS idx_shl_created_at            ON service_health_log(created_at DESC);

-- >>> END 010_indexes.sql <<<

-- >>> BEGIN 011_constraints.sql <<<
-- =============================================================================
-- Migration 011 — Constraints, Triggers & Deferred FKs
-- =============================================================================

-- ── Deferred FK: tenders.awarded_to_bid_id → bids ────────────────────────────
-- Cannot add this FK during table creation because bids table didn't exist yet.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenders_awarded_bid') THEN
    ALTER TABLE tenders
      ADD CONSTRAINT fk_tenders_awarded_bid
        FOREIGN KEY (awarded_to_bid_id)
        REFERENCES bids(id)
        DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- ── Unique active bid per company per tender (the "one bid" rule) ─────────────
-- A company may only have ONE active bid per tender at a time.
-- Withdrawn and disqualified bids do not count (partial index).
-- This prevents duplicate bid submissions at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bid_one_active_per_company_tender
  ON bids(tender_id, company_id)
  WHERE status NOT IN ('withdrawn', 'disqualified');

COMMENT ON INDEX uq_bid_one_active_per_company_tender
  IS 'Prevents a company from having more than one active bid per tender. Core anti-gaming constraint.';

-- ── Unique final submission per bid ──────────────────────────────────────────
-- A bid can only have ONE non-withdrawn submission.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bid_submission_active
  ON bid_submissions(bid_id)
  WHERE is_withdrawn = FALSE;

COMMENT ON INDEX uq_bid_submission_active
  IS 'Enforces the sealed envelope model — one active submission per bid.';

-- ── updated_at auto-maintenance trigger ──────────────────────────────────────
-- Applied to all mutable tables so updated_at is always accurate.
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to every mutable table
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'roles', 'users', 'companies', 'company_documents',
      'tenders', 'tender_requirements', 'tender_evaluation_criteria',
      'bids', 'bid_documents',
      'risk_assessments', 'anomaly_results',
      'government_decisions', 'decision_overrides',
      'notifications'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- ── Tender criteria weight validation ────────────────────────────────────────
-- Fires when criteria are inserted/updated. Warns if weights don't sum to 100.
-- Implemented as a CONSTRAINT TRIGGER to run after all row changes in the statement.
CREATE OR REPLACE FUNCTION fn_validate_criteria_weights()
RETURNS TRIGGER AS $$
DECLARE
  total_weight NUMERIC(7, 2);
BEGIN
  SELECT COALESCE(SUM(weight), 0)
  INTO total_weight
  FROM tender_evaluation_criteria
  WHERE tender_id = NEW.tender_id;

  IF total_weight > 100.01 THEN
    RAISE EXCEPTION
      'Criteria weights for tender % sum to %, which exceeds 100%%',
      NEW.tender_id, total_weight;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_criteria_weights ON tender_evaluation_criteria;
CREATE CONSTRAINT TRIGGER trg_validate_criteria_weights
  AFTER INSERT OR UPDATE ON tender_evaluation_criteria
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION fn_validate_criteria_weights();

-- ── Bid submission lock ───────────────────────────────────────────────────────
-- Once a bid is submitted (status = 'submitted'), prevent changes to
-- bid_amount_enc, technical_proposal, and financial_proposal.
CREATE OR REPLACE FUNCTION fn_lock_submitted_bid_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'submitted' AND (
    NEW.bid_amount_enc IS DISTINCT FROM OLD.bid_amount_enc OR
    NEW.technical_proposal IS DISTINCT FROM OLD.technical_proposal OR
    NEW.financial_proposal IS DISTINCT FROM OLD.financial_proposal
  ) THEN
    RAISE EXCEPTION
      'Bid % is sealed (status=submitted). Core financial/proposal fields cannot be modified.',
      OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_submitted_bid_fields ON bids;
CREATE TRIGGER trg_lock_submitted_bid_fields
  BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION fn_lock_submitted_bid_fields();

-- ── Tender deadline validation trigger ───────────────────────────────────────
-- Prevent publishing a tender whose deadline is in the past.
CREATE OR REPLACE FUNCTION fn_validate_tender_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.submission_deadline_at <= NOW() THEN
    RAISE EXCEPTION
      'Cannot publish tender % — submission deadline % is in the past.',
      NEW.id, NEW.submission_deadline_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_tender_publish ON tenders;
CREATE TRIGGER trg_validate_tender_publish
  BEFORE INSERT OR UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION fn_validate_tender_publish();

-- ── Bidder can only bid on published tenders ──────────────────────────────────
CREATE OR REPLACE FUNCTION fn_validate_bid_tender_status()
RETURNS TRIGGER AS $$
DECLARE
  t_status tender_status;
BEGIN
  SELECT status INTO t_status FROM tenders WHERE id = NEW.tender_id;
  IF t_status NOT IN ('published', 'clarification') THEN
    RAISE EXCEPTION
      'Cannot create/update bid for tender % — tender status is ''%'', must be published or clarification.',
      NEW.tender_id, t_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_bid_tender_status ON bids;
CREATE TRIGGER trg_validate_bid_tender_status
  BEFORE INSERT ON bids
  FOR EACH ROW EXECUTE FUNCTION fn_validate_bid_tender_status();

-- ── Award decision must reference a submitted bid ─────────────────────────────
CREATE OR REPLACE FUNCTION fn_validate_award_bid_status()
RETURNS TRIGGER AS $$
DECLARE
  b_status bid_status;
BEGIN
  IF NEW.decision = 'award' AND NEW.awarded_bid_id IS NOT NULL THEN
    SELECT status INTO b_status FROM bids WHERE id = NEW.awarded_bid_id;
    IF b_status NOT IN ('submitted', 'under_evaluation', 'shortlisted') THEN
      RAISE EXCEPTION
        'Cannot award decision to bid % with status ''%''.',
        NEW.awarded_bid_id, b_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_award_bid_status ON government_decisions;
CREATE TRIGGER trg_validate_award_bid_status
  BEFORE INSERT OR UPDATE ON government_decisions
  FOR EACH ROW EXECUTE FUNCTION fn_validate_award_bid_status();

-- >>> END 011_constraints.sql <<<

-- >>> BEGIN 012_auth_tokens.sql <<<
-- =============================================================================
-- Migration 012 — Auth Tokens Table
-- Stores refresh tokens for rotation + server-side revocation.
-- =============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    CHAR(64)      NOT NULL UNIQUE,  -- SHA-256 hex of the raw refresh token
  family        UUID          NOT NULL DEFAULT gen_random_uuid(), -- rotation family (detect reuse)
  expires_at    TIMESTAMPTZ   NOT NULL,
  is_revoked    BOOLEAN       NOT NULL DEFAULT FALSE,
  revoked_at    TIMESTAMPTZ,
  revoke_reason TEXT,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE refresh_tokens IS 'Server-side refresh token store. Enables rotation and revocation. token_hash is SHA-256 of raw token.';
COMMENT ON COLUMN refresh_tokens.family IS 'Rotation family UUID. If an already-rotated token is replayed, entire family is revoked (theft detection).';

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id   ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash      ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family    ON refresh_tokens(family);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active    ON refresh_tokens(user_id, expires_at DESC)
  WHERE is_revoked = FALSE;

-- Auto-cleanup expired tokens (runs on every INSERT — cheap for low-volume auth table)
CREATE OR REPLACE FUNCTION fn_cleanup_expired_refresh_tokens()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM refresh_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day'  -- keep 1 day for audit purposes
    AND is_revoked = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_refresh_tokens ON refresh_tokens;
CREATE TRIGGER trg_cleanup_refresh_tokens
  AFTER INSERT ON refresh_tokens
  FOR EACH STATEMENT EXECUTE FUNCTION fn_cleanup_expired_refresh_tokens();

-- >>> END 012_auth_tokens.sql <<<

-- >>> BEGIN 013_tender_lifecycle.sql <<<
-- =============================================================================
-- Migration 013 — Tender Lifecycle State Machine & Transition Rules
-- ProcureAI Phase 4: Complete Tender Management
--
-- Lifecycle Sequence:
--   DRAFT
--   → PUBLISHED
--   → OPEN
--   → CLOSED
--   → BIDS_REVEALED
--   → UNDER_EVALUATION
--   → RECOMMENDATION_READY
--   → DECISION_MADE
--   → COMPLETED
-- (Any non-completed state can also transition to CANCELLED)
-- =============================================================================

-- Add uppercase lifecycle state values to tender_status enum
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'PUBLISHED';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'BIDS_REVEALED';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'UNDER_EVALUATION';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'RECOMMENDATION_READY';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'DECISION_MADE';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Add index on status for lifecycle dashboard queries
CREATE INDEX IF NOT EXISTS idx_tenders_lifecycle_status ON tenders(status);

-- ── State Machine Transition Validation Trigger ──────────────────────────────
CREATE OR REPLACE FUNCTION fn_validate_tender_transition()
RETURNS TRIGGER AS $$
DECLARE
  old_st TEXT;
  new_st TEXT;
  is_valid BOOLEAN := FALSE;
BEGIN
  -- Normalize to uppercase for comparison
  old_st := UPPER(OLD.status::text);
  new_st := UPPER(NEW.status::text);

  -- Self-transitions (e.g. updating description or metadata in same state) are allowed
  IF old_st = new_st THEN
    RETURN NEW;
  END IF;

  -- Cancellation is permitted from any non-terminal state
  IF new_st = 'CANCELLED' AND old_st NOT IN ('COMPLETED', 'CANCELLED') THEN
    RETURN NEW;
  END IF;

  -- Forward state transitions
  CASE old_st
    WHEN 'DRAFT' THEN
      IF new_st IN ('PUBLISHED', 'OPEN') THEN is_valid := TRUE; END IF;

    WHEN 'PUBLISHED' THEN
      IF new_st IN ('OPEN', 'CLOSED') THEN is_valid := TRUE; END IF;

    WHEN 'OPEN' THEN
      IF new_st = 'CLOSED' THEN is_valid := TRUE; END IF;

    WHEN 'CLOSED' THEN
      IF new_st = 'BIDS_REVEALED' THEN is_valid := TRUE; END IF;

    WHEN 'BIDS_REVEALED' THEN
      IF new_st = 'UNDER_EVALUATION' THEN is_valid := TRUE; END IF;

    WHEN 'UNDER_EVALUATION' THEN
      IF new_st = 'RECOMMENDATION_READY' THEN is_valid := TRUE; END IF;

    WHEN 'RECOMMENDATION_READY' THEN
      IF new_st = 'DECISION_MADE' THEN is_valid := TRUE; END IF;

    WHEN 'DECISION_MADE' THEN
      IF new_st = 'COMPLETED' THEN is_valid := TRUE; END IF;

    ELSE
      is_valid := FALSE;
  END CASE;

  IF NOT is_valid THEN
    RAISE EXCEPTION
      'Invalid tender state transition: cannot transition from % to %. Permitted progression is DRAFT -> PUBLISHED -> OPEN -> CLOSED -> BIDS_REVEALED -> UNDER_EVALUATION -> RECOMMENDATION_READY -> DECISION_MADE -> COMPLETED.',
      old_st, new_st
      USING ERRCODE = 'check_violation';
  END IF;

  -- Timestamp maintenance on state changes
  IF new_st = 'CLOSED' AND NEW.closed_at IS NULL THEN
    NEW.closed_at := NOW();
  ELSIF new_st = 'PUBLISHED' AND NEW.published_at IS NULL THEN
    NEW.published_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_tender_transition ON tenders;
CREATE TRIGGER trg_validate_tender_transition
  BEFORE UPDATE OF status ON tenders
  FOR EACH ROW EXECUTE FUNCTION fn_validate_tender_transition();

-- ── Draft Protection Trigger ──────────────────────────────────────────────────
-- Modifications to criteria or requirements are only permitted in DRAFT state.
CREATE OR REPLACE FUNCTION fn_protect_tender_specifications()
RETURNS TRIGGER AS $$
DECLARE
  t_status TEXT;
BEGIN
  SELECT UPPER(status::text) INTO t_status FROM tenders WHERE id = NEW.tender_id;

  IF t_status NOT IN ('DRAFT', 'PUBLISHED') THEN
    RAISE EXCEPTION
      'Cannot modify tender criteria or requirements while tender is in % state. Changes only allowed in DRAFT or PUBLISHED.',
      t_status
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_tender_requirements ON tender_requirements;
CREATE TRIGGER trg_protect_tender_requirements
  BEFORE UPDATE OR DELETE ON tender_requirements
  FOR EACH ROW EXECUTE FUNCTION fn_protect_tender_specifications();

DROP TRIGGER IF EXISTS trg_protect_tender_criteria ON tender_evaluation_criteria;
CREATE TRIGGER trg_protect_tender_criteria
  BEFORE UPDATE OR DELETE ON tender_evaluation_criteria
  FOR EACH ROW EXECUTE FUNCTION fn_protect_tender_specifications();

-- >>> END 013_tender_lifecycle.sql <<<

-- >>> BEGIN 014_company_eligibility_profiles.sql <<<
-- =============================================================================
-- Migration 014 — Bidder Eligibility & Enhanced Company Profiles
-- Tables modified: companies, eligibility_results
-- Adds structured profile attributes for automated, explainable eligibility screening.
-- =============================================================================

-- ── 1. Enhance companies with first-class qualification fields ────────────────
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS tax_id                   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS incorporation_date       DATE,
  ADD COLUMN IF NOT EXISTS completed_projects_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_projects       JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS technical_capabilities   JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS financial_capacity       JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS compliance_info          JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS past_performance         JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN companies.completed_projects IS 'Array of completed project dossiers: [{id, title, client_name, value_paisa, completion_year, sector, reference_contact}]';
COMMENT ON COLUMN companies.technical_capabilities IS 'Array of certified capabilities: [{name, category, certified_by, valid_until, level}]';
COMMENT ON COLUMN companies.financial_capacity IS 'Financial health figures: {net_worth_paisa, credit_rating, solvency_ratio, working_capital_paisa, bank_name}';
COMMENT ON COLUMN companies.compliance_info IS 'Statutory compliance: {is_debarred: boolean, tax_clearance_status: string, labor_compliance: boolean, litigation_status: string, sworn_declaration_date: string}';
COMMENT ON COLUMN companies.past_performance IS 'Aggregated past performance ratings: {avg_rating, on_time_completion_pct, projects_evaluated, blacklisted}';

-- ── 2. Enhance eligibility_results with explainability & rule evidence ───────
ALTER TABLE eligibility_results
  ADD COLUMN IF NOT EXISTS rule_type        VARCHAR(100),
  ADD COLUMN IF NOT EXISTS evidence_detail  JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_disqualifying BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN eligibility_results.rule_type IS 'Category of rule executed (e.g. experience_check, turnover_check, projects_check, document_check, compliance_check)';
COMMENT ON COLUMN eligibility_results.evidence_detail IS 'Structured quantitative check metrics e.g. {required: 5, actual: 12, unit: "years", met: true}';
COMMENT ON COLUMN eligibility_results.is_disqualifying IS 'True if failure of this specific mandatory requirement disqualified the bid from AI ranking';

-- ── 3. Performance Indexes for Eligibility Screening ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_companies_turnover_paisa ON companies (annual_turnover_paisa);
CREATE INDEX IF NOT EXISTS idx_companies_years_op ON companies (years_in_operation);
CREATE INDEX IF NOT EXISTS idx_companies_projects_count ON companies (completed_projects_count);
CREATE INDEX IF NOT EXISTS idx_eligibility_results_bid_status ON eligibility_results (bid_id, status);
CREATE INDEX IF NOT EXISTS idx_eligibility_results_disqualifying ON eligibility_results (bid_id, is_disqualifying);

-- >>> END 014_company_eligibility_profiles.sql <<<

-- >>> BEGIN 015_sealed_bids_audit.sql <<<
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

-- >>> END 015_sealed_bids_audit.sql <<<

-- >>> BEGIN 016_ai_evaluation_engine.sql <<<
-- =============================================================================
-- Migration 016 — Phase 7: ProcureAI Evaluation Engine
-- Tables modified: ai_scores, ai_evaluations, ai_recommendations
-- Types modified: criteria_type
-- =============================================================================

-- ── 1. Expand criteria_type ENUM with standardized evaluation factors ────────
ALTER TYPE criteria_type ADD VALUE IF NOT EXISTS 'price';
ALTER TYPE criteria_type ADD VALUE IF NOT EXISTS 'technical_capability';
ALTER TYPE criteria_type ADD VALUE IF NOT EXISTS 'financial_capacity';
ALTER TYPE criteria_type ADD VALUE IF NOT EXISTS 'past_performance';
ALTER TYPE criteria_type ADD VALUE IF NOT EXISTS 'risk_indicators';

-- ── 2. Allow flexible AI scoring against standardized factor codes ───────────
-- Making criteria_id nullable allows AI scoring with either custom tender criteria
-- or the standardized 6 evaluation factors.
ALTER TABLE ai_scores ALTER COLUMN criteria_id DROP NOT NULL;

ALTER TABLE ai_scores
  ADD COLUMN IF NOT EXISTS criteria_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS criteria_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS weight        NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS max_score     NUMERIC(5, 2) DEFAULT 100.00;

COMMENT ON COLUMN ai_scores.criteria_code IS 'Standardized factor code e.g. price, technical_capability, experience, financial_capacity, past_performance, risk_indicators';
COMMENT ON COLUMN ai_scores.criteria_name IS 'Human-readable factor title e.g. Price Score, Technical Capability';
COMMENT ON COLUMN ai_scores.weight IS 'Configured percentage weight for this criterion in this evaluation run (e.g. 40.00 for 40%)';

-- ── 3. Store configured evaluation weights in ai_evaluations ──────────────────
ALTER TABLE ai_evaluations
  ADD COLUMN IF NOT EXISTS weights JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS summary TEXT;

COMMENT ON COLUMN ai_evaluations.weights IS 'Exact JSON snapshot of weights used: {price: 40, technical: 20, experience: 15, financial: 10, past_performance: 10, risk: 5}';

-- ── 4. Track synthetic benchmark datasets in ai_recommendations ───────────────
ALTER TABLE ai_recommendations
  ADD COLUMN IF NOT EXISTS is_synthetic        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS criterion_breakdown JSONB   NOT NULL DEFAULT '{}';

COMMENT ON COLUMN ai_recommendations.is_synthetic IS 'Flag indicating synthetic benchmark evaluation data (not real government record)';
COMMENT ON COLUMN ai_recommendations.criterion_breakdown IS 'Cached JSON snapshot of all criterion scores: {price: {score, weighted, weight}, ...}';

-- >>> END 016_ai_evaluation_engine.sql <<<

-- >>> BEGIN 017_xai_explainability.sql <<<
-- =============================================================================
-- Migration 017 — Phase 8: Explainable AI (XAI) Architecture
-- Tables modified: ai_recommendations, ai_evaluations
-- =============================================================================

-- ── 1. Store structured XAI explanation object in ai_recommendations ──────────
ALTER TABLE ai_recommendations
  ADD COLUMN IF NOT EXISTS explanation_object JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN ai_recommendations.explanation_object IS
  'Non-technical explainability dossier: {why_summary, ratings, positive_contributors, negative_contributors, factor_explanations, shap_attribution}';

-- ── 2. Store model-wide SHAP attributions in ai_evaluations ───────────────────
ALTER TABLE ai_evaluations
  ADD COLUMN IF NOT EXISTS shap_attributions JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN ai_evaluations.shap_attributions IS
  'Baseline expected values and factor importance weights from the SHAP explainer model';

-- >>> END 017_xai_explainability.sql <<<

-- >>> BEGIN 018_risk_anomaly_collusion.sql <<<
-- =============================================================================
-- Migration 018 — Phase 9: Anti-Bias, Anomaly Detection & Collusion Tracking
-- Tables enhanced: risk_assessments, anomaly_results, government_decisions
-- =============================================================================

-- ── 1. Enhance risk_assessments with numerical anomaly score & tier ──────────
ALTER TABLE risk_assessments
  ADD COLUMN IF NOT EXISTS anomaly_score NUMERIC(6, 4),
  ADD COLUMN IF NOT EXISTS risk_tier VARCHAR(30) DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS feature_deviations JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN risk_assessments.risk_tier IS
  'Standard anomaly tier: NORMAL | LOW RISK | MEDIUM RISK | HIGH RISK';
COMMENT ON COLUMN risk_assessments.anomaly_score IS
  'Isolation Forest decision function or raw anomaly score (-1.0 to +1.0)';
COMMENT ON COLUMN risk_assessments.feature_deviations IS
  'Specific metrics evaluated: price_deviation, unusual_pricing, timing_anomaly, etc.';

-- ── 2. Enhance anomaly_results with collusion pattern evidence ────────────────
ALTER TABLE anomaly_results
  ADD COLUMN IF NOT EXISTS collusion_indicators JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS pattern_summary TEXT,
  ADD COLUMN IF NOT EXISTS is_collusion_pattern BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN anomaly_results.collusion_indicators IS
  'Detected patterns (unusually similar bids, winner rotation, repeated relationships)';
COMMENT ON COLUMN anomaly_results.pattern_summary IS
  'Neutral, explainable summary: Potential suspicious pattern detected (never accuses entities of corruption)';

-- ── 3. Enhance government_decisions for override pattern tracking ─────────────
ALTER TABLE government_decisions
  ADD COLUMN IF NOT EXISTS override_pattern_detected BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS override_pattern_summary TEXT;

CREATE INDEX IF NOT EXISTS idx_decisions_officer_override
  ON government_decisions (decided_by, followed_ai, created_at DESC);

COMMENT ON COLUMN government_decisions.override_pattern_detected IS
  'Set to TRUE when repeated overrides match statistical pattern (Potential decision-making pattern detected)';

-- >>> END 018_risk_anomaly_collusion.sql <<<

-- >>> BEGIN 019_decision_workflow_lock.sql <<<
-- =============================================================================
-- Migration 019 — Phase 10: Human-in-the-Loop Decision System & Immutability Lock
-- Tables enhanced: government_decisions
-- =============================================================================

-- ── 1. Enhance government_decisions with cryptographic audit fields ──────────
ALTER TABLE government_decisions
  ADD COLUMN IF NOT EXISTS integrity_hash VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS supporting_note TEXT,
  ADD COLUMN IF NOT EXISTS ai_recommendation_summary JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS selected_bidder_summary JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN government_decisions.integrity_hash IS
  'Cryptographic SHA-256 integrity hash chaining officer ID, timestamp, tender ID, AI recommendation, final decision, selected bidder, override status, and reason.';

COMMENT ON COLUMN government_decisions.is_locked IS
  'Immutability lock. When TRUE, database triggers prevent ordinary UPDATE or DELETE operations.';

COMMENT ON COLUMN government_decisions.supporting_note IS
  'Mandatory supporting note or document reference required when selecting an alternative bidder.';

-- ── 2. Database Immutability Trigger ──────────────────────────────────────────
-- Enforces that once a government decision is recorded and locked, it cannot be modified
CREATE OR REPLACE FUNCTION fn_prevent_locked_decision_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_locked = TRUE THEN
    RAISE EXCEPTION 'GOVERNANCE AUDIT VIOLATION: Decision record % is cryptographically locked and cannot be modified or deleted.', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_government_decisions ON government_decisions;
CREATE TRIGGER trg_lock_government_decisions
  BEFORE UPDATE OR DELETE ON government_decisions
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_locked_decision_mutation();

-- >>> END 019_decision_workflow_lock.sql <<<

-- >>> BEGIN 020_tamper_evident_audit_chain.sql <<<
-- =============================================================================
-- Migration 020 — Phase 11: Tamper-Evident Audit System & Cryptographic Hash Chaining
-- Tables: audit_chain_logs
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_chain_logs (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_sequence  BIGSERIAL     UNIQUE,
  actor           VARCHAR(255)  NOT NULL,
  role            VARCHAR(50)   NOT NULL,
  action          VARCHAR(100)  NOT NULL,
  entity          VARCHAR(100)  NOT NULL,
  entity_id       VARCHAR(100),
  tender_id       UUID          REFERENCES tenders(id) ON DELETE SET NULL,
  company_id      UUID          REFERENCES companies(id) ON DELETE SET NULL,
  risk_level      VARCHAR(20)   NOT NULL DEFAULT 'NORMAL',
  details         JSONB         NOT NULL DEFAULT '{}',
  prev_hash       VARCHAR(64)   NOT NULL,
  curr_hash       VARCHAR(64)   NOT NULL,
  timestamp       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_chain_logs IS
  'Cryptographically linked append-only audit trail. HASH(N) = SHA256(event_data + HASH(N-1)).';

-- Indexes for 6-Factor Auditor Filtering
CREATE INDEX IF NOT EXISTS idx_audit_chain_seq ON audit_chain_logs(chain_sequence ASC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_tender ON audit_chain_logs(tender_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_actor ON audit_chain_logs(actor, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_company ON audit_chain_logs(company_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_action ON audit_chain_logs(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_risk ON audit_chain_logs(risk_level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_time ON audit_chain_logs(timestamp DESC);

-- ── Immutability Trigger ───────────────────────────────────────────────────────
-- Prevents ordinary modifications or deletions on the cryptographic audit ledger
CREATE OR REPLACE FUNCTION fn_audit_chain_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT SECURITY VIOLATION: audit_chain_logs is cryptographically sealed and append-only. Modification or deletion is strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_chain_immutable ON audit_chain_logs;
CREATE TRIGGER trg_audit_chain_immutable
  BEFORE UPDATE OR DELETE ON audit_chain_logs
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_chain_immutable();

-- >>> END 020_tamper_evident_audit_chain.sql <<<
