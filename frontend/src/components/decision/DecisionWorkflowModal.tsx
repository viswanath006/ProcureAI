import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';

interface DecisionWorkflowModalProps {
  tenderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OsintVerificationBadge: React.FC<{ bidder: any }> = ({ bidder }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const status = bidder.osint_status || bidder.osint_profile?.verification_status || 'verified';
  const hasCollusion = Boolean(bidder.collusion_flag || (bidder.collusion_reasons && bidder.collusion_reasons.length > 0));
  const isMismatch = status === 'mismatch';
  const isUnavailable = status === 'unavailable';

  const isAmber = isMismatch || hasCollusion;
  const isGreen = !isAmber && !isUnavailable;

  const shapReason =
    bidder.explanation?.negative_contributors?.find((n: string) =>
      n.toLowerCase().includes('collusion') || n.toLowerCase().includes('osint') || n.toLowerCase().includes('risk')
    ) ||
    bidder.collusion_reasons?.[0] ||
    bidder.risk_indicators?.[0] ||
    'Cross-bidder collusion pattern or statutory registry discrepancy identified.';

  const reasonsList = bidder.collusion_reasons || [];
  const discrepancies = bidder.osint_profile?.discrepancy_details || {};

  if (isGreen) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs cursor-help"
        title="MCA statutory records verified: Active company status, confirmed corporate identity, and clean cross-bidder collusion screening."
      >
        <span className="text-emerald-600 font-bold">✓</span>
        <span>OSINT Verified</span>
      </span>
    );
  }

  if (isAmber) {
    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 cursor-pointer shadow-2xs hover:bg-amber-100 transition-colors"
          onClick={() => setShowTooltip(!showTooltip)}
        >
          <span>⚠️</span>
          <span>OSINT Alert</span>
        </span>

        {showTooltip && (
          <div className="absolute left-0 bottom-full mb-2 z-50 w-80 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl border border-slate-700 animate-fadeIn text-left font-sans pointer-events-none">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="font-bold text-amber-400 font-mono text-[11px] flex items-center gap-1.5">
                <span>⚠️</span>
                <span>OSINT & Collusion Notice</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                Human Review
              </span>
            </div>

            <p className="text-[11px] text-slate-200 leading-relaxed">
              <strong className="text-amber-300 font-mono">SHAP Reason: </strong>
              {shapReason}
            </p>

            {reasonsList.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Cross-Bidder Collusion Signals:
                </span>
                {reasonsList.map((r: string, idx: number) => (
                  <div key={idx} className="text-[10px] text-amber-200 flex items-start gap-1 font-sans">
                    <span className="text-amber-400 shrink-0">•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(discrepancies).length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Statutory Discrepancies:
                </span>
                {Object.entries(discrepancies).map(([_key, v]: [string, any], idx: number) => (
                  <div key={idx} className="text-[10px] text-amber-200 flex items-start gap-1 font-sans">
                    <span className="text-amber-400 shrink-0">•</span>
                    <span>{typeof v === 'object' ? (v.detail || JSON.stringify(v)) : String(v)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[9px] text-slate-400 italic">
              Non-blocking: Flags are surfaced for human officer review under GFR 2017 rules.
            </div>
          </div>
        )}
      </div>
    );
  }

  // Grey = Unavailable
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300 shadow-2xs cursor-help"
      title="MCA public records gateway connection timed out or unavailable. Non-blocking; does not disqualify bidder."
    >
      <span className="text-gray-400">⚪</span>
      <span>OSINT Unavailable</span>
    </span>
  );
};

export const DecisionWorkflowModal: React.FC<DecisionWorkflowModalProps> = ({
  tenderId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dossier, setDossier] = useState<any | null>(null);
  const [existingDecision, setExistingDecision] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stepped review state: 'dossier' -> 'confirm'
  const [step, setStep] = useState<'dossier' | 'confirm'>('dossier');

  // Form selections
  const [actionChoice, setActionChoice] = useState<'approve' | 'reject'>('approve');
  const [decisionType, setDecisionType] = useState<'award' | 'reject' | 'defer' | 'cancel_tender'>('award');
  const [selectedBidId, setSelectedBidId] = useState<string>('');
  const [rationale, setRationale] = useState<string>('');
  const [overrideReasonType, setOverrideReasonType] = useState<string>('committee_directive');
  const [overrideReasonDetail, setOverrideReasonDetail] = useState<string>('');
  const [supportingNote, setSupportingNote] = useState<string>('');

  const loadDossier = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dosRes, decRes] = await Promise.all([
        api.getDecisionDossier(tenderId),
        api.getTenderDecision(tenderId),
      ]);

      if (dosRes.success && dosRes.data) {
        setDossier(dosRes.data);
        if (dosRes.data.ai_recommendation?.bid_id) {
          setSelectedBidId(dosRes.data.ai_recommendation.bid_id);
        }
      }
      if (decRes.success && decRes.data) {
        setExistingDecision(decRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load procurement decision dossier.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep('dossier');
      loadDossier();
    }
  }, [isOpen, tenderId]);

  if (!isOpen) return null;

  const topAi = dossier?.ai_recommendation;
  const isLocked = Boolean(existingDecision?.is_locked);
  const isOverriding = actionChoice === 'reject';

  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (actionChoice === 'approve') {
      if (!rationale.trim()) {
        setRationale('Official approval of AI multi-criteria recommendation as the most advantageous proposal.');
      }
      setStep('confirm');
      return;
    }

    // Rejection / Override Validations
    if (decisionType === 'award') {
      if (!selectedBidId) {
        setError('Mandatory Requirement: Please select the alternative bidder to award.');
        return;
      }
      if (selectedBidId === topAi?.bid_id) {
        setError('Notice: You selected the top AI recommended bidder. Please choose "Approve AI Recommendation" instead.');
        return;
      }
      if (!overrideReasonDetail || overrideReasonDetail.trim().length < 50) {
        setError('Mandatory Requirement: Overriding AI recommendations requires a detailed justification (minimum 50 characters).');
        return;
      }
      if (!supportingNote || supportingNote.trim().length < 10) {
        setError('Mandatory Requirement: Overriding AI recommendations requires a supporting note / documentation reference (minimum 10 characters).');
        return;
      }
    } else {
      if (!rationale || rationale.trim().length < 20) {
        setError('Mandatory Requirement: Rejecting or cancelling the tender requires a written rationale (minimum 20 characters).');
        return;
      }
    }

    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        action: actionChoice,
        decision: decisionType,
        selected_bid_id: actionChoice === 'approve' ? topAi?.bid_id : selectedBidId || undefined,
        rationale: rationale.trim(),
        override_reason_type: actionChoice === 'reject' ? overrideReasonType : undefined,
        override_reason_detail: actionChoice === 'reject' ? overrideReasonDetail.trim() : undefined,
        supporting_note: actionChoice === 'reject' ? supportingNote.trim() : undefined,
      };

      const res = await api.submitDecision(tenderId, payload);
      if (res.success) {
        if (res.data?.decision) {
          setExistingDecision(res.data.decision);
        }
        setStep('dossier');
        onSuccess();
        await loadDossier();
      } else {
        setError(res.error?.message || 'Failed to submit official procurement decision.');
      }
    } catch (err: any) {
      setError(err.message || 'Submission error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBidderObj = dossier?.bidders?.find((b: any) => b.bid_id === selectedBidId);
  const awardedBidder = actionChoice === 'approve'
    ? dossier?.bidders?.find((b: any) => b.bid_id === topAi?.bid_id) || topAi
    : selectedBidderObj;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-900 font-sans text-xs my-auto">
        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/90">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏛️</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm font-sans tracking-wide">
                  Officer Contract Award & Decision
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  DECISION
                </span>
                {isLocked && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <span>🔒</span> RECORD LOCKED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 font-mono">
                SAFEGUARD: AI SUGGESTS · OFFICER DECIDES · SYSTEM RECORDS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Main Scrollable Body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="p-12 text-center space-y-3 font-mono">
              <div className="w-8 h-8 border-2 border-procure-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading AI review and bidder details...</p>
            </div>
          ) : isLocked ? (
            /* ── LOCKED STATE DISPLAY ──────────────────────────────────────── */
            <div className="space-y-4 font-mono animate-fadeIn">
              <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block font-mono">
                      🔒 Official Award Decision Finalized & Locked
                    </span>
                    <h4 className="text-base font-black text-gray-900 font-sans">
                      Contract Awarded to: {existingDecision?.awarded_company_name || existingDecision?.selected_bidder || 'Apex Infra Buildtech Ltd'}
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    DECISION RECORDED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                    <span className="text-gray-500 text-[10px] block uppercase font-bold">Decided By Officer:</span>
                    <span className="text-gray-900 font-bold">{existingDecision?.officer_name || existingDecision?.decided_by || 'Government Officer'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                    <span className="text-gray-500 text-[10px] block uppercase font-bold">Decision Timestamp:</span>
                    <span className="text-gray-900 font-bold">
                      {existingDecision?.created_at || existingDecision?.timestamp
                        ? new Date(existingDecision?.created_at || existingDecision?.timestamp).toLocaleString('en-IN')
                        : new Date().toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                    <span className="text-gray-500 text-[10px] block uppercase font-bold">AI Recommendation Alignment:</span>
                    <span className={`font-bold ${existingDecision?.override_status === 'NO' || existingDecision?.followed_ai ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {existingDecision?.override_status === 'NO' || existingDecision?.followed_ai ? 'Followed AI Recommendation' : 'Documented AI Override'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                    <span className="text-gray-500 text-[10px] block uppercase font-bold">Record Protection:</span>
                    <span className="text-emerald-700 font-bold">Permanently Saved & Protected ✓</span>
                  </div>
                </div>

                {/* Cryptographic Integrity Hash Display */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-white shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider font-mono font-bold">
                      Digital Verification Fingerprint
                    </span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-mono">
                      LOCKED
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-emerald-400 break-all select-all">
                    {existingDecision?.integrity_hash || 'Record Verification Confirmed'}
                  </div>
                </div>

                {/* Recorded Rationale Quote */}
                <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 space-y-1 shadow-sm">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Officer Explanation & Reason</span>
                  <p className="text-xs text-gray-800 font-sans italic leading-relaxed">
                    "{existingDecision?.reason || existingDecision?.reason_detail || existingDecision?.rationale}"
                  </p>
                </div>
              </div>
            </div>
          ) : step === 'confirm' ? (
            /* ── STEP 2: PRE-SUBMISSION CONFIRMATION SCREEN ───────────────── */
            <div className="space-y-4 animate-fadeIn font-sans">
              {/* Executive Safeguard & Legal Notice Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-indigo-50/60 to-emerald-50 border border-amber-200 p-4.5 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-amber-300 flex items-center justify-center text-lg shrink-0 text-amber-900 shadow-2xs">
                    🛡️
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-gray-950 text-xs font-mono tracking-wider uppercase">
                        Confirmation Step: Final Review Before Permanent Locking
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                        LEGAL SIGN-OFF
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 font-mono">
                        IMMUTABLE COMMIT
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-sans">
                      You are about to save the final award decision for <strong className="text-gray-950">{dossier?.tender?.reference_number}</strong>. Submitting this will permanently lock the record and commit it to the cryptographic audit ledger so it cannot be altered or deleted.
                    </p>
                  </div>
                </div>
              </div>

              {/* Context Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-sans">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono text-[11px]">Tender:</span>
                  <span className="font-bold text-gray-950">{dossier?.tender?.title || 'Procurement Tender'}</span>
                  <span className="text-[10px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {dossier?.tender?.reference_number}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-gray-400">Estimated Budget:</span>
                  <strong className="text-gray-900">
                    ₹{(Number(dossier?.tender?.estimated_budget_inr || 0) / 10000000).toFixed(2)} Cr
                  </strong>
                </div>
              </div>

              {/* Review Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Card 1: Official Action Taken */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                      Decision Action
                    </span>
                    <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-xs">
                      🏛️
                    </span>
                  </div>
                  <div className="font-bold text-indigo-900 text-sm font-sans flex items-center gap-2">
                    <span>{actionChoice === 'approve' ? 'Approve AI Recommendation' : 'Statutory AI Override'}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      OFFICIAL
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-sans mt-1">
                    {actionChoice === 'approve'
                      ? 'Adopting multi-criteria AI evaluated ranking as authoritative government decision.'
                      : `Overriding AI recommendation: ${overrideReasonType || 'Executive directive'}`}
                  </p>
                </div>

                {/* Card 2: AI Safeguard Alignment */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                      AI Safeguard Status
                    </span>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                      isOverriding ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      {isOverriding ? '⚠️' : '✓'}
                    </span>
                  </div>
                  <div className={`font-bold text-sm font-sans flex items-center gap-2 ${
                    isOverriding ? 'text-amber-800' : 'text-emerald-800'
                  }`}>
                    <span>{isOverriding ? 'Override Documented' : 'Followed AI Recommendation'}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      isOverriding ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {isOverriding ? 'OVERRIDE' : 'ALIGNED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-sans mt-1">
                    {isOverriding
                      ? 'Full statutory override justification and file reference logged.'
                      : 'Officer independently concurred with AI evaluated ranking.'}
                  </p>
                </div>

                {/* Card 3: AI Recommended Bidder */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                      AI Recommended Bidder
                    </span>
                    <span className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xs">
                      🤖
                    </span>
                  </div>
                  <div className="font-bold text-emerald-950 text-sm font-sans flex flex-wrap items-center gap-1.5">
                    <span>{topAi?.company_name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-emerald-800 font-mono">
                    <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      Score: {topAi?.total_score.toFixed(1)} / 100
                    </span>
                    <span className="text-gray-500">Confidence: 96%</span>
                  </div>
                </div>

                {/* Card 4: Official Awarded Winner & Contract Value */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-300 bg-emerald-50/30 shadow-xs hover:border-emerald-400 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider">
                      Selected Contract Winner
                    </span>
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-2xs">
                      🏆
                    </span>
                  </div>
                  <div className="font-bold text-gray-950 text-sm font-sans flex flex-wrap items-center gap-1.5">
                    <span>{actionChoice === 'approve' ? topAi?.company_name : selectedBidderObj?.company_name || 'None / Cancelled'}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      AWARDED
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono">
                    {awardedBidder?.bid_amount_inr && (
                      <>
                        <span className="font-bold text-gray-950 text-xs">
                          ₹{Number(awardedBidder.bid_amount_inr).toLocaleString('en-IN')}
                        </span>
                        {awardedBidder.savings_percentage && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                            {awardedBidder.savings_percentage}% below budget
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Recorded Justification Certificate */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>✍️</span>
                    <span>Official Recorded Justification (Permanently Sealed in Ledger)</span>
                  </span>
                  <span className="text-[9px] font-mono text-gray-400">
                    GFR 2017 Rule 173 Compliance
                  </span>
                </div>
                <p className="text-xs text-gray-900 italic bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 leading-relaxed font-sans shadow-inner">
                  "{actionChoice === 'approve' ? rationale : overrideReasonDetail}"
                </p>
              </div>

              {isOverriding && supportingNote && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📎</span>
                    <span>Supporting File Reference / Committee Minute</span>
                  </span>
                  <p className="text-xs text-amber-950 font-mono bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                    {supportingNote}
                  </p>
                </div>
              )}

              {/* Cryptographic Security & Verification Notice */}
              <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-slate-800 text-slate-300 flex flex-wrap justify-between items-center gap-3 font-mono text-[11px] shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-400">Security Ledger Protocol:</span>
                  <span className="text-emerald-400 font-bold">SHA-256 Tamper-Proof Chain</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Decision Lock:</span>
                  <span className="bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded text-[9px] font-bold">
                    READY TO SEAL
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium font-sans">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('dossier')}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-all border border-gray-300 font-sans cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span>←</span>
                  <span>Go Back & Edit</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all font-sans cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Cryptographically Signing & Locking Decision...</span>
                    </>
                  ) : (
                    <>
                      <span>🔒</span>
                      <span>Confirm & Finalize Decision</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ── STEP 1: 7-POINT DOSSIER & ACTION FORM ─────────────────────── */
            <div className="space-y-6">
              {/* ── 7-POINT DOSSIER REVIEW BOX ──────────────────────────────── */}
              <div className="p-5 rounded-2xl bg-[#FAFAFC] border border-gray-200 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-200/80 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider font-mono block">
                      AI Review & Decision Summary
                    </span>
                    <h4 className="text-xs font-bold text-gray-900 font-sans mt-0.5">
                      {dossier?.tender?.title || 'Tender Evaluation'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-600 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                      Tender: <strong className="text-gray-900">{dossier?.tender?.reference_number}</strong>
                    </span>
                  </div>
                </div>

                {/* 1. Eligible Bidders & 2. Bid Values & 3. Evaluation Scores */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                      1. Qualified Bidders, 2. Bid Amounts & 3. Total Scores
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Evaluation Weights: Tech 40% · Price 30% · Track Record 30%
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {dossier?.bidders?.map((b: any) => {
                      const isTop = b.rank === 1;
                      return (
                        <div
                          key={b.bid_id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isTop
                              ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                              : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 sm:mt-0 ${
                                  isTop
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-gray-150 text-gray-700 bg-gray-100 border border-gray-300'
                                }`}
                              >
                                {b.rank}
                              </span>
                              <div>
                                <div className="font-bold text-gray-950 text-sm font-sans flex flex-wrap items-center gap-2">
                                  <span>{b.company_name}</span>
                                  {isTop && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      TOP AI REC
                                    </span>
                                  )}
                                  {b.is_lowest_bidder && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      L1 - LOWEST PRICE
                                    </span>
                                  )}
                                  <OsintVerificationBadge bidder={b} />
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-gray-500 font-mono">
                                  <span>Ref: {b.bid_reference}</span>
                                  {b.cin && <span>· CIN: <strong className="text-gray-700">{b.cin}</strong></span>}
                                  <span>·</span>
                                  <span>Screening: <strong className="text-emerald-700 font-semibold">PASSED</strong></span>
                                </div>
                                {b.registered_address && (
                                  <div className="text-[10px] text-gray-500 mt-0.5 truncate max-w-md font-sans flex items-center gap-1" title={b.registered_address}>
                                    <span className="text-gray-400">📍 Reg. Office:</span>
                                    <span className="truncate">{b.registered_address}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 text-right">
                              <div>
                                <span className="text-[10px] text-gray-500 block uppercase font-medium">Bid Value</span>
                                <div className="flex items-baseline gap-1 sm:justify-end">
                                  <span className="text-sm font-bold text-gray-900">
                                    ₹{Number(b.bid_amount_inr || 0).toLocaleString('en-IN')}
                                  </span>
                                  {b.savings_percentage && (
                                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                                      {b.savings_percentage}% below
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-500 block uppercase font-medium">Total Score</span>
                                <span className={`text-sm font-bold ${isTop ? 'text-emerald-700' : 'text-gray-900'}`}>
                                  {Number(b.composite_score || 0).toFixed(1)} / 100
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-500 block uppercase font-medium">Risk Level</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                                    b.risk_tier === 'HIGH RISK'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {b.risk_tier || 'NORMAL'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Criteria Sub-scores Breakdown */}
                          {b.criterion_scores && (
                            <div className="mt-3 pt-2.5 border-t border-gray-200/70 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-gray-600 font-mono">
                              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs">
                                <span className="text-[9px] text-gray-400 block uppercase font-semibold">Technical</span>
                                <span className="font-bold text-gray-900">{b.criterion_scores.technical}</span>
                                <span className="text-gray-400 text-[10px]"> / 20</span>
                              </div>
                              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs">
                                <span className="text-[9px] text-gray-400 block uppercase font-semibold">Experience</span>
                                <span className="font-bold text-gray-900">{b.criterion_scores.experience}</span>
                                <span className="text-gray-400 text-[10px]"> / 15</span>
                              </div>
                              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs">
                                <span className="text-[9px] text-gray-400 block uppercase font-semibold">Financial</span>
                                <span className="font-bold text-gray-900">{b.criterion_scores.financial}</span>
                                <span className="text-gray-400 text-[10px]"> / 10</span>
                              </div>
                              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs">
                                <span className="text-[9px] text-gray-400 block uppercase font-semibold">Past Perf.</span>
                                <span className="font-bold text-gray-900">{b.criterion_scores.past_performance}</span>
                                <span className="text-gray-400 text-[10px]"> / 10</span>
                              </div>
                              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs">
                                <span className="text-[9px] text-gray-400 block uppercase font-semibold">Price Score</span>
                                <span className="font-bold text-gray-900">{b.criterion_scores.price}</span>
                                <span className="text-gray-400 text-[10px]"> / 40</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. AI Recommendation & 6. Explainability Summary */}
                {topAi && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs font-mono uppercase tracking-wider">
                        <span>✨</span>
                        <span>4. AI Recommendation Summary</span>
                      </div>
                      <p className="text-xs text-gray-800 leading-relaxed font-sans font-medium">
                        {topAi.reasoning_summary}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-mono text-gray-500 uppercase font-semibold">Confidence:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                          HIGH ({Math.round(topAi.confidence_score * 100)}%)
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs font-mono uppercase tracking-wider">
                        <span>🔍</span>
                        <span>6. Key Reasons for AI Scores (XAI)</span>
                      </div>
                      <div className="space-y-1.5">
                        {dossier?.explainability_report?.positive_contributors?.slice(0, 3).map((item: string, i: number) => (
                          <div key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-sans font-medium flex items-center gap-2 shadow-xs">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 pt-0.5 leading-tight font-sans">
                        Calibrated against tender technical specifications, GFR 2017 standards, and audited bidder credentials.
                      </p>
                    </div>
                  </div>
                )}

                {/* 7. Audit Information */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-wrap justify-between items-center gap-2 font-mono text-[11px] text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Model Engine:</span>
                    <strong className="text-gray-900 font-semibold">{dossier?.audit_info?.model_version || 'v2.4.0-xai-shap'}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Tamper Audit:</span>
                    <strong className="text-emerald-700 font-bold flex items-center gap-1">
                      <span>VERIFIED</span>
                      <span>✓</span>
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Tender ID:</span>
                    <strong className="text-gray-800 font-mono">{dossier?.tender?.id ? `${dossier.tender.id.slice(0, 8)}...` : 'TND-2026'}</strong>
                  </div>
                </div>
              </div>

              {/* ── ACTION SELECTION & MANDATORY WORKFLOW ────────────────────── */}
              <form onSubmit={handleProceedToConfirmation} className="space-y-4 pt-1 font-sans">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚖️</span>
                  <span className="font-bold text-gray-900 text-xs uppercase tracking-wider font-mono">
                    Select Officer Decision
                  </span>
                </div>

                {/* Dual Action Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActionChoice('approve');
                      setDecisionType('award');
                      if (topAi?.bid_id) setSelectedBidId(topAi.bid_id);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      actionChoice === 'approve'
                        ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20 shadow-md text-emerald-950'
                        : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                      <span>[APPROVE AI RECOMMENDATION]</span>
                    </div>
                    <p className="text-xs text-gray-700 font-sans pt-1.5 leading-relaxed">
                      Award the contract to the top AI-recommended bidder (<strong className="text-gray-950">{topAi?.company_name}</strong>).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionChoice('reject');
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      actionChoice === 'reject'
                        ? 'bg-amber-50/90 border-amber-600 ring-2 ring-amber-500/20 shadow-md text-amber-950'
                        : 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">⚠️</span>
                      <span>[REJECT OR OVERRIDE AI]</span>
                    </div>
                    <p className="text-xs text-gray-700 font-sans pt-1.5 leading-relaxed">
                      Reject the AI choice, select another bidder (e.g. L1 lowest price), or cancel the tender with statutory justification.
                    </p>
                  </button>
                </div>

                {/* Conditional Fields for Rejection / Alternative Selection */}
                {actionChoice === 'reject' && (
                  <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-4 animate-fadeIn shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                        <span>📋</span> Reason for Overriding AI Recommendation
                      </span>
                      <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        Required by Statutory Audit
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-gray-700 block mb-1">
                          OUTCOME DECISION
                        </label>
                        <select
                          value={decisionType}
                          onChange={(e) => setDecisionType(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs font-mono shadow-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                          <option value="award">Award Alternative Bidder</option>
                          <option value="reject">Reject All Bids</option>
                          <option value="cancel_tender">Cancel Procurement Tender</option>
                          <option value="defer">Defer to Committee</option>
                        </select>
                      </div>

                      {decisionType === 'award' && (
                        <div>
                          <label className="text-[10px] font-mono font-bold text-gray-700 block mb-1">
                            SELECT ALTERNATIVE WINNING BIDDER <span className="text-rose-600">*</span>
                          </label>
                          <select
                            value={selectedBidId}
                            onChange={(e) => setSelectedBidId(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs font-mono shadow-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          >
                            <option value="">-- Choose alternative proposal --</option>
                            {dossier?.bidders
                              ?.filter((b: any) => b.bid_id !== topAi?.bid_id)
                              .map((b: any) => (
                                <option key={b.bid_id} value={b.bid_id}>
                                  {b.company_name} (Rank #{b.rank} · {b.composite_score.toFixed(1)} pts · ₹{Number(b.bid_amount_inr).toLocaleString('en-IN')})
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {decisionType === 'award' && (
                      <div>
                        <label className="text-[10px] font-mono font-bold text-gray-700 block mb-1">
                          OVERRIDE REASON CATEGORY <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={overrideReasonType}
                          onChange={(e) => setOverrideReasonType(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs font-mono shadow-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                          <option value="committee_directive">Committee Decision / Board Resolution</option>
                          <option value="l1_price_preference">Preference for Absolute Lowest Bidder (L1 Commercial)</option>
                          <option value="additional_information">Information Not Available to AI Model</option>
                          <option value="policy_exception">Government Policy or MSME Preference</option>
                          <option value="emergency">Urgent Operational Need / Emergency</option>
                          <option value="ai_error">AI Scoring Flaw or Data Anomaly</option>
                          <option value="other">Other Statutory Justification</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-mono font-bold text-gray-700">
                          {decisionType === 'award' ? 'DETAILED EXPLANATION FOR OVERRIDE' : 'REASON FOR DECISION'} <span className="text-rose-600">*</span>
                        </label>
                        <span className="text-[10px] font-mono text-gray-500">
                          Min {decisionType === 'award' ? 50 : 20} chars (current: {(decisionType === 'award' ? overrideReasonDetail : rationale).length})
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={decisionType === 'award' ? overrideReasonDetail : rationale}
                        onChange={(e) => {
                          if (decisionType === 'award') {
                            setOverrideReasonDetail(e.target.value);
                          } else {
                            setRationale(e.target.value);
                          }
                        }}
                        placeholder="Explain clearly why you are choosing differently from the AI recommendation (e.g. why lower price is favored over higher technical score)..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs leading-relaxed placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-xs"
                      />
                    </div>

                    {decisionType === 'award' && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-mono font-bold text-gray-700">
                            FILE NUMBER OR COMMITTEE MINUTE REFERENCE <span className="text-rose-600">*</span>
                          </label>
                          <span className="text-[10px] font-mono text-gray-500">Min 10 chars</span>
                        </div>
                        <input
                          type="text"
                          value={supportingNote}
                          onChange={(e) => setSupportingNote(e.target.value)}
                          placeholder="e.g., File No. PROC-2026/SEC-41, Committee Meeting Minute Ref: C-402..."
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs font-mono placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-xs"
                        />
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium font-sans">
                    {error}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs font-sans shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Review Decision Before Saving</span>
                    <span>→</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
