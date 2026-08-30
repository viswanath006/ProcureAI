/**
 * ProcureAI — Phase 14: End-to-End Procurement Demonstration Engine
 *
 * Synthetic Demonstration Scenario:
 *
 * TENDER:
 * - Government School Infrastructure Project
 * - Estimated Value: ₹10 Crore (100,000,000 INR = 10,000,000,000 Paisa)
 *
 * 3 SYNTHETIC ELIGIBLE COMPANIES:
 * - Company A: Apex Infra Buildtech Ltd (Bid: ₹8.2 Cr)
 * - Company B: Bharat Civil Works & Const. Co. (Bid: ₹7.8 Cr — Lowest Bidder)
 * - Company C: Crescent Urban Developers Ltd (Bid: ₹8.5 Cr)
 *
 * VALUE-FOR-MONEY PRINCIPLE:
 * - Company B submits the lowest price (₹7.8 Cr).
 * - Company A receives the highest overall evaluation (87.6/100) due to
 *   superior technical capability, experience, and past performance.
 *
 * WORKFLOW:
 * 1. Government creates tender
 * 2. Tender is published
 * 3. Companies view tender
 * 4. Companies pass eligibility
 * 5. Companies submit sealed bids
 * 6. Show that bidders cannot see each other's prices
 * 7. Deadline closes
 * 8. Government opens bids
 * 9. Integrity hashes are verified
 * 10. AI evaluates bidders
 * 11. AI ranks bidders
 * 12. AI recommends Company A
 * 13. Explain why Company A was recommended
 * 14. Display risk analysis
 * 15. Government approves recommendation (Scenario 1)
 * 16. Audit trail is generated
 * 17. Auditor verifies audit integrity
 *
 * SCENARIO 2:
 * - AI recommends Company A.
 * - Government selects Company C with mandatory justification.
 * - Logged as a potential governance-risk event for monitoring.
 */

import crypto from 'crypto';
import { query, queryOne, queryRows } from '../config/database';
import {
  encryptBidEnvelope,
  decryptBidEnvelope,
  generateCanonicalBidHash,
} from './sealedBid.service';
import {
  recordChainEvent,
  verifyAuditChain,
  AuditChainRecord,
} from './auditChain.service';
import { computeDecisionIntegrityHash } from './decision.service';

export interface DemoCompany {
  id: string;
  name: string;
  pan: string;
  gstin: string;
  bidAmountInr: number;
  bidAmountFormatted: string;
  isLowestBidder: boolean;
  technicalCapabilityScore: number; // max 20
  experienceScore: number; // max 15
  financialCapacityScore: number; // max 10
  pastPerformanceScore: number; // max 10
  riskIndicatorsScore: number; // max 5
  priceScore: number; // max 40
  compositeScore: number; // max 100
  rank: number;
  isAiRecommended: boolean;
  explanation: {
    whySummary: string;
    positiveContributors: string[];
    negativeContributors: string[];
    ratings: Record<string, string>;
  };
  riskAnalysis: {
    budgetDeviationPct: number;
    anomalyScore: number;
    riskTier: 'NORMAL' | 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';
    flagText?: string;
  };
}

export interface DemoWorkflowStep {
  step: number;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  evidence: Record<string, any>;
  timestamp: string;
}

export interface DemoScenarioState {
  tender: {
    id: string;
    referenceNumber: string;
    title: string;
    estimatedValueInr: number;
    estimatedValueFormatted: string;
    department: string;
    status: string;
  };
  companies: DemoCompany[];
  workflowSteps: DemoWorkflowStep[];
  currentScenario: 'SCENARIO_1_AI_AWARD' | 'SCENARIO_2_HUMAN_OVERRIDE' | 'INITIALIZED';
  scenario1Decision?: {
    officerId: string;
    officerName: string;
    decision: string;
    selectedBidder: string;
    overrideStatus: string;
    integrityHash: string;
    isLocked: boolean;
    timestamp: string;
  };
  scenario2Override?: {
    officerId: string;
    officerName: string;
    aiRecommendation: string;
    finalSelection: string;
    override: string;
    reason: string;
    supportingNote: string;
    integrityHash: string;
    isLocked: boolean;
    governanceRiskFlag: string;
    timestamp: string;
  };
  auditVerification: {
    statusText: string;
    isValid: boolean;
    totalBlocksVerified: number;
  };
}

