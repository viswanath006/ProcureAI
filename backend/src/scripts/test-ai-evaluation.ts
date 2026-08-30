/**
 * ProcureAI — Phase 7: AI-Assisted Tender Evaluation Engine Test Suite
 *
 * Programmatically tests:
 * 1. Default 6-Factor Weights Distribution (Price 40%, Technical 20%, Experience 15%, Financial 10%, Performance 10%, Risk 5%)
 * 2. Strict Weight Sum Validation (strictly requiring sum === 100%)
 * 3. Metric Normalization to Common 0–100 Scale across all factors
 * 4. Non-Lowest-Bidder Balance Protection (Balanced proposal beats low-price dumping risk)
 * 5. Criterion-Level Score Breakdown & Mathematical Consistency (e.g. Price: 37.2/40, Technical: 18.5/20)
 * 6. Confidence Quality Indexing & Transparent Human-Readable Rationale
 * 7. Terminology Safeguards Enforcement (No claims of "proved corruption" or "proved fairness")
 * 8. Synthetic Benchmark Dataset Labeling & Non-Fabrication Rule
 */

import {
  evaluateLocally,
  validateWeights,
  DEFAULT_EVALUATION_WEIGHTS,
  EvaluationWeights,
  runSyntheticBenchmark,
} from '../services/ai.service';

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

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('  PROCUREAI PHASE 7: AI EVALUATION ENGINE TEST SUITE');
  console.log('===============================================================\n');

  // ── 1. Default Weights Configuration ─────────────────────────────────────────
  console.log('─── 1. Default Weights Configuration & Sum Enforcement ────────');
  assert(DEFAULT_EVALUATION_WEIGHTS.price === 40, 'Default Price weight is 40%');
  assert(DEFAULT_EVALUATION_WEIGHTS.technical === 20, 'Default Technical Capability weight is 20%');
  assert(DEFAULT_EVALUATION_WEIGHTS.experience === 15, 'Default Experience weight is 15%');
  assert(DEFAULT_EVALUATION_WEIGHTS.financial === 10, 'Default Financial Capacity weight is 10%');
  assert(DEFAULT_EVALUATION_WEIGHTS.past_performance === 10, 'Default Past Performance weight is 10%');
  assert(DEFAULT_EVALUATION_WEIGHTS.risk === 5, 'Default Risk Indicators weight is 5%');

  const defaultSum =
    DEFAULT_EVALUATION_WEIGHTS.price +
    DEFAULT_EVALUATION_WEIGHTS.technical +
    DEFAULT_EVALUATION_WEIGHTS.experience +
    DEFAULT_EVALUATION_WEIGHTS.financial +
    DEFAULT_EVALUATION_WEIGHTS.past_performance +
    DEFAULT_EVALUATION_WEIGHTS.risk;
  assert(defaultSum === 100, 'Sum of default criteria weights equals exactly 100%');

  // ── 2. Weights Validation & Custom Weight Configuration ──────────────────────
  console.log('\n─── 2. Configurable Weights & Sum Validation ──────────────────');
  let threwOnInvalid = false;
  try {
    validateWeights({
      price: 50,
      technical: 30,
      experience: 15,
      financial: 10,
      past_performance: 10,
      risk: 10, // Sum = 125%
    });
  } catch {
    threwOnInvalid = true;
  }
  assert(threwOnInvalid, 'Weights summing to >100% are strictly rejected');

  let validCustomPassed = false;
  const customWeights: EvaluationWeights = {
    price: 35,
    technical: 25,
    experience: 15,
    financial: 10,
    past_performance: 10,
    risk: 5,
  };
  try {
    validateWeights(customWeights);
    validCustomPassed = true;
  } catch {
    validCustomPassed = false;
  }
  assert(validCustomPassed, 'Tender authorities can configure valid custom weights (Sum = 100%)');

  // ── 3. Test Bench Data ───────────────────────────────────────────────────────
  const benchmarkTender = {
    tender_id: 'tdr-test-procureai-001',
    reference_number: 'PROC-2026-CLOUD',
    title: 'National Government Cloud Platform',
    estimated_budget_inr: 100_000_000, // ₹10 Cr
    required_delivery_days: 180,
    required_experience_years: 5,
    required_completed_projects: 3,
  };

  const sampleBids = [
    {
      bid_id: 'bid-alpha-001',
      bid_reference: 'SYNTH-BID-2026-001',
      company_id: 'comp-alpha',
      company_name: '[SYNTHETIC DATASET] Alpha Enterprise Solutions Ltd',
      bid_amount_inr: 92_000_000, // ₹9.2 Cr (Balanced)
      completion_days: 165,
      technical_proposal:
        'Full containerized cloud architecture with multi-zone disaster recovery, ISO 27001 zero-trust controls, automated CI/CD and 24x7 monitoring.',
      annual_turnover_inr: 750_000_000, // ₹75 Cr
      net_worth_inr: 280_000_000,
      years_in_operation: 9,
      completed_projects_count: 5,
      technical_capabilities: [{ name: 'ISO 27001' }, { name: 'CMMI Level 5' }, { name: 'Tier-3 Data Center' }],
      past_performance: { avg_rating: 4.8, on_time_completion_pct: 98.0, contractual_disputes: 0 },
      is_synthetic: true,
    },
    {
      bid_id: 'bid-beta-002',
      bid_reference: 'SYNTH-BID-2026-002',
      company_id: 'comp-beta',
      company_name: '[SYNTHETIC DATASET] Beta Cloudworks Pvt Ltd',
      bid_amount_inr: 62_000_000, // ₹6.2 Cr (Abnormal low bid / dumping risk)
      completion_days: 80, // Suspiciously compressed timeline
      technical_proposal: 'Standard cloud server deployment with basic scripts.',
      annual_turnover_inr: 220_000_000,
      net_worth_inr: 45_000_000,
      years_in_operation: 3,
      completed_projects_count: 2,
      technical_capabilities: [{ name: 'ISO 9001' }],
      past_performance: { avg_rating: 3.8, on_time_completion_pct: 82.0, contractual_disputes: 1 },
      is_synthetic: true,
    },
    {
      bid_id: 'bid-gamma-003',
      bid_reference: 'SYNTH-BID-2026-003',
      company_id: 'comp-gamma',
      company_name: '[SYNTHETIC DATASET] Gamma National Technologies Corp',
      bid_amount_inr: 109_000_000, // ₹10.9 Cr (Expensive incumbent)
      completion_days: 190,
      technical_proposal: 'Enterprise multi-cloud architecture with legacy system integration and SLA guarantees.',
      annual_turnover_inr: 1_250_000_000,
      net_worth_inr: 520_000_000,
      years_in_operation: 16,
      completed_projects_count: 11,
      technical_capabilities: [{ name: 'ISO 27001' }, { name: 'CMMI Level 5' }],
      past_performance: { avg_rating: 4.6, on_time_completion_pct: 94.0, contractual_disputes: 0 },
      is_synthetic: true,
    },
  ];

  const evalResponse = evaluateLocally(benchmarkTender, sampleBids, DEFAULT_EVALUATION_WEIGHTS);

  // ── 4. Metric Normalization to 0-100 Scale ───────────────────────────────────
  console.log('\n─── 3. Metric Normalization to Common 0-100 Scale ─────────────');
  for (const ranking of evalResponse.rankings) {
    for (const [code, cs] of Object.entries(ranking.criterion_scores)) {
      assert(
        cs.raw_score >= 0 && cs.raw_score <= 100,
        `Raw score for ${ranking.company_name.replace('[SYNTHETIC DATASET] ', '')} (${code}) is bounded [0, 100]: ${cs.raw_score}`
      );
    }
  }

  // ── 5. Non-Lowest-Bidder Balance Protection ─────────────────────────────────
  console.log('\n─── 4. Non-Lowest-Bidder Balance Protection (Core Rule) ───────');
  const lowestPriceBid = sampleBids.reduce((prev, curr) =>
    prev.bid_amount_inr < curr.bid_amount_inr ? prev : curr
  );
  assert(lowestPriceBid.company_id === 'comp-beta', 'Beta offered the lowest numerical price (₹6.2 Cr vs ₹9.2 Cr)');

  const topRanked = evalResponse.rankings[0];
  assert(
    topRanked.company_name.includes('Alpha Enterprise'),
    'Alpha wins Rank #1 overall despite having a higher commercial price than Beta'
  );
  assert(
    topRanked.recommendation === 'award',
    'Top ranked balanced proposal receives "award" recommendation'
  );

  const betaRanked = evalResponse.rankings.find((r) => r.company_name.includes('Beta'));
  assert(
    betaRanked!.criterion_scores.price.weighted_score >= topRanked.criterion_scores.price.weighted_score,
    'Beta scored higher on raw price dimension alone'
  );
  assert(
    topRanked.total_score > betaRanked!.total_score,
    `Alpha's superior technical, experience, financial & risk scores decisively defeat Beta (${topRanked.total_score} vs ${betaRanked!.total_score})`
  );
  assert(
    betaRanked!.rank > 1,
    'Low-price dumping bidder with poor technicals and high risk does NOT win the tender'
  );

  // ── 6. Criterion Breakdown & Mathematical Consistency ───────────────────────
  console.log('\n─── 5. Criterion Breakdown & Mathematical Consistency ─────────');
  const alphaResult = evalResponse.rankings[0];
  const priceScore = alphaResult.criterion_scores.price;
  const techScore = alphaResult.criterion_scores.technical;
  const expScore = alphaResult.criterion_scores.experience;
  const finScore = alphaResult.criterion_scores.financial;
  const perfScore = alphaResult.criterion_scores.past_performance;
  const riskScore = alphaResult.criterion_scores.risk;

  console.log(`     Example Output Breakdown for ${alphaResult.company_name}:`);
  console.log(`     Overall Score: ${alphaResult.total_score.toFixed(1)}/100`);
  console.log(`     Price: ${priceScore.weighted_score}/${priceScore.weight}`);
  console.log(`     Technical: ${techScore.weighted_score}/${techScore.weight}`);
  console.log(`     Experience: ${expScore.weighted_score}/${expScore.weight}`);
  console.log(`     Financial: ${finScore.weighted_score}/${finScore.weight}`);
  console.log(`     Performance: ${perfScore.weighted_score}/${perfScore.weight}`);
  console.log(`     Risk: ${riskScore.weighted_score}/${riskScore.weight}`);

  const sumOfWeighted = Math.round(
    (priceScore.weighted_score +
      techScore.weighted_score +
      expScore.weighted_score +
      finScore.weighted_score +
      perfScore.weighted_score +
      riskScore.weighted_score) *
      100
  ) / 100;

  assert(
    Math.abs(sumOfWeighted - alphaResult.total_score) < 0.05,
    `Mathematical consistency: sum of criterion weighted scores (${sumOfWeighted}) equals total score (${alphaResult.total_score})`
  );

  // ── 7. Explainable Rationale & Confidence ───────────────────────────────────
  console.log('\n─── 6. Explainable Rationale & Quality Confidence ─────────────');
  assert(
    alphaResult.reasoning_summary.length > 30,
    'Top recommendation has substantial explanatory reasoning narrative'
  );
  assert(
    alphaResult.reasoning_summary.includes('Best overall balance between price, technical capability'),
    'Reason narrative highlights multidimensional balance'
  );
  assert(
    ['HIGH', 'MEDIUM', 'LOW'].includes(alphaResult.confidence_level),
    `Confidence level is a valid quality indicator: ${alphaResult.confidence_level} (${alphaResult.confidence_score})`
  );
  assert(alphaResult.key_strengths.length > 0, 'Key strengths are extracted and enumerated');

  // ── 8. Terminology Safeguards ───────────────────────────────────────────────
  console.log('\n─── 7. Approved Terminology Safeguards ────────────────────────');
  const responseJson = JSON.stringify(evalResponse).toLowerCase();

  assert(!responseJson.includes('proved corruption'), 'Disclaims claiming AI has proved corruption');
  assert(!responseJson.includes('proved fairness'), 'Disclaims claiming AI has proved fairness');
  assert(responseJson.includes('recommendation'), 'Employs standard "Recommendation" terminology');
  assert(responseJson.includes('risk indicator'), 'Employs standard "Risk Indicator" terminology');
  assert(evalResponse.disclaimer.includes('AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.'), 'Displays foundational constitutional disclaimer');

  // ── 9. Synthetic Dataset Labeling ───────────────────────────────────────────
  console.log('\n─── 8. Synthetic Benchmark Data Labeling ──────────────────────');
  const synthResponse = await runSyntheticBenchmark();
  assert(synthResponse.bids_evaluated === 3, 'Synthetic benchmark suite generates 3 bidder personas');
  assert(
    synthResponse.rankings.every((r) => r.is_synthetic === true),
    'All benchmark bidders are marked is_synthetic: true'
  );
  assert(
    synthResponse.rankings.every((r) => r.company_name.includes('[SYNTHETIC DATASET]')),
    'All benchmark bidder company names explicitly include [SYNTHETIC DATASET]'
  );

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('  🎯 ALL PHASE 7 AI EVALUATION ENGINE CONTROLS VERIFIED!');
  } else {
    console.log(`  ⚠️ ${totalTests - passedTests} TESTS FAILED!`);
  }
  console.log('===============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite encountered fatal error:', err);
  process.exit(1);
});
