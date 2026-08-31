-- =============================================================================
-- Seed 002 — Users
-- Fictional sample users for development and testing.
-- All passwords are bcrypt hashes of the string "ProcureAI_Dev_2026!"
-- DO NOT use in production. DO NOT use real names or government identifiers.
-- =============================================================================

-- Password: ProcureAI_Dev_2026!
-- bcrypt hash (cost 12): $2b$12$DEVHASHPLACEHOLDERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-- In a real seed, generate with: node -e "console.log(require('bcryptjs').hashSync('ProcureAI_Dev_2026!',12))"

INSERT INTO users (
  id, role_id, email, password_hash, full_name,
  employee_id, department, designation,
  status, email_verified_at, metadata
) VALUES

  -- Government Procurement Officer
  (
    '00000001-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',  -- GOVT_OFFICER
    'officer.alpha@procureai.dev',
    '$2b$12$devhashplaceholderaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Officer Alpha',
    'DEPT-OFF-001',
    'Department of Infrastructure Development (Sample)',
    'Senior Procurement Officer',
    'active',
    NOW(),
    '{"dev_note": "Sample government officer — fictional", "theme": "dark"}'
  ),

  -- Technical Evaluator
  (
    '00000001-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',  -- EVALUATOR
    'evaluator.beta@procureai.dev',
    '$2b$12$devhashplaceholderaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Evaluator Beta',
    'DEPT-EVL-001',
    'Department of Infrastructure Development (Sample)',
    'Technical Evaluation Specialist',
    'active',
    NOW(),
    '{"dev_note": "Sample technical evaluator — fictional"}'
  ),

  -- Compliance Auditor
  (
    '00000001-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',  -- AUDITOR
    'auditor.gamma@procureai.dev',
    '$2b$12$devhashplaceholderaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Auditor Gamma',
    'AUDIT-001',
    'Office of Procurement Compliance (Sample)',
    'Senior Compliance Auditor',
    'active',
    NOW(),
    '{"dev_note": "Sample auditor — fictional"}'
  ),

  -- Bidder rep for Alpha Corp (company inserted in next seed)
  (
    '00000001-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',  -- BIDDER
    'rep.alpha@alphacorp.dev',
    '$2b$12$devhashplaceholderaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Representative Alpha',
    NULL, NULL, 'Chief Business Development Officer',
    'active',
    NOW(),
    '{"dev_note": "Bidder rep for Alpha Corp — fictional"}'
  ),

  -- Bidder rep for Beta Solutions
  (
    '00000001-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000004',  -- BIDDER
    'rep.beta@betasolutions.dev',
    '$2b$12$devhashplaceholderaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Representative Beta',
    NULL, NULL, 'Head of Tenders and Contracts',
    'active',
    NOW(),
    '{"dev_note": "Bidder rep for Beta Solutions — fictional"}'
  ),

  -- Bidder rep for Gamma Technologies
  (
    '00000001-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000004',  -- BIDDER
    'rep.gamma@gammatech.dev',
    '$2b$12$devhashplaceholderaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Representative Gamma',
    NULL, NULL, 'Director of Business Development',
    'active',
    NOW(),
    '{"dev_note": "Bidder rep for Gamma Technologies — fictional"}'
  )

ON CONFLICT (email) DO NOTHING;
