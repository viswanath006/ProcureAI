-- =============================================================================
-- Migration 020 — Phase 11: Tamper-Evident Audit System & Cryptographic Hash Chaining
-- Tables: audit_chain_logs
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_chain_logs (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_sequence  BIGSERIAL     UNIQUE,
  actor           VARCHAR(255)  NOT NULL,
  role            VARCHAR(50)   NOT NULL,
  action          VARCHAR(100)  NOT NULL,
  entity          VARCHAR(100)  NOT NULL,
  entity_id       VARCHAR(100),
  tender_id       UUID          REFERENCES tenders(id) ON DELETE SET NULL,
  company_id      UUID          REFERENCES companies(id) ON DELETE SET NULL,
  risk_level      VARCHAR(20)   NOT NULL DEFAULT 'NORMAL',
  details         JSONB         NOT NULL DEFAULT '{}',
  prev_hash       VARCHAR(64)   NOT NULL,
  curr_hash       VARCHAR(64)   NOT NULL,
  timestamp       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_chain_logs IS
  'Cryptographically linked append-only audit trail. HASH(N) = SHA256(event_data + HASH(N-1)).';

-- Indexes for 6-Factor Auditor Filtering
CREATE INDEX IF NOT EXISTS idx_audit_chain_seq ON audit_chain_logs(chain_sequence ASC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_tender ON audit_chain_logs(tender_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_actor ON audit_chain_logs(actor, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_company ON audit_chain_logs(company_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_action ON audit_chain_logs(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_risk ON audit_chain_logs(risk_level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_chain_time ON audit_chain_logs(timestamp DESC);

-- ── Immutability Trigger ───────────────────────────────────────────────────────
-- Prevents ordinary modifications or deletions on the cryptographic audit ledger
CREATE OR REPLACE FUNCTION fn_audit_chain_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT SECURITY VIOLATION: audit_chain_logs is cryptographically sealed and append-only. Modification or deletion is strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_chain_immutable ON audit_chain_logs;
CREATE TRIGGER trg_audit_chain_immutable
  BEFORE UPDATE OR DELETE ON audit_chain_logs
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_chain_immutable();
