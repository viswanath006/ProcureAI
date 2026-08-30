import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface SecurityTestCase {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  description: string;
  authorizedRoles: string[];
  expectedResultForCurrentRole: 'ALLOW' | 'DENY';
}

const TEST_CASES: SecurityTestCase[] = [
  {
    id: 'tc-1',
    name: 'Create Tender (Govt Authority)',
    endpoint: '/tenders',
    method: 'POST',
    description: 'Only Government Officers and Admins can create new tenders. Bidders and Auditors must be denied.',
    authorizedRoles: ['GOVT_OFFICER', 'ADMIN'],
    expectedResultForCurrentRole: 'DENY',
  },
  {
    id: 'tc-2',
    name: 'Unseal Bids (Pre-Deadline Check)',
    endpoint: '/tenders/00000003-0000-0000-0000-000000000001/bids',
    method: 'GET',
    description: 'Bids are cryptographically sealed until deadline. Bidders are strictly denied. Officers are checked against deadline.',
    authorizedRoles: ['GOVT_OFFICER', 'AUDITOR', 'ADMIN'],
    expectedResultForCurrentRole: 'DENY',
  },
  {
    id: 'tc-3',
    name: 'Submit Sealed Bid',
    endpoint: '/tenders/00000003-0000-0000-0000-000000000001/bids',
    method: 'POST',
    description: 'Only registered Bidders with valid company associations can submit bids. Officers and Auditors cannot bid.',
    authorizedRoles: ['BIDDER'],
    expectedResultForCurrentRole: 'DENY',
  },
  {
    id: 'tc-4',
    name: 'View Own Submissions (Isolation)',
    endpoint: '/bids/mine',
    method: 'GET',
    description: 'Bidders can only view their own submissions. Non-bidders cannot access bidder-isolated endpoints.',
    authorizedRoles: ['BIDDER'],
    expectedResultForCurrentRole: 'DENY',
  },
  {
    id: 'tc-5',
    name: 'Trigger AI Evaluation',
    endpoint: '/tenders/00000003-0000-0000-0000-000000000001/evaluate',
    method: 'POST',
    description: 'Only Government Officers and Admins can trigger AI scoring pipeline. Bidders and Auditors cannot.',
    authorizedRoles: ['GOVT_OFFICER', 'ADMIN'],
    expectedResultForCurrentRole: 'DENY',
  },
  {
    id: 'tc-6',
    name: 'View AI Recommendations',
    endpoint: '/tenders/00000003-0000-0000-0000-000000000001/ai-recommendations',
    method: 'GET',
    description: 'Internal AI scoring is confidential. Bidders are strictly denied access.',
    authorizedRoles: ['GOVT_OFFICER', 'AUDITOR', 'ADMIN', 'EVALUATOR'],
    expectedResultForCurrentRole: 'DENY',
  },
  {
    id: 'tc-7',
    name: 'Override AI Without Mandatory Reason',
    endpoint: '/tenders/00000003-0000-0000-0000-000000000001/decision',
    method: 'POST',
    description: 'Overriding AI recommendation requires mandatory documented justification (minimum 50 chars). System enforces compliance.',
    authorizedRoles: ['GOVT_OFFICER', 'ADMIN'],
    expectedResultForCurrentRole: 'DENY',
  },
  {
    id: 'tc-8',
    name: 'Access Immutable Audit Trail',
    endpoint: '/audit-logs',
    method: 'GET',
    description: 'Audit logs contain sensitive activity traces. Only Auditors and Admins can access. Officers and Bidders are denied.',
    authorizedRoles: ['AUDITOR', 'ADMIN'],
    expectedResultForCurrentRole: 'DENY',
  },
  {
    id: 'tc-9',
    name: 'Admin System Diagnostics',
    endpoint: '/admin/system',
    method: 'GET',
    description: 'Low-level database and active token session diagnostics. Strictly restricted to Platform Administrators.',
    authorizedRoles: ['ADMIN'],
    expectedResultForCurrentRole: 'DENY',
  },
];

