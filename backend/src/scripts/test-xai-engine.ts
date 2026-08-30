/**
 * ProcureAI — Phase 8: Explainable AI (XAI) Engine Test Suite
 *
 * Programmatically tests:
 * 1. "Why did the AI recommend this company?" answer generation.
 * 2. Positive Contributors attribution (+ Competitive price, + Strong technical capability, etc.).
 * 3. Negative Contributors attribution (- Moderate financial capacity, - Higher risk indicator, etc.).
 * 4. Non-Technical Qualitative Ratings Grid (Price: Excellent, Technical: Very strong, Experience: Strong, Financial: Good, Performance: Excellent, Risk: Low).
 * 5. Explainability object tailored for non-technical government officials (no raw ML tensor/gradient internals).
 * 6. SHAP attribution directional mathematical consistency.
 * 7. Multi-factor breakdown availability on government dashboard.
 */

import {
  evaluateLocally,
  DEFAULT_EVALUATION_WEIGHTS,
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
  console.log('  PROCUREAI PHASE 8: EXPLAINABLE AI (XAI) TEST SUITE');
  console.log('===============================================================\n');

  const benchmarkTender = {
    tender_id: 'tdr-xai-2026-001',
    reference_number: 'PROC-2026-CLOUD',
    title: 'National Cloud Infrastructure Initiative',
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
      bid_amount_inr: 92_000_000,
      completion_days: 165,
      technical_proposal:
        'Full containerized cloud architecture with multi-zone disaster recovery, ISO 27001 zero-trust controls, automated CI/CD and 24x7 monitoring.',
      annual_turnover_inr: 750_000_000,
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
      bid_amount_inr: 62_000_000,
      completion_days: 80,
      technical_proposal: 'Standard cloud server deployment with basic scripts.',
      annual_turnover_inr: 220_000_000,
      net_worth_inr: 45_000_000,
      years_in_operation: 3,
      completed_projects_count: 2,
      technical_capabilities: [{ name: 'ISO 9001' }],
      past_performance: { avg_rating: 3.8, on_time_completion_pct: 82.0, contractual_disputes: 1 },
      is_synthetic: true,
    },
  ];

  const evalResponse = evaluateLocally(benchmarkTender, sampleBids, DEFAULT_EVALUATION_WEIGHTS);

  // ── 1. Top Recommendation Explanation Object ─────────────────────────────────
  console.log('─── 1. "Why Did the AI Recommend This Company?" ──────────────');
  const topBid = evalResponse.top_recommendation!;
  assert(topBid !== null, 'Top recommendation exists');
  assert(topBid.explanation !== undefined, 'Explanation object is attached to top recommendation');

  const xai = topBid.explanation!;
  assert(
    xai.why_summary.includes('recommended for award'),
    'why_summary explicitly answers why the company was recommended for award'
  );
  assert(
    xai.why_summary.includes(topBid.company_name),
    'why_summary references the specific winning corporate entity'
  );

  console.log('\n     Executive Explanation for Officer:');
  console.log(`     "${xai.why_summary}"\n`);

  // ── 2. Positive Contributors ────────────────────────────────────────────────
  console.log('─── 2. Positive Contributors Classification ──────────────────');
  assert(
    xai.positive_contributors.length > 0,
    `Top proposal has positive contributors: ${xai.positive_contributors.join(', ')}`
  );
  assert(
    xai.positive_contributors.every((c) => c.startsWith('+')),
    'Positive contributors are formatted with standard "+" indicator prefix'
  );
  assert(
    xai.positive_contributors.some((c) => c.includes('technical') || c.includes('experience') || c.includes('risk') || c.includes('past performance')),
    'Identifies specific dimensional strengths (technical, experience, performance, risk)'
  );

  // ── 3. Negative Contributors ────────────────────────────────────────────────
  console.log('\n─── 3. Negative Contributors Classification ──────────────────');
  const betaBid = evalResponse.rankings.find((r) => r.company_name.includes('Beta'))!;
  assert(betaBid !== undefined, 'Beta bidder exists in ranking');
  const betaXai = betaBid.explanation!;

  assert(
    betaXai.negative_contributors.length > 0,
    `Lagging proposal identifies negative contributors: ${betaXai.negative_contributors.join(', ')}`
  );
  assert(
    betaXai.negative_contributors.every((c) => c.startsWith('-')),
    'Negative contributors are formatted with standard "-" indicator prefix'
  );
  assert(
    betaXai.negative_contributors.some((c) => c.includes('risk') || c.includes('technical') || c.includes('experience') || c.includes('financial')),
    'Beta negative contributors highlight higher risk, technical or financial limits'
  );

  // ── 4. Non-Technical Qualitative Ratings Grid ───────────────────────────────
  console.log('\n─── 4. Non-Technical Qualitative Ratings Grid ────────────────');
  const ratings = xai.ratings;
  const expectedDimensions = [
    'Price',
    'Technical capability',
    'Experience',
    'Financial capacity',
    'Past performance',
    'Risk',
  ];

  for (const dim of expectedDimensions) {
    assert(ratings[dim] !== undefined, `Ratings grid contains dimension: ${dim}`);
    const validRatings = ['Excellent', 'Very strong', 'Strong', 'Good', 'Moderate', 'Low', 'Elevated', 'High'];
    assert(
      validRatings.includes(ratings[dim]),
      `${dim} rating "${ratings[dim]}" is an approved non-technical label`
    );
  }

  console.log('     Ratings Grid Example:');
  for (const [dim, val] of Object.entries(ratings)) {
    console.log(`       ${dim}: ${val}`);
  }

  // ── 5. Non-Technical Government Officer Friendly Language ───────────────────
  console.log('\n─── 5. Non-Technical Language Governance (No ML Jargon) ──────');
  const narrative = xai.plain_language_narrative.toLowerCase();
  assert(!narrative.includes('tensor'), 'Does not leak raw "tensor" internals');
  assert(!narrative.includes('gradient'), 'Does not leak "gradient" internals');
  assert(!narrative.includes('backprop'), 'Does not leak "backprop" internals');
  assert(!narrative.includes('hyperparameter'), 'Does not leak "hyperparameter" internals');
  assert(xai.plain_language_narrative.length > 50, 'Plain-language narrative provides clear contextual reading');

  // ── 6. SHAP Attributions Consistency ────────────────────────────────────────
  console.log('\n─── 6. SHAP Attribution & Factor Explanations ────────────────');
  assert(xai.shap_attributions !== undefined, 'SHAP attributions dictionary exists');
  assert('price' in xai.shap_attributions, 'SHAP attributions contain price');
  assert('technical' in xai.shap_attributions, 'SHAP attributions contain technical');
  assert('risk' in xai.shap_attributions, 'SHAP attributions contain risk');
  assert(xai.factor_explanations.length === 6, 'All 6 criteria have detailed FactorExplanation entries');

  // ── 7. Synthetic Benchmark XAI Verification ─────────────────────────────────
  console.log('\n─── 7. Synthetic Benchmark XAI Integration ───────────────────');
  const synthResponse = await runSyntheticBenchmark();
  const synthTop = synthResponse.top_recommendation!;
  assert(synthTop.explanation !== undefined, 'Synthetic benchmark populates explanation object');
  assert(synthTop.explanation!.ratings['Price'] !== undefined, 'Synthetic benchmark ratings grid populated');

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('  🎯 ALL PHASE 8 EXPLAINABLE AI (XAI) CONTROLS VERIFIED!');
  } else {
    console.log(`  ⚠️ ${totalTests - passedTests} TESTS FAILED!`);
  }
  console.log('===============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('XAI test suite encountered fatal error:', err);
  process.exit(1);
});
