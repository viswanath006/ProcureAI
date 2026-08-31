-- >>> BEGIN 001_roles.sql <<<
-- =============================================================================
-- Seed 001 — Roles
-- Five system roles for ProcureAI. Permissions are additive strings.
-- =============================================================================

INSERT INTO roles (id, code, name, description, permissions, is_system) VALUES

  (
    '00000000-0000-0000-0000-000000000001',
    'ADMIN',
    'Platform Administrator',
    'Full system access. Manages users, roles, and system configuration.',
    '["*"]',
    TRUE
  ),

  (
    '00000000-0000-0000-0000-000000000002',
    'GOVT_OFFICER',
    'Government Procurement Officer',
    'Creates and manages tenders, reviews evaluations, makes final procurement decisions.',
    '[
      "tender:create","tender:read","tender:update","tender:publish","tender:close","tender:award",
      "bid:read","bid:evaluate","bid:disqualify",
      "eligibility:read","eligibility:waive",
      "evaluation:trigger","evaluation:read",
      "decision:make","decision:read",
      "anomaly:read","anomaly:review",
      "risk:read",
      "audit:read",
      "company:verify","company:suspend",
      "notification:send"
    ]',
    TRUE
  ),

  (
    '00000000-0000-0000-0000-000000000003',
    'EVALUATOR',
    'Technical Evaluator',
    'Reviews bids and AI evaluations. Cannot make final award decisions.',
    '[
      "tender:read",
      "bid:read","bid:evaluate",
      "eligibility:read","eligibility:create","eligibility:update",
      "evaluation:read",
      "risk:create","risk:read","risk:update",
      "anomaly:read",
      "audit:read"
    ]',
    TRUE
  ),

  (
    '00000000-0000-0000-0000-000000000004',
    'BIDDER',
    'Company Bidder Representative',
    'Registers company, uploads documents, creates and submits bids.',
    '[
      "tender:read",
      "bid:create","bid:read:own","bid:update:own","bid:submit:own","bid:withdraw:own",
      "company:read:own","company:update:own",
      "document:upload","document:read:own",
      "notification:read:own"
    ]',
    TRUE
  ),

  (
    '00000000-0000-0000-0000-000000000005',
    'AUDITOR',
    'Compliance Auditor',
    'Read-only access to all procurement records, decisions, and audit trails.',
    '[
      "tender:read","bid:read","company:read",
      "evaluation:read","decision:read",
      "override:read","anomaly:read","risk:read",
      "audit:read"
    ]',
    TRUE
  )

ON CONFLICT (code) DO NOTHING;

-- >>> END 001_roles.sql <<<

-- >>> BEGIN 002_users.sql <<<
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

-- >>> END 002_users.sql <<<

-- >>> BEGIN 003_companies.sql <<<
-- =============================================================================
-- Seed 003 — Companies
-- Three fictional bidder companies for development and testing.
-- DO NOT use real company names, registration numbers, or financial data.
-- Financial figures are placeholder paisa values (not real amounts).
-- =============================================================================

-- Update bidder users' company_id after companies are inserted (done at bottom).

