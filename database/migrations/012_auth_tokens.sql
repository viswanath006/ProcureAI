-- =============================================================================
-- Migration 012 — Auth Tokens Table
-- Stores refresh tokens for rotation + server-side revocation.
-- =============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    CHAR(64)      NOT NULL UNIQUE,  -- SHA-256 hex of the raw refresh token
  family        UUID          NOT NULL DEFAULT gen_random_uuid(), -- rotation family (detect reuse)
  expires_at    TIMESTAMPTZ   NOT NULL,
  is_revoked    BOOLEAN       NOT NULL DEFAULT FALSE,
  revoked_at    TIMESTAMPTZ,
  revoke_reason TEXT,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE refresh_tokens IS 'Server-side refresh token store. Enables rotation and revocation. token_hash is SHA-256 of raw token.';
COMMENT ON COLUMN refresh_tokens.family IS 'Rotation family UUID. If an already-rotated token is replayed, entire family is revoked (theft detection).';

CREATE INDEX idx_refresh_tokens_user_id   ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash      ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_family    ON refresh_tokens(family);
CREATE INDEX idx_refresh_tokens_active    ON refresh_tokens(user_id, expires_at DESC)
  WHERE is_revoked = FALSE;

-- Auto-cleanup expired tokens (runs on every INSERT — cheap for low-volume auth table)
CREATE OR REPLACE FUNCTION fn_cleanup_expired_refresh_tokens()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM refresh_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day'  -- keep 1 day for audit purposes
    AND is_revoked = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_refresh_tokens
  AFTER INSERT ON refresh_tokens
  FOR EACH STATEMENT EXECUTE FUNCTION fn_cleanup_expired_refresh_tokens();
