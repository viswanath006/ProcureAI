import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

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
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-8 text-center space-y-3 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Loading tender details...</p>
        </div>
      </div>,
      document.body
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

  return createPortal(
    <div style={{ fontFamily: FONT }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col p-6 sm:p-8 space-y-6 animate-scale-up border border-gray-200/90 shadow-2xl text-gray-900 my-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600">
                {data?.tender?.reference_number || 'Loading...'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                  currentStatus === 'PUBLISHED' || currentStatus === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : currentStatus === 'DRAFT'
                    ? 'bg-gray-100 text-gray-700 border border-gray-200'
                    : currentStatus === 'CLOSED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}
              >
                {currentStatus}
              </span>
              <span className="text-[10px] text-gray-400 uppercase font-medium">
                Category: {data?.tender?.category}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{data?.tender?.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{data?.tender?.department}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── 9-Stage Visual Lifecycle Stepper ──────────────────────── */}
        <div className="p-4 rounded-2xl bg-[#FBFBFD] border border-gray-200 space-y-3">
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
            <span>TENDER PROGRESS TRACKER</span>
            <span>STAGE {currentStageIndex + 1} OF {LIFECYCLE_STAGES.length}</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 text-[10px]">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stage}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs ring-1 ring-blue-500/20'
                      : isPast
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  <div className="text-[9px] opacity-70 mb-0.5">0{idx + 1}</div>
                  <div className="truncate font-medium text-[10px]">{stage.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controller Bar */}
        {isOfficerOrAdmin && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FBFBFD] border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
            <div>
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Next Step</span>
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Current status is <strong className="text-blue-600">[{currentStatus}]</strong>. Select an action below.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentStatus === 'DRAFT' && (
                <button
                  onClick={handlePublish}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Publish Tender</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}

              {user?.role_code === 'BIDDER' && (currentStatus === 'PUBLISHED' || currentStatus === 'OPEN') && (
                <button
                  onClick={() => setIsSubmitBidModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  <span>Submit Bid</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}

              {(currentStatus === 'PUBLISHED' || currentStatus === 'OPEN') && user?.role_code !== 'BIDDER' && (
                <button
                  onClick={handleClose}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Close Bidding</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}

              {currentStatus === 'CLOSED' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsBidOpeningModalOpen(true)}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
                    <span>Open Bids & Check Authenticity</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <button
                    onClick={handleRevealBids}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Unlock & Reveal Bids</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}

              {currentStatus === 'BIDS_REVEALED' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsBidOpeningModalOpen(true)}
                    className="px-4 py-2 rounded-full bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium border border-gray-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
                    <span>Check Security Log</span>
                  </button>

                  <button
                    onClick={() => setIsEligibilityModalOpen(true)}
                    className="px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <span>Check Bidder Requirements</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>

                  <button
                    onClick={handleStartEvaluation}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /></svg>
                    <span>Start AI Review & Scoring</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}

              {currentStatus === 'UNDER_EVALUATION' && (
                <button
                  onClick={() => handleTransition('RECOMMENDATION_READY')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Complete AI Review</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}

              {currentStatus === 'RECOMMENDATION_READY' && (
                <button
                  onClick={() => setIsDecisionModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18" /><path d="m3 7 9-4 9 4" /><path d="M6 10l-3 5a3 3 0 0 0 6 0l-3-5Z" /><path d="M18 10l-3 5a3 3 0 0 0 6 0l-3-5Z" /><path d="M4 21h16" /></svg>
                  <span>Award Contract / Make Decision</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}

              {['DECISION_MADE', 'AWARDED', 'COMPLETED'].includes(currentStatus) && (
                <button
                  onClick={() => setIsDecisionModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  <span>View Final Decision</span>
                </button>
              )}

              {currentStatus === 'DECISION_MADE' && (
                <button
                  onClick={() => handleTransition('COMPLETED')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>Complete Tender</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Decision Form if toggled */}
        {showDecisionForm && (
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4 animate-fade-in text-xs">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18" /><path d="m3 7 9-4 9 4" /><path d="M6 10l-3 5a3 3 0 0 0 6 0l-3-5Z" /><path d="M18 10l-3 5a3 3 0 0 0 6 0l-3-5Z" /><path d="M4 21h16" /></svg>
                <span>Official Decision Record (Officer in Charge)</span>
              </h4>
              <span className="text-[10px] text-amber-700 font-medium">Audit & Activity Log</span>
            </div>

            <form onSubmit={handleRecordDecision} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">DECISION</label>
                  <select
                    value={decisionType}
                    onChange={(e) => setDecisionType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="award">Award Contract</option>
                    <option value="reject">Reject All Bids</option>
                    <option value="defer">Defer Decision</option>
                  </select>
                </div>

                {decisionType === 'award' && (
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">SELECT WINNING BID</label>
                    <select
                      value={selectedBidId}
                      onChange={(e) => setSelectedBidId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-blue-500"
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
                <label className="text-[10px] text-gray-500 font-semibold uppercase block mb-1">
                  OFFICIAL RATIONALE (MIN 20 CHARS)
                </label>
                <textarea
                  rows={2}
                  required
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why this decision is in the best interest of the government and public expenditure..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* AI Override Rule Check */}
              <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={followedAi}
                    onChange={(e) => setFollowedAi(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-900 font-medium">
                    Decision conforms with AI recommendation ranking
                  </span>
                </label>

                {!followedAi && (
                  <div className="pt-2 space-y-2 border-t border-gray-100">
                    <span className="text-amber-700 font-bold block text-[11px] flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      <span>Mandatory Override Requirement:</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={overrideReasonType}
                        onChange={(e) => setOverrideReasonType(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-900 text-[11px] focus:outline-none focus:border-blue-500"
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
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-900 text-[11px] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 rounded-full bg-[#18181B] hover:bg-black text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                Submit Official Procurement Decision
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 shadow-xs">
            <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 shadow-xs">
            <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            <div>{success}</div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="inline-flex p-1 rounded-full bg-[#F4F4F5] border border-gray-200/90 gap-1 flex-wrap text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out cursor-pointer select-none ${
              activeTab === 'overview' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out cursor-pointer select-none ${
              activeTab === 'requirements' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            Requirements ({data?.requirements?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('criteria')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out cursor-pointer select-none ${
              activeTab === 'criteria' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            Scoring Rules ({data?.criteria?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out cursor-pointer select-none ${
              activeTab === 'bids' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            Submitted Bids ({data?.bidsCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out cursor-pointer select-none ${
              activeTab === 'ai' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            AI Scores ({data?.recommendations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out cursor-pointer select-none flex items-center gap-1.5 ${
              activeTab === 'risk' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <span>Risk & Fairness Checks</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#FBFBFD] border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block">ESTIMATED VALUE</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {data?.tender?.estimated_budget_paisa
                      ? `₹${(Number(data.tender.estimated_budget_paisa) / 10000000).toFixed(2)} Cr`
                      : 'Confidential'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block">OPENING DATE</span>
                  <span className="text-gray-700 font-medium">
                    {data?.tender?.submission_start_at
                      ? new Date(data.tender.submission_start_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block">SUBMISSION DEADLINE</span>
                  <span className="text-amber-700 font-bold">
                    {data?.tender?.submission_deadline_at
                      ? new Date(data.tender.submission_deadline_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block">AUTHORING OFFICER</span>
                  <span className="text-gray-700 truncate block font-medium">
                    {data?.tender?.creator_name || 'Government Officer Alpha'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FBFBFD] border border-gray-200 space-y-2">
                <span className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">
                  SCOPE OF WORK & SPECIFICATIONS
                </span>
                <p className="text-gray-600 leading-relaxed">{data?.tender?.description}</p>
              </div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="space-y-2.5">
              {data?.requirements?.map((req: any) => (
                <div key={req.id} className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1 shadow-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                        {req.requirement_type}
                      </span>
                      <span className="font-semibold text-gray-900">{req.title}</span>
                    </div>
                    {req.is_mandatory && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">{req.description}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'criteria' && (
            <div className="space-y-2.5">
              {data?.criteria?.map((crit: any) => (
                <div key={crit.id} className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1 shadow-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                        {crit.criteria_type}
                      </span>
                      <span className="font-semibold text-gray-900">{crit.name}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Weight: {crit.weight}%
                    </span>
                  </div>
                  {crit.description && <p className="text-[11px] text-gray-500">{crit.description}</p>}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bids' && (
            <div className="space-y-4">
              <BidderComparisonChart />

              {data?.unsealedBids?.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  {currentStageIndex < 4
                    ? 'Bids are safely locked in the secret vault until the deadline passes.'
                    : 'No bids were submitted for this tender.'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data?.unsealedBids?.map((b: any) => (
                    <div key={b.id} className="py-3 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-blue-600">{b.bid_reference}</span>
                        <span className="text-gray-900 ml-2 font-medium">{b.company_name}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-3">
                        <span>{b.completion_days} days</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-semibold uppercase">{b.status}</span>
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
            setSuccess('Secret bid submitted and safely locked.');
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
          setSuccess('Tender decision saved and permanently recorded.');
        }}
      />
    </div>,
    document.body
  );
};