INSERT INTO companies (
  id, created_by,
  registration_number, name, legal_name,
  industry,
  address_line1, city, state, country, postal_code,
  website,
  annual_turnover_paisa, net_worth_paisa,
  employee_count, years_in_operation,
  status, verified_at, verified_by,
  metadata
) VALUES

  -- ── Alpha Corp — large, established company ──────────────────────────────
  (
    '00000002-0000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000004',  -- created by rep.alpha
    'REG-SAMPLE-ALPHA-001',
    'Alpha Corp',
    'Alpha Corporation Private Limited',
    'infrastructure',
    '42 Sample Industrial Area, Phase II',
    'Sample City North',
    'Sample State',
    'India',
    '110001',
    'https://alphacorp.dev',
    500000000000,    -- 500 Cr turnover (placeholder, encrypted in prod)
    200000000000,    -- 200 Cr net worth (placeholder)
    850,
    18,
    'verified',
    NOW() - INTERVAL '30 days',
    '00000001-0000-0000-0000-000000000001',  -- verified by Officer Alpha
    '{"dev_note": "Fictional large infrastructure company", "iso_certified": true, "certifications": ["ISO-9001", "ISO-14001"]}'
  ),

  -- ── Beta Solutions — mid-size IT company ────────────────────────────────
  (
    '00000002-0000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000005',  -- created by rep.beta
    'REG-SAMPLE-BETA-002',
    'Beta Solutions',
    'Beta Solutions Technologies Private Limited',
    'information_technology',
    '17 Tech Park, Block C',
    'Sample City South',
    'Sample State',
    'India',
    '560001',
    'https://betasolutions.dev',
    120000000000,    -- 120 Cr turnover (placeholder)
    45000000000,     -- 45 Cr net worth (placeholder)
    320,
    9,
    'verified',
    NOW() - INTERVAL '15 days',
    '00000001-0000-0000-0000-000000000001',
    '{"dev_note": "Fictional mid-size IT company", "iso_certified": true, "certifications": ["ISO-27001", "CMMI-3"]}'
  ),

  -- ── Gamma Technologies — small specialist firm ────────────────────────────
  (
    '00000002-0000-0000-0000-000000000003',
    '00000001-0000-0000-0000-000000000006',  -- created by rep.gamma
    'REG-SAMPLE-GAMMA-003',
    'Gamma Technologies',
    'Gamma Technologies and Engineering LLP',
    'infrastructure',
    '8 Startup Hub, Ground Floor',
    'Sample City East',
    'Sample State',
    'India',
    '400001',
    'https://gammatech.dev',
    35000000000,     -- 35 Cr turnover (placeholder)
    12000000000,     -- 12 Cr net worth (placeholder)
    95,
    4,
    'verified',
    NOW() - INTERVAL '7 days',
    '00000001-0000-0000-0000-000000000001',
    '{"dev_note": "Fictional small specialist engineering firm", "iso_certified": false}'
  )

ON CONFLICT (registration_number) DO NOTHING;

-- ── Link users to their companies ─────────────────────────────────────────────
UPDATE users SET company_id = '00000002-0000-0000-0000-000000000001'
  WHERE id = '00000001-0000-0000-0000-000000000004';

UPDATE users SET company_id = '00000002-0000-0000-0000-000000000002'
  WHERE id = '00000001-0000-0000-0000-000000000005';

UPDATE users SET company_id = '00000002-0000-0000-0000-000000000003'
  WHERE id = '00000001-0000-0000-0000-000000000006';

-- ── Sample company documents ───────────────────────────────────────────────────
INSERT INTO company_documents (
  id, company_id, uploaded_by,
  document_type, file_name, file_size_bytes, mime_type,
  storage_key, sha256_hash,
  status, valid_from, valid_until, metadata
) VALUES
  -- Alpha Corp: Registration Certificate
  (
    gen_random_uuid(),
    '00000002-0000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000004',
    'registration_certificate',
    'alpha_corp_registration.pdf',
    245760,
    'application/pdf',
    'companies/alpha-corp/registration/cert_v1.pdf',
    'aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd',
    'approved',
    '2020-04-01',
    '2030-03-31',
    '{"dev_note": "Placeholder document hash — not a real file"}'
  ),
  -- Beta Solutions: Tax Clearance
  (
    gen_random_uuid(),
    '00000002-0000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000005',
    'tax_clearance',
    'beta_solutions_tax_clearance_2025.pdf',
    189440,
    'application/pdf',
    'companies/beta-solutions/tax/clearance_2025.pdf',
    'bbccddeebbccddeebbccddeebbccddeebbccddeebbccddeebbccddeebbccddee',
    'approved',
    '2025-04-01',
    '2026-03-31',
    '{"dev_note": "Placeholder document hash — not a real file"}'
  ),
  -- Gamma Technologies: Registration Certificate
  (
    gen_random_uuid(),
    '00000002-0000-0000-0000-000000000003',
    '00000001-0000-0000-0000-000000000006',
    'registration_certificate',
    'gamma_tech_llp_registration.pdf',
    198400,
    'application/pdf',
    'companies/gamma-tech/registration/llp_cert_v1.pdf',
    'ccddeeffccddeeffccddeeffccddeeffccddeeffccddeeffccddeeffccddeeff',
    'approved',
    '2022-08-15',
    '2032-08-14',
    '{"dev_note": "Placeholder document hash — not a real file"}'
  )
