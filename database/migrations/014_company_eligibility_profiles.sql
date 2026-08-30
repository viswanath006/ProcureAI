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
