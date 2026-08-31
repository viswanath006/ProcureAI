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