ON CONFLICT DO NOTHING;

-- >>> END 003_companies.sql <<<

-- >>> BEGIN 004_tender.sql <<<
-- =============================================================================
-- Seed 004 — Sample Tender
-- One fictional tender with 4 eligibility requirements and 5 scoring criteria.
-- No real government department names, amounts, or procurement categories.
-- =============================================================================

-- ── Tender ────────────────────────────────────────────────────────────────────
INSERT INTO tenders (
  id,
  created_by,
  reference_number,
  title,
  description,
  category,
  department,
  estimated_budget_paisa,
  budget_is_public,
  currency,
  submission_start_at,
  submission_deadline_at,
  evaluation_deadline_at,
  project_start_date,
  project_duration_days,
  status,
  published_at,
  contact_email,
  tags,
  metadata
) VALUES (
  '00000003-0000-0000-0000-000000000001',
  '00000001-0000-0000-0000-000000000001',  -- Officer Alpha
  'TENDER-SAMPLE-2026-001',
  'Sample Smart Infrastructure Upgrade — Phase A',
  'This is a fictional sample tender created for ProcureAI development and testing purposes. '
  'It represents a hypothetical infrastructure upgrade project. '
  'Bidders must demonstrate technical capability and financial stability. '
  'This tender does not represent any real government procurement.',
  'infrastructure',
  'Department of Sample Infrastructure (Fictional)',
  25000000000,   -- 25 Cr estimated budget in paisa (placeholder)
  FALSE,         -- budget not shown to bidders
  'INR',
  NOW() - INTERVAL '5 days',             -- already open
  NOW() + INTERVAL '25 days',            -- deadline 25 days from now
  NOW() + INTERVAL '45 days',            -- evaluation deadline
  (NOW() + INTERVAL '60 days')::DATE,    -- project start
  365,                                   -- 1 year project
  'published',
  NOW() - INTERVAL '5 days',
  'procurement@sample-dept.procureai.dev',
  '{"infrastructure", "smart-city", "phase-a", "sample"}',
  '{"dev_note": "Fictional sample tender — not a real procurement", "revision": 1}'
)
ON CONFLICT (reference_number) DO NOTHING;

-- ── Eligibility Requirements ──────────────────────────────────────────────────
INSERT INTO tender_requirements (
  id, tender_id, requirement_type,
  title, description,
  is_mandatory, threshold_value, threshold_unit,
  verification_method, sort_order
) VALUES

  -- Financial requirement
  (
    '00000004-0000-0000-0000-000000000001',
    '00000003-0000-0000-0000-000000000001',
    'financial',
    'Minimum Annual Turnover',
    'Bidder must demonstrate minimum average annual turnover over the last 3 audited financial years. '
    'Threshold is a placeholder value for development testing.',
    TRUE,
    10000000000.0000,  -- 10 Cr in paisa (placeholder)
    'INR_PAISA',
    'Verified against audited financial statements submitted as company documents.',
    1
  ),

  -- Technical requirement
  (
    '00000004-0000-0000-0000-000000000002',
    '00000003-0000-0000-0000-000000000001',
    'technical',
    'Minimum 5 Years Project Experience',
    'Bidder must have completed at least 2 similar projects in the last 5 years. '
    'Experience certificates must be submitted with the bid.',
    TRUE,
    5.0000,
    'years',
    'Verified against experience certificates and client references.',
    2
  ),

  -- Legal requirement
  (
    '00000004-0000-0000-0000-000000000003',
    '00000003-0000-0000-0000-000000000001',
    'legal',
    'Valid Company Registration',
    'Bidder must be a legally registered entity with valid registration certificate. '
    'Registration must be active at the time of bid submission.',
    TRUE,
    NULL,
    NULL,
    'Verified against company registration documents uploaded in platform.',
    3
  ),

  -- Capacity requirement (non-mandatory / preferred)
  (
    '00000004-0000-0000-0000-000000000004',
    '00000003-0000-0000-0000-000000000001',
    'capacity',
    'ISO 9001 Certification (Preferred)',
    'Bidder holding a valid ISO 9001 Quality Management System certification '
    'will be given preference during evaluation. Not a disqualifying requirement.',
    FALSE,
    NULL,
    NULL,
    'Certificate uploaded as company document and verified by evaluator.',
    4
  )

