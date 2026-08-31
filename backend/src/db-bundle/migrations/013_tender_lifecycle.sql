-- =============================================================================
-- Migration 013 — Tender Lifecycle State Machine & Transition Rules
-- ProcureAI Phase 4: Complete Tender Management
--
-- Lifecycle Sequence:
--   DRAFT
--   → PUBLISHED
--   → OPEN
--   → CLOSED
--   → BIDS_REVEALED
--   → UNDER_EVALUATION
--   → RECOMMENDATION_READY
--   → DECISION_MADE
--   → COMPLETED
-- (Any non-completed state can also transition to CANCELLED)
-- =============================================================================

-- Add uppercase lifecycle state values to tender_status enum
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'PUBLISHED';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'BIDS_REVEALED';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'UNDER_EVALUATION';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'RECOMMENDATION_READY';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'DECISION_MADE';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE tender_status ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Add index on status for lifecycle dashboard queries
CREATE INDEX IF NOT EXISTS idx_tenders_lifecycle_status ON tenders(status);

-- ── State Machine Transition Validation Trigger ──────────────────────────────
CREATE OR REPLACE FUNCTION fn_validate_tender_transition()
RETURNS TRIGGER AS $$
DECLARE
  old_st TEXT;
  new_st TEXT;
  is_valid BOOLEAN := FALSE;
BEGIN
  -- Normalize to uppercase for comparison
  old_st := UPPER(OLD.status::text);
  new_st := UPPER(NEW.status::text);

  -- Self-transitions (e.g. updating description or metadata in same state) are allowed
  IF old_st = new_st THEN
    RETURN NEW;
  END IF;

  -- Cancellation is permitted from any non-terminal state
  IF new_st = 'CANCELLED' AND old_st NOT IN ('COMPLETED', 'CANCELLED') THEN
    RETURN NEW;
  END IF;

  -- Forward state transitions
  CASE old_st
    WHEN 'DRAFT' THEN
      IF new_st IN ('PUBLISHED', 'OPEN') THEN is_valid := TRUE; END IF;

    WHEN 'PUBLISHED' THEN
      IF new_st IN ('OPEN', 'CLOSED') THEN is_valid := TRUE; END IF;

    WHEN 'OPEN' THEN
      IF new_st = 'CLOSED' THEN is_valid := TRUE; END IF;

    WHEN 'CLOSED' THEN
      IF new_st = 'BIDS_REVEALED' THEN is_valid := TRUE; END IF;

    WHEN 'BIDS_REVEALED' THEN
      IF new_st = 'UNDER_EVALUATION' THEN is_valid := TRUE; END IF;

    WHEN 'UNDER_EVALUATION' THEN
      IF new_st = 'RECOMMENDATION_READY' THEN is_valid := TRUE; END IF;

    WHEN 'RECOMMENDATION_READY' THEN
      IF new_st = 'DECISION_MADE' THEN is_valid := TRUE; END IF;

    WHEN 'DECISION_MADE' THEN
      IF new_st = 'COMPLETED' THEN is_valid := TRUE; END IF;

    ELSE
      is_valid := FALSE;
  END CASE;

  IF NOT is_valid THEN
    RAISE EXCEPTION
      'Invalid tender state transition: cannot transition from % to %. Permitted progression is DRAFT -> PUBLISHED -> OPEN -> CLOSED -> BIDS_REVEALED -> UNDER_EVALUATION -> RECOMMENDATION_READY -> DECISION_MADE -> COMPLETED.',
      old_st, new_st
      USING ERRCODE = 'check_violation';
  END IF;

  -- Timestamp maintenance on state changes
  IF new_st = 'CLOSED' AND NEW.closed_at IS NULL THEN
    NEW.closed_at := NOW();
  ELSIF new_st = 'PUBLISHED' AND NEW.published_at IS NULL THEN
    NEW.published_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_tender_transition ON tenders;
CREATE TRIGGER trg_validate_tender_transition
  BEFORE UPDATE OF status ON tenders
  FOR EACH ROW EXECUTE FUNCTION fn_validate_tender_transition();

-- ── Draft Protection Trigger ──────────────────────────────────────────────────
-- Modifications to criteria or requirements are only permitted in DRAFT state.
CREATE OR REPLACE FUNCTION fn_protect_tender_specifications()
RETURNS TRIGGER AS $$
DECLARE
  t_status TEXT;
BEGIN
  SELECT UPPER(status::text) INTO t_status FROM tenders WHERE id = NEW.tender_id;

  IF t_status NOT IN ('DRAFT', 'PUBLISHED') THEN
    RAISE EXCEPTION
      'Cannot modify tender criteria or requirements while tender is in % state. Changes only allowed in DRAFT or PUBLISHED.',
      t_status
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_tender_requirements ON tender_requirements;
CREATE TRIGGER trg_protect_tender_requirements
  BEFORE UPDATE OR DELETE ON tender_requirements
  FOR EACH ROW EXECUTE FUNCTION fn_protect_tender_specifications();

DROP TRIGGER IF EXISTS trg_protect_tender_criteria ON tender_evaluation_criteria;
CREATE TRIGGER trg_protect_tender_criteria
  BEFORE UPDATE OR DELETE ON tender_evaluation_criteria
  FOR EACH ROW EXECUTE FUNCTION fn_protect_tender_specifications();
