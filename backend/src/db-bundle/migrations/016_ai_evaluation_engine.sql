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