// In-memory demo state instance
let demoState: DemoScenarioState | null = null;

export const DEMO_CONSTANTS = {
  TENDER_ID: '00000000-0000-0000-0000-000000000100',
  TENDER_REF: 'PROC-2026-EDU-SCH-01',
  TENDER_TITLE: 'Government School Infrastructure Project',
  ESTIMATED_BUDGET_INR: 100000000, // ₹10 Crore
  COMPANIES: [
    {
      id: '00000000-0000-0000-0000-000000000101',
      name: 'Company A (Apex Infra Buildtech Ltd)',
      pan: 'AABCA1234F',
      gstin: '27AABCA1234F1Z5',
      bidAmountInr: 82000000, // ₹8.2 Crore
      bidAmountFormatted: '₹8.20 Crore',
      isLowestBidder: false,
      technicalCapabilityScore: 18.8, // /20
      experienceScore: 14.2, // /15
      financialCapacityScore: 8.8, // /10
      pastPerformanceScore: 9.2, // /10
      riskIndicatorsScore: 4.2, // /5
      priceScore: 38.0, // /40
      compositeScore: 87.6, // /100 -> RANK #1
      rank: 1,
      isAiRecommended: true,
      explanation: {
        whySummary: 'Best overall balance of high technical capability, proven school infrastructure experience, and strong past performance with competitive pricing (18% below budget).',
        positiveContributors: [
          'Excellent technical capability (18.8/20) with certified seismic structural engineers',
          'Extensive experience (14.2/15) in rural prefabricated school construction',
          'Outstanding past performance track record (9.2/10) with 0 recorded delays',
          'Competitive commercial quote at ₹8.2 Cr (18% below ₹10 Cr estimated budget)',
        ],
        negativeContributors: [
          'Slightly higher commercial price than Company B (₹7.8 Cr)',
        ],
        ratings: {
          'Price': 'Excellent',
          'Technical Capability': 'Very Strong',
          'Experience': 'Strong',
          'Financial Capacity': 'Good',
          'Past Performance': 'Excellent',
          'Risk': 'Low',
        },
      },
      riskAnalysis: {
        budgetDeviationPct: -18.0,
        anomalyScore: 0.08,
        riskTier: 'NORMAL' as const,
      },
    },
    {
      id: '00000000-0000-0000-0000-000000000102',
      name: 'Company B (Bharat Civil Works & Const. Co.)',
      pan: 'BBBCB5678G',
      gstin: '27BBBCB5678G1Z2',
      bidAmountInr: 78000000, // ₹7.8 Crore -> LOWEST BIDDER (L1)
      bidAmountFormatted: '₹7.80 Crore (Lowest Bidder / L1)',
      isLowestBidder: true,
      technicalCapabilityScore: 12.5, // /20
      experienceScore: 9.8, // /15
      financialCapacityScore: 7.2, // /10
      pastPerformanceScore: 6.8, // /10
      riskIndicatorsScore: 3.8, // /5
      priceScore: 40.0, // /40 (Max price score)
      compositeScore: 74.1, // /100 -> RANK #2
      rank: 2,
      isAiRecommended: false,
      explanation: {
        whySummary: 'Lowest commercial quote (₹7.8 Cr), but lower composite score due to limited technical equipment and past completion delays.',
        positiveContributors: [
          'Lowest commercial bid price of ₹7.8 Cr (22% below government estimate)',
          'High price competitiveness score (40.0/40)',
        ],
        negativeContributors: [
          'Moderate technical capability score (12.5/20)',
          'Lower past performance rating (6.8/10) with historical execution delays',
        ],
        ratings: {
          'Price': 'Outstanding (Lowest)',
          'Technical Capability': 'Moderate',
          'Experience': 'Moderate',
          'Financial Capacity': 'Satisfactory',
          'Past Performance': 'Fair',
          'Risk': 'Moderate',
        },
      },
      riskAnalysis: {
        budgetDeviationPct: -22.0,
        anomalyScore: -0.05,
        riskTier: 'LOW RISK' as const,
        flagText: 'Price is significantly below median estimate; delivery timeline requires close project tracking.',
      },
    },
    {
      id: '00000000-0000-0000-0000-000000000103',
      name: 'Company C (Crescent Urban Developers Ltd)',
      pan: 'CCCCD9012H',
      gstin: '27CCCCD9012H1Z9',
      bidAmountInr: 85000000, // ₹8.5 Crore
      bidAmountFormatted: '₹8.50 Crore',
      isLowestBidder: false,
      technicalCapabilityScore: 15.0, // /20
      experienceScore: 11.5, // /15
      financialCapacityScore: 8.0, // /10
      pastPerformanceScore: 7.5, // /10
      riskIndicatorsScore: 4.0, // /5
      priceScore: 36.7, // /40
      compositeScore: 73.4, // /100 -> RANK #3
      rank: 3,
      isAiRecommended: false,
      explanation: {
        whySummary: 'Solid commercial proposal with modern prefabricated capabilities, but ranked third in weighted multi-criteria evaluation.',
        positiveContributors: [
          'Strong regional prefabrication infrastructure yard',
          'Adequate financial capacity (8.0/10)',
        ],
        negativeContributors: [
          'Highest price quote among all three bidders (₹8.5 Cr)',
          'Composite ranking lower than Company A and B',
        ],
        ratings: {
          'Price': 'Good',
          'Technical Capability': 'Strong',
          'Experience': 'Good',
          'Financial Capacity': 'Good',
          'Past Performance': 'Good',
          'Risk': 'Low',
        },
      },
      riskAnalysis: {
        budgetDeviationPct: -15.0,
        anomalyScore: 0.04,
        riskTier: 'NORMAL' as const,
      },
    },
  ],
};

