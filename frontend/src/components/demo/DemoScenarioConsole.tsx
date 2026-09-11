import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export const DemoScenarioConsole: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    const res = await api.getDemoStatus();
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleReset = async () => {
    setIsLoading(true);
    const res = await api.resetDemoScenario();
    if (res.success && res.data) {
      setData(res.data);
      setNoticeMessage('Demonstration reset: Government School Infrastructure Project (₹10 Cr) initialized.');
    }
    setIsLoading(false);
  };

  const handleRunScenario1 = async () => {
    setIsLoading(true);
    const res = await api.runDemoScenario1();
    if (res.success && res.data) {
      setData(res.data);
      setNoticeMessage('Scenario 1 complete: Government approved AI recommendation for Company A. Decision locked & audit chained.');
    }
    setIsLoading(false);
  };

  const handleRunScenario2 = async () => {
    setIsLoading(true);
    const res = await api.runDemoScenario2();
    if (res.success && res.data) {
      setData(res.data);
      setNoticeMessage('Scenario 2 complete: Government overridden to Company C. Recorded as potential governance-risk event.');
    }
    setIsLoading(false);
  };

  if (!data) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs animate-pulse text-center text-xs text-gray-400 font-medium">
        Loading synthetic demonstration state...
      </div>
    );
  }

  const { tender, companies, workflowSteps, currentScenario, scenario2Override, auditVerification } = data;

  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-6">
      {/* ── Header & Judging Ribbon ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 tracking-wider uppercase inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              SIH Judging Interactive Demo
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Phase 14 End-to-End Workflow</span>
          </div>
          <h3 className="text-base font-bold text-gray-900 mt-1.5 flex items-center gap-2">
            {tender.title}
            <span className="text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100">
              {tender.referenceNumber}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Estimated Budget: <strong className="text-emerald-600 font-semibold">{tender.estimatedValueFormatted}</strong> · Department of School Education & Literacy
          </p>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunScenario1}
            disabled={isLoading}
            className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Run 17-Step Demo (Scenario 1: AI Award)</span>
          </button>

          <button
            onClick={handleRunScenario2}
            disabled={isLoading}
            className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18" />
              <path d="m3 7 9-4 9 4" />
              <path d="M6 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
              <path d="M18 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
              <path d="M4 21h16" />
            </svg>
            <span>Run Scenario 2: Override to Company C</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            title="Reset demonstration data"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-6.19" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="font-medium">{noticeMessage}</span>
          </div>
          <button onClick={() => setNoticeMessage(null)} className="text-blue-500 hover:text-blue-800 text-sm font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* ── Value-For-Money Principle Card (The Key Judging Proof) ───────── */}
      <div className="p-5 rounded-xl bg-[#FBFBFD] border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
                Value-For-Money Evaluation Scorecard
              </h4>
              <span className="text-xs text-gray-500">
                Notice: Company B has the lowest bid, but Company A wins with highest overall evaluation score.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white text-gray-600 border border-gray-200 shadow-xs">
            Weighted: 40/20/15/10/10/5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {companies.map((c: any) => {
            const isRec = c.isAiRecommended;
            const isLowest = c.isLowestBidder;

            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isRec
                    ? 'bg-white border-2 border-emerald-500 shadow-sm'
                    : isLowest
                    ? 'bg-white border border-blue-300 shadow-xs'
                    : 'bg-white border border-gray-200 shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">RANK #{c.rank}</span>
                    <h5 className="font-bold text-gray-900 text-xs mt-0.5">{c.name}</h5>
                  </div>
                  {isRec && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      TOP AI REC
                    </span>
                  )}
                  {isLowest && !isRec && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      LOWEST BID (L1)
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-baseline border-b border-gray-100 pb-2.5">
                  <span className="text-xs text-gray-500">Commercial Quote:</span>
                  <span className="text-sm font-bold text-gray-900">{c.bidAmountFormatted}</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Technical Capability:</span>
                    <strong className="text-purple-600 font-semibold">{c.technicalCapabilityScore}/20</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Experience:</span>
                    <strong className="text-gray-700 font-semibold">{c.experienceScore}/15</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Past Performance:</span>
                    <strong className="text-gray-700 font-semibold">{c.pastPerformanceScore}/10</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price Score:</span>
                    <strong className="text-blue-600 font-semibold">{c.priceScore.toFixed(1)}/40</strong>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-gray-500">FINAL SCORE:</span>
                  <span className={`text-base font-bold ${isRec ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {c.compositeScore.toFixed(1)} <span className="text-xs font-normal text-gray-400">/ 100</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SCENARIO 2 OVERRIDE & GOVERNANCE RISK BANNER ──────────────────── */}
      {currentScenario === 'SCENARIO_2_HUMAN_OVERRIDE' && scenario2Override && (
        <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-amber-900 uppercase tracking-wider text-xs">
                Potential Governance-Risk Event (Decision Override Logged)
              </h4>
              <span className="text-xs text-amber-700">
                The government officer overrode the AI recommendation to select Company C. Mandatory statutory justification recorded.
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-amber-200/70 space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-gray-100 pb-2.5">
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">AI RECOMMENDATION</span>
                <span className="font-bold text-emerald-600">{scenario2Override.aiRecommendation}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">FINAL HUMAN SELECTION</span>
                <span className="font-bold text-amber-600">{scenario2Override.finalSelection} (Override: YES)</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">MANDATORY OVERRIDE REASON</span>
              <p className="text-gray-700 text-xs italic mt-1 leading-relaxed">
                "{scenario2Override.reason}"
              </p>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">SUPPORTING NOTE / DOCUMENT REFERENCE</span>
              <span className="text-gray-600 text-xs">{scenario2Override.supportingNote}</span>
            </div>

            <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-1 text-[10px]">
              <span className="text-gray-400 font-semibold uppercase tracking-wider">SHA-256 INTEGRITY HASH:</span>
              <span className="text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 truncate max-w-full sm:max-w-[340px] font-medium">
                {scenario2Override.integrityHash}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-100/60 border border-amber-200 text-xs text-amber-800">
            <strong>Anti-Bias Policy:</strong> This event is archived in the cryptographic ledger as a potential governance-risk pattern for supervisory review. The system strictly avoids making unsupported accusations of corruption.
          </div>
        </div>
      )}

      {/* ── 17-STEP WORKFLOW STEPPER ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
            17-Step Lifecycle Workflow Tracker
          </h4>
          <span className="text-xs text-emerald-600 font-semibold">
            {auditVerification.statusText}
          </span>
        </div>

        <div className="space-y-2">
          {workflowSteps.map((s: any) => {
            const isCompleted = s.status === 'COMPLETED';
            const isExpanded = expandedStep === s.step;

            return (
              <div
                key={s.step}
                className={`rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-white border-gray-200 hover:border-gray-300'
                    : 'bg-gray-50/60 border-gray-100 opacity-60'
                }`}
              >
                <div
                  onClick={() => setExpandedStep(isExpanded ? null : s.step)}
                  className="p-3 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isCompleted ? '✓' : s.step}
                    </span>
                    <span className="font-semibold text-gray-900 text-xs">
                      Step {s.step}: {s.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-gray-400 text-xs">
                      <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2.5 text-xs text-gray-600">
                    <p className="leading-relaxed">{s.description}</p>
                    {s.evidence && Object.keys(s.evidence).length > 0 && (
                      <pre className="p-3 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[11px] text-gray-800 overflow-x-auto">
                        {JSON.stringify(s.evidence, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
