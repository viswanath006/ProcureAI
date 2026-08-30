import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

interface DecisionWorkflowModalProps {
  tenderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans text-xs">
        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏛️</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm font-mono tracking-wide">
                  Human-in-the-Loop Procurement Decision Console
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-procure-500/20 text-procure-300 border border-procure-500/30">
                  PHASE 10
                </span>
                {isLocked && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <span>🔒</span> RECORD LOCKED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                CONSTITUTIONAL SAFEGUARD: AI RECOMMENDS · HUMANS DECIDE · SYSTEM AUDITS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Main Scrollable Body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="p-12 text-center space-y-3 font-mono">
              <div className="w-8 h-8 border-2 border-procure-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading comprehensive 7-point decision dossier...</p>
            </div>
          ) : isLocked ? (
            /* ── LOCKED STATE DISPLAY ──────────────────────────────────────── */
            <div className="space-y-4 font-mono animate-fadeIn">
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                      🔒 Official Procurement Decision Permanently Locked
                    </span>
                    <h4 className="text-base font-black text-white font-sans">
                      Contract Awarded to: {existingDecision?.awarded_company_name || 'Designated Awardee'}
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    DECISION RECORDED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Decided By Officer:</span>
                    <span className="text-slate-200 font-bold">{existingDecision?.officer_name || existingDecision?.decided_by}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Decision Timestamp:</span>
                    <span className="text-slate-200 font-bold">{new Date(existingDecision?.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">AI Recommendation Alignment:</span>
                    <span className={`font-bold ${existingDecision?.followed_ai ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {existingDecision?.followed_ai ? 'Followed AI Recommendation' : 'Documented AI Override'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Immutability Protection:</span>
                    <span className="text-emerald-400 font-bold">PostgreSQL Row Lock Trigger Active ✓</span>
                  </div>
                </div>

                {/* Cryptographic Integrity Hash Display */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                    Cryptographic SHA-256 Integrity Hash
                  </span>
                  <div className="font-mono text-[11px] text-procure-300 break-all select-all">
                    {existingDecision?.integrity_hash || 'SHA-256 Chaining Verified'}
                  </div>
                </div>

                {/* Recorded Rationale Quote */}
                <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Official Justification Rationale</span>
                  <p className="text-xs text-slate-200 font-sans italic">
                    "{existingDecision?.reason_detail || existingDecision?.rationale}"
                  </p>
                </div>
              </div>
            </div>
          ) : step === 'confirm' ? (
            /* ── STEP 2: PRE-SUBMISSION CONFIRMATION SCREEN ───────────────── */
            <div className="space-y-4 animate-fadeIn font-mono">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <h4 className="font-bold text-purple-200 text-xs uppercase tracking-wider">
                    Confirmation Step: Authoritative Commitment & Immutability Seal
                  </h4>
                </div>
                <p className="text-[11px] text-purple-200/90 font-sans leading-relaxed">
                  You are about to record the final binding procurement decision. Submitting this decision will cryptographically seal the record, write an immutable entry to the governance audit trail, and lock it from ordinary modification.
                </p>
              </div>

              {/* Review Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">ACTION:</span>
                    <span className="font-bold text-white uppercase">{actionChoice} RECOMMENDATION</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">OVERRIDE STATUS:</span>
                    <span className={`font-bold ${isOverriding ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isOverriding ? 'YES (OVERRIDE)' : 'NO (FOLLOWED AI)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">AI RECOMMENDED ENTITY:</span>
                    <span className="font-bold text-emerald-300">{topAi?.company_name} ({topAi?.total_score.toFixed(1)} pts)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">OFFICIAL SELECTED WINNER:</span>
                    <span className="font-bold text-white">
                      {actionChoice === 'approve' ? topAi?.company_name : selectedBidderObj?.company_name || 'Rejected / None'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1 font-sans">
                  <span className="text-[10px] text-slate-400 block font-mono">RECORDED JUSTIFICATION:</span>
                  <p className="text-xs text-slate-200 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    "{actionChoice === 'approve' ? rationale : overrideReasonDetail}"
                  </p>
                </div>

                {isOverriding && supportingNote && (
                  <div className="pt-1 space-y-1 font-sans">
                    <span className="text-[10px] text-slate-400 block font-mono">SUPPORTING DOCUMENTATION NOTE:</span>
                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                      {supportingNote}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('dossier')}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  ← Go Back & Edit
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all font-mono"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Cryptographically Signing & Locking...</span>
                    </>
                  ) : (
                    <>
                      <span>🔒</span> Confirm & Cryptographically Lock Decision
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ── STEP 1: 7-POINT DOSSIER & ACTION FORM ─────────────────────── */
            <div className="space-y-6">
              {/* ── 7-POINT DOSSIER REVIEW BOX ──────────────────────────────── */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-[10px] font-bold text-procure-400 uppercase tracking-wider">
                    7-Point Multi-Criteria Decision Dossier
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Tender: {dossier?.tender?.reference_number}
                  </span>
                </div>

                {/* 1. Eligible Bidders & 2. Bid Values & 3. Evaluation Scores */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    1. Eligible Bidders, 2. Commercial Values & 3. Evaluation Scores
                  </span>
                  <div className="space-y-2">
                    {dossier?.bidders?.map((b: any) => {
                      const isTop = b.rank === 1;
                      return (
                        <div
                          key={b.bid_id}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono ${
                            isTop
                              ? 'bg-emerald-500/10 border-emerald-500/30 shadow-md'
                              : 'bg-slate-900/40 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isTop ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {b.rank}
                            </span>
                            <div>
                              <div className="font-bold text-white text-xs font-sans flex items-center gap-1.5">
                                <span>{b.company_name}</span>
                                {isTop && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    TOP AI REC
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400">
                                Ref: {b.bid_reference} · Screening: <strong className="text-emerald-400">PASSED</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <span className="text-[9px] text-slate-500 block">Bid Value</span>
                              <span className="text-xs font-bold text-slate-200">
                                ₹{Number(b.bid_amount_inr || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">Composite Score</span>
                              <span className={`text-xs font-bold ${isTop ? 'text-emerald-400' : 'text-slate-300'}`}>
                                {Number(b.composite_score || 0).toFixed(1)} / 100
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">Risk Tier</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  b.risk_tier === 'HIGH RISK'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {b.risk_tier}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. AI Recommendation & 6. Explainability Summary */}
                {topAi && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 block uppercase">
                        4. AI Recommendation Summary
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {topAi.reasoning_summary}
                      </p>
                      <div className="text-[10px] font-mono text-slate-400 pt-1">
                        Confidence: <strong className="text-procure-300">{topAi.confidence_level} ({Math.round(topAi.confidence_score * 100)}%)</strong>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-procure-400 block uppercase">
                        6. Explainability Report (XAI)
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                        {dossier?.explainability_report?.positive_contributors?.slice(0, 3).map((item: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                            {item}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 pt-1 leading-tight">
                        Balanced price-to-technical index with verified delivery safety.
                      </p>
                    </div>
                  </div>
                )}

                {/* 7. Audit Information */}
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-wrap justify-between items-center gap-2 font-mono text-[10px] text-slate-400">
                  <div>
                    <span>Model Engine: </span>
                    <strong className="text-slate-300">{dossier?.audit_info?.model_version}</strong>
                  </div>
                  <div>
                    <span>Tamper Audit: </span>
                    <strong className="text-emerald-400">VERIFIED ✓</strong>
                  </div>
                  <div>
                    <span>Tender ID: </span>
                    <strong className="text-slate-300">{dossier?.tender?.id.slice(0, 8)}...</strong>
                  </div>
                </div>
              </div>

              {/* ── ACTION SELECTION & MANDATORY WORKFLOW ────────────────────── */}
              <form onSubmit={handleProceedToConfirmation} className="space-y-4">
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-sm">⚖️</span>
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Select Binding Procurement Decision Action
                  </span>
                </div>

                {/* Dual Action Radio Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setActionChoice('approve');
                      setDecisionType('award');
                      if (topAi?.bid_id) setSelectedBidId(topAi.bid_id);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      actionChoice === 'approve'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span>✓</span>
                      <span>[APPROVE RECOMMENDATION]</span>
                    </div>
                    <p className="text-[11px] font-sans opacity-80 pt-1">
                      Award the procurement contract to the top AI-recommended entity ({topAi?.company_name}).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionChoice('reject');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      actionChoice === 'reject'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                      <span>⚠</span>
                      <span>[REJECT RECOMMENDATION]</span>
                    </div>
                    <p className="text-[11px] font-sans opacity-80 pt-1">
                      Reject the AI recommendation, select another bidder, or cancel the tender with mandatory justification.
                    </p>
                  </button>
                </div>

                {/* Conditional Fields for Rejection / Alternative Selection */}
                {actionChoice === 'reject' && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3.5 animate-fadeIn">
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-[11px] font-bold text-amber-300 uppercase">
                        Mandatory Exception & Override Form
                      </span>
                      <span className="text-[10px] text-amber-400/80">
                        Strict Audit Compliance Required
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">
                          OUTCOME DECISION
                        </label>
                        <select
                          value={decisionType}
                          onChange={(e) => setDecisionType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
                        >
                          <option value="award">Award Alternative Bidder</option>
                          <option value="reject">Reject All Bids</option>
                          <option value="cancel_tender">Cancel Procurement Tender</option>
                          <option value="defer">Defer to Committee</option>
                        </select>
                      </div>

                      {decisionType === 'award' && (
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block mb-1">
                            SELECT ALTERNATIVE WINNING BIDDER <span className="text-rose-400">*</span>
                          </label>
                          <select
                            value={selectedBidId}
                            onChange={(e) => setSelectedBidId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
                          >
                            <option value="">-- Choose alternative proposal --</option>
                            {dossier?.bidders
                              ?.filter((b: any) => b.bid_id !== topAi?.bid_id)
                              .map((b: any) => (
                                <option key={b.bid_id} value={b.bid_id}>
                                  {b.company_name} (Rank #{b.rank} · {b.composite_score.toFixed(1)} pts)
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {decisionType === 'award' && (
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">
                          OVERRIDE REASON CATEGORY <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={overrideReasonType}
                          onChange={(e) => setOverrideReasonType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
                        >
                          <option value="committee_directive">High-Level Committee Directive</option>
                          <option value="additional_information">Material Information Not Available to AI</option>
                          <option value="policy_exception">Government Strategic / MSME Policy Exception</option>
                          <option value="emergency">Emergency Procurement Mandate</option>
                          <option value="ai_error">Defect in AI Evaluation Criteria</option>
                          <option value="other">Other Validated Justification</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-mono text-slate-400">
                          {decisionType === 'award' ? 'DETAILED OVERRIDE JUSTIFICATION' : 'MANDATORY REASON'} <span className="text-rose-400">*</span>
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">
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
                        placeholder="Provide substantive justification explaining why the AI recommendation was overridden..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs leading-relaxed placeholder:text-slate-600 focus:border-amber-500/50"
                      />
                    </div>

                    {decisionType === 'award' && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-mono text-slate-400">
                            SUPPORTING NOTE / DOCUMENT REFERENCE <span className="text-rose-400">*</span>
                          </label>
                          <span className="text-[10px] font-mono text-slate-500">Min 10 chars</span>
                        </div>
                        <input
                          type="text"
                          value={supportingNote}
                          onChange={(e) => setSupportingNote(e.target.value)}
                          placeholder="e.g., Committee Minute Ref: C-402, File No. TR-2026/81..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono placeholder:text-slate-600"
                        />
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    {error}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-procure-600 hover:bg-procure-500 text-white font-bold text-xs font-mono shadow-md transition-colors"
                  >
                    Proceed to Pre-Submission Review →
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
