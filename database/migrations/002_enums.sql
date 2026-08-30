-- =============================================================================
-- Migration 002 — ENUM Types
-- ProcureAI Phase 2 Database Architecture
-- All state-machine values are enforced at the PostgreSQL level.
-- =============================================================================

-- ── User / Identity ──────────────────────────────────────────────────────────

CREATE TYPE user_status AS ENUM (
  'pending_verification',   -- registered but email/identity not confirmed
  'active',                 -- fully verified, can use platform
  'suspended',              -- temporarily disabled by admin
  'deactivated'             -- permanently disabled
);

-- ── Company ───────────────────────────────────────────────────────────────────

CREATE TYPE company_status AS ENUM (
  'pending_review',         -- documents submitted, awaiting KYC approval
  'verified',               -- KYC passed, can submit bids
  'rejected',               -- KYC failed
  'suspended',              -- blocked by compliance
  'deactivated'
);

CREATE TYPE document_status AS ENUM (
  'pending',                -- uploaded, not yet reviewed
  'approved',
  'rejected',
  'expired'
);

CREATE TYPE document_type AS ENUM (
  'registration_certificate',
  'tax_clearance',
  'audited_financials',
  'director_id',
  'bank_statement',
  'iso_certification',
  'other'
);

-- ── Tender ────────────────────────────────────────────────────────────────────

CREATE TYPE tender_status AS ENUM (
  'draft',                  -- being authored, not published
  'published',              -- open for bids
  'clarification',          -- Q&A period, bids on hold
  'closed',                 -- deadline passed, no new bids
  'under_evaluation',       -- AI + human evaluation in progress
  'awarded',                -- winner selected
  'cancelled'
);

CREATE TYPE tender_category AS ENUM (
  'infrastructure',
  'information_technology',
  'healthcare',
  'education',
  'defense',
  'agriculture',
  'energy',
  'transport',
  'environment',
  'other'
);

CREATE TYPE requirement_type AS ENUM (
  'financial',              -- minimum turnover, net worth etc.
  'technical',              -- certifications, experience
  'legal',                  -- registration, compliance
  'capacity'                -- manpower, equipment
);

CREATE TYPE criteria_type AS ENUM (
  'technical',
  'financial',
  'experience',
  'delivery_timeline',
  'quality',
  'social_impact',
  'environmental'
);

-- ── Bid ───────────────────────────────────────────────────────────────────────

CREATE TYPE bid_status AS ENUM (
  'draft',                  -- being composed, not submitted
  'submitted',              -- formally submitted (sealed)
  'withdrawn',              -- voluntarily withdrawn before close
  'disqualified',           -- failed eligibility
  'under_evaluation',       -- actively being scored
  'shortlisted',
  'rejected',
  'awarded'
);

CREATE TYPE submission_type AS ENUM (
  'initial',                -- first submission
  'revision',               -- allowed amendment before deadline
  'final'                   -- explicitly marked final by bidder
);

-- ── AI Pipeline ───────────────────────────────────────────────────────────────

CREATE TYPE eligibility_status AS ENUM (
  'pass',
  'fail',
  'waived',                 -- manually waived by officer with reason
  'not_applicable'
);

CREATE TYPE evaluation_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',                 -- AI pipeline error
  'cancelled'
);

CREATE TYPE recommendation_type AS ENUM (
  'award',
  'reject',
  'shortlist',
  'request_clarification',
  'flag_for_review'
);

CREATE TYPE risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE risk_category AS ENUM (
  'financial',
  'compliance',
  'capacity',
  'experience',
  'conflict_of_interest',
  'data_integrity',
  'bid_manipulation'
);

CREATE TYPE anomaly_type AS ENUM (
  'price_collusion',        -- bids suspiciously similar across companies
  'bid_clustering',         -- multiple bids cluster near the estimate
  'shill_bidding',          -- same entity bidding under different companies
  'document_tampering',     -- hash mismatch on documents
  'abnormal_low_bid',       -- far below market rate (potential dumping)
  'abnormal_high_bid',
  'late_surge',             -- sudden bid pattern change near deadline
  'other'
);

CREATE TYPE anomaly_severity AS ENUM (
  'informational',
  'warning',
  'critical'
);

-- ── Decision ─────────────────────────────────────────────────────────────────

CREATE TYPE decision_type AS ENUM (
  'award',
  'reject',
  'defer',                  -- defer to committee / legal review
  'cancel_tender',
  're_tender'
);

CREATE TYPE override_reason_type AS ENUM (
  'ai_error',               -- AI produced incorrect result
  'additional_information', -- officer has info AI did not
  'policy_exception',       -- government policy override
  'emergency',              -- emergency procurement rules
  'committee_directive',    -- higher authority instruction
  'other'
);

-- ── Observability ─────────────────────────────────────────────────────────────

CREATE TYPE audit_action AS ENUM (
  -- identity
  'user_registered', 'user_verified', 'user_suspended', 'user_login', 'user_logout',
  -- company
  'company_created', 'company_verified', 'company_suspended', 'document_uploaded', 'document_approved',
  -- tender
  'tender_created', 'tender_published', 'tender_closed', 'tender_cancelled',
  -- bid
  'bid_created', 'bid_submitted', 'bid_withdrawn', 'bid_disqualified',
  -- AI pipeline
  'eligibility_check_run', 'ai_evaluation_started', 'ai_evaluation_completed',
  'ai_recommendation_generated',
  -- decision
  'decision_made', 'decision_overridden',
  -- system
  'anomaly_detected', 'risk_flag_raised', 'schema_migrated'
);

CREATE TYPE notification_type AS ENUM (
  'tender_published',
  'bid_received',
  'bid_status_changed',
  'eligibility_result',
  'evaluation_completed',
  'decision_made',
  'document_expiry_warning',
  'anomaly_alert',
  'system_alert'
);

CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'sms'
);

CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed',
  'read'
);
