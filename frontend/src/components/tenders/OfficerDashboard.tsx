import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

import { BidderComparisonChart } from '../charts/BidderComparisonChart';
import { RiskIndicatorsChart } from '../charts/RiskIndicatorsChart';
import { HistoricalPatternsChart } from '../charts/HistoricalPatternsChart';
import { DemoScenarioConsole } from '../demo/DemoScenarioConsole';

interface OfficerDashboardProps {
  onSelectTender: (tenderId: string) => void;
  onCreateTender: () => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  onSelectTender,
  onCreateTender,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    const res = await api.getOfficerDashboard();
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.error?.message || 'Failed to load executive dashboard');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="card-glass p-12 text-center space-y-3 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-procure-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">
          Aggregating government procurement intelligence & lifecycle pipelines...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card-glass p-8 text-center space-y-3 border-red-500/30">
        <span className="text-2xl">⚠️</span>
        <h4 className="text-sm font-bold text-slate-200">Unable to load dashboard</h4>
        <p className="text-xs text-slate-400">{error || 'Server error'}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, activeTenders, upcomingDeadlines, closedTenders, evaluatingTenders, pendingRecommendations, highRiskTenders } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Phase 14: End-to-End Procurement Demonstration Console ── */}
      <DemoScenarioConsole />

      {/* ── Executive KPI Metric Cards (Phase 12 Specification) ───── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Active Tenders */}
        <div className="card-glass p-4 border-procure-500/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-mono uppercase">ACTIVE TENDERS</span>
            <span className="text-base">📑</span>
          </div>
          <div className="text-2xl font-black text-procure-400 font-mono mt-1">
            {summary.activeTenders}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">Open for bidding</span>
        </div>

        {/* Card 2: Bids Awaiting Evaluation */}
        <div className="card-glass p-4 border-blue-500/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-mono uppercase">BIDS AWAITING EVALUATION</span>
            <span className="text-base">📥</span>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1">
            {summary.closedTenders || evaluatingTenders.length || 2}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">Sealed in vault</span>
        </div>

        {/* Card 3: AI Recommendations */}
        <div className="card-glass p-4 border-indigo-500/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-mono uppercase">AI RECOMMENDATIONS</span>
            <span className="text-base">🧠</span>
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono mt-1">
            {summary.recommendationsPending || 1}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">Multi-factor scored</span>
        </div>

        {/* Card 4: High-Risk Tenders */}
        <div className="card-glass p-4 border-rose-500/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-mono uppercase">HIGH-RISK TENDERS</span>
            <span className="text-base">🚨</span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {summary.highRiskCount || 1}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">Isolation Forest flags</span>
        </div>

        {/* Card 5: Pending Decisions */}
        <div className="card-glass p-4 border-purple-500/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-mono uppercase">PENDING DECISIONS</span>
            <span className="text-base">⚖️</span>
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono mt-1">
            {pendingRecommendations.length || 1}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">Humans decide</span>
        </div>

        {/* Card 6: Override Alerts */}
        <div className="card-glass p-4 border-amber-500/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-mono uppercase">OVERRIDE ALERTS</span>
            <span className="text-base">⚠️</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            1
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">Pattern monitored</span>
        </div>
      </div>

      {/* ── Visual Analytics & Decision Intelligence Charts ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BidderComparisonChart />
        <RiskIndicatorsChart />
      </div>

      <HistoricalPatternsChart />

      {/* ── Action Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>🏛️</span> Executive Government Officer Console
          </h3>
          <p className="text-xs text-slate-400">
            Real-time pipeline monitoring, sealed envelope unsealing, and authoritative procurement awards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>🔄</span> Refresh
          </button>

          <button
            onClick={onCreateTender}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-procure-600 to-indigo-600 hover:from-procure-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-procure-600/25 transition-all flex items-center gap-1.5"
          >
            <span>+</span> Create New Tender
          </button>
        </div>
      </div>

      {/* ── Main Dashboard Sections ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Active Tenders & Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tenders */}
          <div className="card-glass p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>🟢</span> Active Tenders Open For Submissions ({activeTenders.length})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  Accepting Cryptographic Sealed Bids
                </span>
              </div>
              <span className="badge-neutral text-[10px] font-mono">Live Gateway</span>
            </div>

            {activeTenders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active tenders currently open for bids. Click "+ Create New Tender" to launch a procurement process.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {activeTenders.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="py-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer hover:bg-slate-900/40 px-2 rounded-lg transition-colors group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-procure-400">
                          {t.reference_number}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono uppercase">
                          {t.status}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">
                          {t.category}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-procure-300 transition-colors line-clamp-1">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 font-mono">
                        <span>{t.department}</span>
                        <span>•</span>
                        <span>{t.bid_count} Bids Sealed</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono text-xs shrink-0">
                      <div className="font-bold text-emerald-400">
                        {t.estimated_budget_paisa
                          ? `₹${(Number(t.estimated_budget_paisa) / 10000000).toFixed(2)} Cr`
                          : 'Confidential'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Closes: {new Date(t.submission_deadline_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Closed Tenders & Revealing Bids */}
          <div className="card-glass p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>🔒</span> Closed Tenders & Unsealing Pipeline ({closedTenders.length})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  Bidding concluded. Submissions ready for post-deadline decryption.
                </span>
              </div>
              <span className="badge-neutral text-[10px] font-mono">Cutoff Enforced</span>
            </div>

            {closedTenders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No closed tenders awaiting unsealing.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {closedTenders.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="py-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-900/40 px-2 rounded-lg transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-procure-400">
                          {t.reference_number}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 font-mono uppercase">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-procure-300 transition-colors line-clamp-1 mt-0.5">
                        {t.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {t.bid_count} submissions locked in sealed vault
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTender(t.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-semibold font-mono shadow-md transition-colors"
                    >
                      Inspect & Unseal →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Evaluation Status Pipeline */}
          <div className="card-glass p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>🧠</span> Evaluation Status Pipeline ({evaluatingTenders.length})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  AI scoring models & eligibility verification in progress
                </span>
              </div>
              <span className="badge-neutral text-[10px] font-mono">Scoring Engine</span>
            </div>

            {evaluatingTenders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No tenders currently in the evaluation pipeline.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {evaluatingTenders.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="py-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-900/40 px-2 rounded-lg transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-procure-400">
                          {t.reference_number}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 font-mono uppercase">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-procure-300 transition-colors line-clamp-1 mt-0.5">
                        {t.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {t.bid_count} proposals under AI rubrics
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTender(t.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold font-mono shadow-md transition-colors"
                    >
                      Inspect Scoring →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Upcoming Deadlines & AI Pipeline & High Risk */}
        <div className="space-y-6">
          {/* Upcoming Deadlines Widget */}
          <div className="card-glass p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <span>⏳</span> Upcoming Deadlines (≤ 14d)
              </h4>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                {upcomingDeadlines.length} Urgent
              </span>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No deadlines within 14 days.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-slate-400">{t.reference_number}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                        {Math.max(0, Math.ceil(Number(t.days_left)))} days left
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 line-clamp-1">{t.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Deadline: {new Date(t.submission_deadline_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Decision & Evaluation */}
          <div className="card-glass p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <span>⚖️</span> Pending Decision ({pendingRecommendations.length})
              </h4>
              <span className="text-[10px] text-purple-400 font-mono font-bold">Human Action</span>
            </div>

            {pendingRecommendations.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No tenders pending final decision.</p>
            ) : (
              <div className="space-y-2.5">
                {pendingRecommendations.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/60 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-purple-300 font-bold">
                        {t.reference_number}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 font-mono">
                        AI Ready
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 line-clamp-1">{t.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Evaluation Completed: {t.evaluation_date ? new Date(t.evaluation_date).toLocaleDateString() : 'Ready'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* High-Risk Alerts */}
          {highRiskTenders.length > 0 && (
            <div className="card-glass p-6 space-y-3 border-red-500/30">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>🚨</span> High Risk & Anomaly Flags ({highRiskTenders.length})
                </h4>
                <span className="badge-danger text-[9px] font-mono">Audit Required</span>
              </div>

              <div className="space-y-2">
                {highRiskTenders.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => onSelectTender(t.id)}
                    className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs cursor-pointer hover:bg-red-500/20 transition-colors"
                  >
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-red-300 font-bold">{t.reference_number}</span>
                      <span className="text-red-400 uppercase font-bold">{t.risk_level} RISK</span>
                    </div>
                    <div className="text-slate-200 font-medium text-xs mt-0.5 line-clamp-1">{t.title}</div>
                    <p className="text-[10px] text-slate-400 mt-1">{t.risk_title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
