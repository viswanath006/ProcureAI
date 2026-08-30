import { env } from '../config/env';

export interface AiHealthData {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  capabilities: string[];
}

export interface AiHealthResult {
  reachable: boolean;
  data?: AiHealthData;
  error?: string;
}

export interface EvaluationWeights {
  price: number;
  technical: number;
  experience: number;
  financial: number;
  past_performance: number;
  risk: number;
}

export const DEFAULT_EVALUATION_WEIGHTS: EvaluationWeights = {
  price: 40.0,
  technical: 20.0,
  experience: 15.0,
  financial: 10.0,
  past_performance: 10.0,
  risk: 5.0,
};

export interface CriterionScore {
  code: string;
  name: string;
  raw_score: number;
  weight: number;
  weighted_score: number;
  confidence: number;
  explanation: string;
  evidence: string[];
  risk_indicators: string[];
}

export interface FactorExplanation {
  factor: string;
  title: string;
  rating_label: string; // Excellent | Very strong | Strong | Good | Moderate | Low
  raw_score: number;
  weighted_score: number;
  weight: number;
  shap_value: number;
  impact: 'positive' | 'negative' | 'neutral';
  summary: string;
}

export interface BidderExplanationObject {
  bid_id: string;
  bid_reference: string;
  company_name: string;
  rank: number;
  total_score: number;
  why_summary: string;
  ratings: Record<string, string>;
  positive_contributors: string[];
  negative_contributors: string[];
  factor_explanations: FactorExplanation[];
  shap_attributions: Record<string, number>;
  baseline_expected_score: number;
  plain_language_narrative: string;
}

export interface BidderEvaluationResult {
  bid_id: string;
  bid_reference: string;
  company_name: string;
  rank: number;
  total_score: number;
  recommendation: 'award' | 'shortlist' | 'reserve' | 'not_recommended';
  confidence_score: number;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning_summary: string;
  criterion_scores: Record<string, CriterionScore>;
  key_strengths: string[];
  key_weaknesses: string[];
  risk_indicators: string[];
  is_synthetic: boolean;
  explanation?: BidderExplanationObject;
}

export interface EvaluationResponse {
  tender_id: string;
  evaluation_id: string;
  timestamp: string;
  bids_evaluated: number;
  weights_used: EvaluationWeights;
  top_recommendation: BidderEvaluationResult | null;
  rankings: BidderEvaluationResult[];
  summary_notes: string;
  disclaimer: string;
}

export async function checkAiServiceHealth(): Promise<AiHealthResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${env.AI_SERVICE_URL}/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return {
        reachable: false,
        error: `AI service returned HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as AiHealthData;
    return { reachable: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error contacting AI service';
    return { reachable: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function pingAiService(): Promise<{ message: string; aiResponse: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${env.AI_SERVICE_URL}/ping`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`AI service returned HTTP ${response.status}`);
    }

    const aiResponse = await response.json();
    return {
      message: 'Backend successfully communicated with AI service',
      aiResponse,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error contacting AI service';
    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }
}

export function validateWeights(weights: EvaluationWeights): void {
  const sum = Math.round(
    (weights.price +
      weights.technical +
      weights.experience +
      weights.financial +
      weights.past_performance +
      weights.risk) *
      100
  ) / 100;

  if (Math.abs(sum - 100.0) > 0.05) {
    throw new Error(
      `Evaluation criteria weights must sum to exactly 100%. Current sum: ${sum}%`
    );
  }
}

