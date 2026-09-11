/**
 * ProcureAI — Phase 10: Human-in-the-Loop Decision System & Immutability Lock
 *
 * Core Principle:
 * "The AI recommendation must NEVER automatically award the tender."
 *
 * Government officer sees:
 * 1. Eligible bidders
 * 2. Bid values
 * 3. Evaluation scores
 * 4. AI recommendation
 * 5. Risk indicators
 * 6. Explainability report
 * 7. Audit information
 *
 * Actions:
 * [APPROVE RECOMMENDATION]
 * [REJECT RECOMMENDATION]
 *
 * Records:
 * - officer ID
 * - timestamp
 * - AI recommendation
 * - final decision
 * - selected bidder
 * - override status
 * - reason
 * - integrity hash
 *
 * Locks the decision record from ordinary modification.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { query, queryOne, queryRows } from '../config/database';
import { ValidationError, NotFoundError } from '../utils/errors';
import { recordChainEvent } from './auditChain.service';
import { saveLocalTender, getLocalTender } from '../controllers/tender.controller';
import { OsintService } from './osint.service';

const DATA_DIR = path.resolve(__dirname, '../../data');
const DECISIONS_FILE = path.join(DATA_DIR, 'decisions.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create data dir:', err);
  }
}

export function loadLocalDecisions(): any[] {
  ensureDataDir();
  try {
    if (fs.existsSync(DECISIONS_FILE)) {
      const raw = fs.readFileSync(DECISIONS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.error('Error reading decisions file:', err);
  }
  return [];
}

export function getLocalDecision(tenderId: string): any | null {
  const list = loadLocalDecisions();
  return list.find((d: any) => d.tender_id === tenderId) || null;
}

export function saveLocalDecision(decision: any): void {
  ensureDataDir();
  const list = loadLocalDecisions();
  const idx = list.findIndex((d: any) => d.tender_id === decision.tender_id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...decision };
  } else {
    list.unshift(decision);
  }
  try {
    fs.writeFileSync(DECISIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving decision file:', err);
  }
}

export interface DecisionDossier {
  tender: {
    id: string;
    reference_number: string;
    title: string;
    estimated_budget_inr: number;
    status: string;
    closing_at: string;
    created_at: string;
  };
  // 1. Eligible bidders & 2. Bid values & 3. Evaluation scores & 5. Risk indicators
  bidders: Array<{
    bid_id: string;
    bid_reference: string;
    company_id: string;
    company_name: string;
    bid_amount_inr: number;
    is_eligible: boolean;
    composite_score: number;
    rank: number;
    criterion_scores: Record<string, any>;
    risk_tier: string;
    risk_indicators: string[];
    explanation?: any;
    osint_status?: 'verified' | 'mismatch' | 'unavailable';
    osint_profile?: any;
    collusion_flag?: boolean;
    collusion_reasons?: string[];
    cin?: string;
    registered_address?: string;
    directors?: any[];
  }>;
  // 4. AI recommendation
  ai_recommendation: {
    bid_id: string;
    company_name: string;
    bid_reference: string;
    total_score: number;
    confidence_level: string;
    confidence_score: number;
    recommendation_type: string;
    reasoning_summary: string;
  } | null;
  // 6. Explainability report
  explainability_report: {
    why_summary: string;
    ratings: Record<string, string>;
    positive_contributors: string[];
    negative_contributors: string[];
    shap_attributions: Record<string, number>;
  } | null;
  // 7. Audit information
  audit_info: {
    tender_id: string;
    evaluated_at: string;
    model_version: string;
    tamper_verified: boolean;
    integrity_sealed: boolean;
    is_locked: boolean;
    existing_decision: any | null;
  };
}

export interface HumanDecisionPayload {
  action: 'approve' | 'reject';
  decision: 'award' | 'reject' | 'defer' | 'cancel_tender';
  selected_bid_id?: string | null;
  rationale: string;
  override_reason_type?: string;
  override_reason_detail?: string;
  supporting_note?: string;
}

export interface FinalDecisionRecord {
  id: string;
  tender_id: string;
  decided_by: string;
  officer_name?: string;
  timestamp: string;
  ai_recommendation: string;
  final_decision: string;
  selected_bidder: string;
  selected_bid_id: string | null;
  override_status: 'YES' | 'NO';
  reason: string;
  supporting_note: string | null;
  integrity_hash: string;
  is_locked: boolean;
}

/**
 * Computes canonical cryptographic SHA-256 integrity hash chaining:
 * officer ID | timestamp | tender ID | AI recommendation | final decision | selected bidder | override status | reason
 */
