# Database Architecture

## Overview

ProcureAI uses **PostgreSQL 16** as its primary data store. The Phase 2 schema implements a fully normalized, 3NF design across **21 tables** organized into **6 domains**. The schema is designed for correctness, data integrity, and forward-looking scalability.

---

## Schema at a Glance

| Domain | Tables | Purpose |
|--------|--------|---------|
| **Identity** | `roles`, `users`, `companies`, `company_documents` | Who is on the platform |
| **Procurement** | `tenders`, `tender_requirements`, `tender_evaluation_criteria` | What is being procured |
| **Bids** | `bids`, `bid_documents`, `bid_hashes`, `bid_submissions` | What was submitted |
| **AI Pipeline** | `eligibility_results`, `ai_evaluations`, `ai_scores`, `ai_recommendations` | What AI found |
| **Risk & Anomaly** | `risk_assessments`, `anomaly_results` | Detected issues |
| **Decisions** | `government_decisions`, `decision_overrides` | Human outcome |
| **Observability** | `audit_logs`, `notifications`, `service_health_log` | System record |

---

## File Structure

```
database/
├── init.sql                      # Orchestrator — loaded by Docker on first start
├── migrations/
│   ├── 001_extensions.sql        # pgcrypto, uuid-ossp, pg_trgm, citext
│   ├── 002_enums.sql             # 25 PostgreSQL ENUM types
│   ├── 003_identity.sql          # roles, users, companies, company_documents
│   ├── 004_procurement.sql       # tenders, tender_requirements, criteria
│   ├── 005_bids.sql              # bids, bid_documents, bid_hashes, bid_submissions
│   ├── 006_ai_pipeline.sql       # eligibility_results, ai_evaluations, ai_scores, ai_recommendations
│   ├── 007_risk_anomaly.sql      # risk_assessments, anomaly_results
│   ├── 008_decisions.sql         # government_decisions, decision_overrides
│   ├── 009_observability.sql     # audit_logs, notifications, service_health_log
│   ├── 010_indexes.sql           # All performance indexes
│   └── 011_constraints.sql       # Triggers, partial unique indexes, deferred FKs
├── seeds/
│   ├── 001_roles.sql             # 5 system roles
│   ├── 002_users.sql             # 6 fictional users (officer, evaluator, auditor, 3 bidders)
│   ├── 003_companies.sql         # 3 fictional companies + documents
│   ├── 004_tender.sql            # 1 sample tender + 4 requirements + 5 criteria
│   └── 005_bids.sql              # 3 sample bids + documents + hashes + submissions
└── docs/
    └── er-diagram.md             # Mermaid ER diagram + relationship documentation
```

---

## Key Design Decisions

### 1. UUID Primary Keys
All tables use `gen_random_uuid()` (pgcrypto) for primary keys. Prevents enumeration attacks and allows offline/distributed ID generation.

### 2. Monetary Values as BIGINT Paisa
All monetary amounts are stored as `BIGINT` in **paisa** (1 INR = 100 paisa). This eliminates floating-point rounding errors in financial calculations. Example: ₹1,00,000 is stored as `10000000`.

### 3. Encrypted Sensitive Fields
Sensitive columns (`bid_amount_enc`, `phone_number`, `technical_proposal`, `financial_proposal`, `annual_turnover_paisa`, `net_worth_paisa`) are marked as encrypted at the application layer using **AES-256-GCM**. Each table with encrypted fields has an `encryption_key_id` column referencing an external KMS key for key rotation support.

### 4. Sealed Envelope Bid Model
When a bid is submitted:
1. A `bid_hashes` row is created (SHA-256 of canonical bid JSON).
2. A `bid_submissions` row is inserted with `bid_hash_id` pointing to the snapshot.
3. A trigger (`trg_lock_submitted_bid_fields`) prevents modification of core financial/proposal fields after submission.
4. A unique receipt token is generated and returned to the bidder.

Any tampering after step 1 is detectable by recomputing the hash.

### 5. Immutable Audit Log
`audit_logs` is append-only. A `BEFORE UPDATE OR DELETE` trigger raises an exception on any modification attempt. This is the platform's primary tamper-evident audit trail.

### 6. AI and Bid Data Separation
AI results (scores, recommendations) are stored in separate tables (`ai_scores`, `ai_recommendations`) with no foreign keys back into bid content tables. This means:
- AI pipeline can be run multiple times with different models.
- AI results can be purged/recomputed without affecting bid data.
- Evaluators see AI findings independently from raw bid content.

### 7. Partial Unique Indexes
PostgreSQL partial indexes enforce business rules at the database level:
- **One active bid per company per tender** — `WHERE status NOT IN ('withdrawn', 'disqualified')`
- **One active submission per bid** — `WHERE is_withdrawn = FALSE`
- **One final decision per tender** — `WHERE is_final = TRUE`

---

## Performance Indexes

| Pattern | Index Type | Tables |
|---|---|---|
| PK lookups | B-tree (automatic) | all |
| Status filtering | B-tree partial | `tenders`, `bids`, `notifications`, `risk_assessments` |
| Fuzzy name search | GIN trigram | `companies.name`, `tenders.title` |
| Tag search | GIN array | `tenders.tags` |
| Affected bid lookup | GIN array | `anomaly_results.affected_bid_ids` |
| Hot path covering | B-tree INCLUDE | `bids(tender_id, status) INCLUDE (company_id, created_at)` |
| Latest evaluation | B-tree partial | `ai_evaluations` WHERE `status='completed'` |

---

## Apply Schema

```bash
# Full stack reset (wipes PostgreSQL data volume)
docker compose down -v
docker compose up --build

# Verify schema
docker exec -it procureai-postgres psql -U procureai -d procureai

# Inside psql:
\dt                              -- list all 21 tables
\d bids                          -- inspect bids table
\di                              -- list all indexes

# Check seed data
SELECT COUNT(*) FROM roles;           -- 5
SELECT COUNT(*) FROM users;           -- 6
SELECT COUNT(*) FROM companies;       -- 3
SELECT COUNT(*) FROM tenders;         -- 1
SELECT COUNT(*) FROM bids;            -- 3
SELECT COUNT(*) FROM bid_submissions; -- 3
SELECT COUNT(*) FROM audit_logs;      -- 5+
```

---

## Development Reset Commands

```bash
# Reset database only (keep other containers)
docker compose stop postgres
docker volume rm procureai_postgres_data
docker compose up -d postgres
# Wait ~10s for init to complete

# Check init logs
docker compose logs postgres

# Connect directly
docker exec -it procureai-postgres psql -U procureai -d procureai -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
```

---

## Scalability Considerations

| Concern | Current Design | Future Scaling Path |
|---|---|---|
| Audit log volume | Append-only, no soft deletes | Partition by `created_at` month; archive to cold storage |
| Bid content encryption | App-layer KMS | Rotate keys per `encryption_key_id`; support multiple key versions |
| AI evaluation runs | One row per run | Add `ai_evaluation_runs` queue table with worker pool |
| Notifications | Single table | Separate table per channel; add dead-letter queue |
| Multi-tenancy | Single department per tender | Add `organization_id` FK to tenders and users |
| Read replicas | Single PostgreSQL | Route audit log queries to read replica |
| Full-text search | pg_trgm | Migrate heavy search to Elasticsearch/OpenSearch |