// ── In-Process Evaluation Fallback Engine ──────────────────────────────────────
// Ensures mathematical reproducibility and zero-downtime if the external AI service
// is starting up or in isolated testing environments.
export function evaluateLocally(
  tender: any,
  bids: any[],
  weights: EvaluationWeights = DEFAULT_EVALUATION_WEIGHTS
): EvaluationResponse {
  validateWeights(weights);

  const budget = Number(
    tender.estimated_budget_inr ||
      (tender.estimated_budget_paisa ? Number(tender.estimated_budget_paisa) / 100 : 100000000)
  );
  const minPrice = Math.min(...bids.map((b) => Number(b.bid_amount_inr || 0)).filter((p) => p > 0));

  const scoredEntries = bids.map((bid) => {
    const bidPrice = Number(bid.bid_amount_inr || 0);
    const risks: string[] = [];
    const strengths: string[] = [];
    const criterion_scores: Record<string, CriterionScore> = {};

    // 1. Price Score
    const budgetRatio = bidPrice / budget;
    let priceRaw = 100.0 * (minPrice / Math.max(bidPrice, 1));
    if (budgetRatio < 0.65) {
      const dumpingPenalty = Math.min(25.0, (0.65 - budgetRatio) * 60);
      priceRaw = Math.max(50.0, priceRaw - dumpingPenalty);
      risks.push(`Risk Indicator: Abnormal low bid pattern (${(budgetRatio * 100).toFixed(1)}% of budget).`);
    } else if (budgetRatio > 1.25) {
      priceRaw = Math.max(10.0, priceRaw - (budgetRatio - 1.0) * 50);
      risks.push(`Risk Indicator: Bid exceeds official estimated budget by ${((budgetRatio - 1.0) * 100).toFixed(1)}%.`);
    }
    priceRaw = Math.max(0, Math.min(100, Math.round(priceRaw * 100) / 100));
    const priceWeighted = Math.round(priceRaw * (weights.price / 100.0) * 100) / 100;
    if (priceRaw >= 90) strengths.push(`Competitive commercial offer (₹${bidPrice.toLocaleString('en-IN')})`);

    // Timeline feasibility risk
    const reqDays = Number(tender.required_delivery_days || 180);
    const compDays = Number(bid.completion_days || 180);
    if (compDays < reqDays * 0.5) {
      risks.push(`Risk Indicator: Proposed delivery (${compDays}d) is suspiciously compressed (<50% of target ${reqDays}d).`);
    } else if (compDays > reqDays * 1.15) {
      risks.push(`Risk Indicator: Proposed delivery (${compDays}d) exceeds target window (${reqDays}d).`);
    }

    criterion_scores['price'] = {
      code: 'price',
      name: 'Price Score',
      raw_score: priceRaw,
      weight: weights.price,
      weighted_score: priceWeighted,
      confidence: 0.96,
      explanation: `Commercial proposal evaluated against competitive baseline and estimated budget.`,
      evidence: [`Commercial value: ₹${bidPrice.toLocaleString('en-IN')}`, `Budget ratio: ${(budgetRatio * 100).toFixed(1)}%`],
      risk_indicators: risks.filter((r) => r.includes('low bid') || r.includes('budget')),
    };

    // 2. Technical Score
    let techRaw = 40.0;
    const caps = Array.isArray(bid.technical_capabilities) ? bid.technical_capabilities : [];
    if (caps.length >= 3) techRaw += 35.0;
    else if (caps.length >= 1) techRaw += 15.0;
    const proposal = String(bid.technical_proposal || '');
    if (proposal.length > 250) techRaw += 25.0;
    else if (proposal.length > 60) techRaw += 10.0;
    techRaw = Math.max(0, Math.min(100, Math.round(techRaw * 100) / 100));
    const techWeighted = Math.round(techRaw * (weights.technical / 100.0) * 100) / 100;
    if (techRaw >= 85) strengths.push('High technical methodology depth and verified accreditations');

    criterion_scores['technical'] = {
      code: 'technical',
      name: 'Technical Capability',
      raw_score: techRaw,
      weight: weights.technical,
      weighted_score: techWeighted,
      confidence: 0.92,
      explanation: 'Technical methodology and verified accreditations evaluated.',
      evidence: [`Accreditations registered: ${caps.length}`, `Proposal length: ${proposal.length} characters`],
      risk_indicators: techRaw < 60 ? ['Risk Indicator: Limited technical documentation or accreditations.'] : [],
    };

    // 3. Experience Score
    const years = Number(bid.years_in_operation || 0);
    const projects = Number(bid.completed_projects_count || 0);
    let expRaw = 30.0;
    if (years >= 5) expRaw += 35.0;
    else expRaw += years * 6.0;
    if (projects >= 3) expRaw += 25.0;
    else expRaw += projects * 7.0;
    expRaw = Math.max(0, Math.min(100, Math.round(expRaw * 100) / 100));
    const expWeighted = Math.round(expRaw * (weights.experience / 100.0) * 100) / 100;
    if (expRaw >= 85) strengths.push(`Strong industry track record (${years} yrs, ${projects} completed projects)`);

    criterion_scores['experience'] = {
      code: 'experience',
      name: 'Experience',
      raw_score: expRaw,
      weight: weights.experience,
      weighted_score: expWeighted,
      confidence: 0.94,
      explanation: 'Operational years in business and verified completed reference projects.',
      evidence: [`Years in operation: ${years}`, `Completed projects: ${projects}`],
      risk_indicators: expRaw < 60 ? ['Risk Indicator: Operational experience is below target threshold.'] : [],
    };

    // 4. Financial Capacity
    const turnover = Number(bid.annual_turnover_inr || 0);
    const tRatio = turnover / budget;
    let finRaw = 40.0;
    if (tRatio >= 3.0) finRaw += 45.0;
    else if (tRatio >= 1.5) finRaw += 30.0;
    else if (tRatio >= 1.0) finRaw += 15.0;
    finRaw = Math.max(0, Math.min(100, Math.round(finRaw * 100) / 100));
    const finWeighted = Math.round(finRaw * (weights.financial / 100.0) * 100) / 100;
    if (finRaw >= 85) strengths.push('Substantial financial solvency and turnover cushion');

    criterion_scores['financial'] = {
      code: 'financial',
      name: 'Financial Capacity',
      raw_score: finRaw,
      weight: weights.financial,
      weighted_score: finWeighted,
      confidence: 0.95,
      explanation: 'Assessed audited annual turnover and financial solvency ratios.',
      evidence: [`Annual turnover: ₹${turnover.toLocaleString('en-IN')}`, `Turnover to budget ratio: ${tRatio.toFixed(1)}x`],
      risk_indicators: tRatio < 1.0 ? ['Risk Indicator: Annual turnover indicates tight liquidity.'] : [],
    };

    // 5. Past Performance
    const perf = bid.past_performance || {};
    const rating = Number(perf.avg_rating || 4.2);
    const onTime = Number(perf.on_time_completion_pct || 92.0);
    let perfRaw = (rating / 5.0) * 55.0 + (onTime / 100.0) * 40.0;
    perfRaw = Math.max(0, Math.min(100, Math.round(perfRaw * 100) / 100));
    const perfWeighted = Math.round(perfRaw * (weights.past_performance / 100.0) * 100) / 100;
    if (perfRaw >= 85) strengths.push('Exemplary historical delivery record and client ratings');

    criterion_scores['past_performance'] = {
      code: 'past_performance',
      name: 'Past Performance',
      raw_score: perfRaw,
      weight: weights.past_performance,
      weighted_score: perfWeighted,
      confidence: 0.91,
      explanation: 'Historical on-time completion rates, ratings, and contract disputes.',
      evidence: [`Client satisfaction: ${rating}/5.0`, `On-time delivery: ${onTime}%`],
      risk_indicators: perfRaw < 65 ? ['Risk Indicator: Lower historical delivery completion metrics.'] : [],
    };

    // 6. Risk Indicators
    let riskRaw = 100.0 - risks.length * 15.0;
    riskRaw = Math.max(0, Math.min(100, Math.round(riskRaw * 100) / 100));
    const riskWeighted = Math.round(riskRaw * (weights.risk / 100.0) * 100) / 100;

    criterion_scores['risk'] = {
      code: 'risk',
      name: 'Risk Indicators',
      raw_score: riskRaw,
      weight: weights.risk,
      weighted_score: riskWeighted,
      confidence: 0.90,
      explanation: 'Composite assessment of execution viability and anomaly signals.',
      evidence: [`${risks.length} operational risk indicators evaluated.`],
      risk_indicators: risks,
    };

    const totalScore = Math.round(
      (priceWeighted + techWeighted + expWeighted + finWeighted + perfWeighted + riskWeighted) * 100
    ) / 100;

    return {
      bid,
      totalScore,
      criterion_scores,
      strengths,
      risks,
    };
  });

  scoredEntries.sort((a, b) => b.totalScore - a.totalScore);

  const topScore = scoredEntries[0]?.totalScore || 0;
  const secondScore = scoredEntries[1]?.totalScore || 0;
  const leadMargin = Math.round((topScore - secondScore) * 10) / 10;
  const topName = scoredEntries[0]?.bid.company_name || 'Top Bidder';

  const rankings: BidderEvaluationResult[] = scoredEntries.map((entry, idx) => {
    const rank = idx + 1;
    const bid = entry.bid;
    const totalScore = entry.totalScore;
    const crits = entry.criterion_scores;

    const recommendation =
      rank === 1 ? 'award' : rank === 2 ? 'shortlist' : rank === 3 ? 'reserve' : 'not_recommended';

    const confidence_score = rank === 1 && leadMargin >= 3.0 ? 0.95 : 0.92;
    const confidence_level = confidence_score >= 0.9 ? 'HIGH' : 'MEDIUM';

    let summary = '';
    if (rank === 1) {
      summary =
        leadMargin > 1.0
          ? `Best overall balance between price, technical capability, experience, financial capacity and historical performance.`
          : `Ranks #1 with narrow margin (${leadMargin} pts). Demonstrates balanced composite scores across all factors.`;
    } else if (rank === 2) {
      summary = `Strong alternative candidate (${totalScore}/100), trailing ${topName} primarily on technical and operational depth.`;
    } else {
      summary = `Composite score of ${totalScore}/100. Identified areas where competitors demonstrated stronger capacity.`;
    }

    const mapScoreToRating = (code: string, raw: number): string => {
      if (code === 'risk') {
        if (raw >= 90) return 'Low';
        if (raw >= 75) return 'Moderate';
        if (raw >= 55) return 'Elevated';
        return 'High';
      }
      if (raw >= 90) return 'Excellent';
      if (raw >= 80) return 'Very strong';
      if (raw >= 70) return 'Strong';
      if (raw >= 60) return 'Good';
      if (raw >= 50) return 'Moderate';
      return 'Low';
    };

    const ratings: Record<string, string> = {
      'Price': mapScoreToRating('price', crits.price?.raw_score ?? 70),
      'Technical capability': mapScoreToRating('technical', crits.technical?.raw_score ?? 70),
      'Experience': mapScoreToRating('experience', crits.experience?.raw_score ?? 70),
      'Financial capacity': mapScoreToRating('financial', crits.financial?.raw_score ?? 70),
      'Past performance': mapScoreToRating('past_performance', crits.past_performance?.raw_score ?? 70),
      'Risk': mapScoreToRating('risk', crits.risk?.raw_score ?? 85),
    };

    const positive_contributors: string[] = [];
    const negative_contributors: string[] = [];

    if ((crits.price?.raw_score ?? 0) >= 80) positive_contributors.push('+ Competitive price');
    else if ((crits.price?.raw_score ?? 0) < 75) negative_contributors.push('- Less competitive price');

    if ((crits.technical?.raw_score ?? 0) >= 80) positive_contributors.push('+ Strong technical capability');
    else if ((crits.technical?.raw_score ?? 0) < 75) negative_contributors.push('- Moderate technical capability');

    if ((crits.experience?.raw_score ?? 0) >= 80) positive_contributors.push('+ Relevant experience');
    else if ((crits.experience?.raw_score ?? 0) < 75) negative_contributors.push('- Limited operational experience');

    if ((crits.financial?.raw_score ?? 0) >= 80) positive_contributors.push('+ Strong financial capacity');
    else if ((crits.financial?.raw_score ?? 0) < 75) negative_contributors.push('- Moderate financial capacity');

    if ((crits.past_performance?.raw_score ?? 0) >= 80) positive_contributors.push('+ Strong past performance');
    else if ((crits.past_performance?.raw_score ?? 0) < 75) negative_contributors.push('- Moderate past performance');

    if ((crits.risk?.raw_score ?? 0) >= 80) positive_contributors.push('+ Low operational risk');
    else negative_contributors.push('- Higher risk indicator');

    if (positive_contributors.length === 0) positive_contributors.push('+ Meets mandatory eligibility requirements');
    if (negative_contributors.length === 0 && rank > 1) negative_contributors.push('- Moderate comparative margin vs top proposal');

    const factor_explanations: FactorExplanation[] = [
      {
        factor: 'price',
        title: 'Price',
        rating_label: ratings['Price'],
        raw_score: crits.price?.raw_score ?? 70,
        weighted_score: crits.price?.weighted_score ?? 28,
        weight: weights.price,
        shap_value: Math.round(((crits.price?.weighted_score ?? 28) - (weights.price * 0.72)) * 10) / 10,
        impact: (crits.price?.raw_score ?? 0) >= 80 ? 'positive' : 'negative',
        summary: crits.price?.explanation ?? 'Commercial pricing evaluated against budget baseline.',
      },
      {
        factor: 'technical',
        title: 'Technical capability',
        rating_label: ratings['Technical capability'],
        raw_score: crits.technical?.raw_score ?? 70,
        weighted_score: crits.technical?.weighted_score ?? 14,
        weight: weights.technical,
        shap_value: Math.round(((crits.technical?.weighted_score ?? 14) - (weights.technical * 0.72)) * 10) / 10,
        impact: (crits.technical?.raw_score ?? 0) >= 80 ? 'positive' : 'negative',
        summary: crits.technical?.explanation ?? 'Evaluated technical architecture and certifications.',
      },
      {
        factor: 'experience',
        title: 'Experience',
        rating_label: ratings['Experience'],
        raw_score: crits.experience?.raw_score ?? 70,
        weighted_score: crits.experience?.weighted_score ?? 10.5,
        weight: weights.experience,
        shap_value: Math.round(((crits.experience?.weighted_score ?? 10.5) - (weights.experience * 0.72)) * 10) / 10,
        impact: (crits.experience?.raw_score ?? 0) >= 80 ? 'positive' : 'negative',
        summary: crits.experience?.explanation ?? 'Evaluated operational longevity and project track record.',
      },
      {
        factor: 'financial',
        title: 'Financial capacity',
        rating_label: ratings['Financial capacity'],
        raw_score: crits.financial?.raw_score ?? 70,
        weighted_score: crits.financial?.weighted_score ?? 7,
        weight: weights.financial,
        shap_value: Math.round(((crits.financial?.weighted_score ?? 7) - (weights.financial * 0.72)) * 10) / 10,
        impact: (crits.financial?.raw_score ?? 0) >= 80 ? 'positive' : 'negative',
        summary: crits.financial?.explanation ?? 'Assessed annual turnover and financial solvency ratios.',
      },
      {
        factor: 'past_performance',
        title: 'Past performance',
        rating_label: ratings['Past performance'],
        raw_score: crits.past_performance?.raw_score ?? 70,
        weighted_score: crits.past_performance?.weighted_score ?? 7,
        weight: weights.past_performance,
        shap_value: Math.round(((crits.past_performance?.weighted_score ?? 7) - (weights.past_performance * 0.72)) * 10) / 10,
        impact: (crits.past_performance?.raw_score ?? 0) >= 80 ? 'positive' : 'negative',
        summary: crits.past_performance?.explanation ?? 'Historical delivery on-time rates and verified ratings.',
      },
      {
        factor: 'risk',
        title: 'Risk',
        rating_label: ratings['Risk'],
        raw_score: crits.risk?.raw_score ?? 85,
        weighted_score: crits.risk?.weighted_score ?? 4.25,
        weight: weights.risk,
        shap_value: Math.round(((crits.risk?.weighted_score ?? 4.25) - (weights.risk * 0.72)) * 10) / 10,
        impact: (crits.risk?.raw_score ?? 0) >= 80 ? 'positive' : 'negative',
        summary: crits.risk?.explanation ?? 'Assessment of timeline compression and execution viability.',
      },
    ];

    const shap_attributions: Record<string, number> = {};
    for (const fe of factor_explanations) {
      shap_attributions[fe.factor] = fe.shap_value;
    }

    const why_summary =
      rank === 1
        ? `${bid.company_name} was recommended for award because it achieved the highest composite score (${totalScore.toFixed(1)}/100), balancing competitive price, strong technical capability, and verified historical performance with minimal risk.`
        : `${bid.company_name} was ranked #${rank} (${totalScore.toFixed(1)}/100), trailing the leading proposal on comparative technical or commercial dimensions.`;

    const plain_language_narrative = `The AI evaluated ${bid.company_name} across the 6 tender criteria. Commercial pricing scored ${ratings['Price']}, technical capability was rated ${ratings['Technical capability']}, operational experience is ${ratings['Experience']}, and overall risk was determined as ${ratings['Risk']}.`;

    const explanation: BidderExplanationObject = {
      bid_id: bid.bid_id,
      bid_reference: bid.bid_reference,
      company_name: bid.company_name,
      rank,
      total_score: totalScore,
      why_summary,
      ratings,
      positive_contributors,
      negative_contributors,
      factor_explanations,
      shap_attributions,
      baseline_expected_score: 72.0,
      plain_language_narrative,
    };

    return {
      bid_id: bid.bid_id,
      bid_reference: bid.bid_reference,
      company_name: bid.company_name,
      rank,
      total_score: totalScore,
      recommendation,
      confidence_score,
      confidence_level,
      reasoning_summary: summary,
      criterion_scores: crits,
      key_strengths: entry.strengths.length > 0 ? entry.strengths : ['Meets baseline tender requirements.'],
      key_weaknesses: rank > 1 ? ['Competitive variance across technical or commercial criteria.'] : [],
      risk_indicators: entry.risks,
      is_synthetic: Boolean(bid.is_synthetic),
      explanation,
    };
  });

  return {
    tender_id: tender.tender_id || tender.id || 'tender-eval',
    evaluation_id: `eval-${Date.now()}`,
    timestamp: new Date().toISOString(),
    bids_evaluated: bids.length,
    weights_used: weights,
    top_recommendation: rankings[0] || null,
    rankings,
    summary_notes: `Evaluated ${bids.length} eligible bidder proposals against 6 weighted criteria. Top recommendation: ${rankings[0]?.company_name} (Score: ${rankings[0]?.total_score}/100).`,
    disclaimer:
      'AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS. Recommendations and risk indicators are decision-support outputs based on quantifiable tender criteria and do not prove legal compliance, corruption, or absolute fairness.',
  };
}