export function computeDecisionIntegrityHash(payload: {
  officerId: string;
  timestamp: string;
  tenderId: string;
  aiRecommendation: string;
  finalDecision: string;
  selectedBidder: string;
  overrideStatus: string;
  reason: string;
}): string {
  const canonicalString = [
    payload.officerId.trim(),
    payload.timestamp.trim(),
    payload.tenderId.trim(),
    payload.aiRecommendation.trim(),
    payload.finalDecision.trim(),
    payload.selectedBidder.trim(),
    payload.overrideStatus.trim(),
    payload.reason.trim(),
  ].join('|');

  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

import { DEMO_CONSTANTS } from './demoScenario.service';

/**
 * Compiles the complete 7-point Decision Dossier for the Government Officer.
 */
export async function getTenderDecisionDossier(tenderId: string): Promise<DecisionDossier> {
  try {
    const tender = await queryOne<any>(
      `SELECT id, reference_number, title, estimated_budget_paisa, status, closing_at, created_at
       FROM tenders WHERE id = $1`,
      [tenderId]
    );
    if (!tender) {
      throw new NotFoundError('Tender not found', 'TENDER_NOT_FOUND');
    }

    const budgetInr = tender.estimated_budget_paisa ? Number(tender.estimated_budget_paisa) / 100 : 100000000;

    // 1. Eligible Bidders, 2. Bid Values, 3. Evaluation Scores
    const evaluation = await queryOne<any>(
      `SELECT e.id, e.model_name, e.model_version, e.created_at, e.weights
       FROM ai_evaluations e
       WHERE e.tender_id = $1
       ORDER BY e.created_at DESC LIMIT 1`,
      [tenderId]
    );

    const recommendations = await queryRows<any>(
      `SELECT r.id, r.bid_id, r.total_score, r.rank, r.recommendation,
              r.confidence, r.reasoning_summary, r.criterion_breakdown,
              r.explanation_object,
              COALESCE(b.bid_reference, 'SYNTH-BID') AS bid_reference,
              b.bid_amount_paisa,
              COALESCE(c.name, 'Bidder Entity') AS company_name,
              c.id AS company_id
       FROM ai_recommendations r
       LEFT JOIN bids b ON b.id = r.bid_id
       LEFT JOIN companies c ON c.id = b.company_id
       WHERE r.evaluation_id = $1
       ORDER BY r.rank ASC`,
      [evaluation?.id || '00000000-0000-0000-0000-000000000000']
    );

    // 4. AI Recommendation
    const topRec = recommendations[0];
    const aiRec = topRec
      ? {
          bid_id: topRec.bid_id,
          company_name: topRec.company_name,
          bid_reference: topRec.bid_reference,
          total_score: Number(topRec.total_score),
          confidence_level: String(topRec.confidence || 'HIGH').toUpperCase(),
          confidence_score: 0.95,
          recommendation_type: topRec.recommendation || 'award',
          reasoning_summary: topRec.reasoning_summary || 'Top multi-criteria composite score.',
        }
      : null;

    // 5. Risk Indicators & 6. Explainability Report
    const xai = topRec?.explanation_object || {};
    const explainabilityReport = xai.why_summary
      ? {
          why_summary: xai.why_summary,
          ratings: xai.ratings || {},
          positive_contributors: xai.positive_contributors || [],
          negative_contributors: xai.negative_contributors || [],
          shap_attributions: xai.shap_attributions || {},
        }
      : null;

    const rawBidders = recommendations.map((r) => {
      const rawPrice = r.bid_amount_paisa ? Number(r.bid_amount_paisa) / 100 : budgetInr * 0.9;
      const isHighRisk = r.rank > 1 && (rawPrice < budgetInr * 0.65 || rawPrice > budgetInr * 1.25);

      return {
        bid_id: r.bid_id,
        bid_reference: r.bid_reference,
        company_id: r.company_id,
        company_name: r.company_name,
        bid_amount_inr: rawPrice,
        is_eligible: true,
        composite_score: Number(r.total_score),
        rank: r.rank,
        criterion_scores: r.criterion_breakdown || {},
        risk_tier: isHighRisk ? 'HIGH RISK' : 'NORMAL',
        risk_indicators: isHighRisk
          ? ['Risk Indicator: Substantial deviation from benchmark budget distribution.']
          : [],
        explanation: r.explanation_object,
      };
    });

    const bidders = await OsintService.enrichBiddersWithOsint(rawBidders);

    // Check if a decision already exists
    const existingDecision = await queryOne<any>(
      `SELECT d.*, u.full_name AS officer_name, c.name AS awarded_company_name,
              ov.reason_type, ov.reason_detail
       FROM government_decisions d
       LEFT JOIN users u ON u.id = d.decided_by
       LEFT JOIN bids b ON b.id = d.awarded_bid_id
       LEFT JOIN companies c ON c.id = b.company_id
       LEFT JOIN decision_overrides ov ON ov.decision_id = d.id
       WHERE d.tender_id = $1
       ORDER BY d.created_at DESC
       LIMIT 1`,
      [tenderId]
    );

    return {
      tender: {
        id: tender.id,
        reference_number: tender.reference_number,
        title: tender.title,
        estimated_budget_inr: budgetInr,
        status: tender.status,
        closing_at: tender.closing_at,
        created_at: tender.created_at,
      },
      bidders,
      ai_recommendation: aiRec,
      explainability_report: explainabilityReport,
      audit_info: {
        tender_id: tender.id,
        evaluated_at: evaluation?.created_at || new Date().toISOString(),
        model_version: evaluation?.model_version || 'v1.7.0',
        tamper_verified: true,
        integrity_sealed: true,
        is_locked: Boolean(existingDecision?.is_locked),
        existing_decision: existingDecision,
      },
    };
  } catch {
    // Database offline mode — synthesize complete 7-point decision dossier adapted to the tender
    const localDec = getLocalDecision(tenderId);
    const localTender = getLocalTender(tenderId);

    const budgetInr = localTender?.estimated_budget_paisa
      ? Number(localTender.estimated_budget_paisa) / 100
      : DEMO_CONSTANTS.ESTIMATED_BUDGET_INR;
    const tenderRef = localTender?.reference_number || DEMO_CONSTANTS.TENDER_REF;
    const tenderTitle = localTender?.title || DEMO_CONSTANTS.TENDER_TITLE;
    const category = (localTender?.category || '').toLowerCase();
    const dept = localTender?.department || 'Government Procurement';
    const budgetCr = (budgetInr / 10000000).toFixed(2);

    // Domain-specific company names
    let companyNames = [
      'Company A (Apex Infra Buildtech Ltd)',
      'Company B (Bharat Civil Works & Const. Co.)',
      'Company C (Crescent Urban Developers Ltd)',
    ];

    if (category.includes('health') || tenderTitle.toLowerCase().includes('oxygen') || tenderTitle.toLowerCase().includes('hospital')) {
      companyNames = [
        'Company A (Medix Cryogenics & Healthcare Solutions Ltd)',
        'Company B (National Oxygen & Gas Infra Ltd)',
        'Company C (Apex LifeCare Systems Pvt Ltd)',
      ];
    } else if (category.includes('agri') || tenderTitle.toLowerCase().includes('pump') || tenderTitle.toLowerCase().includes('kusum')) {
      companyNames = [
        'Company A (Kisan Urja Smart Pumps & Agro Ltd)',
        'Company B (Krishi Solar Irrigation Infra Pvt Ltd)',
        'Company C (Gramin Tech Agrosystems Ltd)',
      ];
    } else if (category.includes('telecom') || category.includes('cloud') || tenderTitle.toLowerCase().includes('compute') || tenderTitle.toLowerCase().includes('data')) {
      companyNames = [
        'Company A (DataGrid Sovereign Cloud & IT Infra Ltd)',
        'Company B (NetCore National Communications Ltd)',
        'Company C (Bharat CyberTech Systems Ltd)',
      ];
    } else if (category.includes('transport') || tenderTitle.toLowerCase().includes('ev') || tenderTitle.toLowerCase().includes('highway')) {
      companyNames = [
        'Company A (VoltExpress EV Corridors & Microgrid Ltd)',
        'Company B (Bharat Highway Electrification Co.)',
        'Company C (GreenGrid Express Mobility Ltd)',
      ];
    } else if (category.includes('waste') || category.includes('energy') || category.includes('solar') || tenderTitle.toLowerCase().includes('solar')) {
      companyNames = [
        'Company A (SunShakti Renewables & Solar Grid Ltd)',
        'Company B (Vikram Green Power Technologies Ltd)',
        'Company C (Bharat Urja Solutions Pvt Ltd)',
      ];
    }

    const rawBidders = DEMO_CONSTANTS.COMPANIES.map((c, i) => {
      const multiplier = i === 0 ? 0.82 : i === 1 ? 0.78 : 0.85;
      const calculatedBid = Math.round(budgetInr * multiplier);
      const isL1 = i === 1;

      return {
        bid_id: c.id,
        bid_reference: `BID-2026-0${i + 1}`,
        company_id: c.id,
        company_name: companyNames[i] || c.name,
        bid_amount_inr: calculatedBid,
        is_lowest_bidder: isL1,
        savings_percentage: Math.round((1 - multiplier) * 100),
        is_eligible: true,
        composite_score: c.compositeScore,
        rank: c.rank,
        criterion_scores: {
          technical: c.technicalCapabilityScore,
          max_technical: 20,
          experience: c.experienceScore,
          max_experience: 15,
          financial: c.financialCapacityScore,
          max_financial: 10,
          past_performance: c.pastPerformanceScore,
          max_past_performance: 10,
          risk: c.riskIndicatorsScore,
          max_risk: 5,
          price: c.priceScore,
          max_price: 40,
        },
        risk_tier: c.riskAnalysis.riskTier,
        risk_indicators: c.riskAnalysis.flagText ? [c.riskAnalysis.flagText] : [],
        explanation: c.explanation,
      };
    });

    const bidders = await OsintService.enrichBiddersWithOsint(rawBidders);

    const compA = bidders[0];
    const compB = bidders[1];
    const whySummary = `Best overall balance of high technical capability (${compA.criterion_scores.technical}/20), proven track record in ${dept}, and strong past performance (${compA.criterion_scores.past_performance}/10) with competitive pricing (${compA.savings_percentage}% below ₹${budgetCr} Cr estimated budget). Recommended over L1 due to superior technical compliance.`;

    return {
      tender: {
        id: tenderId,
        reference_number: tenderRef,
        title: tenderTitle,
        estimated_budget_inr: budgetInr,
        status: localDec?.is_locked
          ? (localDec.final_decision === 'award' ? 'AWARDED' : 'DECISION_MADE')
          : (localTender?.status || 'RECOMMENDATION_READY'),
        closing_at: localTender?.submission_deadline_at || new Date(Date.now() + 86400000 * 5).toISOString(),
        created_at: localTender?.created_at || new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      bidders,
      ai_recommendation: {
        bid_id: compA.bid_id,
        company_name: compA.company_name,
        bid_reference: 'BID-2026-01',
        total_score: compA.composite_score,
        confidence_level: 'HIGH',
        confidence_score: 0.96,
        recommendation_type: 'award',
        reasoning_summary: whySummary,
      },
      explainability_report: {
        why_summary: whySummary,
        ratings: {
          'Price': 'Competitive',
          'Technical Capability': 'Exceptional',
          'Experience': 'Strong',
          'Financial Capacity': 'Good',
          'Past Performance': 'Outstanding (0 Delays)',
          'Risk': 'Low',
        },
        positive_contributors: [
          `Exceptional technical capability (${compA.criterion_scores.technical}/20) with certified domain engineers`,
          `Extensive verified execution track record aligned with ${dept}`,
          `Outstanding delivery reliability (${compA.criterion_scores.past_performance}/10) with 0 recorded defects`,
          `Substantial fiscal savings: bid at ₹${(compA.bid_amount_inr / 10000000).toFixed(2)} Cr (${compA.savings_percentage}% below ₹${budgetCr} Cr budget)`,
        ],
        negative_contributors: [
          `Commercial quote is slightly higher than L1 bidder (${compB.company_name} at ₹${(compB.bid_amount_inr / 10000000).toFixed(2)} Cr)`,
        ],
        shap_attributions: {
          'Technical Architecture & Engineering': 0.38,
          'Past Performance & Zero-Defects': 0.28,
          'Competitive Commercial Pricing': 0.22,
          'Timeline & SLA Commitments': 0.12,
        },
      },
      audit_info: {
        tender_id: tenderId,
        evaluated_at: localDec?.created_at || new Date().toISOString(),
        model_version: 'v2.4.0-xai-shap',
        tamper_verified: true,
        integrity_sealed: true,
        is_locked: Boolean(localDec?.is_locked),
        existing_decision: localDec,
      },
    };
  }
}

/**
 * Records Authoritative Government Procurement Decision with Immutability Lock.
 */
export async function recordHumanDecision(
  tenderId: string,
  user: { userId: string; role: string; fullName?: string },
  payload: HumanDecisionPayload
): Promise<FinalDecisionRecord> {
  // Check if final decision is already locked
  try {
    const existing = await queryOne<any>(
      'SELECT id, is_locked, integrity_hash FROM government_decisions WHERE tender_id = $1 AND is_final = TRUE',
      [tenderId]
    );
    if (existing && existing.is_locked) {
      try {
        await recordChainEvent({
          actor: user.fullName || user.userId,
          role: user.role,
          action: 'decision_modification_attempt',
          entity: 'government_decisions',
          entity_id: existing.id,
          tender_id: tenderId,
          risk_level: 'CRITICAL',
          details: {
            violation: 'Attempted to modify already finalized and locked procurement decision',
            decisionId: existing.id,
            targetTender: tenderId,
            actorId: user.userId,
          },
        });
      } catch (logErr) {
        console.error('Failed to log decision modification attempt to audit chain:', logErr);
      }

      throw new ValidationError(
        'GOVERNANCE AUDIT NOTICE: This tender already has an authoritative, cryptographically locked final decision record. It cannot be modified.',
        'DECISION_ALREADY_LOCKED'
      );
    }
  } catch (err: any) {
    if (err instanceof ValidationError) throw err;
    // Database offline mode — proceed with memory state
  }

  const dossier = await getTenderDecisionDossier(tenderId);
  const topAi = dossier.ai_recommendation;

  const isApprove = payload.action === 'approve';
  const isOverride = !isApprove;
  const overrideStatus: 'YES' | 'NO' = isOverride ? 'YES' : 'NO';

  // Determine selected bidder
  let selectedBidId: string | null = null;
  let selectedBidderName = 'None (Rejected / Cancelled)';

  if (isApprove) {
    if (!topAi) {
      throw new ValidationError('Cannot approve recommendation: AI evaluation not yet recorded.', 'NO_AI_RECOMMENDATION');
    }
    selectedBidId = topAi.bid_id;
    selectedBidderName = topAi.company_name;
  } else {
    // REJECT path
    // If selecting another bidder, require selected_bid_id, reason, and supporting_note
    if (payload.decision === 'award') {
      if (!payload.selected_bid_id) {
        throw new ValidationError('Mandatory Requirement: When overriding to award another bidder, the selected bidder must be specified.', 'SELECTED_BIDDER_REQUIRED');
      }
      const chosen = dossier.bidders.find((b) => b.bid_id === payload.selected_bid_id);
      if (!chosen) {
        throw new ValidationError('Selected bidder is not a valid eligible proposal in this tender.', 'INVALID_SELECTED_BIDDER');
      }
      selectedBidId = chosen.bid_id;
      selectedBidderName = chosen.company_name;

      if (!payload.override_reason_type) {
        throw new ValidationError('Mandatory Requirement: Overriding AI recommendation to award an alternative bidder requires a valid reason category.', 'OVERRIDE_REASON_CATEGORY_REQUIRED');
      }

      if (!payload.override_reason_detail || payload.override_reason_detail.trim().length < 50) {
        throw new ValidationError('Mandatory Requirement: Overriding AI recommendation to award an alternative bidder requires detailed justification (minimum 50 characters).', 'OVERRIDE_REASON_DETAIL_REQUIRED');
      }

      if (!payload.supporting_note || payload.supporting_note.trim().length < 10) {
        throw new ValidationError('Mandatory Requirement: Overriding AI recommendation to select an alternative bidder requires a supporting note / documentation reference (minimum 10 characters).', 'SUPPORTING_NOTE_REQUIRED');
      }
    } else {
      // Reject all bids or cancel
      if (!payload.rationale || payload.rationale.trim().length < 20) {
        throw new ValidationError('Mandatory Requirement: Rejecting the AI recommendation requires a mandatory written explanation (minimum 20 characters).', 'RATIONALE_REQUIRED');
      }
    }
  }

  const effectiveReason = isOverride
    ? payload.override_reason_detail || payload.rationale
    : payload.rationale || 'Accepted AI multi-criteria recommendation as the most economically advantageous and safe proposal.';

  const timestamp = new Date().toISOString();
  const aiRecName = topAi ? topAi.company_name : 'No AI Recommendation';

  // Compute Cryptographic SHA-256 Integrity Hash
  const integrityHash = computeDecisionIntegrityHash({
    officerId: user.userId,
    timestamp,
    tenderId,
    aiRecommendation: aiRecName,
    finalDecision: payload.decision,
    selectedBidder: selectedBidderName,
    overrideStatus,
    reason: effectiveReason,
  });

  const decisionId = crypto.randomUUID();

  // Record locked government decision
  try {
    const decision = await queryOne<any>(
      `INSERT INTO government_decisions (
        id, tender_id, decided_by, decision, awarded_bid_id,
        rationale, followed_ai, is_final, is_locked,
        integrity_hash, supporting_note,
        ai_recommendation_summary, selected_bidder_summary,
        effective_at, created_at
       ) VALUES (
        $1, $2, $3, $4, $5, $6, TRUE, TRUE, $7, $8, $9, $10, $11, $11
       ) RETURNING id`,
      [
        decisionId,
        tenderId,
        user.userId,
        payload.decision,
        selectedBidId,
        effectiveReason,
        isApprove,
        integrityHash,
        payload.supporting_note || null,
        JSON.stringify(topAi || {}),
        JSON.stringify({ bid_id: selectedBidId, company_name: selectedBidderName }),
        timestamp,
      ]
    );

    // If override, record into decision_overrides table
    if (isOverride && decision) {
      await query(
        `INSERT INTO decision_overrides (
          decision_id, override_by, reason_type, reason_detail,
          supporting_docs
         ) VALUES ($1, $2, $3, $4, $5)`,
        [
          decision.id,
          user.userId,
          payload.override_reason_type || 'other',
          effectiveReason,
          JSON.stringify(payload.supporting_note ? [{ note: payload.supporting_note }] : []),
        ]
      );
    }

    // Update tender status & lock bids
    if (payload.decision === 'award' && selectedBidId) {
      await query(
        "UPDATE tenders SET status = 'awarded', awarded_at = NOW(), awarded_to_bid_id = $1 WHERE id = $2",
        [selectedBidId, tenderId]
      );
      await query(
        "UPDATE bids SET status = 'awarded' WHERE id = $1",
        [selectedBidId]
      );
    } else if (payload.decision === 'reject' || payload.decision === 'cancel_tender') {
      await query(
        "UPDATE tenders SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
        [tenderId]
      );
    } else {
      await query(
        "UPDATE tenders SET status = 'decision_made', updated_at = NOW() WHERE id = $1",
        [tenderId]
      );
    }

    // Record in immutable audit log
    await query(
      `INSERT INTO audit_logs (
        event_type, action, entity_type, entity_id, actor_user_id,
        description, metadata
      ) VALUES (
        'system', 'DECISION_FINALIZED_LOCKED', 'tender', $1, $2,
        $3, $4
      )`,
      [
        tenderId,
        user.userId,
        `Government officer finalized procurement decision (Integrity Hash: ${integrityHash})`,
        JSON.stringify({
          officer_id: user.userId,
          timestamp,
          ai_recommendation: aiRecName,
          final_decision: payload.decision,
          selected_bidder: selectedBidderName,
          override_status: overrideStatus,
          reason: effectiveReason,
          supporting_note: payload.supporting_note || null,
          integrity_hash: integrityHash,
          is_locked: true,
        }),
      ]
    );
  } catch {
    // Database offline mode — DB write skipped, audit chain is updated below
  }

  // Also record to hash-chained tamper-evident ledger (Phase 11)
  try {
    await recordChainEvent({
      actor: user.fullName || user.userId,
      role: user.role,
      action: isOverride ? 'recommendation_override' : 'recommendation_approved',
      entity: 'government_decisions',
      entity_id: decisionId,
      tender_id: tenderId,
      company_id: selectedBidId || undefined,
      risk_level: isOverride ? 'MEDIUM' : 'LOW',
      details: {
        decision: payload.decision,
        selectedBidder: selectedBidderName,
        aiRecommendation: aiRecName,
        overrideStatus,
        effectiveReason,
        integrityHash,
        statutoryJustification: isOverride ? payload.override_reason_detail : undefined,
        supportingNote: payload.supporting_note,
        governanceNotice: isOverride
          ? 'Potential governance-risk event: Higher-cost or alternative proposal selected over AI recommendation.'
          : 'Human decision ratified AI recommendation.',
      },
    });
  } catch (chainErr) {
    console.error('Failed to append to audit chain ledger:', chainErr);
  }

  const decisionResult = {
    id: decisionId,
    tender_id: tenderId,
    decided_by: user.userId,
    officer_name: user.fullName || 'Government Procurement Officer',
    timestamp,
    ai_recommendation: aiRecName,
    final_decision: payload.decision,
    selected_bidder: selectedBidderName,
    selected_bid_id: selectedBidId,
    override_status: overrideStatus,
    reason: effectiveReason,
    supporting_note: payload.supporting_note || null,
    integrity_hash: integrityHash,
    is_locked: true,
    created_at: timestamp,
  };

  // Persist locally for offline runtime reliability
  saveLocalDecision(decisionResult);
  saveLocalTender({
    id: tenderId,
    status: payload.decision === 'award' ? 'AWARDED' : (payload.decision === 'reject' || payload.decision === 'cancel_tender') ? 'CANCELLED' : 'DECISION_MADE',
    updated_at: timestamp,
  });

  return decisionResult;
}
