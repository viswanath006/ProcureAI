-- =============================================================================
-- Seed 007 — SIH 2026 Standardized Demo Accounts
-- Provides primary and alias accounts for Smart India Hackathon evaluation.
-- Password for ALL accounts: ProcureAI_Dev_2026!
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/tHDirJJ4K
-- =============================================================================

INSERT INTO users (
  id, role_id, email, password_hash, full_name,
  employee_id, department, designation,
  status, email_verified_at, metadata
) VALUES
  -- 1. Primary Government Officer
  (
    '00000001-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000002', -- GOVT_OFFICER
    'officer.suresh@finance.gov.in',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/tHDirJJ4K',
    'Suresh Kumar (Director of Procurement)',
    'GOV-FIN-DIR-01',
    'Department of Expenditure, Ministry of Finance',
    'Senior Procurement Officer',
    'active',
    NOW(),
    '{"sih_demo": true, "department": "School Education & Literacy"}'
  ),

  -- 2. Primary Bidder Representative
  (
    '00000001-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000004', -- BIDDER
    'bidder.alpha@alphacorp.dev',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/tHDirJJ4K',
    'Vikram Mehta (Apex Infra Buildtech Ltd)',
    NULL, NULL,
    'Managing Director & Authorized Bidder',
    'active',
    NOW(),
    '{"sih_demo": true, "company": "Apex Infra Buildtech Ltd"}'
  ),

  -- 3. Primary CAG Auditor
  (
    '00000001-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000005', -- AUDITOR
    'auditor.priya@cag.gov.in',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/tHDirJJ4K',
    'Priya Sharma (Principal Auditor)',
    'CAG-AUDIT-088',
    'Comptroller and Auditor General of India',
    'Senior Audit Officer',
    'active',
    NOW(),
    '{"sih_demo": true, "inspection_scope": "GFR-2017 & Integrity Ledger"}'
  ),

  -- 4. Primary System Administrator
  (
    '00000001-0000-0000-0000-000000000014',
    '00000000-0000-0000-0000-000000000001', -- ADMIN
    'admin.rajesh@procureai.gov.in',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/tHDirJJ4K',
    'Rajesh Verma (Platform Architect)',
    'SYS-NIC-ADM-01',
    'National Informatics / ProcureAI PMU',
    'Principal Enterprise Architect',
    'active',
    NOW(),
    '{"sih_demo": true, "scope": "Super Administrator"}'
  )

ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  status = 'active';