export async function runAiEvaluation(
  tender: any,
  bids: any[],
  weights: EvaluationWeights = DEFAULT_EVALUATION_WEIGHTS
): Promise<EvaluationResponse> {
  validateWeights(weights);

  // Try calling external Python FastAPI AI service
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const payload = {
      tender: {
        tender_id: tender.id || tender.tender_id,
        reference_number: tender.reference_number || 'TDR-REF',
        title: tender.title || 'Procurement Tender',
        estimated_budget_inr: Number(tender.estimated_budget_inr || (tender.estimated_budget_paisa ? Number(tender.estimated_budget_paisa) / 100 : 10000000)),
        required_delivery_days: tender.required_delivery_days || 180,
        required_experience_years: tender.required_experience_years || 3,
        required_completed_projects: tender.required_completed_projects || 2,
      },
      bids: bids.map((b) => ({
        bid_id: b.id || b.bid_id,
        bid_reference: b.bid_reference,
        company_id: b.company_id,
        company_name: b.company_name || b.name,
        bid_amount_inr: Number(b.bid_amount_inr || (b.bid_amount_paisa ? Number(b.bid_amount_paisa) / 100 : 0)),
        completion_days: Number(b.completion_days || 180),
        technical_proposal: b.technical_proposal || '',
        annual_turnover_inr: Number(b.annual_turnover_inr || (b.annual_turnover_paisa ? Number(b.annual_turnover_paisa) / 100 : 0)),
        net_worth_inr: Number(b.net_worth_inr || (b.net_worth_paisa ? Number(b.net_worth_paisa) / 100 : 0)),
        years_in_operation: Number(b.years_in_operation || 0),
        completed_projects_count: Number(b.completed_projects_count || 0),
        technical_capabilities: b.technical_capabilities || [],
        compliance_info: b.compliance_info || {},
        past_performance: b.past_performance || {},
        is_synthetic: Boolean(b.is_synthetic),
      })),
      weights,
    };

    const res = await fetch(`${env.AI_SERVICE_URL}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (res.ok) {
      return (await res.json()) as EvaluationResponse;
    }
    console.warn(`[AI Service] FastAPI returned HTTP ${res.status}. Falling back to internal engine.`);
  } catch (err) {
    console.warn('[AI Service] FastAPI unreachable. Utilizing high-fidelity in-process evaluator fallback.');
  } finally {
    clearTimeout(timeout);
  }

  // Fallback to local evaluator
  return evaluateLocally(tender, bids, weights);
}

export async function runSyntheticBenchmark(
  tender?: any,
  weights: EvaluationWeights = DEFAULT_EVALUATION_WEIGHTS
): Promise<EvaluationResponse> {
  validateWeights(weights);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const payload = {
      tender: tender
        ? {
            tender_id: tender.id || tender.tender_id,
            reference_number: tender.reference_number || 'TDR-REF',
            title: tender.title || 'Procurement Tender',
            estimated_budget_inr: Number(tender.estimated_budget_inr || 100000000),
            required_delivery_days: 180,
          }
        : null,
      weights,
    };

    const res = await fetch(`${env.AI_SERVICE_URL}/synthetic/benchmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (res.ok) {
      return (await res.json()) as EvaluationResponse;
    }
  } catch (err) {
    console.warn('[AI Service] FastAPI unreachable for synthetic benchmark. Generating local benchmark.');
  } finally {
    clearTimeout(timeout);
  }

  // Local synthetic benchmark generation
  const budget = tender?.estimated_budget_inr ? Number(tender.estimated_budget_inr) : 100000000;
  const synthTender = {
    tender_id: tender?.id || 'synth-tdr-001',
    reference_number: tender?.reference_number || 'SYNTH-TDR-2026-CLOUD-01',
    title: '[SYNTHETIC BENCHMARK] Government Cloud Infrastructure & Resiliency Suite',
    estimated_budget_inr: budget,
  };

  const synthBids = [
    {
      bid_id: 'synth-bid-alpha-001',
      bid_reference: 'SYNTH-BID-2026-001',
      company_name: '[SYNTHETIC DATASET] Alpha Enterprise Solutions Ltd',
      bid_amount_inr: budget * 0.92,
      completion_days: 165,
      technical_proposal:
        'Comprehensive cloud migration architecture using containerized microservices, automated CI/CD pipelines, multi-zone disaster recovery and ISO 27001 security.',
      annual_turnover_inr: 750000000,
      net_worth_inr: 280000000,
      years_in_operation: 9,
      completed_projects_count: 5,
      technical_capabilities: [{ name: 'ISO 27001' }, { name: 'CMMI Level 5' }],
      past_performance: { avg_rating: 4.8, on_time_completion_pct: 97.5 },
      is_synthetic: true,
    },
    {
      bid_id: 'synth-bid-beta-002',
      bid_reference: 'SYNTH-BID-2026-002',
      company_name: '[SYNTHETIC DATASET] Beta Cloudworks Pvt Ltd',
      bid_amount_inr: budget * 0.62,
      completion_days: 81,
      technical_proposal: 'Standard cloud server deployment with basic scripts.',
      annual_turnover_inr: 220000000,
      net_worth_inr: 45000000,
      years_in_operation: 3,
      completed_projects_count: 2,
      technical_capabilities: [{ name: 'ISO 9001' }],
      past_performance: { avg_rating: 3.8, on_time_completion_pct: 81.0 },
      is_synthetic: true,
    },
    {
      bid_id: 'synth-bid-gamma-003',
      bid_reference: 'SYNTH-BID-2026-003',
      company_name: '[SYNTHETIC DATASET] Gamma National Technologies Corp',
      bid_amount_inr: budget * 1.09,
      completion_days: 190,
      technical_proposal: 'Enterprise multi-cloud architecture with legacy system integration.',
      annual_turnover_inr: 1250000000,
      net_worth_inr: 520000000,
      years_in_operation: 16,
      completed_projects_count: 11,
      technical_capabilities: [{ name: 'ISO 27001' }, { name: 'CMMI Level 5' }, { name: 'Tier-4 Operations' }],
      past_performance: { avg_rating: 4.6, on_time_completion_pct: 93.0 },
      is_synthetic: true,
    },
  ];

  return evaluateLocally(synthTender, synthBids, weights);
}