/**
 * Initializes and seeds the complete 17-step demonstration scenario
 */
export async function resetAndSeedDemoScenario(): Promise<DemoScenarioState> {
  const tender = {
    id: DEMO_CONSTANTS.TENDER_ID,
    referenceNumber: DEMO_CONSTANTS.TENDER_REF,
    title: DEMO_CONSTANTS.TENDER_TITLE,
    estimatedValueInr: DEMO_CONSTANTS.ESTIMATED_BUDGET_INR,
    estimatedValueFormatted: '₹10.00 Crore',
    department: 'Department of School Education & Literacy',
    status: 'DECISION_PENDING',
  };

  const companies: DemoCompany[] = JSON.parse(JSON.stringify(DEMO_CONSTANTS.COMPANIES));

  const baseDate = new Date('2026-08-29T10:00:00.000Z').getTime();
  const stepTime = (m: number) => new Date(baseDate + m * 60000).toISOString();

  const workflowSteps: DemoWorkflowStep[] = [
    {
      step: 1,
      title: 'Government Creates Tender',
      description: 'Government Officer Alpha created the tender specification for the School Infrastructure Project with ₹10 Cr budget.',
      status: 'COMPLETED',
      evidence: { tenderRef: tender.referenceNumber, budget: tender.estimatedValueFormatted },
      timestamp: stepTime(0),
    },
    {
      step: 2,
      title: 'Tender Is Published',
      description: 'Notice Inviting Tender (NIT) published to public procurement portal. Submission window opened.',
      status: 'COMPLETED',
      evidence: { status: 'PUBLISHED', publishedAt: stepTime(5) },
      timestamp: stepTime(5),
    },
    {
      step: 3,
      title: 'Companies View Tender',
      description: 'Prospective bidder companies (Company A, Company B, Company C) accessed the public technical documents.',
      status: 'COMPLETED',
      evidence: { viewsRecorded: 3, prospectiveVendors: ['Company A', 'Company B', 'Company C'] },
      timestamp: stepTime(15),
    },
    {
      step: 4,
      title: 'Companies Pass Eligibility',
      description: 'Automated 6-gate qualification engine verified GSTIN, PAN, audited balance sheets, and active work orders.',
      status: 'COMPLETED',
      evidence: {
        'Company A': 'ELIGIBLE (Turnover: ₹45 Cr, Exp: 12 yrs)',
        'Company B': 'ELIGIBLE (Turnover: ₹22 Cr, Exp: 4 yrs)',
        'Company C': 'ELIGIBLE (Turnover: ₹35 Cr, Exp: 8 yrs)',
      },
      timestamp: stepTime(20),
    },
    {
      step: 5,
      title: 'Companies Submit Sealed Bids',
      description: 'All 3 eligible companies submitted bids encrypted client-side with AES-256-GCM and hashed with SHA-256.',
      status: 'COMPLETED',
      evidence: {
        'Company A': 'Sealed Envelope #1 (AES-256-GCM)',
        'Company B': 'Sealed Envelope #2 (AES-256-GCM)',
        'Company C': 'Sealed Envelope #3 (AES-256-GCM)',
      },
      timestamp: stepTime(30),
    },
    {
      step: 6,
      title: 'Pre-Deadline Confidentiality Enforced',
      description: 'Bidders strictly prohibited from inspecting competitor bids or pricing. Bids locked in vault.',
      status: 'COMPLETED',
      evidence: { crossInspectionBlocked: true, encryptionState: 'ENCRYPTED_SEALED_ENVELOPE' },
      timestamp: stepTime(35),
    },
    {
      step: 7,
      title: 'Deadline Closes',
      description: 'Submission window elapsed. Cryptographic vault closed to new submissions or modifications.',
      status: 'COMPLETED',
      evidence: { vaultLocked: true, submissionsAccepted: 3 },
      timestamp: stepTime(60),
    },
    {
      step: 8,
      title: 'Government Opens Bids',
      description: 'Authorized Government Officer executed dual-key unsealing ceremony.',
      status: 'COMPLETED',
      evidence: {
        unsealedQuotes: {
          'Company A': '₹8.20 Crore',
          'Company B': '₹7.80 Crore (Lowest Bidder / L1)',
          'Company C': '₹8.50 Crore',
        },
      },
      timestamp: stepTime(65),
    },
    {
      step: 9,
      title: 'Integrity Hashes Verified',
      description: 'SHA-256 canonical hash verification confirmed zero tampering between submission and unsealing.',
      status: 'COMPLETED',
      evidence: {
        'Company A Tamper Check': 'MATCH (100% Intact)',
        'Company B Tamper Check': 'MATCH (100% Intact)',
        'Company C Tamper Check': 'MATCH (100% Intact)',
      },
      timestamp: stepTime(70),
    },
    {
      step: 10,
      title: 'AI Evaluates Bidders',
      description: 'Configurable weighted criteria engine evaluated all factors (Price 40%, Tech 20%, Exp 15%, Fin 10%, Perf 10%, Risk 5%).',
      status: 'COMPLETED',
      evidence: {
        weights: { price: '40%', technical: '20%', experience: '15%', financial: '10%', performance: '10%', risk: '5%' },
      },
      timestamp: stepTime(75),
    },
    {
      step: 11,
      title: 'AI Ranks Bidders',
      description: 'Composite multi-attribute normalization computed final ranking scores.',
      status: 'COMPLETED',
      evidence: {
        'Rank 1': 'Company A — 87.6 / 100',
        'Rank 2': 'Company B — 74.1 / 100',
        'Rank 3': 'Company C — 73.4 / 100',
      },
      timestamp: stepTime(78),
    },
    {
      step: 12,
      title: 'AI Recommends Company A',
      description: 'AI engine generated formal recommendation for Company A despite Company B offering lower price (Value-for-Money).',
      status: 'COMPLETED',
      evidence: {
        recommendedBidder: 'Company A (Apex Infra Buildtech Ltd)',
        lowestBidderNotSelected: 'Company B (Bharat Civil Works) had lowest price (₹7.8 Cr) but inferior technical & past performance',
      },
      timestamp: stepTime(80),
    },
    {
      step: 13,
      title: 'Explain Why Company A Was Recommended',
      description: 'Explainable AI (XAI) generated non-technical governance attribution breakdown.',
      status: 'COMPLETED',
      evidence: companies[0].explanation,
      timestamp: stepTime(82),
    },
    {
      step: 14,
      title: 'Display Risk Analysis',
      description: 'Isolation Forest anomaly detection verified pricing dispersion and budget compliance.',
      status: 'COMPLETED',
      evidence: {
        'Company A Risk': 'NORMAL (Anomaly: 0.08, -18% budget deviation)',
        'Company B Risk': 'LOW RISK (Anomaly: -0.05, -22% aggressive dumping)',
        'Company C Risk': 'NORMAL (Anomaly: 0.04, -15% budget deviation)',
      },
      timestamp: stepTime(85),
    },
    {
      step: 15,
      title: 'Government Approves Recommendation',
      description: 'Awaiting authoritative human decision (Scenario 1: Approve Company A vs Scenario 2: Override to Company C).',
      status: 'PENDING',
      evidence: {},
      timestamp: stepTime(90),
    },
    {
      step: 16,
      title: 'Audit Trail Is Generated',
      description: 'Every lifecycle action chained into cryptographic SHA-256 blocks.',
      status: 'PENDING',
      evidence: {},
      timestamp: stepTime(92),
    },
    {
      step: 17,
      title: 'Auditor Verifies Audit Integrity',
      description: 'Cryptographic audit verification engine evaluates complete ledger continuity.',
      status: 'PENDING',
      evidence: {},
      timestamp: stepTime(95),
    },
  ];

  const auditReport = await verifyAuditChain();

  demoState = {
    tender,
    companies,
    workflowSteps,
    currentScenario: 'INITIALIZED',
    auditVerification: {
      statusText: auditReport.statusText,
      isValid: auditReport.isValid,
      totalBlocksVerified: auditReport.totalBlocks,
    },
  };

  return demoState;
}