ON CONFLICT DO NOTHING;

-- ── Evaluation Criteria (weights must sum to 100) ─────────────────────────────
INSERT INTO tender_evaluation_criteria (
  id, tender_id, criteria_type,
  name, description,
  weight, max_score,
  scoring_rubric, is_ai_scored, sort_order
) VALUES

  -- Technical (40%)
  (
    '00000005-0000-0000-0000-000000000001',
    '00000003-0000-0000-0000-000000000001',
    'technical',
    'Technical Approach & Methodology',
    'Quality and feasibility of the proposed technical approach, methodology, and work plan.',
    40.00, 100.00,
    '{
      "90": "Excellent — detailed methodology, innovative approach, clear work plan with milestones",
      "75": "Good — methodology is sound but lacks some detail or innovation",
      "60": "Adequate — basic methodology meets requirements with gaps",
      "40": "Poor — vague methodology, missing key components",
      "0":  "Not submitted or completely non-compliant"
    }',
    TRUE, 1
  ),

  -- Experience (25%)
  (
    '00000005-0000-0000-0000-000000000002',
    '00000003-0000-0000-0000-000000000001',
    'experience',
    'Relevant Project Experience',
    'Quality and relevance of past projects, client references, and demonstrated outcomes.',
    25.00, 100.00,
    '{
      "90": "Excellent — 3+ highly relevant projects with verified outcomes and strong references",
      "75": "Good — 2 relevant projects with good references",
      "60": "Adequate — 1 relevant project or projects with limited relevance",
      "40": "Poor — experience provided but minimally relevant",
      "0":  "No relevant experience demonstrated"
    }',
    TRUE, 2
  ),

  -- Financial (20%)
  (
    '00000005-0000-0000-0000-000000000003',
    '00000003-0000-0000-0000-000000000001',
    'financial',
    'Financial Competitiveness',
    'Competitiveness and reasonableness of the financial proposal relative to market rates and budget.',
    20.00, 100.00,
    '{
      "90": "Highly competitive — best value, within budget, well-justified",
      "75": "Competitive — reasonable price with good justification",
      "60": "Acceptable — slightly high but justified",
      "40": "Marginal — significantly above market or below market (dumping risk)",
      "0":  "Not submitted or completely unreasonable"
    }',
    TRUE, 3
  ),

  -- Delivery Timeline (10%)
  (
    '00000005-0000-0000-0000-000000000004',
    '00000003-0000-0000-0000-000000000001',
    'delivery_timeline',
    'Proposed Delivery Timeline',
    'Feasibility and efficiency of the proposed project completion timeline.',
    10.00, 100.00,
    '{
      "90": "Excellent — realistic timeline, ahead of required date, well-planned milestones",
      "75": "Good — meets required deadline with reasonable milestones",
      "60": "Adequate — meets deadline but milestone planning is weak",
      "40": "Poor — timeline is at risk or exceeds project duration",
      "0":  "Timeline not provided or clearly infeasible"
    }',
    TRUE, 4
  ),

  -- Social Impact (5%) — manually scored only
  (
    '00000005-0000-0000-0000-000000000005',
    '00000003-0000-0000-0000-000000000001',
    'social_impact',
    'Local Employment and Social Impact',
    'Commitment to local employment, skill development, and positive social outcomes.',
    5.00, 100.00,
    '{
      "90": "Strong — specific commitments to local hiring, training programs, community engagement",
      "75": "Good — general commitments with some specificity",
      "60": "Adequate — mentions social impact but minimal detail",
      "0":  "No social impact consideration provided"
    }',
    FALSE,  -- manually scored by human evaluator only
    5
  )

