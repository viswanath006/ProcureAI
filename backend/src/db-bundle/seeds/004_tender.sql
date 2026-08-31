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
