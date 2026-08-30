# ProcureAI — Entity-Relationship Diagram

## Mermaid ER Diagram

```mermaid
erDiagram

  %% ── Domain 1: Identity ──────────────────────────────────────────────────

  roles {
    uuid id PK
    varchar code UK
    varchar name
    jsonb permissions
    boolean is_system
  }

  users {
    uuid id PK
    uuid role_id FK
    uuid company_id FK "nullable"
    citext email UK
    text password_hash
    varchar full_name
    text phone_number "encrypted"
    varchar employee_id "officers only"
    varchar department "officers only"
    user_status status
    timestamptz email_verified_at
    timestamptz last_login_at
  }

  companies {
    uuid id PK
    uuid created_by FK
    varchar registration_number UK
    varchar name
    varchar legal_name
    bigint annual_turnover_paisa "encrypted"
    bigint net_worth_paisa "encrypted"
    company_status status
    uuid verified_by FK "nullable"
    text encryption_key_id
  }

  company_documents {
    uuid id PK
    uuid company_id FK
    uuid uploaded_by FK
    document_type document_type
    text storage_key UK
    char sha256_hash
    document_status status
    date valid_until "nullable"
  }

  %% ── Domain 2: Procurement ───────────────────────────────────────────────

  tenders {
    uuid id PK
    uuid created_by FK
    varchar reference_number UK
    varchar title
    tender_category category
    bigint estimated_budget_paisa "nullable"
    timestamptz submission_deadline_at
    tender_status status
    uuid awarded_to_bid_id FK "nullable — deferred"
  }

  tender_requirements {
    uuid id PK
    uuid tender_id FK
    requirement_type requirement_type
    varchar title
    boolean is_mandatory
    numeric threshold_value "nullable"
  }

  tender_evaluation_criteria {
    uuid id PK
    uuid tender_id FK
    criteria_type criteria_type
    varchar name
    numeric weight "sums to 100 per tender"
    numeric max_score
    jsonb scoring_rubric
    boolean is_ai_scored
  }

  %% ── Domain 3: Bids ──────────────────────────────────────────────────────

  bids {
    uuid id PK
    uuid tender_id FK
    uuid company_id FK
    uuid created_by FK
    varchar bid_reference UK
    text bid_amount_enc "AES-GCM ciphertext"
    integer completion_days
    bid_status status
    timestamptz submitted_at
    text encryption_key_id
  }

  bid_documents {
    uuid id PK
    uuid bid_id FK
    uuid uploaded_by FK
    document_type document_type
    text storage_key UK
    char sha256_hash
    boolean is_encrypted
  }

  bid_hashes {
    uuid id PK
    uuid bid_id FK
    integer version
    char content_hash
    text hash_input_json
    uuid signed_by FK "nullable"
  }

  bid_submissions {
    uuid id PK
    uuid bid_id FK
    uuid submitted_by FK
    submission_type submission_type
    uuid bid_hash_id FK
    text receipt_token UK
    boolean declaration_accepted
    boolean is_withdrawn
  }

  %% ── Domain 4: AI Pipeline ───────────────────────────────────────────────

  eligibility_results {
    uuid id PK
    uuid bid_id FK
    uuid requirement_id FK
    uuid checked_by_user FK "nullable"
    eligibility_status status
    numeric score "nullable"
    text evidence_summary
  }

  ai_evaluations {
    uuid id PK
    uuid tender_id FK
    uuid triggered_by FK "nullable"
    varchar model_name
    varchar model_version
    evaluation_status status
    integer bids_evaluated
    timestamptz completed_at
  }

  ai_scores {
    uuid id PK
    uuid evaluation_id FK
    uuid bid_id FK
    uuid criteria_id FK
    numeric raw_score
    numeric weighted_score
    numeric confidence
    text explanation
    jsonb evidence_refs
    text[] flags
  }

  ai_recommendations {
    uuid id PK
    uuid evaluation_id FK
    uuid bid_id FK
    recommendation_type recommendation
    numeric total_score
    integer rank "nullable"
    numeric confidence
    text reasoning_summary
    boolean bias_check_passed
  }

  %% ── Domain 5: Risk & Anomaly ────────────────────────────────────────────

  risk_assessments {
    uuid id PK
    uuid bid_id FK
    uuid evaluation_id FK "nullable"
    risk_category risk_category
    risk_level risk_level
    varchar title
    boolean is_resolved
  }

  anomaly_results {
    uuid id PK
    uuid tender_id FK
    uuid evaluation_id FK "nullable"
    anomaly_type anomaly_type
    anomaly_severity severity
    uuid[] affected_bid_ids
    numeric confidence_score
    boolean is_confirmed "nullable — tristate"
  }

  %% ── Domain 6: Decisions ─────────────────────────────────────────────────

  government_decisions {
    uuid id PK
    uuid tender_id FK
    uuid decided_by FK
    uuid ai_recommendation_id FK "nullable"
    decision_type decision
    uuid awarded_bid_id FK "nullable"
    text rationale
    boolean followed_ai
    boolean is_final
  }

  decision_overrides {
    uuid id PK
    uuid decision_id FK UK "1:1"
    uuid override_by FK
    override_reason_type reason_type
    text reason_detail
    boolean is_approved "nullable — tristate"
  }

  %% ── Domain 7: Observability ─────────────────────────────────────────────

  audit_logs {
    uuid id PK
    uuid actor_id FK "nullable"
    audit_action action
    varchar target_type
    uuid target_id "nullable"
    jsonb previous_state
    jsonb new_state
    text correlation_id
  }

  notifications {
    uuid id PK
    uuid user_id FK
    notification_type notification_type
    notification_channel channel
    notification_status status
    varchar subject
    uuid related_tender_id FK "nullable"
    uuid related_bid_id FK "nullable"
    smallint priority
  }

  service_health_log {
    uuid id PK
    varchar service_name
    varchar status
    text message
  }

  %% ── Relationships ────────────────────────────────────────────────────────

  roles                     ||--o{ users                      : "has"
  users                     |o--o{ companies                  : "creates"
  users                     }o--|| companies                  : "belongs to (nullable)"
  companies                 ||--o{ company_documents          : "has"
  users                     ||--o{ company_documents          : "uploads"

  users                     ||--o{ tenders                    : "creates"
  tenders                   ||--o{ tender_requirements        : "has"
  tenders                   ||--o{ tender_evaluation_criteria : "has"

  companies                 ||--o{ bids                       : "submits"
  tenders                   ||--o{ bids                       : "receives"
  users                     ||--o{ bids                       : "creates"
  bids                      ||--o{ bid_documents              : "has"
  bids                      ||--o{ bid_hashes                 : "has versions"
  bids                      ||--o{ bid_submissions            : "has"
  bid_hashes                ||--o{ bid_submissions            : "captured at"

  bids                      ||--o{ eligibility_results        : "checked against"
  tender_requirements       ||--o{ eligibility_results        : "defines check for"

  tenders                   ||--o{ ai_evaluations             : "evaluated by"
  ai_evaluations            ||--o{ ai_scores                  : "produces"
  ai_evaluations            ||--o{ ai_recommendations         : "produces"
  bids                      ||--o{ ai_scores                  : "scored in"
  bids                      ||--o{ ai_recommendations         : "recommended in"
  tender_evaluation_criteria ||--o{ ai_scores                 : "scored on"

  bids                      ||--o{ risk_assessments           : "has"
  tenders                   ||--o{ anomaly_results            : "has"

  tenders                   ||--o| government_decisions       : "decided on"
  users                     ||--o{ government_decisions       : "makes"
  ai_recommendations        |o--o| government_decisions       : "informs"
  government_decisions      ||--o| decision_overrides         : "may have"

  users                     ||--o{ audit_logs                 : "actor in"
  users                     ||--o{ notifications              : "receives"
```

