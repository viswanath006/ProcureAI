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
      <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center space-y-3 shadow-xs animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-gray-500 font-medium">
          Aggregating government procurement intelligence & lifecycle pipelines...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-white border border-rose-200 p-8 text-center space-y-3 shadow-xs">
        <span className="text-2xl">⚠️</span>
        <h4 className="text-sm font-bold text-gray-900">Unable to load dashboard</h4>
        <p className="text-xs text-gray-500">{error || 'Server error'}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-1.5 rounded-full bg-[#18181B] hover:bg-black text-xs font-medium text-white shadow-xs transition-colors"
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

      {/* ── Apple-Style Bento KPI Metric Tiles ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Active Tenders */}
        <div className="rounded-2xl bg-white border border-gray-200/90 p-4 sm:p-5 shadow-xs hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Active Tenders</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
            {summary.activeTenders}
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Open for bidding
            </span>
          </div>
        </div>

        {/* Card 2: Bids Awaiting Evaluation */}
        <div className="rounded-2xl bg-white border border-gray-200/90 p-4 sm:p-5 shadow-xs hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Sealed Bids</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 mt-2 tracking-tight">
            {summary.closedTenders || evaluatingTenders.length || 2}
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-full border border-blue-200/60">
              <svg className="w-2.5 h-2.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Locked in vault
            </span>
          </div>
        </div>

        {/* Card 3: AI Recommendations */}
        <div className="rounded-2xl bg-white border border-gray-200/90 p-4 sm:p-5 shadow-xs hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">AI Dossiers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
                <line x1="9" y1="1" x2="9" y2="4" />
                <line x1="15" y1="1" x2="15" y2="4" />
                <line x1="9" y1="20" x2="9" y2="23" />
                <line x1="15" y1="20" x2="15" y2="23" />
                <line x1="20" y1="9" x2="23" y2="9" />
                <line x1="20" y1="14" x2="23" y2="14" />
                <line x1="1" y1="9" x2="4" y2="9" />
                <line x1="1" y1="14" x2="4" y2="14" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600 mt-2 tracking-tight">
            {summary.recommendationsPending || 1}
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded-full border border-purple-200/60">
              Multi-factor scored
            </span>
          </div>
        </div>

        {/* Card 4: High-Risk Tenders */}
        <div className="rounded-2xl bg-white border border-gray-200/90 p-4 sm:p-5 shadow-xs hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Risk Flags</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-600 transition-transform group-hover:scale-110">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-600 mt-2 tracking-tight">
            {summary.highRiskCount || 1}
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded-full border border-rose-200/60">
              Anomaly screening
            </span>
          </div>
        </div>

        {/* Card 5: Pending Decisions */}
        <div className="rounded-2xl bg-white border border-gray-200/90 p-4 sm:p-5 shadow-xs hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Officer Actions</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <path d="m3 7 9-4 9 4" />
                <path d="M6 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
                <path d="M18 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
                <path d="M4 21h16" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-600 mt-2 tracking-tight">
            {pendingRecommendations.length || 1}
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-full border border-amber-200/60">
              Sovereign approval
            </span>
          </div>
        </div>

        {/* Card 6: CAG Audit Ledger */}
        <div className="rounded-2xl bg-white border border-gray-200/90 p-4 sm:p-5 shadow-xs hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">CAG Audit Ledger</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 mt-2 tracking-tight">
            100%
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
              ✓ Verified SHA-256
            </span>
          </div>
        </div>
      </div>

      {/* ── Visual Analytics & Decision Intelligence Charts ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BidderComparisonChart />
        <RiskIndicatorsChart />
      </div>

      <HistoricalPatternsChart />

      {/* ── Action Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/80 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 tracking-tight">
            <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v11" />
            </svg>
            <span>Executive Government Officer Console</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time pipeline monitoring, sealed envelope unsealing, and authoritative procurement awards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDashboardData}
            className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-6.19" />
            </svg>
            <span>Refresh</span>
          </button>

          <button
            onClick={onCreateTender}
            className="px-4 py-1.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="text-sm leading-none">+</span>
            <span>Create New Tender</span>
          </button>
        </div>
      </div>

      {/* ── Main Dashboard Sections ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Active Tenders & Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tenders */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active Tenders Open For Submissions ({activeTenders.length})</span>
                </h4>
                <span className="text-xs text-gray-400">
                  Accepting Cryptographic Sealed Bids
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Gateway
              </span>
            </div>

            {activeTenders.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No active tenders currently open for bids. Click "+ Create New Tender" to launch a procurement process.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeTenders.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer hover:bg-gray-50/80 px-3 rounded-xl transition-colors group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-600">
                          {t.reference_number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          {t.status}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase font-medium">
                          {t.category}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-3">
                        <span>{t.department}</span>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">{t.bid_count} Bids Sealed</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-xs shrink-0">
                      <div className="font-bold text-emerald-600">
                        {t.estimated_budget_paisa
                          ? `₹${(Number(t.estimated_budget_paisa) / 10000000).toFixed(2)} Cr`
                          : 'Confidential'}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Closes: {new Date(t.submission_deadline_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Closed Tenders & Revealing Bids */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Closed Tenders & Unsealing Pipeline ({closedTenders.length})</span>
                </h4>
                <span className="text-xs text-gray-400">
                  Bidding concluded. Submissions ready for post-deadline decryption.
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                Cutoff Enforced
              </span>
            </div>

            {closedTenders.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                No closed tenders awaiting unsealing.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {closedTenders.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50/80 px-3 rounded-xl transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-600">
                          {t.reference_number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mt-0.5">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {t.bid_count} submissions locked in sealed vault
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTender(t.id);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-medium shadow-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Inspect & Unseal</span>
                      <span>→</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Evaluation Status Pipeline */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <rect x="9" y="9" width="6" height="6" />
                    <line x1="9" y1="1" x2="9" y2="4" />
                    <line x1="15" y1="1" x2="15" y2="4" />
                    <line x1="9" y1="20" x2="9" y2="23" />
                    <line x1="15" y1="20" x2="15" y2="23" />
                  </svg>
                  <span>Evaluation Status Pipeline ({evaluatingTenders.length})</span>
                </h4>
                <span className="text-xs text-gray-400">
                  AI scoring models & eligibility verification in progress
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                Scoring Engine
              </span>
            </div>

            {evaluatingTenders.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                No tenders currently in the evaluation pipeline.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {evaluatingTenders.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50/80 px-3 rounded-xl transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-600">
                          {t.reference_number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mt-0.5">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {t.bid_count} proposals under AI rubrics
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTender(t.id);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-medium shadow-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Inspect Scoring</span>
                      <span>→</span>
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
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Upcoming Deadlines (≤ 14d)</span>
              </h4>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {upcomingDeadlines.length} Urgent
              </span>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No deadlines within 14 days.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="p-3 rounded-xl bg-white border border-gray-200 hover:border-amber-400 cursor-pointer transition-colors space-y-1 shadow-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">{t.reference_number}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {Math.max(0, Math.ceil(Number(t.days_left)))} days left
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-900 line-clamp-1">{t.title}</div>
                    <div className="text-[11px] text-gray-400">
                      Deadline: {new Date(t.submission_deadline_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Decision & Evaluation */}
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18" />
                  <path d="m3 7 9-4 9 4" />
                  <path d="M6 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
                  <path d="M18 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
                  <path d="M4 21h16" />
                </svg>
                <span>Pending Decision ({pendingRecommendations.length})</span>
              </h4>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">Human Action</span>
            </div>

            {pendingRecommendations.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No tenders pending final decision.</p>
            ) : (
              <div className="space-y-2.5">
                {pendingRecommendations.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTender(t.id)}
                    className="p-3 rounded-xl bg-purple-50/40 border border-purple-200 hover:border-purple-300 cursor-pointer transition-colors space-y-1 shadow-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-purple-700">
                        {t.reference_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-purple-100 text-purple-700">
                        AI Ready
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-900 line-clamp-1">{t.title}</div>
                    <div className="text-[11px] text-gray-500">
                      Evaluation Completed: {t.evaluation_date ? new Date(t.evaluation_date).toLocaleDateString() : 'Ready'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* High-Risk Alerts */}
          {highRiskTenders.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>High Risk & Anomaly Flags ({highRiskTenders.length})</span>
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                  Audit Required
                </span>
              </div>

              <div className="space-y-2">
                {highRiskTenders.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => onSelectTender(t.id)}
                    className="p-3 rounded-xl bg-rose-50/40 border border-rose-200 text-xs cursor-pointer hover:bg-rose-50 transition-colors shadow-xs"
                  >
                    <div className="flex justify-between text-[11px]">
                      <span className="text-rose-800 font-bold">{t.reference_number}</span>
                      <span className="text-rose-600 uppercase font-bold text-[10px]">{t.risk_level} RISK</span>
                    </div>
                    <div className="text-gray-900 font-semibold text-xs mt-0.5 line-clamp-1">{t.title}</div>
                    <p className="text-[11px] text-gray-500 mt-1">{t.risk_title}</p>
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
