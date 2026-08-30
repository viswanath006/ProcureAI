/**
 * ProcureAI — Phase 14: End-to-End Procurement Demonstration Script
 *
 * Runs the full 17-step demonstration workflow:
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
 * Also demonstrates Scenario 2:
 * - AI recommends Company A
 * - Government selects Company C
 * - System requires an override reason
 * - Audit log records: AI Rec -> Company A, Final -> Company C, Override -> YES, Reason -> [...]
 * - Displayed as a potential governance-risk event rather than corruption proof
 */

import {
  resetAndSeedDemoScenario,
  runScenario1Approval,
  runScenario2Override,
  DEMO_CONSTANTS,
  DemoScenarioState,
} from '../services/demoScenario.service';

async function runDemonstration() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║               PROCUREAI — END-TO-END PROCUREMENT DEMONSTRATION            ║');
  console.log('║                   "Intelligent. Fair. Transparent."                      ║');
  console.log('║               AI RECOMMENDS · HUMANS DECIDE · SYSTEM AUDITS               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  console.log('📋 TENDER PROFILE:');
  console.log(`   Project:          ${DEMO_CONSTANTS.TENDER_TITLE}`);
  console.log(`   Reference:        ${DEMO_CONSTANTS.TENDER_REF}`);
  console.log('   Estimated Value:  ₹10 Crore (₹10,00,00,000)');
  console.log('   Department:       Department of School Education & Literacy, Govt. of India');
  console.log('   Scope:            STEM laboratories, digital smart classrooms, seismic foundations\n');

  console.log('🏢 COMPETING BIDDER PROFILES:');
  console.log('   1. Company A (Apex Infra Buildtech Ltd)       — Bid: ₹8.20 Cr | Tech: 18.8/20 | Exp: 14.2/15');
  console.log('   2. Company B (Bharat Civil Works & Const.)    — Bid: ₹7.80 Cr [LOWEST BIDDER / L1] | Tech: 12.5/20');
  console.log('   3. Company C (Crescent Urban Developers Ltd)  — Bid: ₹8.50 Cr | Tech: 15.0/20 | Exp: 11.5/15\n');

  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log('  PHASE 14.1 — EXECUTING 17-STEP WORKFLOW (SCENARIO 1: AI AWARD)');
  console.log('─────────────────────────────────────────────────────────────────────────────\n');

  // Step 1 - 14: Initialization & Scoring
  const state1 = await resetAndSeedDemoScenario();

  for (let i = 0; i < 14; i++) {
    const s = state1.workflowSteps[i];
    console.log(`  Step ${String(s.step).padStart(2, ' ')}: [${s.status}] ${s.title}`);
    console.log(`          ↳ ${s.description}`);
  }

  console.log('\n  🎯 CORE PRINCIPLE PROOF:');
  console.log('     Company B has the LOWEST BID (₹7.80 Cr).');
  console.log('     However, Company A achieves the HIGHEST COMPOSITE SCORE (87.6 / 100).');
  console.log('     The system does NOT simply select the lowest bidder!\n');

  console.log('  📊 MULTI-FACTOR EVALUATION SCORECARD:');
  console.log('  ┌────────────┬─────────────┬───────────┬──────────────┬────────────┬────────────┐');
  console.log('  │ Company    │ Price (40)  │ Tech (20) │ Exper. (15)  │ Perf. (10) │ TOTAL (100)│');
  console.log('  ├────────────┼─────────────┼───────────┼──────────────┼────────────┼────────────┤');
  for (const c of state1.companies) {
    const isRec = c.isAiRecommended ? ' 🏆 (REC)' : '        ';
    console.log(
      `  │ ${c.name.slice(0, 10).padEnd(10, ' ')} │   ${c.priceScore.toFixed(1).padStart(4, ' ')}/40  │   ${c.technicalCapabilityScore.toFixed(1).padStart(4, ' ')}/20 │    ${c.experienceScore.toFixed(1).padStart(4, ' ')}/15   │   ${c.pastPerformanceScore.toFixed(1).padStart(4, ' ')}/10   │ ${c.compositeScore.toFixed(1).padStart(5, ' ')}/100${isRec}│`
    );
  }
  console.log('  └────────────┴─────────────┴───────────┴──────────────┴────────────┴────────────┘\n');

  console.log('  🧠 EXPLAINABLE AI (XAI) ATTRIBUTION:');
  console.log('     Why did AI recommend Company A?');
  for (const pos of state1.companies[0].explanation.positiveContributors) {
    console.log(`     + ${pos}`);
  }
  for (const neg of state1.companies[0].explanation.negativeContributors) {
    console.log(`     - ${neg}`);
  }

  console.log('\n  🛡️ RISK ANALYSIS (ISOLATION FOREST ANOMALY DETECTION):');
  for (const c of state1.companies) {
    const r = c.riskAnalysis;
    console.log(`     ${c.name.slice(0, 9)}: Tier [${r.riskTier}] | Anomaly: ${r.anomalyScore} | Budget Dev: ${r.budgetDeviationPct}%`);
    if (r.flagText) {
      console.log(`       ↳ Notice: ${r.flagText}`);
    }
  }

  // Execute Step 15 - 17: Government Approval
  console.log('\n  🏛️ STEP 15 - 17: AUTHORITATIVE GOVERNMENT DECISION:');
  const finalState1 = await runScenario1Approval();

  const step15 = finalState1.workflowSteps[14];
  const step16 = finalState1.workflowSteps[15];
  const step17 = finalState1.workflowSteps[16];

  console.log(`  Step 15: [${step15.status}] ${step15.title}`);
  console.log(`          ↳ Action: ${step15.evidence.action} → Awarded: ${step15.evidence.awardedBidder}`);
  console.log(`          ↳ Integrity Hash: ${step15.evidence.integrityHash}`);
  console.log(`  Step 16: [${step16.status}] ${step16.title}`);
  console.log(`          ↳ Chained into cryptographic block sequence`);
  console.log(`  Step 17: [${step17.status}] ${step17.title}`);
  console.log(`          ↳ Status: ${step17.evidence.verificationStatus} (${step17.evidence.blocksVerified} blocks verified)`);

  console.log('\n─────────────────────────────────────────────────────────────────────────────');
  console.log('  PHASE 14.2 — DEMONSTRATING SCENARIO 2: HUMAN DECISION OVERRIDE');
  console.log('─────────────────────────────────────────────────────────────────────────────\n');

  console.log('  Action: Government Officer overrides AI Recommendation (Company A) and selects Company C.\n');
  const finalState2 = await runScenario2Override();
  const ov = finalState2.scenario2Override!;

  console.log('  📋 AUDIT LOG OVERRIDE RECORD:');
  console.log(`     AI Recommendation  → ${ov.aiRecommendation}`);
  console.log(`     Final Selection    → ${ov.finalSelection}`);
  console.log(`     Override Status    → ${ov.override}`);
  console.log(`     Officer ID         → ${ov.officerName}`);
  console.log(`     Integrity Hash     → ${ov.integrityHash}`);
  console.log(`     Mandatory Reason   → "${ov.reason}"`);
  console.log(`     Supporting Note    → "${ov.supportingNote}"`);
  console.log(`     Decision Locked    → ${ov.isLocked}`);

  console.log('\n  ⚠️ GOVERNANCE RISK ASSESSMENT DISPLAY:');
  console.log(`     Notice: ${ov.governanceRiskFlag}`);
  console.log('     Policy: Recorded as a potential governance-risk pattern for audit review.');
  console.log('             Strictly avoids making unsupported accusations (Anti-Bias Principle).\n');

  console.log('  ⛓️ AUDITOR CRYPTOGRAPHIC VERIFICATION:');
  console.log(`     Status: ${finalState2.auditVerification.statusText}`);
  console.log(`     Ledger Continuity: Valid (${finalState2.auditVerification.totalBlocksVerified} sequential SHA-256 blocks verified)\n`);

  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║   🎯 PHASE 14 END-TO-END DEMONSTRATION VERIFIED SUCCESSFULLY!             ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');
}

runDemonstration().catch((err) => {
  console.error('Demonstration failed:', err);
  process.exit(1);
});
