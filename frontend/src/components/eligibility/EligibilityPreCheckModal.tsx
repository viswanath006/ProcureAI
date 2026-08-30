import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

interface EligibilityPreCheckModalProps {
  tenderId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EligibilityPreCheckModal: React.FC<EligibilityPreCheckModalProps> = ({
  tenderId: initialTenderId,
  isOpen,
  onClose,
}) => {
  const [tenders, setTenders] = useState<any[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string>(initialTenderId || '');
  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOpenTenders() {
      const res = await api.getTenders();
      if (res.success && res.data) {
        setTenders(res.data.tenders);
        if (!selectedTenderId && res.data.tenders.length > 0) {
          setSelectedTenderId(res.data.tenders[0].id);
        }
      }
    }
    if (isOpen) {
      loadOpenTenders();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialTenderId) {
      setSelectedTenderId(initialTenderId);
    }
  }, [initialTenderId]);

  const handleRunPrecheck = async () => {
    if (!selectedTenderId) return;
    setIsLoading(true);
    setError(null);
    setReport(null);

    const res = await api.precheckEligibility(selectedTenderId);
    if (res.success && res.data) {
      setReport(res.data.report);
    } else {
      setError(res.error?.message || 'Pre-check evaluation failed.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && selectedTenderId) {
      handleRunPrecheck();
    }
  }, [isOpen, selectedTenderId]);

  if (!isOpen) return null;

  const currentTender = tenders.find((t) => t.id === selectedTenderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="card-glass max-w-3xl w-full max-h-[90vh] flex flex-col p-6 sm:p-8 space-y-6 animate-scale-up border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔍</span>
              <h3 className="text-lg font-bold text-slate-100 font-mono">
                Bidder Qualification Self-Screening Gate
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify your company credentials against mandatory eligibility gates before cryptographic proposal submission.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Tender Selector */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-[10px] text-slate-400 font-mono block">SELECT TARGET TENDER</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedTenderId}
              onChange={(e) => setSelectedTenderId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs"
            >
              {tenders.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.reference_number}] {t.title} ({t.status})
                </option>
              ))}
            </select>

            <button
              onClick={handleRunPrecheck}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-procure-600 hover:bg-procure-500 text-white font-semibold text-xs font-mono transition-colors"
            >
              {isLoading ? 'Checking...' : 'Re-Run Check'}
            </button>
          </div>

          {currentTender && (
            <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap gap-4 font-mono">
              <span>Department: {currentTender.department}</span>
              <span>•</span>
              <span>Deadline: {new Date(currentTender.submission_deadline_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center space-y-2 animate-pulse">
              <div className="w-6 h-6 rounded-full border-2 border-procure-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Running automated qualification algorithms...</p>
            </div>
          ) : report ? (
            <div className="space-y-4">
              {/* Verdict Banner */}
              <div
                className={`p-5 rounded-xl border flex justify-between items-center ${
                  report.isEligible
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/40 text-red-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-mono font-bold text-base">
                    <span>{report.isEligible ? '✅' : '❌'}</span>
                    ELIGIBILITY VERDICT: {report.verdict}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-sans">
                    {report.isEligible
                      ? 'All mandatory requirements satisfied. Your company is qualified to submit a bid.'
                      : report.disqualificationReason}
                  </p>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span className="opacity-80 block">Verified On</span>
                  <span>{new Date(report.evaluatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Explainable Checklist Matrix */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">
                  Detailed Criteria Breakdown ({report.checks.length} checks)
                </span>

                {report.checks.map((c: any, idx: number) => (
                  <div
                    key={c.requirementId || idx}
                    className={`p-3.5 rounded-xl border space-y-1 transition-all ${
                      c.passed
                        ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                        : 'bg-red-500/10 border-red-500/30 text-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className={c.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {c.passed ? '✓' : '❌'}
                        </span>
                        <span>{c.title}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-400">
                          {c.requirementType}
                        </span>
                      </div>

                      {c.isMandatory && (
                        <span className="badge-danger text-[9px] font-mono">MANDATORY GATE</span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 pl-5 font-mono">{c.evidenceSummary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Select a tender to evaluate your company qualification status.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs">
          <span className="text-slate-500 font-mono text-[10px]">
            🛡️ Zero-bias guarantee: Evaluated exclusively against objective corporate credentials.
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
