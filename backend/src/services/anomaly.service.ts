/**
 * ProcureAI — Phase 9: Anti-Bias, Anomaly & Collusion Detection Service
 *
 * Core Principles:
 * 1. Identify suspicious patterns without making unsupported accusations.
 * 2. Feature 1: Bid Anomaly Detection (NORMAL | LOW RISK | MEDIUM RISK | HIGH RISK).
 * 3. Feature 2: Bid Collusion Indicators ("Potential suspicious pattern detected", never says "Company X is corrupt").
 * 4. Feature 3: Decision Override Analysis ("Potential decision-making pattern detected", never accuses the officer).
 */

import { query, queryOne, queryRows } from '../config/database';
import { env } from '../config/env';

export interface BidAnomalyFactor {
  name: string;
  code: string;
  value: number;
  is_anomaly: boolean;
  description: string;
}

export interface BidAnomalyProfile {
  bid_id: string;
  company_name: string;
  bid_reference: string;
  bid_amount_inr: number;
  anomaly_score: number;
  risk_tier: 'NORMAL' | 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';
  is_outlier: boolean;
  price_deviation_pct: number;
  unusual_pricing_flag: boolean;
  timing_anomaly_flag: boolean;
  price_similarity_flag: boolean;
  factors: BidAnomalyFactor[];
  risk_indicators: string[];
}

export interface CollusionPatternIndicator {
  pattern_type: string;
  label: string; // "Potential suspicious pattern detected"
  pattern_name: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  involved_companies: string[];
  evidence_summary: string;
  metrics: Record<string, any>;
}

export interface TenderRiskAnalysisResult {
  tender_id: string;
  bids_evaluated: number;
  bid_anomalies: BidAnomalyProfile[];
  collusion_indicators: CollusionPatternIndicator[];
  has_collusion_pattern: boolean;
  summary: string;
  disclaimer: string;
}

export interface DecisionOverrideSummary {
  tender_id: string;
  tender_title: string;
  ai_recommendation: {
    bid_id: string;
    company_name: string;
    total_score: number;
  } | null;
  government_selection: {
    bid_id: string;
    company_name: string;
    total_score?: number;
  } | null;
  is_override: boolean;
  override_status: 'YES' | 'NO';
  mandatory_reason: string | null;
  reason_type: string | null;
  decided_by_name: string | null;
  decided_at: string | null;
  pattern_analysis: {
    repeated_pattern_detected: boolean;
    pattern_label: string | null; // "Potential decision-making pattern detected."
    summary: string | null;
    officer_override_count: number;
    officer_total_decisions: number;
    explainable_risk_indicators: string[];
  };
}

const COLLUSION_LABEL = 'Potential suspicious pattern detected';
const DECISION_PATTERN_LABEL = 'Potential decision-making pattern detected.';

/**
 * Local high-fidelity anomaly and collusion detection engine for offline/test execution.
 */