ON CONFLICT DO NOTHING;

-- >>> END 004_tender.sql <<<

-- >>> BEGIN 005_bids.sql <<<
-- =============================================================================
-- Seed 005 — Sample Bids, Hashes & Submissions
-- Three fictional bids on the sample tender (one per company).
-- All amounts are encrypted placeholders — not real financial data.
-- =============================================================================

-- ── Bids ──────────────────────────────────────────────────────────────────────
-- Note: bid_amount_enc holds a placeholder string.
-- In production this would be an AES-GCM ciphertext base64 string.

INSERT INTO bids (
  id, tender_id, company_id, created_by,
  bid_reference,
  bid_amount_enc,           -- placeholder ciphertext
  bid_amount_currency,
  completion_days,
  status,
  submitted_at,
  encryption_key_id,
  metadata
) VALUES

  -- Bid from Alpha Corp (strong bidder)
  (
    '00000006-0000-0000-0000-000000000001',
    '00000003-0000-0000-0000-000000000001',   -- sample tender
    '00000002-0000-0000-0000-000000000001',   -- Alpha Corp
    '00000001-0000-0000-0000-000000000004',   -- rep.alpha
    'BID-SAMPLE-2026-001-ALPHA',
    'PLACEHOLDER_CIPHERTEXT_ALPHA_BID_AMOUNT_AES256GCM_BASE64==',
    'INR',
    300,   -- 300 days
    'submitted',
    NOW() - INTERVAL '2 days',
    'kms-key-dev-placeholder-001',
    '{"dev_note": "Fictional Alpha Corp bid — strong competitor", "completeness": "full"}'
  ),

  -- Bid from Beta Solutions (mid-tier bidder)
  (
    '00000006-0000-0000-0000-000000000002',
    '00000003-0000-0000-0000-000000000001',
    '00000002-0000-0000-0000-000000000002',   -- Beta Solutions
    '00000001-0000-0000-0000-000000000005',   -- rep.beta
    'BID-SAMPLE-2026-001-BETA',
    'PLACEHOLDER_CIPHERTEXT_BETA_BID_AMOUNT_AES256GCM_BASE64==',
    'INR',
    330,   -- 330 days
    'submitted',
    NOW() - INTERVAL '1 day',
    'kms-key-dev-placeholder-001',
    '{"dev_note": "Fictional Beta Solutions bid — mid-tier", "completeness": "full"}'
  ),

  -- Bid from Gamma Technologies (budget bidder, smaller firm)
  (
    '00000006-0000-0000-0000-000000000003',
    '00000003-0000-0000-0000-000000000001',
    '00000002-0000-0000-0000-000000000003',   -- Gamma Technologies
    '00000001-0000-0000-0000-000000000006',   -- rep.gamma
    'BID-SAMPLE-2026-001-GAMMA',
    'PLACEHOLDER_CIPHERTEXT_GAMMA_BID_AMOUNT_AES256GCM_BASE64==',
    'INR',
    355,   -- 355 days
    'submitted',
    NOW() - INTERVAL '12 hours',
    'kms-key-dev-placeholder-001',
    '{"dev_note": "Fictional Gamma Tech bid — budget option", "completeness": "partial"}'
  )

ON CONFLICT (bid_reference) DO NOTHING;

