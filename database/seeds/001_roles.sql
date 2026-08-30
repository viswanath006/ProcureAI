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