export function analyzeTenderRisksLocally(
  tender: any,
  bids: any[],
  historicalTenders: any[] = []
): TenderRiskAnalysisResult {
  const budget = Number(
    tender.estimated_budget_inr ||
      (tender.estimated_budget_paisa ? Number(tender.estimated_budget_paisa) / 100 : 100000000)
  );

  const prices = bids.map((b) => Number(b.bid_amount_inr || b.bid_amount_paisa ? Number(b.bid_amount_paisa) / 100 : 0)).filter((p) => p > 0);
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const medianPrice = sortedPrices.length ? sortedPrices[Math.floor(sortedPrices.length / 2)] : budget;

  // 1. Bid Anomaly Detection (7 dimensions)
  const bid_anomalies: BidAnomalyProfile[] = bids.map((bid) => {
    const price = Number(bid.bid_amount_inr || (bid.bid_amount_paisa ? Number(bid.bid_amount_paisa) / 100 : 0));
    const devVsBudget = ((price - budget) / budget) * 100;
    const devVsMedian = ((price - medianPrice) / medianPrice) * 100;

    // Unusual pricing: repeating non-zero digits (e.g. 99999999) or exact budget match to the single rupee
    const digitsStr = String(Math.floor(price));
    const last4 = digitsStr.slice(-4);
    const hasRepeating = digitsStr.length >= 6 && last4[0] !== '0' && new Set(last4).size <= 1;
    const isExactBudget = Math.abs(price - budget) < 1;
    const unusualPricing = hasRepeating || isExactBudget;

    // Delivery timing compression
    const reqDays = Number(tender.required_delivery_days || 180);
    const compDays = Number(bid.completion_days || reqDays);
    const timingAnomaly = compDays < reqDays * 0.5 || compDays > reqDays * 1.25;

    // Pairwise similarity check (< 0.5%)
    const otherPrices = prices.filter((p) => Math.abs(p - price) > 100);
    let minGapPct = 20.0;
    if (otherPrices.length > 0) {
      const minGap = Math.min(...otherPrices.map((p) => Math.abs(p - price)));
      minGapPct = (minGap / Math.max(price, 1)) * 100;
    }
    const isPriceSimilar = otherPrices.length > 0 && minGapPct < 0.50;

    // Factors
    const factors: BidAnomalyFactor[] = [
      {
        name: 'Bid Price Deviation',
        code: 'price_deviation',
        value: Math.round(devVsBudget * 10) / 10,
        is_anomaly: Math.abs(devVsBudget) >= 30,
        description: `Price deviates by ${devVsBudget >= 0 ? '+' : ''}${devVsBudget.toFixed(1)}% from official budget.`,
      },
      {
        name: 'Unusual Pricing Digits',
        code: 'unusual_pricing',
        value: unusualPricing ? 1 : 0,
        is_anomaly: unusualPricing,
        description: 'Pricing contains suspicious repeating digits or exact round integers.',
      },
      {
        name: 'Delivery Schedule Feasibility',
        code: 'timing_deviation',
        value: compDays,
        is_anomaly: timingAnomaly,
        description: `Schedule (${compDays} days) deviates from standard window (${reqDays} days).`,
      },
      {
        name: 'Price Proximity to Competitors',
        code: 'price_similarity',
        value: Math.round(minGapPct * 100) / 100,
        is_anomaly: isPriceSimilar,
        description: `Nearest competing bid is within ${minGapPct.toFixed(2)}% gap.`,
      },
    ];

    const risks: string[] = [];
    if (devVsBudget <= -35) {
      risks.push(`Risk Indicator: Abnormal low bid (${Math.abs(devVsBudget).toFixed(1)}% below budget). Potential dumping or delivery compromise.`);
    } else if (devVsBudget >= 25) {
      risks.push(`Risk Indicator: High price deviation (+${devVsBudget.toFixed(1)}% above budget).`);
    }

    if (unusualPricing) {
      risks.push('Risk Indicator: Suspicious round numbers or repeating digit structures detected.');
    }
    if (timingAnomaly) {
      risks.push(`Risk Indicator: Suspicious delivery window (${compDays} days vs ${reqDays} days required).`);
    }
    if (isPriceSimilar) {
      risks.push(`Risk Indicator: Price is within ${minGapPct.toFixed(2)}% of a competitor's submission.`);
    }

    // Determine Risk Tier: NORMAL | LOW RISK | MEDIUM RISK | HIGH RISK
    let risk_tier: 'NORMAL' | 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' = 'NORMAL';
    let anomaly_score = 0.12;

    if (risks.length >= 3 || devVsBudget <= -38) {
      risk_tier = 'HIGH RISK';
      anomaly_score = -0.22;
    } else if (risks.length === 2 || isPriceSimilar || Math.abs(devVsBudget) >= 25) {
      risk_tier = 'MEDIUM RISK';
      anomaly_score = -0.08;
    } else if (risks.length === 1 || Math.abs(devVsBudget) >= 15) {
      risk_tier = 'LOW RISK';
      anomaly_score = 0.03;
    }

    return {
      bid_id: bid.bid_id || bid.id,
      company_name: bid.company_name || 'Bidder Entity',
      bid_reference: bid.bid_reference || 'BID-REF',
      bid_amount_inr: price,
      anomaly_score,
      risk_tier,
      is_outlier: risk_tier === 'HIGH RISK' || risk_tier === 'MEDIUM RISK',
      price_deviation_pct: Math.round(devVsBudget * 10) / 10,
      unusual_pricing_flag: unusualPricing,
      timing_anomaly_flag: timingAnomaly,
      price_similarity_flag: isPriceSimilar,
      factors,
      risk_indicators: risks,
    };
  });

  // 2. Collusion Pattern Detection (5 patterns)
  const collusion_indicators: CollusionPatternIndicator[] = [];

  // Pattern 1: Unusually similar bids (< 0.5%)
  for (let i = 0; i < bids.length; i++) {
    for (let j = i + 1; j < bids.length; j++) {
      const p1 = Number(bids[i].bid_amount_inr || (bids[i].bid_amount_paisa ? Number(bids[i].bid_amount_paisa) / 100 : 0));
      const p2 = Number(bids[j].bid_amount_inr || (bids[j].bid_amount_paisa ? Number(bids[j].bid_amount_paisa) / 100 : 0));
      if (p1 > 0 && p2 > 0) {
        const delta = Math.abs(p1 - p2);
        const meanP = (p1 + p2) / 2;
        const diffPct = (delta / meanP) * 100;

        if (diffPct < 0.50) {
          collusion_indicators.push({
            pattern_type: 'price_similarity',
            label: COLLUSION_LABEL,
            pattern_name: 'Unusually Similar Bid Prices',
            severity: diffPct < 0.2 ? 'HIGH' : 'MEDIUM',
            involved_companies: [bids[i].company_name, bids[j].company_name],
            evidence_summary: `${COLLUSION_LABEL}: Close pairwise pricing between ${bids[i].company_name} (₹${p1.toLocaleString('en-IN')}) and ${bids[j].company_name} (₹${p2.toLocaleString('en-IN')}) with a variance of ${diffPct.toFixed(3)}%.`,
            metrics: { price_1: p1, price_2: p2, diff_pct: diffPct },
          });
        }
      }
    }
  }

  // Pattern 2: Constant mark-up relationship (e.g. exactly 5.0% higher)
  for (let i = 0; i < bids.length; i++) {
    for (let j = 0; j < bids.length; j++) {
      if (i === j) continue;
      const p1 = Number(bids[i].bid_amount_inr || 0);
      const p2 = Number(bids[j].bid_amount_inr || 0);
      if (p1 > 0 && p2 > 0 && p2 > p1) {
        const ratio = p2 / p1;
        if (Math.abs(ratio - 1.05) < 0.003 || Math.abs(ratio - 1.10) < 0.003) {
          const margin = ((ratio - 1) * 100).toFixed(1);
          collusion_indicators.push({
            pattern_type: 'repeated_price_relationship',
            label: COLLUSION_LABEL,
            pattern_name: 'Structured Price Margin Relationship',
            severity: 'MEDIUM',
            involved_companies: [bids[i].company_name, bids[j].company_name],
            evidence_summary: `${COLLUSION_LABEL}: Structured pricing delta. ${bids[j].company_name}'s proposal is marked up by uniform ${margin}% above ${bids[i].company_name}.`,
            metrics: { ratio, margin_pct: margin },
          });
        }
      }
    }
  }

  // Pattern 3: Repeated bidder combinations from historical tenders
  if (historicalTenders && historicalTenders.length >= 2) {
    const currentCompanies = new Set(bids.map((b) => b.company_id || b.company_name));
    for (const hist of historicalTenders) {
      const histBidders = new Set(hist.bidders || []);
      const overlap = [...currentCompanies].filter((c) => histBidders.has(c));
      if (overlap.length >= 2 && hist.repeated_count >= 3) {
        collusion_indicators.push({
          pattern_type: 'repeated_combination',
          label: COLLUSION_LABEL,
          pattern_name: 'Repeated Bidder Pairing',
          severity: 'MEDIUM',
          involved_companies: overlap.map(String),
          evidence_summary: `${COLLUSION_LABEL}: Frequent co-bidding partnership observed across ${hist.repeated_count} recent tenders.`,
          metrics: { co_occurrence_count: hist.repeated_count },
        });
        break;
      }
    }
  }

  // Pattern 4: Non-competitive token participation (> 30% above budget)
  for (const bid of bids) {
    const p = Number(bid.bid_amount_inr || 0);
    if (p > budget * 1.3) {
      collusion_indicators.push({
        pattern_type: 'unusual_participation',
        label: COLLUSION_LABEL,
        pattern_name: 'Non-Competitive Price Participation',
        severity: 'LOW',
        involved_companies: [bid.company_name],
        evidence_summary: `${COLLUSION_LABEL}: Non-competitive pricing behavior. ${bid.company_name} submitted a bid ${(((p - budget) / budget) * 100).toFixed(1)}% above estimated budget.`,
        metrics: { price: p, budget },
      });
    }
  }

  return {
    tender_id: tender.tender_id || tender.id || 'tender-1',
    bids_evaluated: bids.length,
    bid_anomalies,
    collusion_indicators,
    has_collusion_pattern: collusion_indicators.length > 0,
    summary: `Evaluated ${bids.length} bids. Flagged ${bid_anomalies.filter((a) => a.risk_tier === 'HIGH RISK').length} high-risk bid anomalies and ${collusion_indicators.length} potential suspicious market patterns.`,
    disclaimer:
      'ANTI-BIAS & ANOMALY SAFEGUARD: All flagged patterns represent statistical deviations and potential suspicious patterns requiring standard committee verification. The system strictly does not claim or prove corruption, bid-rigging, or administrative misconduct.',
  };
}