export const RbacSecurityTester: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [results, setResults] = useState<
    Record<
      string,
      {
        status: number;
        statusText: string;
        response: any;
        passed: boolean;
        durationMs: number;
      }
    >
  >({});
  const [isRunningAll, setIsRunningAll] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

  const runTest = async (testCase: SecurityTestCase) => {
    const startTime = performance.now();

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      let body: string | undefined = undefined;

      // Prepare test payloads
      if (testCase.id === 'tc-1') {
        body = JSON.stringify({
          reference_number: `T-TEST-${Date.now().toString().slice(-4)}`,
          title: 'Unauthorized Test Tender Attempt',
          description: 'Testing RBAC enforcement on tender creation',
          category: 'infrastructure',
          department: 'Security Testing Unit',
        });
      } else if (testCase.id === 'tc-3') {
        body = JSON.stringify({
          bid_reference: `BID-ATTACK-${Date.now().toString().slice(-4)}`,
          bid_amount_enc: 'CIPHERTEXT_TEST==',
          completion_days: 180,
        });
      } else if (testCase.id === 'tc-7') {
        // Deliberately omit override reason to test mandatory rule validation
        body = JSON.stringify({
          decision: 'award',
          rationale: 'Testing override enforcement without reason',
          followed_ai: false, // NOT following AI, but NO override reason provided
        });
      }

      const res = await fetch(`${API_BASE}${testCase.endpoint}`, {
        method: testCase.method,
        headers,
        body,
      });

      const data = await res.json().catch(() => ({}));
      const durationMs = Math.round(performance.now() - startTime);

      const isAllowedRole = user && testCase.authorizedRoles.includes(user.role_code);

      let passed = false;
      if (testCase.id === 'tc-7' && isAllowedRole) {
        // Special case: we EXPECT 400 Validation Error because override reason was omitted
        passed = res.status === 400 && data.error?.code === 'OVERRIDE_REASON_REQUIRED';
      } else if (isAllowedRole) {
        // Allowed role should succeed (200, 201) or trigger sealed bid check
        passed = res.status >= 200 && res.status < 300;
        if (testCase.id === 'tc-2' && user.role_code === 'GOVT_OFFICER') {
          // Tender deadline in seed is in 25 days, so 403 BIDS_STILL_SEALED is the EXPECTED security behavior!
          passed = res.status === 403 && data.error?.code === 'BIDS_STILL_SEALED';
        }
      } else {
        // Unauthorized role MUST receive 401 (if unauthenticated) or 403 (if wrong role)
        passed = res.status === 403 || res.status === 401;
      }

      setResults((prev) => ({
        ...prev,
        [testCase.id]: {
          status: res.status,
          statusText: res.statusText,
          response: data,
          passed,
          durationMs,
        },
      }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [testCase.id]: {
          status: 0,
          statusText: 'Network Error',
          response: { message: err.message },
          passed: false,
          durationMs: 0,
        },
      }));
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const tc of TEST_CASES) {
      await runTest(tc);
    }
    setIsRunningAll(false);
  };

  return (
    <div className="card-glass p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h3 className="text-lg font-bold text-slate-100">
              Live RBAC & Cryptographic Security Validation Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Validates active principal <span className="text-procure-300 font-mono">[{user?.role_code || 'UNAUTHENTICATED'}]</span> against strict endpoint permissions, sealed envelope locks, and mandatory override rules.
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunningAll}
          className="px-4 py-2 rounded-lg bg-procure-600 hover:bg-procure-500 text-white text-xs font-semibold shadow-lg shadow-procure-600/25 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {isRunningAll ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span>Auditing Endpoints...</span>
            </>
          ) : (
            <>
              <span>⚡</span> Run All Security Tests
            </>
          )}
        </button>
      </div>

      {/* Tests Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 pr-4 font-semibold uppercase tracking-wider">Test Scenario</th>
              <th className="pb-3 px-3 font-semibold uppercase tracking-wider">Method & Path</th>
              <th className="pb-3 px-3 font-semibold uppercase tracking-wider">Authorized Roles</th>
              <th className="pb-3 px-3 font-semibold uppercase tracking-wider">Expected For You</th>
              <th className="pb-3 px-3 font-semibold uppercase tracking-wider">HTTP Status</th>
              <th className="pb-3 pl-3 font-semibold uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {TEST_CASES.map((tc) => {
              const res = results[tc.id];
              const isAllowed = user && tc.authorizedRoles.includes(user.role_code);

              return (
                <tr key={tc.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="font-semibold text-slate-200 text-xs font-sans">{tc.name}</div>
                    <div className="text-[11px] text-slate-500 font-sans mt-0.5 line-clamp-1">
                      {tc.description}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${
                        tc.method === 'GET'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {tc.method}
                    </span>
                    <span className="text-slate-400 text-[11px]">{tc.endpoint}</span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {tc.authorizedRoles.map((role) => (
                        <span
                          key={role}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                            user?.role_code === role
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {isAllowed ? (
                      <span className="text-emerald-400 font-bold text-[11px]">ALLOWED</span>
                    ) : (
                      <span className="text-red-400 font-bold text-[11px]">403 FORBIDDEN</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {res ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            res.status === 200 || res.status === 201
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : res.status === 403 || res.status === 401
                              ? 'bg-red-500/20 text-red-400'
                              : res.status === 400
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {res.status} {res.statusText}
                        </span>
                        {res.passed ? (
                          <span className="text-emerald-400 text-sm" title="Policy Enforced Correctly">
                            ✅
                          </span>
                        ) : (
                          <span className="text-red-400 text-sm" title="Policy Violation Detected">
                            ❌
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">{res.durationMs}ms</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[11px]">Not tested</span>
                    )}
                  </td>

                  <td className="py-3.5 pl-3 text-right">
                    <button
                      onClick={() => runTest(tc)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                    >
                      Test
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Raw Response Viewer if any test run */}
      {Object.keys(results).length > 0 && (
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Latest Security Test Payloads (Cryptographic Inspection)</span>
            <span className="text-[10px] text-slate-500">JSON Responses</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
            {Object.entries(results).map(([tcId, res]) => (
              <div key={tcId} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]">
                <div className="flex items-center justify-between font-mono mb-1">
                  <span className="text-procure-400 font-bold">{tcId}</span>
                  <span className={res.passed ? 'text-emerald-400' : 'text-red-400'}>
                    HTTP {res.status} ({res.passed ? 'SECURE' : 'INSECURE'})
                  </span>
                </div>
                <pre className="text-slate-400 text-[10px] overflow-x-auto max-h-24">
                  {JSON.stringify(res.response, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
