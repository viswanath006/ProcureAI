-- =============================================================================
-- Migration 002 — ENUM Types
-- ProcureAI Phase 2 Database Architecture
-- All state-machine values are enforced at the PostgreSQL level.
-- =============================================================================

-- ── User / Identity ──────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM (
  'pending_verification',   -- registered but email/identity not confirmed
  'active',                 -- fully verified, can use platform
  'suspended',              -- temporarily disabled by admin
  'deactivated'             -- permanently disabled
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Company ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE company_status AS ENUM (
  'pending_review',         -- documents submitted, awaiting KYC approval
  'verified',               -- KYC passed, can submit bids
  'rejected',               -- KYC failed
  'suspended',              -- blocked by compliance
  'deactivated'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM (
  'pending',                -- uploaded, not yet reviewed
  'approved',
  'rejected',
  'expired'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
  'registration_certificate',
  'tax_clearance',
  'audited_financials',
  'director_id',
  'bank_statement',
  'iso_certification',
  'other'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Tender ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE tender_status AS ENUM (
  'draft',                  -- being authored, not published
  'published',              -- open for bids
  'clarification',          -- Q&A period, bids on hold
  'closed',                 -- deadline passed, no new bids
  'under_evaluation',       -- AI + human evaluation in progress
  'awarded',                -- winner selected
  'cancelled'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE requirement_type AS ENUM (
  'financial',              -- minimum turnover, net worth etc.
  'technical',              -- certifications, experience
  'legal',                  -- registration, compliance
  'capacity'                -- manpower, equipment
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE criteria_type AS ENUM (
  'technical',
  'financial',
  'experience',
  'delivery_timeline',
  'quality',
  'social_impact',
  'environmental'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Bid ───────────────────────────────────────────────────────────────────────

DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_type AS ENUM (
  'initial',                -- first submission
  'revision',               -- allowed amendment before deadline
  'final'                   -- explicitly marked final by bidder
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── AI Pipeline ───────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE eligibility_status AS ENUM (
  'pass',
  'fail',
  'waived',                 -- manually waived by officer with reason
  'not_applicable'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE evaluation_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',                 -- AI pipeline error
  'cancelled'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recommendation_type AS ENUM (
  'award',
  'reject',
  'shortlist',
  'request_clarification',
  'flag_for_review'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_category AS ENUM (
  'financial',
  'compliance',
  'capacity',
  'experience',
  'conflict_of_interest',
  'data_integrity',
  'bid_manipulation'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE anomaly_severity AS ENUM (
  'informational',
  'warning',
  'critical'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Decision ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE decision_type AS ENUM (
  'award',
  'reject',
  'defer',                  -- defer to committee / legal review
  'cancel_tender',
  're_tender'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE override_reason_type AS ENUM (
  'ai_error',               -- AI produced incorrect result
  'additional_information', -- officer has info AI did not
  'policy_exception',       -- government policy override
  'emergency',              -- emergency procurement rules
  'committee_directive',    -- higher authority instruction
  'other'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Observability ─────────────────────────────────────────────────────────────

DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'sms'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed',
  'read'
);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
