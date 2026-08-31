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
