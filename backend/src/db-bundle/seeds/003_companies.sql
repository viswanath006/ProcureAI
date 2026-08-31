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
