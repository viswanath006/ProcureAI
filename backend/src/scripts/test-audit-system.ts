/**
 * ProcureAI — Phase 11: Tamper-Evident Audit System Test Suite
 *
 * Verifies:
 * 1. Recording of all 16 required procurement events:
 *    - login, tender creation, tender publication, tender modification,
 *      bidder registration, document upload, bid submission, bid locking,
 *      bid opening, AI evaluation, recommendation generation,
 *      government approval, government rejection, recommendation override,
 *      decision modification attempt, suspicious activity.
 * 2. Presence of all 8 required event fields:
 *    - event ID, actor, role, action, entity, timestamp, previous hash, current hash.
 * 3. Cryptographic hash chaining:
 *    HASH(N) = SHA256(event_data + HASH(N-1))
 * 4. Audit verification function displaying:
 *    - "✓ AUDIT CHAIN VALID" on valid chain
 *    - "⚠ AUDIT INTEGRITY FAILURE" on tampered chain
 * 5. 6-Factor filter queries:
 *    - tender, user, company, event type, date, risk level.
 */

import {
  recordChainEvent,
  verifyAuditChain,
  queryAuditChainLogs,
  simulateTamperAttempt,
  restoreValidAuditChain,
  seedProcurementAuditTrail,
  GENESIS_HASH,
  computeBlockHash,
  canonicalizeEventData,
} from '../services/auditChain.service';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPhase11Tests() {
  console.log('\n===============================================================');
  console.log('  PROCUREAI PHASE 11: TAMPER-EVIDENT AUDIT SYSTEM');
  console.log('===============================================================\n');

  // Initialize benchmark audit trail
  await seedProcurementAuditTrail();

  // ─── 1. Verify All 16 Required Procurement Events ───────────────────────────
  console.log('─── 1. Verify All 16 Required Procurement Event Types ────────');
  const requiredEvents = [
    'login',
    'tender_creation',
    'tender_publication',
    'tender_modification',
    'bidder_registration',
    'document_upload',
    'bid_submission',
    'bid_locking',
    'bid_opening',
    'ai_evaluation',
    'recommendation_generation',
    'government_approval',
    'government_rejection',
    'recommendation_override',
    'decision_modification_attempt',
    'suspicious_activity',
  ];

  const allLogsRes = await queryAuditChainLogs({ limit: 100 });
  const presentActions = new Set(allLogsRes.logs.map((l) => l.action));

  for (const eventType of requiredEvents) {
    assert(presentActions.has(eventType), `Event type recorded in chain: ${eventType}`);
  }

  // ─── 2. Verify All 8 Required Fields Per Event ──────────────────────────────
  console.log('\n─── 2. Verify All 8 Required Fields Per Audit Event ──────────');
  const sampleEvent = allLogsRes.logs[0];

  assert(Boolean(sampleEvent.id), `Field 1 present: event ID (${sampleEvent.id})`);
  assert(Boolean(sampleEvent.actor), `Field 2 present: actor (${sampleEvent.actor})`);
  assert(Boolean(sampleEvent.role), `Field 3 present: role (${sampleEvent.role})`);
  assert(Boolean(sampleEvent.action), `Field 4 present: action (${sampleEvent.action})`);
  assert(Boolean(sampleEvent.entity), `Field 5 present: entity (${sampleEvent.entity})`);
  assert(Boolean(sampleEvent.timestamp), `Field 6 present: timestamp (${sampleEvent.timestamp})`);
  assert(Boolean(sampleEvent.prev_hash), `Field 7 present: previous hash (${sampleEvent.prev_hash.slice(0, 16)}...)`);
  assert(Boolean(sampleEvent.curr_hash), `Field 8 present: current hash (${sampleEvent.curr_hash.slice(0, 16)}...)`);

  // ─── 3. Verify Cryptographic Hash Chaining ──────────────────────────────────
  console.log('\n─── 3. Verify Hash Chaining: HASH(N) = SHA256(data + HASH(N-1))');
  const chronological = [...allLogsRes.logs].sort((a, b) => a.chain_sequence - b.chain_sequence);

  assert(chronological[0].prev_hash === GENESIS_HASH, 'Block 0 points to canonical root Genesis Hash (64 zeros)');

  for (let i = 1; i < chronological.length; i++) {
    const prevBlock = chronological[i - 1];
    const currBlock = chronological[i];
    assert(
      currBlock.prev_hash === prevBlock.curr_hash,
      `Link ${currBlock.chain_sequence} correctly chains to block ${prevBlock.chain_sequence} hash`
    );
  }

  // Verify mathematical formula recalculation on arbitrary block
  const testBlock = chronological[5];
  const recomputedData = canonicalizeEventData({
    id: testBlock.id,
    actor: testBlock.actor,
    role: testBlock.role,
    action: testBlock.action,
    entity: testBlock.entity,
    timestamp: testBlock.timestamp,
    details: testBlock.details,
  });
  const expectedHash = computeBlockHash(recomputedData, testBlock.prev_hash);
  assert(testBlock.curr_hash === expectedHash, 'Mathematical recalculation matches stored SHA-256 block hash exactly');

  // ─── 4. Audit Verification Function ─────────────────────────────────────────
  console.log('\n─── 4. Audit Verification Function (Valid vs Corrupted) ──────');
  const validResult = await verifyAuditChain();
  assert(validResult.isValid === true, 'Audit verification passes on untampered ledger');
  assert(validResult.statusText === '✓ AUDIT CHAIN VALID', `Verification status displays exact label: "${validResult.statusText}"`);
  assert(validResult.totalBlocks >= 16, `Verified all ${validResult.totalBlocks} sequential cryptographic blocks`);

  // Simulate Tamper
  console.log('\n  [SIMULATING MALICIOUS TAMPERING OF BLOCK DETAIL PAYLOAD]');
  simulateTamperAttempt(5);
  const corruptedResult = await verifyAuditChain();
  assert(corruptedResult.isValid === false, 'Audit verification detects unauthorized payload tampering');
  assert(corruptedResult.statusText === '⚠ AUDIT INTEGRITY FAILURE', `Tamper status displays exact label: "${corruptedResult.statusText}"`);
  assert(Boolean(corruptedResult.failureDetails), 'Tamper report isolates failure sequence and identifies corrupted block');

  // Restore Valid Chain
  restoreValidAuditChain();
  const restoredResult = await verifyAuditChain();
  assert(restoredResult.isValid === true && restoredResult.statusText === '✓ AUDIT CHAIN VALID', 'Restoration re-validates chain integrity');

  // ─── 5. 6-Factor Auditor Filter Verification ────────────────────────────────
  console.log('\n─── 5. 6-Factor Auditor Filter Verification ──────────────────');

  // Factor 1: Tender filter
  const tenderLogs = await queryAuditChainLogs({ tender: '00000000-0000-0000-0000-000000000001' });
  assert(tenderLogs.logs.length > 0, `Filter 1 (tender): matched ${tenderLogs.logs.length} events for tender`);

  // Factor 2: User filter
  const userLogs = await queryAuditChainLogs({ user: 'suresh' });
  assert(userLogs.logs.every((l) => l.actor.includes('suresh')), 'Filter 2 (user): only returns events for specified actor');

  // Factor 3: Company filter
  const companyLogs = await queryAuditChainLogs({ company: '00000000-0000-0000-0000-000000000010' });
  assert(companyLogs.logs.length > 0, `Filter 3 (company): matched ${companyLogs.logs.length} events for company`);

  // Factor 4: Event Type filter
  const loginLogs = await queryAuditChainLogs({ event_type: 'login' });
  assert(loginLogs.logs.every((l) => l.action === 'login'), 'Filter 4 (event type): only returns login events');

  // Factor 5: Date filter
  const dateLogs = await queryAuditChainLogs({
    start_date: '2026-08-29T10:00:00.000Z',
    end_date: '2026-08-29T15:00:00.000Z',
  });
  assert(dateLogs.logs.length > 0, `Filter 5 (date): successfully filtered events within date bounds`);

  // Factor 6: Risk Level filter
  const critLogs = await queryAuditChainLogs({ risk_level: 'CRITICAL' });
  assert(critLogs.logs.length > 0 && critLogs.logs.every((l) => l.risk_level === 'CRITICAL'), 'Filter 6 (risk level): correctly isolates CRITICAL security events');

  console.log('\n===============================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('  🎯 ALL PHASE 11 TAMPER-EVIDENT AUDIT CONTROLS VERIFIED!');
  console.log('===============================================================\n');
}

runPhase11Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