/**
 * SCENARIO 1: Government Officer Approves AI Recommendation (Company A)
 */
export async function runScenario1Approval(): Promise<DemoScenarioState> {
  if (!demoState) {
    await resetAndSeedDemoScenario();
  }

  const timestamp = new Date().toISOString();
  const companyA = DEMO_CONSTANTS.COMPANIES[0];

  const integrityHash = computeDecisionIntegrityHash({
    officerId: 'officer-alpha-id',
    timestamp,
    tenderId: DEMO_CONSTANTS.TENDER_ID,
    aiRecommendation: companyA.name,
    finalDecision: 'award',
    selectedBidder: companyA.name,
    overrideStatus: 'NO',
    reason: 'Accepted AI multi-criteria recommendation as the most economically advantageous and technically sound proposal.',
  });

  // Step 15: Government Approves Recommendation
  demoState!.workflowSteps[14].status = 'COMPLETED';
  demoState!.workflowSteps[14].evidence = {
    action: 'APPROVE RECOMMENDATION',
    awardedBidder: companyA.name,
    awardedValue: companyA.bidAmountFormatted,
    officer: 'officer.alpha@finance.gov.in',
    rationale: 'Accepted AI recommendation. Superior technical score (18.8/20) and flawless past performance outweigh ₹40L price differential with Company B.',
    integrityHash,
  };

  // Step 16: Audit Trail Generated
  await recordChainEvent({
    actor: 'officer.alpha@finance.gov.in',
    role: 'GOVT_OFFICER',
    action: 'government_approval',
    entity: 'government_decisions',
    entity_id: 'dec-school-001',
    tender_id: DEMO_CONSTANTS.TENDER_ID,
    company_id: companyA.id,
    risk_level: 'NORMAL',
    details: {
      awardedBidder: companyA.name,
      awardedAmount: companyA.bidAmountInr,
      aiRecommendedBidder: companyA.name,
      overrideStatus: 'NO',
      integrityHash,
    },
  });

  demoState!.workflowSteps[15].status = 'COMPLETED';
  demoState!.workflowSteps[15].evidence = {
    auditAction: 'government_approval',
    hashChained: true,
    blockRecorded: true,
  };

  // Step 17: Auditor Verifies Audit Integrity
  const auditReport = await verifyAuditChain();
  demoState!.workflowSteps[16].status = 'COMPLETED';
  demoState!.workflowSteps[16].evidence = {
    verificationStatus: auditReport.statusText,
    isValid: auditReport.isValid,
    blocksVerified: auditReport.totalBlocks,
  };

  demoState!.currentScenario = 'SCENARIO_1_AI_AWARD';
  demoState!.tender.status = 'AWARDED_TO_COMPANY_A';
  demoState!.scenario1Decision = {
    officerId: 'officer-alpha-id',
    officerName: 'officer.alpha@finance.gov.in',
    decision: 'CONTRACT_AWARDED',
    selectedBidder: companyA.name,
    overrideStatus: 'NO (ACCEPTED_AI)',
    integrityHash,
    isLocked: true,
    timestamp,
  };

  demoState!.auditVerification = {
    statusText: auditReport.statusText,
    isValid: auditReport.isValid,
    totalBlocksVerified: auditReport.totalBlocks,
  };

  return demoState!;
}