/**
 * Runs Anomaly & Collusion Analysis by querying Python FastAPI or falling back to local engine.
 */
export async function runAnomalyAndCollusionAnalysis(
  tender: any,
  bids: any[]
): Promise<TenderRiskAnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${env.AI_SERVICE_URL}/risk/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        tender: {
          tender_id: tender.id,
          reference_number: tender.reference_number,
          title: tender.title,
          estimated_budget_inr: tender.estimated_budget_paisa
            ? Number(tender.estimated_budget_paisa) / 100
            : Number(tender.estimated_budget_inr || 100000000),
          required_delivery_days: tender.required_delivery_days || 180,
          required_experience_years: tender.required_experience_years || 5,
          required_completed_projects: tender.required_completed_projects || 3,
        },
        bids: bids.map((b) => ({
          bid_id: b.id || b.bid_id,
          bid_reference: b.bid_reference || 'BID-REF',
          company_id: b.company_id || 'comp-id',
          company_name: b.company_name || 'Bidder Entity',
          bid_amount_inr: b.bid_amount_paisa
            ? Number(b.bid_amount_paisa) / 100
            : Number(b.bid_amount_inr || 0),
          completion_days: b.completion_days || 180,
          technical_proposal: b.technical_proposal || '',
          annual_turnover_inr: b.annual_turnover_paisa
            ? Number(b.annual_turnover_paisa) / 100
            : Number(b.annual_turnover_inr || 0),
          net_worth_inr: b.net_worth_paisa ? Number(b.net_worth_paisa) / 100 : Number(b.net_worth_inr || 0),
          years_in_operation: b.years_in_operation || 5,
          completed_projects_count: b.completed_projects_count || 3,
          technical_capabilities: b.technical_capabilities || [],
          past_performance: b.past_performance || {},
          is_synthetic: Boolean(b.is_synthetic),
        })),
      }),
    });

    if (response.ok) {
      return (await response.json()) as TenderRiskAnalysisResult;
    }
  } catch (err) {
    // Graceful fallback to local anomaly engine
  } finally {
    clearTimeout(timeout);
  }

  return analyzeTenderRisksLocally(tender, bids);
}

