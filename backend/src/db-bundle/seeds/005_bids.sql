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
