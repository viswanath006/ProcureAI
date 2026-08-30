import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { EligibilityReportModal } from '../eligibility/EligibilityReportModal';
import { BidOpeningModal } from '../bids/BidOpeningModal';
import { SealedBidSubmissionModal } from '../bids/SealedBidSubmissionModal';
import { AiEvaluationView } from './AiEvaluationView';
import { TenderRiskAnalysisView } from '../risk/TenderRiskAnalysisView';
import { DecisionWorkflowModal } from '../decision/DecisionWorkflowModal';
import { BidderComparisonChart } from '../charts/BidderComparisonChart';

interface TenderDetailModalProps {
  tenderId: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const LIFECYCLE_STAGES = [
  'DRAFT',
  'PUBLISHED',
  'OPEN',
  'CLOSED',
  'BIDS_REVEALED',
  'UNDER_EVALUATION',
  'RECOMMENDATION_READY',
  'DECISION_MADE',
  'COMPLETED',
];

export const TenderDetailModal: React.FC<TenderDetailModalProps> = ({
  tenderId,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'criteria' | 'bids' | 'ai' | 'risk'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  const [isBidOpeningModalOpen, setIsBidOpeningModalOpen] = useState(false);
  const [isSubmitBidModalOpen, setIsSubmitBidModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // Decision form inside modal
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decisionType, setDecisionType] = useState<'award' | 'reject' | 'defer'>('award');
  const [selectedBidId, setSelectedBidId] = useState('');
  const [rationale, setRationale] = useState('');
  const [followedAi, setFollowedAi] = useState(true);
  const [overrideReasonType, setOverrideReasonType] = useState('additional_information');
  const [overrideDetail, setOverrideDetail] = useState('');

  const loadDetails = async () => {
    setIsLoading(true);
    setError(null);
    const res = await api.getTenderDetails(tenderId);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.error?.message || 'Failed to load tender details');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && tenderId) {
      loadDetails();
    }
  }, [isOpen, tenderId]);

  if (!isOpen) return null;

  if (isLoading && !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="card-glass max-w-md w-full p-8 text-center space-y-3 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-procure-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Loading tender dossier...</p>
        </div>
      </div>
    );
  }
  const currentStatus = data?.tender?.status?.toUpperCase() || 'DRAFT';
  const currentStageIndex = LIFECYCLE_STAGES.indexOf(currentStatus);

  const isOfficerOrAdmin = ['GOVT_OFFICER', 'ADMIN'].includes(user?.role_code || '');

  // Quick Action Handlers
  const handlePublish = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    const res = await api.publishTender(tenderId);
    setActionLoading(false);
    if (res.success) {
      setSuccess('Tender published successfully.');
      loadDetails();
      onRefresh();
    } else {
      setError(res.error?.message || 'Publishing failed');
    }
  };

  const handleClose = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    const res = await api.closeTender(tenderId);
    setActionLoading(false);
    if (res.success) {
      setSuccess('Tender bidding closed successfully.');
      loadDetails();
      onRefresh();
    } else {
      setError(res.error?.message || 'Close failed');
    }
  };

  const handleRevealBids = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    const res = await api.revealBids(tenderId);
    setActionLoading(false);
    if (res.success) {
      setSuccess('Bids unsealed and integrity tokens verified.');
      loadDetails();
      onRefresh();
    } else {
      setError(res.error?.message || 'Unsealing failed');
    }
  };

  const handleStartEvaluation = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    const res = await api.startEvaluation(tenderId);
    setActionLoading(false);
    if (res.success) {
      // Also transition to UNDER_EVALUATION
      await api.transitionTender(tenderId, 'UNDER_EVALUATION');
      setSuccess('AI Evaluation pipeline triggered.');
      loadDetails();
      onRefresh();
    } else {
      setError(res.error?.message || 'Evaluation start failed');
    }
  };

  const handleTransition = async (target: string) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    const res = await api.transitionTender(tenderId, target);
    setActionLoading(false);
    if (res.success) {
      setSuccess(`Tender transitioned to ${target}.`);
      loadDetails();
      onRefresh();
    } else {
      setError(res.error?.message || 'Transition failed');
    }
  };

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const res = await api.submitDecision(tenderId, {
      decision: decisionType,
      awarded_bid_id: decisionType === 'award' ? selectedBidId || undefined : undefined,
      rationale,
      followed_ai: followedAi,
      override_reason_type: !followedAi ? overrideReasonType : undefined,
      override_reason_detail: !followedAi ? overrideDetail : undefined,
    });

    setActionLoading(false);

    if (res.success) {
      setSuccess('Government procurement decision recorded.');
      setShowDecisionForm(false);
      loadDetails();
      onRefresh();
    } else {
      setError(res.error?.message || 'Failed to record decision');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="card-glass max-w-5xl w-full max-h-[90vh] flex flex-col p-6 sm:p-8 space-y-6 animate-scale-up border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-procure-400">
                {data?.tender?.reference_number || 'Loading...'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-procure-500/20 text-procure-300 font-mono uppercase">
                {currentStatus}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">
                Category: {data?.tender?.category}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mt-1">{data?.tender?.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{data?.tender?.department}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          >
            ✕
          </button>
        </div>

        {/* ── 9-Stage Visual Lifecycle Stepper ──────────────────────── */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>TENDER LIFECYCLE PROGRESSION</span>
            <span>STAGE {currentStageIndex + 1} OF {LIFECYCLE_STAGES.length}</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 font-mono text-[9px]">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stage}
                  className={`p-1.5 rounded-lg text-center border transition-all ${
                    isCurrent
                      ? 'bg-procure-500/20 border-procure-400 text-procure-200 font-bold shadow-md shadow-procure-500/20'
                      : isPast
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-600'
                  }`}
                >
                  <div className="text-[8px] opacity-70">0{idx + 1}</div>
                  <div className="truncate font-semibold">{stage.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controller Bar */}
        {isOfficerOrAdmin && (
          <div className="p-4 rounded-xl bg-slate-900/80 border border-procure-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                <span>⚡</span> Permitted Next Action:
              </span>
              <p className="text-[11px] text-slate-400">
                Current state is <strong className="text-procure-300">[{currentStatus}]</strong>. Proceed according to government procurement protocol.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentStatus === 'DRAFT' && (
                <button
                  onClick={handlePublish}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Publish Tender →
                </button>
              )}

              {user?.role_code === 'BIDDER' && (currentStatus === 'PUBLISHED' || currentStatus === 'OPEN') && (
                <button
                  onClick={() => setIsSubmitBidModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all font-mono flex items-center gap-1.5"
                >
                  <span>🔒</span> Submit Sealed Bid →
                </button>
              )}

              {(currentStatus === 'PUBLISHED' || currentStatus === 'OPEN') && user?.role_code !== 'BIDDER' && (
                <button
                  onClick={handleClose}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Close Bidding (Cutoff) →
                </button>
              )}

              {currentStatus === 'CLOSED' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsBidOpeningModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors font-mono flex items-center gap-1.5"
                  >
                    <span>🔓</span> Bid Opening & Tamper Verification →
                  </button>
                  <button
                    onClick={handleRevealBids}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    Unseal Cryptographic Bids →
                  </button>
                </div>
              )}

              {currentStatus === 'BIDS_REVEALED' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsBidOpeningModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors font-mono"
                  >
                    🔓 Tamper Audit Console
                  </button>

                  <button
                    onClick={() => setIsEligibilityModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition-colors font-mono"
                  >
                    🛡️ Screen Bidder Eligibility →
                  </button>

                  <button
                    onClick={handleStartEvaluation}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    Start AI Evaluation Pipeline →
                  </button>
                </div>
              )}

              {currentStatus === 'UNDER_EVALUATION' && (
                <button
                  onClick={() => handleTransition('RECOMMENDATION_READY')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Mark Recommendations Ready →
                </button>
              )}

              {currentStatus === 'RECOMMENDATION_READY' && (
                <button
                  onClick={() => setIsDecisionModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition-all font-mono flex items-center gap-1.5"
                >
                  <span>⚖️</span> Authoritative Decision Console →
                </button>
              )}

              {['DECISION_MADE', 'AWARDED', 'COMPLETED'].includes(currentStatus) && (
                <button
                  onClick={() => setIsDecisionModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors font-mono flex items-center gap-1.5"
                >
                  <span>🔒</span> Locked Decision Record
                </button>
              )}

              {currentStatus === 'DECISION_MADE' && (
                <button
                  onClick={() => handleTransition('COMPLETED')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Complete Procurement Cycle ✓
                </button>
              )}
            </div>
          </div>
        )}

        {/* Decision Form if toggled */}
        {showDecisionForm && (
          <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4 animate-fade-in text-xs">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-amber-300 font-mono text-sm">
                🏛️ Official Government Decision Record (Humans Decide)
              </h4>
              <span className="text-[10px] text-amber-400/80 font-mono">Audited Exception Ledger</span>
            </div>

            <form onSubmit={handleRecordDecision} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">DECISION</label>
                  <select
                    value={decisionType}
                    onChange={(e) => setDecisionType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
                  >
                    <option value="award">Award Contract</option>
                    <option value="reject">Reject All Bids</option>
                    <option value="defer">Defer Decision</option>
                  </select>
                </div>

                {decisionType === 'award' && (
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">SELECT WINNING BID</label>
                    <select
                      value={selectedBidId}
                      onChange={(e) => setSelectedBidId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
                    >
                      <option value="">-- Choose evaluated bid --</option>
                      {data?.unsealedBids?.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.company_name} ({b.bid_reference})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                  OFFICIAL RATIONALE (MIN 20 CHARS)
                </label>
                <textarea
                  rows={2}
                  required
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why this decision is in the best interest of the government and public expenditure..."
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                />
              </div>

              {/* AI Override Rule Check */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={followedAi}
                    onChange={(e) => setFollowedAi(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-procure-500"
                  />
                  <span className="text-xs text-slate-200 font-medium">
                    Decision conforms with AI recommendation ranking
                  </span>
                </label>

                {!followedAi && (
                  <div className="pt-2 space-y-2 border-t border-slate-800">
                    <span className="text-amber-400 font-bold block text-[11px]">
                      ⚠️ Mandatory Override Requirement:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={overrideReasonType}
                        onChange={(e) => setOverrideReasonType(e.target.value)}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-[11px]"
                      >
                        <option value="additional_information">Additional Information</option>
                        <option value="policy_exception">Government Policy Exception</option>
                        <option value="emergency">Emergency Mandate</option>
                        <option value="ai_error">AI Scoring Flaw</option>
                      </select>
                      <input
                        type="text"
                        value={overrideDetail}
                        onChange={(e) => setOverrideDetail(e.target.value)}
                        placeholder="Detailed justification (min 50 chars)..."
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-[11px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                Submit Official Procurement Decision
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-start gap-2">
            <span>✅</span>
            <div>{success}</div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'overview' ? 'bg-procure-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'requirements' ? 'bg-procure-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Eligibility ({data?.requirements?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('criteria')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'criteria' ? 'bg-procure-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Criteria & Weights ({data?.criteria?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'bids' ? 'bg-procure-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bids ({data?.bidsCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'ai' ? 'bg-procure-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Evaluations ({data?.recommendations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'risk' ? 'bg-procure-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🛡️</span> Risk & Anti-Bias
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">ESTIMATED VALUE</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {data?.tender?.estimated_budget_paisa
                      ? `₹${(Number(data.tender.estimated_budget_paisa) / 10000000).toFixed(2)} Cr`
                      : 'Confidential'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">OPENING DATE</span>
                  <span className="text-slate-300 font-medium">
                    {data?.tender?.submission_start_at
                      ? new Date(data.tender.submission_start_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SUBMISSION DEADLINE</span>
                  <span className="text-amber-400 font-bold">
                    {data?.tender?.submission_deadline_at
                      ? new Date(data.tender.submission_deadline_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">AUTHORING OFFICER</span>
                  <span className="text-slate-300 truncate block">
                    {data?.tender?.creator_name || 'Government Officer Alpha'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider font-mono text-[10px]">
                  SCOPE OF WORK & SPECIFICATIONS
                </span>
                <p className="text-slate-400 leading-relaxed">{data?.tender?.description}</p>
              </div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="space-y-2.5">
              {data?.requirements?.map((req: any) => (
                <div key={req.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-procure-300 uppercase font-mono">
                        {req.requirement_type}
                      </span>
                      <span className="font-semibold text-slate-200">{req.title}</span>
                    </div>
                    {req.is_mandatory && (
                      <span className="badge-danger text-[9px] font-mono">MANDATORY GATE</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{req.description}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'criteria' && (
            <div className="space-y-2.5">
              {data?.criteria?.map((crit: any) => (
                <div key={crit.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase font-mono">
                        {crit.criteria_type}
                      </span>
                      <span className="font-semibold text-slate-200">{crit.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400">
                      Weight: {crit.weight}%
                    </span>
                  </div>
                  {crit.description && <p className="text-[11px] text-slate-400">{crit.description}</p>}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bids' && (
            <div className="space-y-4">
              <BidderComparisonChart />

              {data?.unsealedBids?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  {currentStageIndex < 4
                    ? 'Submissions are currently cryptographically locked in the sealed envelope vault until deadline.'
                    : 'No bids were submitted for this tender.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {data?.unsealedBids?.map((b: any) => (
                    <div key={b.id} className="py-3 flex justify-between items-center font-mono">
                      <div>
                        <span className="font-bold text-procure-300">{b.bid_reference}</span>
                        <span className="text-slate-300 ml-2 font-sans font-medium">{b.company_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>{b.completion_days} days</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <AiEvaluationView
              tenderId={tenderId}
              tenderStatus={currentStatus}
              onEvaluationComplete={() => {
                loadDetails();
                onRefresh();
              }}
            />
          )}

          {activeTab === 'risk' && (
            <TenderRiskAnalysisView tenderId={tenderId} />
          )}
        </div>
      </div>

      {/* Bidder Eligibility Screening Console */}
      <EligibilityReportModal
        tenderId={tenderId}
        isOpen={isEligibilityModalOpen}
        onClose={() => setIsEligibilityModalOpen(false)}
        onRefresh={() => {
          loadDetails();
          onRefresh();
        }}
      />

      {/* Official Bid Opening & Tamper Verification Console */}
      <BidOpeningModal
        tenderId={tenderId}
        isOpen={isBidOpeningModalOpen}
        onClose={() => setIsBidOpeningModalOpen(false)}
        onRefresh={() => {
          loadDetails();
          onRefresh();
        }}
      />

      {/* Sealed Bid Submission Modal */}
      {data?.tender && (
        <SealedBidSubmissionModal
          tender={data.tender}
          isOpen={isSubmitBidModalOpen}
          onClose={() => setIsSubmitBidModalOpen(false)}
          onSuccess={() => {
            loadDetails();
            onRefresh();
            setSuccess('Cryptographic sealed bid submitted and locked.');
          }}
        />
      )}

      {/* Human-in-the-Loop Decision Workflow Console */}
      <DecisionWorkflowModal
        tenderId={tenderId}
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        onSuccess={() => {
          loadDetails();
          onRefresh();
          setSuccess('Government procurement decision officially recorded & locked.');
        }}
      />
    </div>
  );
};
