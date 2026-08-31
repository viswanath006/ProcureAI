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
