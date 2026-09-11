-- =============================================================================
-- Migration 021 — OSINT Company Verification & Cross-Bidder Collusion Profiles
-- Tables added: osint_company_cache, bidder_osint_profile
-- Supports:
-- 1. MCA Company Master Data caching with 30-day TTL (data.gov.in)
-- 2. Bidder verification audit records (verified / mismatch / unavailable)
-- 3. Pairwise collusion tracking (shared registered address, shared directors/DINs)
-- =============================================================================

-- ── 1. External OSINT Cache Table (30-day TTL) ─────────────────────────────
CREATE TABLE IF NOT EXISTS osint_company_cache (
  cin                 VARCHAR(50) PRIMARY KEY,
  company_name        VARCHAR(255),
  company_status      VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  incorporation_date  DATE,
  registered_address  TEXT,
  directors           JSONB NOT NULL DEFAULT '[]',
  authorized_capital  NUMERIC(18, 2) DEFAULT 0,
  raw_response        JSONB,
  fetched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

COMMENT ON TABLE osint_company_cache IS 'High-performance cache for external MCA data.gov.in API responses with 30-day TTL';
COMMENT ON COLUMN osint_company_cache.directors IS 'List of registered directors: [{name, din, designation, appointed_date}]';

CREATE INDEX IF NOT EXISTS idx_osint_cache_expires_at ON osint_company_cache (expires_at);
CREATE INDEX IF NOT EXISTS idx_osint_cache_status ON osint_company_cache (company_status);

-- ── 2. Bidder OSINT Verification Profile Table ─────────────────────────────
CREATE TABLE IF NOT EXISTS bidder_osint_profile (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bidder_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cin                 VARCHAR(50),
  mca_status          VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  incorporation_date  DATE,
  registered_address  TEXT,
  directors           JSONB NOT NULL DEFAULT '[]',
  last_verified_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status VARCHAR(50) NOT NULL DEFAULT 'verified'
    CHECK (verification_status IN ('verified', 'mismatch', 'unavailable')),
  discrepancy_details JSONB NOT NULL DEFAULT '{}',
  collusion_flags     JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bidder_osint_profile IS 'Official record of company identity cross-referencing against statutory public records';
COMMENT ON COLUMN bidder_osint_profile.verification_status IS 'verified: matched; mismatch: discrepancies found for human officer review; unavailable: external service offline';
COMMENT ON COLUMN bidder_osint_profile.collusion_flags IS 'Pairwise cartel flags: [{flag_type, matching_bidder_id, matching_company_name, reason}]';

CREATE UNIQUE INDEX IF NOT EXISTS idx_bidder_osint_bidder_id ON bidder_osint_profile (bidder_id);
CREATE INDEX IF NOT EXISTS idx_bidder_osint_cin ON bidder_osint_profile (cin);
CREATE INDEX IF NOT EXISTS idx_bidder_osint_status ON bidder_osint_profile (verification_status);
