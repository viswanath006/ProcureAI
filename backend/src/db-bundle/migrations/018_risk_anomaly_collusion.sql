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