---

## Relationship Explanations

### Identity Domain

| Relationship | Cardinality | Notes |
|---|---|---|
| `roles` → `users` | 1:N | Every user has exactly one role |
| `users` → `companies` | N:1 (nullable) | Bidder reps have `company_id`; officers/auditors do not |
| `users` ← `companies` (created_by) | N:1 | A user creates a company (bidder rep) |
| `companies` → `company_documents` | 1:N | A company can have multiple KYC documents |

### Procurement Domain

| Relationship | Cardinality | Notes |
|---|---|---|
| `users` → `tenders` | 1:N | Government officers create tenders |
| `tenders` → `tender_requirements` | 1:N | Each tender has eligibility requirements |
| `tenders` → `tender_evaluation_criteria` | 1:N | Each tender has weighted scoring criteria. Sum of weights = 100 (enforced by trigger) |

### Bid Domain

| Relationship | Cardinality | Notes |
|---|---|---|
| `companies` → `bids` | 1:N | A company can bid on multiple tenders |
| `tenders` → `bids` | 1:N | A tender receives multiple bids |
| `bids` → `bid_documents` | 1:N | A bid has supporting documents |
| `bids` → `bid_hashes` | 1:N | One hash per bid version (version tracking) |
| `bids` → `bid_submissions` | 1:1 (active) | Only ONE non-withdrawn submission per bid (partial unique index) |
| `bid_hashes` → `bid_submissions` | 1:N | A submission captures the exact hash at submission time |