-- ── Bid Documents ─────────────────────────────────────────────────────────────
INSERT INTO bid_documents (
  bid_id, uploaded_by,
  document_type, file_name, file_size_bytes, mime_type,
  storage_key, sha256_hash,
  is_encrypted, encryption_key_id, description
) VALUES
  -- Alpha Corp: Technical Proposal
  (
    '00000006-0000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000004',
    'other',
    'alpha_corp_technical_proposal.pdf',
    2097152,
    'application/pdf',
    'bids/alpha-bid-001/technical_proposal.pdf.enc',
    'aabbccddeeff0011aabbccddeeff0011aabbccddeeff0011aabbccddeeff0011',
    TRUE, 'kms-key-dev-placeholder-001',
    'Technical methodology, work plan, and staffing plan'
  ),
  -- Alpha Corp: Financial Proposal
  (
    '00000006-0000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000004',
    'audited_financials',
    'alpha_corp_financial_proposal.xlsx',
    409600,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'bids/alpha-bid-001/financial_proposal.xlsx.enc',
    '1122334455661122334455661122334455661122334455661122334455661122',
    TRUE, 'kms-key-dev-placeholder-001',
    'Itemized financial proposal with BOQ'
  ),
  -- Beta Solutions: Technical Proposal
  (
    '00000006-0000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000005',
    'other',
    'beta_solutions_technical_proposal.pdf',
    1572864,
    'application/pdf',
    'bids/beta-bid-001/technical_proposal.pdf.enc',
    'bbccddeeff00bbccddeeff00bbccddeeff00bbccddeeff00bbccddeeff00bbcc',
    TRUE, 'kms-key-dev-placeholder-001',
    'Technical approach and implementation methodology'
  ),
  -- Gamma Technologies: Technical Proposal
  (
    '00000006-0000-0000-0000-000000000003',
    '00000001-0000-0000-0000-000000000006',
    'other',
    'gamma_tech_technical_proposal.pdf',
    786432,
    'application/pdf',
    'bids/gamma-bid-001/technical_proposal.pdf.enc',
    'ccddeeff0011ccddeeff0011ccddeeff0011ccddeeff0011ccddeeff0011ccdd',
    TRUE, 'kms-key-dev-placeholder-001',
    'Condensed technical proposal'
  )
ON CONFLICT DO NOTHING;

-- ── Bid Hashes (Integrity Snapshots) ─────────────────────────────────────────
-- content_hash = placeholder SHA-256. In production: hash of canonical bid JSON.
INSERT INTO bid_hashes (
  id, bid_id, version, hash_algorithm,
  content_hash, hash_input_json
) VALUES
  (
    '00000007-0000-0000-0000-000000000001',
    '00000006-0000-0000-0000-000000000001',
    1, 'SHA-256',
    'aabb1234aabb1234aabb1234aabb1234aabb1234aabb1234aabb1234aabb1234',
    '{"bid_id":"00000006-0000-0000-0000-000000000001","bid_reference":"BID-SAMPLE-2026-001-ALPHA","tender_id":"00000003-0000-0000-0000-000000000001","document_hashes":["aabbccddeeff0011aabbccddeeff0011aabbccddeeff0011aabbccddeeff0011","1122334455661122334455661122334455661122334455661122334455661122"],"dev_note":"placeholder hash input"}'
  ),
  (
    '00000007-0000-0000-0000-000000000002',
    '00000006-0000-0000-0000-000000000002',
    1, 'SHA-256',
    'bbcc2345bbcc2345bbcc2345bbcc2345bbcc2345bbcc2345bbcc2345bbcc2345',
    '{"bid_id":"00000006-0000-0000-0000-000000000002","bid_reference":"BID-SAMPLE-2026-001-BETA","tender_id":"00000003-0000-0000-0000-000000000001","document_hashes":["bbccddeeff00bbccddeeff00bbccddeeff00bbccddeeff00bbccddeeff00bbcc"],"dev_note":"placeholder hash input"}'
  ),
  (
    '00000007-0000-0000-0000-000000000003',
    '00000006-0000-0000-0000-000000000003',
    1, 'SHA-256',
    'ccdd3456ccdd3456ccdd3456ccdd3456ccdd3456ccdd3456ccdd3456ccdd3456',
    '{"bid_id":"00000006-0000-0000-0000-000000000003","bid_reference":"BID-SAMPLE-2026-001-GAMMA","tender_id":"00000003-0000-0000-0000-000000000001","document_hashes":["ccddeeff0011ccddeeff0011ccddeeff0011ccddeeff0011ccddeeff0011ccdd"],"dev_note":"placeholder hash input"}'
  )
