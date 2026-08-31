-- =============================================================================
-- Migration 009 — Observability Domain
-- Tables: audit_logs, notifications
-- Also preserves Phase 1 service_health_log
-- =============================================================================

-- ── audit_logs ────────────────────────────────────────────────────────────────
-- IMMUTABLE append-only audit trail of all system actions.
-- NO UPDATE or DELETE is ever issued on this table.
-- Row security policy (Phase 3) will enforce this at DB level.
-- actor_id may be NULL for system-generated events.
-- target_* allows logging actions against any entity type.
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID          REFERENCES users(id) ON DELETE SET NULL,  -- who did it
  action          audit_action  NOT NULL,
  target_type     VARCHAR(100)  NOT NULL,   -- table name: 'tenders', 'bids', etc.
  target_id       UUID,                     -- PK of the affected row
  target_ref      VARCHAR(200),             -- human-readable reference (tender ref no, bid ref)
  previous_state  JSONB,                    -- snapshot BEFORE the change (for diffs)
  new_state       JSONB,                    -- snapshot AFTER the change
  ip_address      INET,
  user_agent      TEXT,
  session_id      TEXT,
  correlation_id  TEXT,                     -- trace ID for distributed request tracing
  metadata        JSONB         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  -- Intentionally NO updated_at — this table is append-only
);

COMMENT ON TABLE audit_logs IS 'IMMUTABLE append-only audit trail. Never UPDATE or DELETE. Embodies: SYSTEM AUDITS.';
COMMENT ON COLUMN audit_logs.previous_state IS 'Full JSON snapshot of the row BEFORE the action. NULL for creation events.';
COMMENT ON COLUMN audit_logs.new_state IS 'Full JSON snapshot of the row AFTER the action. NULL for deletion events.';
COMMENT ON COLUMN audit_logs.correlation_id IS 'Distributed trace ID for correlating events across microservices.';

-- Prevent accidental updates/deletes via trigger
CREATE OR REPLACE FUNCTION fn_audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is immutable — UPDATE and DELETE are not permitted (action=%, target_id=%)',
    OLD.action, OLD.id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON audit_logs;
CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log_immutable();

-- ── notifications ─────────────────────────────────────────────────────────────
-- System notifications delivered to users via in-app, email, or SMS.
-- Allows future multi-channel fan-out without schema changes.
CREATE TABLE IF NOT EXISTS notifications (
  id                UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type notification_type       NOT NULL,
  channel           notification_channel    NOT NULL DEFAULT 'in_app',
  status            notification_status     NOT NULL DEFAULT 'pending',
  subject           VARCHAR(500)            NOT NULL,
  body              TEXT                    NOT NULL,
  -- Optional references to the entity that triggered the notification
  related_tender_id UUID                    REFERENCES tenders(id) ON DELETE SET NULL,
  related_bid_id    UUID                    REFERENCES bids(id) ON DELETE SET NULL,
  priority          SMALLINT                NOT NULL DEFAULT 0,  -- 0=normal, 1=high, 2=critical
  send_after_at     TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  read_at           TIMESTAMPTZ,
  failed_reason     TEXT,
  retry_count       SMALLINT                NOT NULL DEFAULT 0,
  metadata          JSONB                   NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_notification_priority CHECK (priority BETWEEN 0 AND 2),
  CONSTRAINT chk_notification_retries  CHECK (retry_count >= 0)
);

COMMENT ON TABLE notifications IS 'Multi-channel notification queue. Supports in_app, email, and SMS delivery.';
COMMENT ON COLUMN notifications.priority IS '0=normal, 1=high, 2=critical. Higher priority notifications are processed first.';
COMMENT ON COLUMN notifications.send_after_at IS 'Earliest time to send. Enables scheduled/delayed notifications.';

-- ── service_health_log (Phase 1 — preserved) ─────────────────────────────────
-- Originally created in Phase 1. Kept for infrastructure health monitoring.
CREATE TABLE IF NOT EXISTS service_health_log (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100)  NOT NULL,
  status       VARCHAR(50)   NOT NULL DEFAULT 'healthy',
  message      TEXT,
  metadata     JSONB         NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE service_health_log IS 'Phase 1 infrastructure health log. Preserved for backward compatibility.';
