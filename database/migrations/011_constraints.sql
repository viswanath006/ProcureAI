-- =============================================================================
-- Migration 011 — Constraints, Triggers & Deferred FKs
-- =============================================================================

-- ── Deferred FK: tenders.awarded_to_bid_id → bids ────────────────────────────
-- Cannot add this FK during table creation because bids table didn't exist yet.
ALTER TABLE tenders
  ADD CONSTRAINT fk_tenders_awarded_bid
    FOREIGN KEY (awarded_to_bid_id)
    REFERENCES bids(id)
    DEFERRABLE INITIALLY DEFERRED;

-- ── Unique active bid per company per tender (the "one bid" rule) ─────────────
-- A company may only have ONE active bid per tender at a time.
-- Withdrawn and disqualified bids do not count (partial index).
-- This prevents duplicate bid submissions at the database level.
CREATE UNIQUE INDEX uq_bid_one_active_per_company_tender
  ON bids(tender_id, company_id)
  WHERE status NOT IN ('withdrawn', 'disqualified');

COMMENT ON INDEX uq_bid_one_active_per_company_tender
  IS 'Prevents a company from having more than one active bid per tender. Core anti-gaming constraint.';

-- ── Unique final submission per bid ──────────────────────────────────────────
-- A bid can only have ONE non-withdrawn submission.
CREATE UNIQUE INDEX uq_bid_submission_active
  ON bid_submissions(bid_id)
  WHERE is_withdrawn = FALSE;

COMMENT ON INDEX uq_bid_submission_active
  IS 'Enforces the sealed envelope model — one active submission per bid.';

-- ── updated_at auto-maintenance trigger ──────────────────────────────────────
-- Applied to all mutable tables so updated_at is always accurate.
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to every mutable table
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'roles', 'users', 'companies', 'company_documents',
      'tenders', 'tender_requirements', 'tender_evaluation_criteria',
      'bids', 'bid_documents',
      'risk_assessments', 'anomaly_results',
      'government_decisions', 'decision_overrides',
      'notifications'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- ── Tender criteria weight validation ────────────────────────────────────────
-- Fires when criteria are inserted/updated. Warns if weights don't sum to 100.
-- Implemented as a CONSTRAINT TRIGGER to run after all row changes in the statement.
CREATE OR REPLACE FUNCTION fn_validate_criteria_weights()
RETURNS TRIGGER AS $$
DECLARE
  total_weight NUMERIC(7, 2);
BEGIN
  SELECT COALESCE(SUM(weight), 0)
  INTO total_weight
  FROM tender_evaluation_criteria
  WHERE tender_id = NEW.tender_id;

  IF total_weight > 100.01 THEN
    RAISE EXCEPTION
      'Criteria weights for tender % sum to %, which exceeds 100%%',
      NEW.tender_id, total_weight;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_validate_criteria_weights
  AFTER INSERT OR UPDATE ON tender_evaluation_criteria
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION fn_validate_criteria_weights();

-- ── Bid submission lock ───────────────────────────────────────────────────────
-- Once a bid is submitted (status = 'submitted'), prevent changes to
-- bid_amount_enc, technical_proposal, and financial_proposal.
CREATE OR REPLACE FUNCTION fn_lock_submitted_bid_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'submitted' AND (
    NEW.bid_amount_enc IS DISTINCT FROM OLD.bid_amount_enc OR
    NEW.technical_proposal IS DISTINCT FROM OLD.technical_proposal OR
    NEW.financial_proposal IS DISTINCT FROM OLD.financial_proposal
  ) THEN
    RAISE EXCEPTION
      'Bid % is sealed (status=submitted). Core financial/proposal fields cannot be modified.',
      OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_submitted_bid_fields
  BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION fn_lock_submitted_bid_fields();

-- ── Tender deadline validation trigger ───────────────────────────────────────
-- Prevent publishing a tender whose deadline is in the past.
CREATE OR REPLACE FUNCTION fn_validate_tender_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.submission_deadline_at <= NOW() THEN
    RAISE EXCEPTION
      'Cannot publish tender % — submission deadline % is in the past.',
      NEW.id, NEW.submission_deadline_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_tender_publish
  BEFORE INSERT OR UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION fn_validate_tender_publish();

-- ── Bidder can only bid on published tenders ──────────────────────────────────
CREATE OR REPLACE FUNCTION fn_validate_bid_tender_status()
RETURNS TRIGGER AS $$
DECLARE
  t_status tender_status;
BEGIN
  SELECT status INTO t_status FROM tenders WHERE id = NEW.tender_id;
  IF t_status NOT IN ('published', 'clarification') THEN
    RAISE EXCEPTION
      'Cannot create/update bid for tender % — tender status is ''%'', must be published or clarification.',
      NEW.tender_id, t_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_bid_tender_status
  BEFORE INSERT ON bids
  FOR EACH ROW EXECUTE FUNCTION fn_validate_bid_tender_status();

-- ── Award decision must reference a submitted bid ─────────────────────────────
CREATE OR REPLACE FUNCTION fn_validate_award_bid_status()
RETURNS TRIGGER AS $$
DECLARE
  b_status bid_status;
BEGIN
  IF NEW.decision = 'award' AND NEW.awarded_bid_id IS NOT NULL THEN
    SELECT status INTO b_status FROM bids WHERE id = NEW.awarded_bid_id;
    IF b_status NOT IN ('submitted', 'under_evaluation', 'shortlisted') THEN
      RAISE EXCEPTION
        'Cannot award decision to bid % with status ''%''.',
        NEW.awarded_bid_id, b_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_award_bid_status
  BEFORE INSERT OR UPDATE ON government_decisions
  FOR EACH ROW EXECUTE FUNCTION fn_validate_award_bid_status();