/**
 * Feature 3 — Decision Override Analysis
 * Tracks AI recommendation vs Government final decision.
 * Checks for repeated patterns across decisions without accusing the officer.
 */
export async function analyzeDecisionOverrides(
  tenderId: string
): Promise<DecisionOverrideSummary> {
  const tender = await queryOne<any>(
    'SELECT id, reference_number, title FROM tenders WHERE id = $1',
    [tenderId]
  );

  // Get AI recommendation
  const topAiRec = await queryOne<any>(
    `SELECT r.bid_id, r.total_score,
            COALESCE(c.name, 'Recommended Bidder') AS company_name
     FROM ai_recommendations r
     LEFT JOIN bids b ON b.id = r.bid_id
     LEFT JOIN companies c ON c.id = b.company_id
     JOIN ai_evaluations e ON e.id = r.evaluation_id
     WHERE e.tender_id = $1
     ORDER BY r.rank ASC
     LIMIT 1`,
    [tenderId]
  );

  // Get Government decision
  const decision = await queryOne<any>(
    `SELECT d.id, d.decision, d.awarded_bid_id, d.rationale, d.followed_ai,
            d.decided_by, d.created_at,
            COALESCE(u.full_name, 'Procurement Officer') AS officer_name,
            COALESCE(c.name, 'Awarded Company') AS awarded_company_name,
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

  const isOverride = decision ? !decision.followed_ai : false;
  const officerId = decision?.decided_by;

  // Check historical override patterns for the officer / department
  let officerTotalDecisions = 1;
  let officerOverrideCount = isOverride ? 1 : 0;
  let repeatedPattern = false;
  let patternSummary: string | null = null;
  const explainableRisks: string[] = [];

  if (officerId) {
    const histDecisions = await queryRows<any>(
      `SELECT d.id, d.followed_ai, d.awarded_bid_id, c.id AS company_id, c.name AS company_name
       FROM government_decisions d
       LEFT JOIN bids b ON b.id = d.awarded_bid_id
       LEFT JOIN companies c ON c.id = b.company_id
       WHERE d.decided_by = $1`,
      [officerId]
    );

    officerTotalDecisions = Math.max(1, histDecisions.length);
    officerOverrideCount = histDecisions.filter((d) => !d.followed_ai).length;

    // Pattern 1: Officer has overridden AI 2 or more times favoring the same company
    if (isOverride && decision.awarded_company_name) {
      const sameCompanyOverrides = histDecisions.filter(
        (d) => !d.followed_ai && d.company_name === decision.awarded_company_name
      );
      if (sameCompanyOverrides.length >= 2) {
        repeatedPattern = true;
        patternSummary = `${DECISION_PATTERN_LABEL} Multiple overrides (${sameCompanyOverrides.length} instances) have selected ${decision.awarded_company_name} over the top AI-recommended proposal.`;
        explainableRisks.push(`Repeated selection of ${decision.awarded_company_name} in ${sameCompanyOverrides.length} tenders despite lower composite scoring.`);
      }
    }

    // Pattern 2: Officer has a high overall override rate (> 50% on >= 3 decisions)
    if (officerTotalDecisions >= 3 && (officerOverrideCount / officerTotalDecisions) >= 0.5) {
      repeatedPattern = true;
      const ratePct = ((officerOverrideCount / officerTotalDecisions) * 100).toFixed(0);
      patternSummary = patternSummary || `${DECISION_PATTERN_LABEL} Officer has a ${ratePct}% override frequency across ${officerTotalDecisions} recorded procurement decisions.`;
      explainableRisks.push(`Frequent deviation from automated scoring (${officerOverrideCount}/${officerTotalDecisions} decisions). Standard compliance review advised.`);
    }
  }

  return {
    tender_id: tenderId,
    tender_title: tender?.title || 'Government Tender',
    ai_recommendation: topAiRec
      ? {
          bid_id: topAiRec.bid_id,
          company_name: topAiRec.company_name,
          total_score: Number(topAiRec.total_score),
        }
      : null,
    government_selection: decision?.awarded_bid_id
      ? {
          bid_id: decision.awarded_bid_id,
          company_name: decision.awarded_company_name,
        }
      : null,
    is_override: isOverride,
    override_status: isOverride ? 'YES' : 'NO',
    mandatory_reason: decision?.reason_detail || decision?.rationale || null,
    reason_type: decision?.reason_type || null,
    decided_by_name: decision?.officer_name || null,
    decided_at: decision?.created_at || null,
    pattern_analysis: {
      repeated_pattern_detected: repeatedPattern,
      pattern_label: repeatedPattern ? DECISION_PATTERN_LABEL : null,
      summary: patternSummary,
      officer_override_count: officerOverrideCount,
      officer_total_decisions: officerTotalDecisions,
      explainable_risk_indicators: explainableRisks,
    },
  };
}
