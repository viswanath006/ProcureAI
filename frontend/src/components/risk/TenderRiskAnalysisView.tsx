import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

interface TenderRiskAnalysisViewProps {
  tenderId: string;
}

export const TenderRiskAnalysisView: React.FC<TenderRiskAnalysisViewProps> = ({ tenderId }) => {
  const [riskData, setRiskData] = useState<any | null>(null);
  const [overrideData, setOverrideData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [riskRes, overrideRes] = await Promise.all([
        api.getTenderRiskAnalysis(tenderId),
        api.getTenderOverrideAnalysis(tenderId),
      ]);

      if (riskRes.success && riskRes.data) {
        setRiskData(riskRes.data);
      }
      if (overrideRes.success && overrideRes.data) {
        setOverrideData(overrideRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load risk analysis data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenderId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3 font-mono">
        <div className="w-8 h-8 border-2 border-procure-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Executing Isolation Forest anomaly & collusion analysis...</p>
      </div>
    );
  }

  const anomalies: any[] = riskData?.bid_anomalies || [];
  const collusionIndicators: any[] = riskData?.collusion_indicators || [];
  const highRiskCount = anomalies.filter((a) => a.risk_tier === 'HIGH RISK').length;
  const mediumRiskCount = anomalies.filter((a) => a.risk_tier === 'MEDIUM RISK').length;

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'HIGH RISK':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'MEDIUM RISK':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW RISK':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* ── Header Governance Disclaimer Banner ────────────────────────────── */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
        <span className="text-lg">🛡️</span>
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              ProcureAI Anti-Bias & Anomaly Analysis Module (Phase 9)
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] bg-procure-500/20 text-procure-300 border border-procure-500/30">
              Isolation Forest v1.2
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Identifies statistical outliers, price proximity clustering, and decision-making patterns without making unsupported accusations. All flags represent mathematical indicators requiring standard committee verification.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
          {error}
        </div>
      )}

      {/* ── Key Metrics Overview Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Bids Evaluated</span>
          <span className="text-xl font-bold text-slate-200">{anomalies.length}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Risk Outliers (High/Med)</span>
          <span className={`text-xl font-bold ${highRiskCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {highRiskCount} <span className="text-xs font-medium text-slate-500">/ {mediumRiskCount}</span>
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Collusion Signals</span>
          <span className={`text-xl font-bold ${collusionIndicators.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {collusionIndicators.length}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Override Status</span>
          <span className={`text-xl font-bold ${overrideData?.is_override ? 'text-amber-400' : 'text-emerald-400'}`}>
            {overrideData ? overrideData.override_status : 'PENDING'}
          </span>
        </div>
      </div>

      {/* ── FEATURE 3: DECISION OVERRIDE ANALYSIS ───────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚖️</span>
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Feature 3 — Decision Override Analysis
            </h4>
          </div>
          {overrideData?.is_override ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              OVERRIDE: YES
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              OVERRIDE: NO (FOLLOWED AI)
            </span>
          )}
        </div>

        {/* Side-by-Side Comparison: AI Recommendation vs Government Decision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* AI Recommendation Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5 font-mono">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              AI Recommendation
            </span>
            <div className="text-sm font-bold text-white">
              {overrideData?.ai_recommendation?.company_name || 'Evaluation in progress'}
            </div>
            {overrideData?.ai_recommendation && (
              <span className="text-[11px] text-slate-400 block">
                Composite Score: <strong className="text-emerald-300">{overrideData.ai_recommendation.total_score.toFixed(1)}/100</strong>
              </span>
            )}
          </div>

          {/* Government Selection Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5 font-mono">
            <span className="text-[10px] font-bold text-procure-400 uppercase tracking-wider block">
              Government Final Selection
            </span>
            <div className="text-sm font-bold text-white">
              {overrideData?.government_selection?.company_name || 'Pending Final Award'}
            </div>
            {overrideData?.decided_by_name && (
              <span className="text-[11px] text-slate-400 block">
                Decided By: <strong className="text-slate-200">{overrideData.decided_by_name}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Mandatory Reason from Audit Log */}
        {overrideData?.is_override && overrideData.mandatory_reason && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-bold font-mono text-amber-300 uppercase tracking-wider">
              <span>📝</span> Mandatory Override Justification (Stored in Audit Log)
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed font-sans italic">
              "{overrideData.mandatory_reason}"
            </p>
            {overrideData.reason_type && (
              <span className="text-[10px] font-mono text-amber-400/80 block pt-0.5">
                Category: {overrideData.reason_type}
              </span>
            )}
          </div>
        )}

        {/* Repeated Pattern Alert (Never accuses officer) */}
        {overrideData?.pattern_analysis?.repeated_pattern_detected && (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2 animate-fadeIn font-mono">
            <div className="flex items-center gap-2">
              <span className="text-base">🔍</span>
              <span className="font-bold text-purple-300 text-xs uppercase tracking-wider">
                {overrideData.pattern_analysis.pattern_label || 'Potential decision-making pattern detected.'}
              </span>
            </div>
            <p className="text-xs text-purple-200/90 leading-relaxed font-sans">
              {overrideData.pattern_analysis.summary}
            </p>
            <div className="space-y-1 pt-1">
              {overrideData.pattern_analysis.explainable_risk_indicators?.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-purple-300/80 font-sans">
                  <span>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <span className="text-[9px] text-slate-500 block pt-1 border-t border-purple-500/20">
              GOVERNANCE NOTICE: Statistical pattern indicator generated for administrative audit. Does not claim or prove officer misconduct.
            </span>
          </div>
        )}
      </div>

      {/* ── FEATURE 2: POSSIBLE BID COLLUSION INDICATORS ────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">🤝</span>
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Feature 2 — Possible Bid Collusion Indicators
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {collusionIndicators.length} Pattern(s) Identified
          </span>
        </div>

        {collusionIndicators.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-white/5 space-y-1 font-mono">
            <span className="text-emerald-400 font-bold block">✓ No Collusive Groupings Detected</span>
            <p className="text-[11px] text-slate-400 font-sans">
              Bids show independent price dispersion and standard competitive separation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {collusionIndicators.map((ci: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {ci.label || 'Potential suspicious pattern detected'}
                    </span>
                    <span className="font-bold text-white font-mono text-xs">
                      {ci.pattern_name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Severity: <strong className="text-amber-300">{ci.severity}</strong>
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {ci.evidence_summary}
                </p>

                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                  <span className="text-slate-400">Involved Entities:</span>
                  {ci.involved_companies?.map((c: string, cIdx: number) => (
                    <span
                      key={cIdx}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FEATURE 1: BID ANOMALY DETECTION (ISOLATION FOREST) ─────────────── */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">🌲</span>
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Feature 1 — Bid Anomaly Detection (Isolation Forest)
            </h4>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="text-slate-500">Output Tiers:</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">NORMAL</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">LOW</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">MEDIUM</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">HIGH</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {anomalies.map((bid: any) => {
            const isExpanded = expandedBidId === bid.bid_id;
            return (
              <div
                key={bid.bid_id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-2.5 transition-all hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getTierBadge(
                          bid.risk_tier
                        )}`}
                      >
                        {bid.risk_tier}
                      </span>
                      <h5 className="font-bold text-white text-xs">{bid.company_name}</h5>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({bid.bid_reference})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Commercial Bid</span>
                      <span className="text-xs font-bold text-slate-200">
                        ₹{Number(bid.bid_amount_inr || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Budget Dev</span>
                      <span
                        className={`text-xs font-bold ${
                          bid.price_deviation_pct < -30
                            ? 'text-rose-400'
                            : bid.price_deviation_pct > 20
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {bid.price_deviation_pct >= 0 ? '+' : ''}
                        {Number(bid.price_deviation_pct).toFixed(1)}%
                      </span>
                    </div>
                    <button
                      onClick={() => setExpandedBidId(isExpanded ? null : bid.bid_id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                    >
                      {isExpanded ? 'Hide' : 'Factors'}
                    </button>
                  </div>
                </div>

                {/* Risk Indicator Alerts */}
                {bid.risk_indicators?.length > 0 && (
                  <div className="space-y-1 pt-1 font-mono">
                    {bid.risk_indicators.map((ri: string, rIdx: number) => (
                      <div
                        key={rIdx}
                        className="text-[11px] text-amber-300/90 flex items-start gap-1.5"
                      >
                        <span>⚠</span>
                        <span>{ri}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded Multi-Factor Breakdown */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-2 animate-fadeIn font-mono">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Isolation Forest Score: {bid.anomaly_score}</span>
                      <span>Outlier Status: {bid.is_outlier ? 'Flagged Outlier' : 'Standard'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      {bid.factors?.map((f: any, fIdx: number) => (
                        <div
                          key={fIdx}
                          className={`p-2 rounded-lg border ${
                            f.is_anomaly
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                              : 'bg-slate-900/50 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between font-bold">
                            <span>{f.name}</span>
                            <span>{f.is_anomaly ? '⚠️ Flagged' : '✓ Normal'}</span>
                          </div>
                          <p className="text-[9px] opacity-80 pt-0.5">{f.description}</p>
                        </div>
                      ))}
                    </div>
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
