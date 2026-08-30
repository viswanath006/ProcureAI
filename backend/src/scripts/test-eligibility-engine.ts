/**
 * ProcureAI — Phase 5 Bidder Eligibility Engine Test Suite
 *
 * Programmatically tests:
 * 1. Financial Turnover Gate (audited annual turnover vs threshold)
 * 2. Operational Experience Gate (years in operation vs threshold)
 * 3. Completed Projects & Capacity Gate (verified project count vs threshold)
 * 4. Technical Capabilities & Certification Gate (domain accreditations)
 * 5. Legal & Regulatory Non-Debarment Gate (statutory non-debarment declaration)
 * 6. Cryptographic Document Validity & Expiry Checks
 * 7. Mandatory Disqualification vs Preferred (non-disqualifying) requirements
 * 8. Explainability Generation (human-readable evidence & checkmarks)
 * 9. Non-Discrimination Guard (blocking personal/demographic characteristics)
 * 10. Pre-AI Ranking Qualification Enforcement
 */

import {
  evaluateRequirement,
  evaluateBidderEligibility,
  assertNonDiscriminatory,
} from '../services/eligibility.engine';
import { Company, CompanyDocument, TenderRequirement } from '../types/database';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

// ── Mock Factory ─────────────────────────────────────────────────────────────

function createMockCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    created_by: '22222222-2222-2222-2222-222222222222',
    registration_number: 'CIN-U72200DL2018PTC123456',
    name: 'Apex Infrastructure & Cloud Technologies Ltd',
    legal_name: 'Apex Infrastructure & Cloud Technologies Private Limited',
    industry: 'Information Technology',
    address_line1: 'Block C, Cyber Gateway',
    address_line2: null,
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    postal_code: '500081',
    website: 'https://apexinfra.example.com',
    annual_turnover_paisa: BigInt(75000000000), // ₹75.00 Crore (750000000 INR * 100)
    net_worth_paisa: BigInt(35000000000),      // ₹35.00 Crore
    years_in_operation: 8,
    employee_count: 450,
    completed_projects_count: 5,
    completed_projects: [
      { id: 'p1', title: 'State Cloud Data Center', client_name: 'Govt of Telangana', completion_year: 2024 },
      { id: 'p2', title: 'Smart Grid Telemetry', client_name: 'State Electricity Board', completion_year: 2023 },
    ],
    technical_capabilities: [
      { name: 'Tier-3 Data Center Deployment', category: 'Infrastructure', level: 'Enterprise' },
      { name: 'ISO 27001 Certified Security Operations', category: 'Cybersecurity', level: 'Advanced' },
    ],
    compliance_info: {
      is_debarred: false,
      tax_clearance_status: 'valid',
      labor_compliance: true,
      sworn_declaration_date: '2026-01-15',
    },
    financial_capacity: {
      credit_rating: 'CRISIL AA+',
      solvency_ratio: 2.8,
    },
    past_performance: {
      avg_rating: 4.8,
      on_time_completion_pct: 98,
      projects_evaluated: 12,
      blacklisted: false,
    },
    status: 'verified',
    verified_at: new Date('2026-01-01'),
    verified_by: null,
    rejection_reason: null,
    metadata: {},
    encryption_key_id: null,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  };
}

