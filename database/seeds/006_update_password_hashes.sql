-- =============================================================================
-- Seed 006 — Update Dev Password Hashes
-- Replaces placeholder hashes with real bcrypt(cost=12) hashes.
-- Dev password for ALL seed users: ProcureAI_Dev_2026!
--
-- Hash generated with: node -e "const b=require('bcryptjs');console.log(b.hashSync('ProcureAI_Dev_2026!',12))"
-- IMPORTANT: These hashes are for DEVELOPMENT ONLY. Never use in production.
-- =============================================================================

-- Real bcrypt cost-12 hash of "ProcureAI_Dev_2026!"
DO $$
DECLARE
  dev_hash TEXT := '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/tHDirJJ4K';
BEGIN
  UPDATE users SET password_hash = dev_hash
  WHERE email IN (
    'officer.alpha@procureai.dev',
    'evaluator.beta@procureai.dev',
    'auditor.gamma@procureai.dev',
    'rep.alpha@alphacorp.dev',
    'rep.beta@betasolutions.dev',
    'rep.gamma@gammatech.dev'
  );

  RAISE NOTICE 'Updated password hashes for % dev users', (
    SELECT COUNT(*) FROM users
    WHERE email IN (
      'officer.alpha@procureai.dev',
      'evaluator.beta@procureai.dev',
      'auditor.gamma@procureai.dev',
      'rep.alpha@alphacorp.dev',
      'rep.beta@betasolutions.dev',
      'rep.gamma@gammatech.dev'
    )
  );
END;
$$;
