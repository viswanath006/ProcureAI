-- =============================================================================
-- Migration 019 — Phase 10: Human-in-the-Loop Decision System & Immutability Lock
-- Tables enhanced: government_decisions
-- =============================================================================

-- ── 1. Enhance government_decisions with cryptographic audit fields ──────────
ALTER TABLE government_decisions
  ADD COLUMN IF NOT EXISTS integrity_hash VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS supporting_note TEXT,
  ADD COLUMN IF NOT EXISTS ai_recommendation_summary JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS selected_bidder_summary JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN government_decisions.integrity_hash IS
  'Cryptographic SHA-256 integrity hash chaining officer ID, timestamp, tender ID, AI recommendation, final decision, selected bidder, override status, and reason.';

COMMENT ON COLUMN government_decisions.is_locked IS
  'Immutability lock. When TRUE, database triggers prevent ordinary UPDATE or DELETE operations.';

COMMENT ON COLUMN government_decisions.supporting_note IS
  'Mandatory supporting note or document reference required when selecting an alternative bidder.';

-- ── 2. Database Immutability Trigger ──────────────────────────────────────────
-- Enforces that once a government decision is recorded and locked, it cannot be modified
CREATE OR REPLACE FUNCTION fn_prevent_locked_decision_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_locked = TRUE THEN
    RAISE EXCEPTION 'GOVERNANCE AUDIT VIOLATION: Decision record % is cryptographically locked and cannot be modified or deleted.', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_government_decisions ON government_decisions;
CREATE TRIGGER trg_lock_government_decisions
  BEFORE UPDATE OR DELETE ON government_decisions
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_locked_decision_mutation();