/**
 * SCENARIO 2: Government Overrides AI Recommendation to Select Company C
 *
 * Demonstrates:
 * - AI recommends Company A
 * - Government selects Company C
 * - System requires mandatory justification
 * - Audit log records: AI Recommendation -> Company A, Final -> Company C, Override -> YES
 * - Displayed as a POTENTIAL GOVERNANCE-RISK EVENT (not corruption proof)
 */
export async function runScenario2Override(): Promise<DemoScenarioState> {
  if (!demoState) {
    await resetAndSeedDemoScenario();
  }

  const timestamp = new Date().toISOString();
  const companyA = DEMO_CONSTANTS.COMPANIES[0];
  const companyC = DEMO_CONSTANTS.COMPANIES[2];

  const overrideReason =
    'Vendor C maintains an existing localized rapid prefabricated assembly yard within 15 km of target tribal schools, ensuring zero monsoon weather disruptions and proven seismic-resilient precast modules.';
  const supportingNote =
    'State Tribal Welfare Department Site Assessment Order Reference #TWD/2026/SITE-44A confirming localized factory access.';

  const integrityHash = computeDecisionIntegrityHash({
    officerId: 'officer-alpha-id',
    timestamp,
    tenderId: DEMO_CONSTANTS.TENDER_ID,
    aiRecommendation: companyA.name,
    finalDecision: 'award',
    selectedBidder: companyC.name,
    overrideStatus: 'YES',
    reason: overrideReason,
  });

  // Step 15: Government Overrides AI Recommendation
  demoState!.workflowSteps[14].status = 'COMPLETED';
  demoState!.workflowSteps[14].evidence = {
    action: 'REJECT_RECOMMENDATION_OVERRIDE',
    aiRecommendation: companyA.name,
    selectedBidder: companyC.name,
    overrideStatus: 'YES',
    statutoryJustification: overrideReason,
    supportingNote,
    integrityHash,
  };

  // Step 16: Audit Trail Generated with Override Flag
  await recordChainEvent({
    actor: 'officer.alpha@finance.gov.in',
    role: 'GOVT_OFFICER',
    action: 'recommendation_override',
    entity: 'government_decisions',
    entity_id: 'dec-school-override-002',
    tender_id: DEMO_CONSTANTS.TENDER_ID,
    company_id: companyC.id,
    risk_level: 'MEDIUM',
    details: {
      aiRecommendation: companyA.name,
      finalSelection: companyC.name,
      override: 'YES',
      reason: overrideReason,
      supportingNote,
      integrityHash,
      governanceNotice: 'Potential governance-risk event recorded for supervisory review (Objective pattern flag).',
    },
  });

  demoState!.workflowSteps[15].status = 'COMPLETED';
  demoState!.workflowSteps[15].evidence = {
    auditAction: 'recommendation_override',
    overrideFlag: 'YES',
    governanceRiskFlag: 'Potential governance-risk event: Higher-cost proposal selected over AI recommendation. Mandatory justification archived.',
  };

  // Step 17: Auditor Verifies Audit Integrity
  const auditReport = await verifyAuditChain();
  demoState!.workflowSteps[16].status = 'COMPLETED';
  demoState!.workflowSteps[16].evidence = {
    verificationStatus: auditReport.statusText,
    isValid: auditReport.isValid,
    blocksVerified: auditReport.totalBlocks,
  };

  demoState!.currentScenario = 'SCENARIO_2_HUMAN_OVERRIDE';
  demoState!.tender.status = 'AWARDED_WITH_OVERRIDE_TO_COMPANY_C';
  demoState!.scenario2Override = {
    officerId: 'officer-alpha-id',
    officerName: 'officer.alpha@finance.gov.in',
    aiRecommendation: companyA.name,
    finalSelection: companyC.name,
    override: 'YES',
    reason: overrideReason,
    supportingNote,
    integrityHash,
    isLocked: true,
    governanceRiskFlag: 'POTENTIAL GOVERNANCE RISK EVENT: AI recommendation overridden. Documented statutory rationale recorded for supervisory review.',
    timestamp,
  };

  demoState!.auditVerification = {
    statusText: auditReport.statusText,
    isValid: auditReport.isValid,
    totalBlocksVerified: auditReport.totalBlocks,
  };

  return demoState!;
}

/**
 * Returns current status of the demonstration scenario
 */
export async function getDemoScenarioStatus(): Promise<DemoScenarioState> {
  if (!demoState) {
    return await resetAndSeedDemoScenario();
  }
  return demoState;
}