ON CONFLICT (bid_id, version) DO NOTHING;

-- ── Bid Submissions (Sealed Envelopes) ────────────────────────────────────────
INSERT INTO bid_submissions (
  id, bid_id, submitted_by,
  submission_type, bid_hash_id,
  ip_address, declaration_accepted,
  receipt_token, submitted_at
) VALUES
  (
    gen_random_uuid(),
    '00000006-0000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000004',
    'final',
    '00000007-0000-0000-0000-000000000001',
    '10.0.0.1',
    TRUE,
    'RECEIPT-ALPHA-' || encode(gen_random_bytes(16), 'hex'),
    NOW() - INTERVAL '2 days'
  ),
  (
    gen_random_uuid(),
    '00000006-0000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000005',
    'final',
    '00000007-0000-0000-0000-000000000002',
    '10.0.0.2',
    TRUE,
    'RECEIPT-BETA-' || encode(gen_random_bytes(16), 'hex'),
    NOW() - INTERVAL '1 day'
  ),
  (
    gen_random_uuid(),
    '00000006-0000-0000-0000-000000000003',
    '00000001-0000-0000-0000-000000000006',
    'initial',
    '00000007-0000-0000-0000-000000000003',
    '10.0.0.3',
    TRUE,
    'RECEIPT-GAMMA-' || encode(gen_random_bytes(16), 'hex'),
    NOW() - INTERVAL '12 hours'
  )
ON CONFLICT DO NOTHING;

-- ── Sample Audit Log Entries ──────────────────────────────────────────────────
INSERT INTO audit_logs (
  actor_id, action, target_type, target_id, target_ref, new_state
) VALUES
  (
    '00000001-0000-0000-0000-000000000001',
    'tender_published',
    'tenders',
    '00000003-0000-0000-0000-000000000001',
    'TENDER-SAMPLE-2026-001',
    '{"status":"published","dev_note":"Seed audit entry"}'
  ),
  (
    '00000001-0000-0000-0000-000000000004',
    'bid_submitted',
    'bids',
    '00000006-0000-0000-0000-000000000001',
    'BID-SAMPLE-2026-001-ALPHA',
    '{"status":"submitted","dev_note":"Seed audit entry"}'
  ),
  (
    '00000001-0000-0000-0000-000000000005',
    'bid_submitted',
    'bids',
    '00000006-0000-0000-0000-000000000002',
    'BID-SAMPLE-2026-001-BETA',
    '{"status":"submitted","dev_note":"Seed audit entry"}'
  ),
  (
    '00000001-0000-0000-0000-000000000006',
    'bid_submitted',
    'bids',
    '00000006-0000-0000-0000-000000000003',
    'BID-SAMPLE-2026-001-GAMMA',
    '{"status":"submitted","dev_note":"Seed audit entry"}'
  );

-- ── Health log seed ────────────────────────────────────────────────────────────
INSERT INTO service_health_log (service_name, status, message, metadata)
VALUES ('database', 'healthy', 'ProcureAI Phase 2 schema initialized', '{"phase": 2, "tables": 21}');

-- >>> END 005_bids.sql <<<

-- >>> BEGIN 006_update_password_hashes.sql <<<
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

-- >>> END 006_update_password_hashes.sql <<<

-- >>> BEGIN 007_sih_demo_accounts.sql <<<
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

-- >>> END 007_sih_demo_accounts.sql <<<