**Key constraint:** A company can have only ONE active (non-withdrawn) bid per tender. Enforced by partial unique index `uq_bid_one_active_per_company_tender`.

### AI Pipeline Domain

| Relationship | Cardinality | Notes |
|---|---|---|
| `bids` → `eligibility_results` | 1:N | One result per (bid, requirement) pair |
| `tender_requirements` → `eligibility_results` | 1:N | Each requirement checked against each bid |
| `tenders` → `ai_evaluations` | 1:N | Multiple evaluation runs per tender are allowed (re-evaluation) |
| `ai_evaluations` → `ai_scores` | 1:N | One score per (evaluation, bid, criteria) triple |
| `ai_evaluations` → `ai_recommendations` | 1:N | One recommendation per (evaluation, bid) |
| `tender_evaluation_criteria` → `ai_scores` | 1:N | Each criterion is scored independently |

### Risk & Anomaly Domain

| Relationship | Cardinality | Notes |
|---|---|---|
| `bids` → `risk_assessments` | 1:N | Multiple risk flags per bid, one per risk category |
| `tenders` → `anomaly_results` | 1:N | Cross-bid anomalies are at tender level. `affected_bid_ids[]` references multiple bids |

**Design decision:** `anomaly_results.affected_bid_ids` is a `UUID[]` array rather than a junction table, because anomalies are analytical findings (not transactional relationships) and the read pattern is always "get all anomalies for a tender".

### Decision Domain

| Relationship | Cardinality | Notes |
|---|---|---|
| `tenders` → `government_decisions` | 1:1 (final) | Only ONE final decision per tender (partial unique index on `is_final=TRUE`) |
| `ai_recommendations` → `government_decisions` | 0:1 | Optional — decision may be made without AI recommendation |
| `government_decisions` → `decision_overrides` | 1:0..1 | An override record is only created when `followed_ai=FALSE` |

### Observability Domain

| Relationship | Cardinality | Notes |
|---|---|---|
| `users` → `audit_logs` | 1:N | `actor_id` is nullable for system events |
| `users` → `notifications` | 1:N | Multi-channel delivery queue |

---

## Data Isolation Layers

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1 — Identity                                      │
│  roles, users, companies, company_documents              │
│  (who is on the platform)                                │
├─────────────────────────────────────────────────────────┤
│  Layer 2 — Procurement                                   │
│  tenders, requirements, criteria                         │
│  (what is being procured)                                │
├─────────────────────────────────────────────────────────┤
│  Layer 3 — Bid Content  [ENCRYPTED]                      │
│  bids, bid_documents, bid_hashes, bid_submissions        │
│  (what was submitted — sealed until evaluation)          │
├─────────────────────────────────────────────────────────┤
│  Layer 4 — AI Analysis  [SEPARATE FROM BIDS]             │
│  eligibility_results, ai_evaluations, ai_scores,         │
│  ai_recommendations, risk_assessments, anomaly_results   │
│  (what AI found — cannot be confused with source data)   │
├─────────────────────────────────────────────────────────┤
│  Layer 5 — Human Decision                                │
│  government_decisions, decision_overrides                │
│  (what humans decided, and why they overrode AI)         │
├─────────────────────────────────────────────────────────┤
│  Layer 6 — Audit Trail  [IMMUTABLE]                      │
│  audit_logs, notifications, service_health_log           │
│  (permanent record — no updates/deletes allowed)         │
└─────────────────────────────────────────────────────────┘
```

---

## Key Integrity Mechanisms

| Mechanism | Where | Purpose |
|---|---|---|
| Partial unique index `uq_bid_one_active_per_company_tender` | `bids` | Prevents duplicate bid submission |
| Partial unique index `uq_bid_submission_active` | `bid_submissions` | Enforces sealed envelope model |
| Partial unique index `uq_government_decision_tender` | `government_decisions` | One final decision per tender |
| Trigger `trg_audit_log_immutable` | `audit_logs` | BEFORE UPDATE/DELETE — raises exception |
| Trigger `trg_lock_submitted_bid_fields` | `bids` | Prevents field changes after submission |
| Trigger `trg_validate_criteria_weights` | `tender_evaluation_criteria` | Weights cannot exceed 100 per tender |
| Trigger `trg_validate_tender_publish` | `tenders` | Prevents publishing past-deadline tenders |
| Trigger `trg_validate_bid_tender_status` | `bids` | Prevents bids on non-open tenders |
| `sha256_hash` on all documents | `bid_documents`, `company_documents` | Tamper detection |
| `bid_hashes` table | Snapshot at submission | Full bid integrity proof |
| `receipt_token` UNIQUE | `bid_submissions` | Cryptographic submission receipt |
| `encryption_key_id` on bids/companies | `bids`, `companies` | KMS key rotation support |
