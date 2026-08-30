import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

interface EligibilityReportModalProps {
  tenderId: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const EligibilityReportModal: React.FC<EligibilityReportModalProps> = ({
  tenderId,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningScreening, setIsRunningScreening] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadReport = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const res = await api.getTenderEligibilitySummary(tenderId);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setStatusMessage({ type: 'error', text: res.error?.message || 'Failed to load eligibility report.' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && tenderId) {
      loadReport();
    }
  }, [isOpen, tenderId]);

  const handleRunScreening = async () => {
    setIsRunningScreening(true);
    setStatusMessage(null);
    const res = await api.evaluateTenderEligibility(tenderId);
    setIsRunningScreening(false);

    if (res.success && res.data) {
      setStatusMessage({
        type: 'success',
        text: `Eligibility gate completed: ${res.data.eligibleBids} eligible, ${res.data.disqualifiedBids} disqualified.`,
      });
      loadReport();
      onRefresh();
    } else {
      setStatusMessage({ type: 'error', text: res.error?.message || 'Screening failed.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="card-glass max-w-4xl w-full max-h-[90vh] flex flex-col p-6 sm:p-8 space-y-6 animate-scale-up border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h3 className="text-lg font-bold text-slate-100 font-mono">
                Bidder Eligibility Screening Console
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic qualification gate executed BEFORE AI ranking. Disqualified bids are excluded from scoring models.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          >
            ✕
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}
          >
            <span>{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Screening Metrics & Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
            <span className="text-[10px] text-slate-400 block">TOTAL BIDS SUBMITTED</span>
            <span className="text-xl font-bold text-slate-200 mt-0.5 block">{data?.totalBids ?? 0}</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono">
            <span className="text-[10px] text-emerald-400 block">QUALIFIED (ELIGIBLE)</span>
            <span className="text-xl font-bold text-emerald-300 mt-0.5 block">{data?.eligibleBids ?? 0}</span>
          </div>

          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 font-mono">
            <span className="text-[10px] text-red-400 block">DISQUALIFIED</span>
            <span className="text-xl font-bold text-red-300 mt-0.5 block">{data?.disqualifiedBids ?? 0}</span>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleRunScreening}
              disabled={isRunningScreening}
              className="w-full h-full py-3 px-4 rounded-xl bg-gradient-to-r from-procure-600 to-indigo-600 hover:from-procure-500 hover:to-indigo-500 text-white font-semibold text-xs font-mono shadow-lg shadow-procure-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isRunningScreening ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Screening...</span>
                </>
              ) : (
                <span>⚡ Run Eligibility Gate</span>
              )}
            </button>
          </div>
        </div>

        {/* Bidders Qualification Breakdown */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse font-mono">
              Loading qualification records...
            </div>
          ) : data?.bids?.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No bids have been submitted for this tender yet.
            </div>
          ) : (
            <div className="space-y-4">
              {data?.bids?.map((bid: any) => {
                const isDisqualified = bid.bid_status === 'disqualified';
                const checks = bid.checks || [];

                return (
                  <div
                    key={bid.bid_id}
                    className={`p-4 rounded-xl border space-y-3 ${
                      isDisqualified
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-bold text-procure-300">{bid.bid_reference}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isDisqualified ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {isDisqualified ? 'DISQUALIFIED' : 'ELIGIBLE'}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-100 mt-0.5">{bid.company_name}</h4>
                      </div>

                      <div className="text-right text-[10px] font-mono text-slate-400">
                        <span>Turnover: {bid.annual_turnover_paisa ? `₹${(Number(bid.annual_turnover_paisa) / 1000000000).toFixed(2)} Cr` : '—'}</span>
                        <span className="mx-2">•</span>
                        <span>Experience: {bid.years_in_operation || 0} yrs</span>
                      </div>
                    </div>

                    {bid.disqualification_reason && (
                      <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-[11px] text-red-300 font-mono">
                        {bid.disqualification_reason}
                      </div>
                    )}

                    {/* Criteria checks checklist */}
                    {checks.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        {checks.map((chk: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between text-[11px] font-mono py-1 px-2 rounded bg-slate-950/40"
                          >
                            <div className="flex items-center gap-2">
                              <span className={chk.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}>
                                {chk.status === 'pass' ? '✓' : '❌'}
                              </span>
                              <span className="text-slate-300 font-semibold">{chk.requirement_title}</span>
                              <span className="text-[9px] text-slate-500 uppercase">{chk.requirement_type}</span>
                            </div>
                            <span className="text-slate-400 truncate max-w-sm">{chk.evidence_summary}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs">
          <span className="text-slate-500 font-mono text-[10px]">
            Statutory Rule: Only qualified (ELIGIBLE) bids advance to AI multi-criteria evaluation.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold font-mono"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