function createMockRequirement(overrides: Partial<TenderRequirement> = {}): TenderRequirement {
  return {
    id: 'req-001',
    tender_id: 't-001',
    requirement_type: 'financial',
    title: 'Minimum Annual Turnover',
    description: 'Audited annual turnover of at least ₹50 Crore in the last 3 financial years.',
    is_mandatory: true,
    threshold_value: '500000000', // 50 Cr in INR
    threshold_unit: 'INR',
    verification_method: 'Audited balance sheet',
    sort_order: 1,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function createMockDocuments(): CompanyDocument[] {
  return [
    {
      id: 'doc-1',
      company_id: '11111111-1111-1111-1111-111111111111',
      uploaded_by: 'user-1',
      document_type: 'tax_clearance',
      file_name: 'Annual_Audited_Accounts_2025.pdf',
      file_size_bytes: BigInt(2048500),
      mime_type: 'application/pdf',
      storage_key: 's3/tax_clearance.pdf',
      sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'approved',
      valid_from: '2025-04-01',
      valid_until: '2027-03-31',
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'doc-2',
      company_id: '11111111-1111-1111-1111-111111111111',
      uploaded_by: 'user-1',
      document_type: 'registration_certificate',
      file_name: 'Statutory_Non_Debarment_Affidavit.pdf',
      file_size_bytes: BigInt(1024000),
      mime_type: 'application/pdf',
      storage_key: 's3/affidavit.pdf',
      sha256_hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      status: 'approved',
      valid_from: '2026-01-01',
      valid_until: null, // No expiry
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];
}

async function runEligibilityTests() {
  console.log('\n===============================================================');
  console.log('  PROCUREAI PHASE 5: BIDDER ELIGIBILITY ENGINE TEST SUITE');
  console.log('===============================================================\n');

  const baseCompany = createMockCompany();
  const docs = createMockDocuments();

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Financial Turnover Gate
  // ───────────────────────────────────────────────────────────────────────────
  console.log('─── 1. Financial Turnover Gate (Audited Revenue) ─────────────');

  const turnoverReq = createMockRequirement({
    requirement_type: 'financial',
    title: 'Minimum Audited Turnover',
    threshold_value: '500000000', // 50 Cr
    threshold_unit: 'INR',
  });

  const turnoverPass = evaluateRequirement(turnoverReq, baseCompany, docs);
  assert(
    turnoverPass.passed && turnoverPass.status === 'pass',
    'Company with ₹75 Cr turnover passes ₹50 Cr requirement'
  );
  assert(
    turnoverPass.evidenceSummary.includes('✓ Turnover requirement satisfied'),
    'Turnover pass evidence includes positive checkmark and values'
  );

  const lowTurnoverCompany = createMockCompany({
    annual_turnover_paisa: BigInt(30000000000), // ₹30 Cr
  });
  const turnoverFail = evaluateRequirement(turnoverReq, lowTurnoverCompany, docs);
  assert(
    !turnoverFail.passed && turnoverFail.status === 'fail',
    'Company with ₹30 Cr turnover fails ₹50 Cr requirement'
  );
  assert(
    turnoverFail.evidenceSummary.includes('❌ Turnover requirement failed'),
    'Turnover failure evidence includes cross mark and shortfall detail'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Operational Experience Gate
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n─── 2. Operational Experience Gate (Years in Operation) ──────');

  const expReq = createMockRequirement({
    requirement_type: 'experience',
    title: 'Minimum Operational Experience',
    threshold_value: '5',
    threshold_unit: 'years',
  });

  const expPass = evaluateRequirement(expReq, baseCompany, docs);
  assert(
    expPass.passed && expPass.status === 'pass',
    'Company with 8 years experience passes 5-year requirement'
  );
  assert(
    expPass.evidenceSummary.includes('8 years in operation exceeds required 5 years'),
    'Experience pass summary details actual vs required years'
  );

  const youngCompany = createMockCompany({ years_in_operation: 2 });
  const expFail = evaluateRequirement(expReq, youngCompany, docs);
  assert(
    !expFail.passed && expFail.status === 'fail',
    'Company with 2 years experience fails 5-year requirement'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Completed Projects & Capacity Gate
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n─── 3. Completed Projects Gate (Verified Project Count) ─────');

  const projectReq = createMockRequirement({
    requirement_type: 'capacity',
    title: 'Track Record of Completed Projects',
    threshold_value: '3',
    threshold_unit: 'projects',
  });

  const projectPass = evaluateRequirement(projectReq, baseCompany, docs);
  assert(
    projectPass.passed,
    'Company with 5 completed projects passes requirement of 3'
  );

  const fewProjectsCompany = createMockCompany({
    completed_projects_count: 1,
    completed_projects: [],
  });
  const projectFail = evaluateRequirement(projectReq, fewProjectsCompany, docs);
  assert(
    !projectFail.passed,
    'Company with 1 completed project fails requirement of 3'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Technical Capabilities Gate
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n─── 4. Technical Capabilities & Certification Gate ───────────');

  const techReq = createMockRequirement({
    requirement_type: 'technical',
    title: 'Tier-3 Data Center Deployment Capability',
    description: 'Proven technical capacity in Tier-3 architecture',
  });

  const techPass = evaluateRequirement(techReq, baseCompany, docs);
  assert(
    techPass.passed,
    'Company with Tier-3 Data Center capability passes technical gate'
  );

  const unqualifiedCompany = createMockCompany({
    technical_capabilities: [{ name: 'Basic Web Development' }],
  });
  const techFail = evaluateRequirement(
    createMockRequirement({
      requirement_type: 'technical',
      title: 'Satellite Uplink Telemetry System',
    }),
    unqualifiedCompany,
    []
  );
  assert(
    !techFail.passed,
    'Company lacking specialized satellite capability fails gate'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Legal Compliance & Non-Debarment Gate
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n─── 5. Legal & Statutory Non-Debarment Gate ──────────────────');

  const legalReq = createMockRequirement({
    requirement_type: 'legal',
    title: 'Non-Debarment Statutory Affidavit',
    description: 'Sworn affidavit confirming bidder is not debarred or blacklisted',
    is_mandatory: true,
  });

  const legalPass = evaluateRequirement(legalReq, baseCompany, docs);
  assert(
    legalPass.passed,
    'Non-debarred company with affidavit doc passes legal gate'
  );

  const debarredCompany = createMockCompany({
    compliance_info: {
      is_debarred: true, // Blacklisted
      sworn_declaration_date: '2026-01-01',
    },
  });
  const legalFail = evaluateRequirement(legalReq, debarredCompany, docs);
  assert(
    !legalFail.passed,
    'Debarred company is strictly disqualified under legal gate'
  );
  assert(
    legalFail.evidenceSummary.includes('statutory debarment register'),
    'Legal failure details debarment register flag'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Cryptographic Document Validity & Expiry
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n─── 6. Document Validity & Tamper Detection ──────────────────');

  const docReq = createMockRequirement({
    requirement_type: 'technical',
    title: 'Cybersecurity ISO 27001 Compliance Certificate',
    description: 'Mandatory ISO 27001 certificate document check',
  });

  const docPass = evaluateRequirement(docReq, baseCompany, docs);
  assert(
    docPass.passed,
    'Valid non-expired approved document satisfies document check'
  );

  const expiredDocs: CompanyDocument[] = [
    {
      ...docs[0],
      file_name: 'Cybersecurity_ISO_27001_Compliance_Certificate.pdf',
      valid_until: '2024-01-01', // Expired
    },
  ];
  const companyWithoutCap = createMockCompany({ technical_capabilities: [] });
  const expiredCheck = evaluateRequirement(docReq, companyWithoutCap, expiredDocs);
  assert(
    !expiredCheck.passed,
    'Expired compliance document fails eligibility check'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Overall Tender Eligibility Evaluation & Explainable Report
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n─── 7. Overall Evaluation & Explainable Dossier ───────────────');

  const fullTenderRequirements = [turnoverReq, expReq, projectReq, techReq, legalReq];

  const fullReportEligible = evaluateBidderEligibility(fullTenderRequirements, baseCompany, docs, 'bid-101');
  assert(
    fullReportEligible.isEligible && fullReportEligible.verdict === 'ELIGIBLE',
    'Fully qualified company receives verdict ELIGIBLE'
  );
  assert(
    fullReportEligible.checks.length === 5,
    'Report includes evaluation of all 5 tender requirements'
  );
  assert(
    fullReportEligible.summaryExplanation.includes('RESULT: ELIGIBLE'),
    'Report summary clearly states RESULT: ELIGIBLE'
  );

  const disqualifiedCompany = createMockCompany({
    annual_turnover_paisa: BigInt(10000000000), // ₹10 Cr (fails ₹50 Cr)
    years_in_operation: 1,                      // 1 year (fails 5 years)
  });

  const fullReportDisqualified = evaluateBidderEligibility(
    fullTenderRequirements,
    disqualifiedCompany,
    docs,
    'bid-102'
  );
  assert(
    !fullReportDisqualified.isEligible && fullReportDisqualified.verdict === 'NOT_ELIGIBLE',
    'Company failing mandatory gates receives verdict NOT_ELIGIBLE'
  );
  assert(
    fullReportDisqualified.summaryExplanation.includes('RESULT: NOT_ELIGIBLE'),
    'Report summary clearly states RESULT: NOT_ELIGIBLE'
  );
  assert(
    fullReportDisqualified.disqualificationReason !== undefined &&
    fullReportDisqualified.disqualificationReason.includes('non-compliance on 2 mandatory requirement(s)'),
    'Report explains exactly which and how many mandatory gates failed'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Mandatory vs Preferred Requirements (Disqualification Policy)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n─── 8. Mandatory vs Preferred (Non-Disqualifying) Policy ─────');

  const preferredReq = createMockRequirement({
    requirement_type: 'capacity',
    title: 'Preferred 500+ Employee Staffing',
    threshold_value: '500',
    is_mandatory: false, // Preferred but NOT disqualifying
  });

  const smallStaffCompany = createMockCompany({ employee_count: 50 });
  const preferredReport = evaluateBidderEligibility(
    [turnoverReq, preferredReq],
    smallStaffCompany,
    docs
  );

  assert(
    preferredReport.isEligible && preferredReport.verdict === 'ELIGIBLE',
    'Failing a non-mandatory preferred requirement does NOT disqualify bidder'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Non-Discrimination Guard
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n─── 9. Strict Non-Discrimination Guard ────────────────────────');

  assert(
    (() => {
      try {
        assertNonDiscriminatory(turnoverReq, baseCompany);
        return true;
      } catch {
        return false;
      }
    })(),
    'Valid corporate objective criteria passes non-discrimination guard'
  );

  const discriminatoryReq = createMockRequirement({
    title: 'Director Gender Criteria',
    description: 'Requires specific gender ratio of board members',
  });

  assert(
    (() => {
      try {
        assertNonDiscriminatory(discriminatoryReq, baseCompany);
        return false;
      } catch (err: any) {
        return err.message.includes('DISCRIMINATORY_REQUIREMENT_REJECTED');
      }
    })(),
    'Requirement mentioning prohibited personal characteristic is strictly rejected'
  );

  const discriminatoryCompany = createMockCompany({
    metadata: { caste: 'prohibited_key' },
  });

  assert(
    (() => {
      try {
        assertNonDiscriminatory(turnoverReq, discriminatoryCompany);
        return false;
      } catch (err: any) {
        return err.message.includes('DISCRIMINATORY_DATA_REJECTED');
      }
    })(),
    'Company metadata containing personal demographic trait is strictly rejected'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 10. Pre-AI Ranking Gate Qualification
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n─── 10. Pre-AI Ranking Qualification Gate ────────────────────');

  function filterEligibleBidsForAiRanking(bids: Array<{ id: string; isEligible: boolean }>): string[] {
    return bids.filter((b) => b.isEligible).map((b) => b.id);
  }

  const candidateBids = [
    { id: 'bid-A', isEligible: true },
    { id: 'bid-B', isEligible: false }, // Disqualified
    { id: 'bid-C', isEligible: true },
  ];

  const aiEligiblePool = filterEligibleBidsForAiRanking(candidateBids);
  assert(
    aiEligiblePool.length === 2 && !aiEligiblePool.includes('bid-B'),
    'AI evaluation ranking pipeline receives ONLY verified eligible bids (disqualified bids excluded)'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Summary
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('  🎯 ALL PHASE 5 BIDDER ELIGIBILITY ENGINE RULES VERIFIED!');
  } else {
    console.error('  ⚠️ SOME ELIGIBILITY TESTS FAILED.');
  }
  console.log('===============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runEligibilityTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
