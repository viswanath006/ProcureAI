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
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 animate-pulse text-center text-xs text-slate-400 font-mono">
        Loading synthetic demonstration state...
      </div>
    );
  }

  const { tender, companies, workflowSteps, currentScenario, scenario2Override, auditVerification } = data;

  return (
    <div className="p-6 rounded-3xl bg-slate-950/90 border border-procure-500/30 shadow-2xl space-y-6 font-mono text-xs">
      {/* ── Header & Judging Ribbon ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 tracking-wider uppercase">
              SIH Judging Interactive Demo
            </span>
            <span className="text-[10px] text-slate-400">Phase 14 End-to-End Workflow</span>
          </div>
          <h3 className="text-base font-black text-white font-sans mt-1">
            {tender.title} <span className="text-procure-400 font-mono text-xs font-normal">({tender.referenceNumber})</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Estimated Budget: <strong className="text-emerald-400 font-mono">{tender.estimatedValueFormatted}</strong> · Department of School Education & Literacy
          </p>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunScenario1}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>⚡</span> Run 17-Step Demo (Scenario 1: AI Award)
          </button>

          <button
            onClick={handleRunScenario2}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-[11px] shadow-lg shadow-amber-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>⚖️</span> Run Scenario 2: Override to Company C
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors disabled:opacity-50"
            title="Reset demonstration data"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3 rounded-xl bg-procure-500/10 border border-procure-500/30 text-procure-300 text-[11px] flex justify-between items-center">
          <span>{noticeMessage}</span>
          <button onClick={() => setNoticeMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ── Value-For-Money Principle Card (The Key Judging Proof) ───────── */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base">🏆</span>
            <div>
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                Value-For-Money Evaluation Scorecard
              </h4>
              <span className="text-[10px] text-slate-400 font-sans">
                Notice: Company B has the lowest bid, but Company A wins with highest overall evaluation score.
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-procure-500/20 text-procure-300 border border-procure-500/30">
            Weighted: 40/20/15/10/10/5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {companies.map((c: any) => {
            const isRec = c.isAiRecommended;
            const isLowest = c.isLowestBidder;

            return (
              <div
                key={c.id}
                className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                  isRec
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                    : isLowest
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400">RANK #{c.rank}</span>
                    <h5 className="font-bold text-slate-100 font-sans text-xs">{c.name}</h5>
                  </div>
                  {isRec && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                      TOP AI REC
                    </span>
                  )}
                  {isLowest && !isRec && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      LOWEST BID (L1)
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-baseline border-b border-slate-800/80 pb-2">
                  <span className="text-[10px] text-slate-400">Commercial Quote:</span>
                  <span className="text-sm font-black text-white">{c.bidAmountFormatted}</span>
                </div>

                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Technical Capability:</span>
                    <strong className="text-purple-300">{c.technicalCapabilityScore}/20</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Experience:</span>
                    <strong className="text-slate-200">{c.experienceScore}/15</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Past Performance:</span>
                    <strong className="text-slate-200">{c.pastPerformanceScore}/10</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price Score:</span>
                    <strong className="text-blue-300">{c.priceScore.toFixed(1)}/40</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400">FINAL SCORE:</span>
                  <span className={`text-base font-black ${isRec ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {c.compositeScore.toFixed(1)} / 100
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SCENARIO 2 OVERRIDE & GOVERNANCE RISK BANNER ──────────────────── */}
      {currentScenario === 'SCENARIO_2_HUMAN_OVERRIDE' && scenario2Override && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="font-bold text-amber-300 uppercase tracking-wider text-xs">
                Potential Governance-Risk Event (Decision Override Logged)
              </h4>
              <span className="text-[10px] text-slate-400 font-sans">
                The government officer overrode the AI recommendation to select Company C. Mandatory statutory justification recorded.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1.5 text-[11px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-slate-800 pb-2">
              <div>
                <span className="text-[10px] text-slate-500 block">AI RECOMMENDATION</span>
                <span className="font-bold text-emerald-400">{scenario2Override.aiRecommendation}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">FINAL HUMAN SELECTION</span>
                <span className="font-bold text-amber-400">{scenario2Override.finalSelection} (Override: YES)</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">MANDATORY OVERRIDE REASON</span>
              <p className="text-slate-300 font-sans text-xs italic mt-0.5 leading-relaxed">
                "{scenario2Override.reason}"
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">SUPPORTING NOTE / DOCUMENT REFERENCE</span>
              <span className="text-slate-400 font-sans text-[11px]">{scenario2Override.supportingNote}</span>
            </div>

            <div className="pt-1 flex justify-between items-center text-[10px]">
              <span className="text-slate-500">SHA-256 INTEGRITY HASH:</span>
              <span className="text-procure-300 font-mono truncate max-w-[280px]">{scenario2Override.integrityHash}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200">
            <strong>Anti-Bias Policy:</strong> This event is archived in the cryptographic ledger as a potential governance-risk pattern for supervisory review. The system strictly avoids making unsupported accusations of corruption.
          </div>
        </div>
      )}

      {/* ── 17-STEP WORKFLOW STEPPER ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
            17-Step Lifecycle Workflow Tracker
          </h4>
          <span className="text-[10px] text-emerald-400 font-bold">
            {auditVerification.statusText}
          </span>
        </div>

        <div className="space-y-1.5">
          {workflowSteps.map((s: any) => {
            const isCompleted = s.status === 'COMPLETED';
            const isExpanded = expandedStep === s.step;

            return (
              <div
                key={s.step}
                className={`rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div
                  onClick={() => setExpandedStep(isExpanded ? null : s.step)}
                  className="p-2.5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? '✓' : s.step}
                    </span>
                    <span className="font-bold text-slate-200 text-xs">
                      Step {s.step}: {s.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-800/50 space-y-2 text-[11px] text-slate-400 font-sans">
                    <p>{s.description}</p>
                    {s.evidence && Object.keys(s.evidence).length > 0 && (
                      <pre className="p-2.5 rounded-lg bg-slate-950 border border-white/5 text-[10px] text-procure-300 font-mono overflow-x-auto">
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
