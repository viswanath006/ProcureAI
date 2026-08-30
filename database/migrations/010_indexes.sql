-- =============================================================================
-- Migration 010 — Performance Indexes
-- All indexes are named with the convention: idx_{table}_{columns}
-- Covering indexes and partial indexes used where appropriate.
-- =============================================================================

-- ── roles ────────────────────────────────────────────────────────────────────
CREATE INDEX idx_roles_code ON roles(code);

-- ── users ────────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_role_id         ON users(role_id);
CREATE INDEX idx_users_company_id      ON users(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_users_status          ON users(status);
CREATE INDEX idx_users_email           ON users(email);  -- citext index
CREATE INDEX idx_users_last_login      ON users(last_login_at DESC NULLS LAST);

-- ── companies ────────────────────────────────────────────────────────────────
CREATE INDEX idx_companies_status          ON companies(status);
CREATE INDEX idx_companies_created_by      ON companies(created_by);
CREATE INDEX idx_companies_verified_at     ON companies(verified_at DESC NULLS LAST)
  WHERE verified_at IS NOT NULL;
-- Trigram index for fuzzy company name search
CREATE INDEX idx_companies_name_trgm       ON companies USING GIN (name gin_trgm_ops);
CREATE INDEX idx_companies_reg_number      ON companies(registration_number);

-- ── company_documents ────────────────────────────────────────────────────────
CREATE INDEX idx_company_docs_company_id   ON company_documents(company_id);
CREATE INDEX idx_company_docs_status       ON company_documents(status);
CREATE INDEX idx_company_docs_valid_until  ON company_documents(valid_until)
  WHERE valid_until IS NOT NULL;
CREATE INDEX idx_company_docs_type         ON company_documents(document_type);

-- ── tenders ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_tenders_status            ON tenders(status);
CREATE INDEX idx_tenders_created_by        ON tenders(created_by);
CREATE INDEX idx_tenders_category          ON tenders(category);
CREATE INDEX idx_tenders_deadline          ON tenders(submission_deadline_at);
-- Partial index: active tenders only (most frequent query pattern)
CREATE INDEX idx_tenders_active            ON tenders(submission_deadline_at, category)
  WHERE status IN ('published', 'clarification');
-- Trigram index for full-text search on tender titles
CREATE INDEX idx_tenders_title_trgm        ON tenders USING GIN (title gin_trgm_ops);
-- GIN index for tags array
CREATE INDEX idx_tenders_tags              ON tenders USING GIN (tags);
CREATE INDEX idx_tenders_ref_number        ON tenders(reference_number);

-- ── tender_requirements ──────────────────────────────────────────────────────
CREATE INDEX idx_tender_reqs_tender_id     ON tender_requirements(tender_id);
CREATE INDEX idx_tender_reqs_type          ON tender_requirements(requirement_type);
CREATE INDEX idx_tender_reqs_mandatory     ON tender_requirements(tender_id, is_mandatory);

-- ── tender_evaluation_criteria ───────────────────────────────────────────────
CREATE INDEX idx_criteria_tender_id        ON tender_evaluation_criteria(tender_id);
CREATE INDEX idx_criteria_type             ON tender_evaluation_criteria(criteria_type);

-- ── bids ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_bids_tender_id            ON bids(tender_id);
CREATE INDEX idx_bids_company_id           ON bids(company_id);
CREATE INDEX idx_bids_created_by           ON bids(created_by);
CREATE INDEX idx_bids_status               ON bids(status);
CREATE INDEX idx_bids_tender_company       ON bids(tender_id, company_id);
-- Covering index for tender evaluation queries
CREATE INDEX idx_bids_tender_status        ON bids(tender_id, status)
  INCLUDE (company_id, created_at);

-- ── bid_documents ────────────────────────────────────────────────────────────
CREATE INDEX idx_bid_docs_bid_id           ON bid_documents(bid_id);
CREATE INDEX idx_bid_docs_type             ON bid_documents(document_type);

-- ── bid_hashes ───────────────────────────────────────────────────────────────
CREATE INDEX idx_bid_hashes_bid_id         ON bid_hashes(bid_id);
CREATE INDEX idx_bid_hashes_content        ON bid_hashes(content_hash);

-- ── bid_submissions ──────────────────────────────────────────────────────────
CREATE INDEX idx_bid_submissions_bid_id    ON bid_submissions(bid_id);
CREATE INDEX idx_bid_submissions_by        ON bid_submissions(submitted_by);
CREATE INDEX idx_bid_submissions_at        ON bid_submissions(submitted_at DESC);

-- ── eligibility_results ──────────────────────────────────────────────────────
CREATE INDEX idx_eligibility_bid_id        ON eligibility_results(bid_id);
CREATE INDEX idx_eligibility_req_id        ON eligibility_results(requirement_id);
CREATE INDEX idx_eligibility_status        ON eligibility_results(bid_id, status);

-- ── ai_evaluations ───────────────────────────────────────────────────────────
CREATE INDEX idx_ai_evals_tender_id        ON ai_evaluations(tender_id);
CREATE INDEX idx_ai_evals_status           ON ai_evaluations(status);
CREATE INDEX idx_ai_evals_created          ON ai_evaluations(created_at DESC);
-- Most recent completed evaluation per tender
CREATE INDEX idx_ai_evals_tender_completed ON ai_evaluations(tender_id, completed_at DESC NULLS LAST)
  WHERE status = 'completed';

-- ── ai_scores ────────────────────────────────────────────────────────────────
CREATE INDEX idx_ai_scores_evaluation_id   ON ai_scores(evaluation_id);
CREATE INDEX idx_ai_scores_bid_id          ON ai_scores(bid_id);
CREATE INDEX idx_ai_scores_criteria_id     ON ai_scores(criteria_id);
CREATE INDEX idx_ai_scores_eval_bid        ON ai_scores(evaluation_id, bid_id);

-- ── ai_recommendations ───────────────────────────────────────────────────────
CREATE INDEX idx_ai_recs_evaluation_id     ON ai_recommendations(evaluation_id);
CREATE INDEX idx_ai_recs_bid_id            ON ai_recommendations(bid_id);
CREATE INDEX idx_ai_recs_recommendation    ON ai_recommendations(recommendation);
-- Ranking query: top-ranked bids per evaluation
CREATE INDEX idx_ai_recs_rank              ON ai_recommendations(evaluation_id, rank ASC NULLS LAST)
  WHERE rank IS NOT NULL;

-- ── risk_assessments ─────────────────────────────────────────────────────────
CREATE INDEX idx_risk_bid_id               ON risk_assessments(bid_id);
CREATE INDEX idx_risk_category             ON risk_assessments(risk_category);
CREATE INDEX idx_risk_level                ON risk_assessments(risk_level);
CREATE INDEX idx_risk_unresolved           ON risk_assessments(bid_id, risk_level)
  WHERE is_resolved = FALSE;

-- ── anomaly_results ──────────────────────────────────────────────────────────
CREATE INDEX idx_anomaly_tender_id         ON anomaly_results(tender_id);
CREATE INDEX idx_anomaly_type              ON anomaly_results(anomaly_type);
CREATE INDEX idx_anomaly_severity          ON anomaly_results(severity);
-- Pending review anomalies
CREATE INDEX idx_anomaly_pending           ON anomaly_results(severity, created_at DESC)
  WHERE is_confirmed IS NULL;
-- GIN index on affected_bid_ids array for bid-to-anomaly lookups
CREATE INDEX idx_anomaly_affected_bids     ON anomaly_results USING GIN (affected_bid_ids);

-- ── government_decisions ─────────────────────────────────────────────────────
CREATE INDEX idx_decisions_tender_id       ON government_decisions(tender_id);
CREATE INDEX idx_decisions_decided_by      ON government_decisions(decided_by);
CREATE INDEX idx_decisions_type            ON government_decisions(decision);
CREATE INDEX idx_decisions_effective_at    ON government_decisions(effective_at DESC);

-- ── decision_overrides ───────────────────────────────────────────────────────
CREATE INDEX idx_overrides_decision_id     ON decision_overrides(decision_id);
CREATE INDEX idx_overrides_pending_review  ON decision_overrides(created_at DESC)
  WHERE is_approved IS NULL;

-- ── audit_logs ───────────────────────────────────────────────────────────────
CREATE INDEX idx_audit_actor_id            ON audit_logs(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_action              ON audit_logs(action);
CREATE INDEX idx_audit_target              ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_created_at          ON audit_logs(created_at DESC);
-- Correlation ID for distributed tracing
CREATE INDEX idx_audit_correlation         ON audit_logs(correlation_id)
  WHERE correlation_id IS NOT NULL;

-- ── notifications ────────────────────────────────────────────────────────────
CREATE INDEX idx_notif_user_id             ON notifications(user_id);
CREATE INDEX idx_notif_status              ON notifications(status);
CREATE INDEX idx_notif_send_after          ON notifications(send_after_at)
  WHERE status = 'pending';
CREATE INDEX idx_notif_user_unread         ON notifications(user_id, created_at DESC)
  WHERE status != 'read';

-- ── service_health_log ───────────────────────────────────────────────────────
CREATE INDEX idx_shl_service_name          ON service_health_log(service_name);
CREATE INDEX idx_shl_created_at            ON service_health_log(created_at DESC);
