-- =============================================================================
-- ProcureAI — Database Initialization Orchestrator
-- Phase 2: Full Schema
--
-- This file is automatically executed by the PostgreSQL Docker container
-- on first start via the docker-entrypoint-initdb.d mechanism.
--
-- Execution order matters — migrations must run before seeds,
-- and migrations run in dependency order (extensions → enums → tables → indexes → constraints).
--
-- To RESET and re-apply:
--   docker compose down -v
--   docker compose up -d postgres
-- =============================================================================

\echo '=========================================='
\echo 'ProcureAI Phase 2 — Schema Initialization'
\echo '=========================================='

-- ── Migrations ────────────────────────────────────────────────────────────────
\echo '[1/11] Installing PostgreSQL extensions...'
\i /docker-entrypoint-initdb.d/migrations/001_extensions.sql

\echo '[2/11] Creating ENUM types...'
\i /docker-entrypoint-initdb.d/migrations/002_enums.sql

\echo '[3/11] Creating identity tables (roles, users, companies, company_documents)...'
\i /docker-entrypoint-initdb.d/migrations/003_identity.sql

\echo '[4/11] Creating procurement tables (tenders, requirements, criteria)...'
\i /docker-entrypoint-initdb.d/migrations/004_procurement.sql

\echo '[5/11] Creating bid tables (bids, documents, hashes, submissions)...'
\i /docker-entrypoint-initdb.d/migrations/005_bids.sql

\echo '[6/11] Creating AI pipeline tables (eligibility, evaluations, scores, recommendations)...'
\i /docker-entrypoint-initdb.d/migrations/006_ai_pipeline.sql

\echo '[7/11] Creating risk & anomaly tables...'
\i /docker-entrypoint-initdb.d/migrations/007_risk_anomaly.sql

\echo '[8/11] Creating decision tables (decisions, overrides)...'
\i /docker-entrypoint-initdb.d/migrations/008_decisions.sql

\echo '[9/11] Creating observability tables (audit_logs, notifications, health_log)...'
\i /docker-entrypoint-initdb.d/migrations/009_observability.sql

\echo '[10/11] Creating performance indexes...'
\i /docker-entrypoint-initdb.d/migrations/010_indexes.sql

\echo '[11/11] Applying constraints and triggers...'
\i /docker-entrypoint-initdb.d/migrations/011_constraints.sql

\echo '[12/13] Creating refresh tokens table (Phase 3)...'
\i /docker-entrypoint-initdb.d/migrations/012_auth_tokens.sql

\echo '[13/14] Applying tender lifecycle state machine & transition rules (Phase 4)...'
\i /docker-entrypoint-initdb.d/migrations/013_tender_lifecycle.sql

\echo '[14/15] Applying bidder eligibility & enhanced company profiles (Phase 5)...'
\i /docker-entrypoint-initdb.d/migrations/014_company_eligibility_profiles.sql

\echo '[15/16] Applying sealed bids cryptographic audit & tamper tracking (Phase 6)...'
\i /docker-entrypoint-initdb.d/migrations/015_sealed_bids_audit.sql

\echo '[16/17] Applying AI evaluation engine multi-factor schema (Phase 7)...'
\i /docker-entrypoint-initdb.d/migrations/016_ai_evaluation_engine.sql

\echo '[17/18] Applying Explainable AI (XAI) SHAP attribution schema (Phase 8)...'
\i /docker-entrypoint-initdb.d/migrations/017_xai_explainability.sql

\echo '[18/19] Applying Anti-Bias, Anomaly Detection & Collusion Tracking (Phase 9)...'
\i /docker-entrypoint-initdb.d/migrations/018_risk_anomaly_collusion.sql

\echo '[19/20] Applying Human-in-the-Loop Decision System & Lock (Phase 10)...'
\i /docker-entrypoint-initdb.d/migrations/019_decision_workflow_lock.sql

\echo '[20/20] Applying Tamper-Evident Audit Chain Schema (Phase 11)...'
\i /docker-entrypoint-initdb.d/migrations/020_tamper_evident_audit_chain.sql

\echo ''
\echo '-- Schema complete. Loading seed data...'
\echo ''

-- ── Seeds ─────────────────────────────────────────────────────────────────────
\echo '[1/5] Seeding roles...'
\i /docker-entrypoint-initdb.d/seeds/001_roles.sql

\echo '[2/5] Seeding users...'
\i /docker-entrypoint-initdb.d/seeds/002_users.sql

\echo '[3/5] Seeding companies and documents...'
\i /docker-entrypoint-initdb.d/seeds/003_companies.sql

\echo '[4/5] Seeding sample tender, requirements, and criteria...'
\i /docker-entrypoint-initdb.d/seeds/004_tender.sql

\echo '[5/5] Seeding sample bids, hashes, submissions, and audit logs...'
\i /docker-entrypoint-initdb.d/seeds/005_bids.sql

\echo '[6/6] Updating dev password hashes (Phase 3)...'
\i /docker-entrypoint-initdb.d/seeds/006_update_password_hashes.sql

\echo ''
\echo '=========================================='
\echo 'ProcureAI Phase 3 initialization complete!'
\echo '=========================================='

-- ── Summary query ─────────────────────────────────────────────────────────────
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

