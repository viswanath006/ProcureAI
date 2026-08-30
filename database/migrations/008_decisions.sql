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
CREATE UNIQUE INDEX uq_government_decision_tender
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
