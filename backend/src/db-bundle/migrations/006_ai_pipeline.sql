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
