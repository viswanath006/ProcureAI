import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { OfficerDashboard } from '../tenders/OfficerDashboard';
import { TenderFormModal } from '../tenders/TenderFormModal';
import { TenderDetailModal } from '../tenders/TenderDetailModal';
import { SealedBidSubmissionModal } from '../bids/SealedBidSubmissionModal';

export const TendersPortal: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'dashboard' | 'registry'>('dashboard');
  const [tenders, setTenders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTenderIdForDetail, setSelectedTenderIdForDetail] = useState<string | null>(null);

  // Selected tender for inline bidder view
  const [inlineSelectedTender, setInlineSelectedTender] = useState<any | null>(null);
  const [isSealedBidModalOpen, setIsSealedBidModalOpen] = useState(false);

  const isOfficerOrAdmin = ['GOVT_OFFICER', 'ADMIN'].includes(user?.role_code || '');

  const loadTenders = async () => {
    setIsLoading(true);
    setActionError(null);
    const res = await api.getTenders();
    if (res.success && res.data) {
      setTenders(res.data.tenders);
      if (res.data.tenders.length > 0 && !inlineSelectedTender) {
        setInlineSelectedTender(res.data.tenders[0]);
      }
    } else {
      setActionError(res.error?.message || 'Failed to fetch tenders');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTenders();
  }, []);

  const filteredTenders = tenders.filter((t) => {
    const matchesStatus =
      statusFilter === 'ALL' || t.status?.toUpperCase() === statusFilter.toUpperCase();
    const matchesSearch =
      !searchQuery ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Switcher for Officers/Admins */}
      {isOfficerOrAdmin && (
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all flex items-center gap-2 ${
                viewMode === 'dashboard'
                  ? 'bg-gradient-to-r from-procure-600 to-indigo-600 text-white shadow-lg shadow-procure-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>📊</span> Executive Dashboard
            </button>

            <button
              onClick={() => setViewMode('registry')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all flex items-center gap-2 ${
                viewMode === 'registry'
                  ? 'bg-gradient-to-r from-procure-600 to-indigo-600 text-white shadow-lg shadow-procure-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>📑</span> Full Tender Registry ({tenders.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadTenders}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono"
              title="Refresh"
            >
              🔄
            </button>

            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-1.5"
            >
              <span>+</span> Create Tender
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2 animate-fade-in">
          <span>⚠️</span>
          <div>{actionError}</div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-start gap-2 animate-fade-in">
          <span>✅</span>
          <div>{actionSuccess}</div>
        </div>
      )}

      {/* Mode 1: Executive Dashboard (for officers/admins) */}
      {isOfficerOrAdmin && viewMode === 'dashboard' && (
        <OfficerDashboard
          onSelectTender={(id) => setSelectedTenderIdForDetail(id)}
          onCreateTender={() => setIsFormModalOpen(true)}
        />
      )}

      {/* Mode 2: Full Tender Registry & Detailed View */}
      {(!isOfficerOrAdmin || viewMode === 'registry') && (
        <div className="space-y-6">
          {/* Controls Bar: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, title, or department..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-procure-500/40"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
            </div>

            <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
              {['ALL', 'DRAFT', 'PUBLISHED', 'OPEN', 'CLOSED', 'UNDER_EVALUATION', 'RECOMMENDATION_READY', 'DECISION_MADE', 'COMPLETED'].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === st
                        ? 'bg-procure-600 text-white shadow-md'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tenders List */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>Tenders ({filteredTenders.length})</span>
                <span>Click to inspect</span>
              </div>

              {isLoading ? (
                <div className="card-glass p-8 text-center text-xs text-slate-400 animate-pulse">
                  Querying procurement registry...
                </div>
              ) : filteredTenders.length === 0 ? (
                <div className="card-glass p-8 text-center text-xs text-slate-500">
                  No tenders matching current filter.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTenders.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setInlineSelectedTender(t);
                        if (isOfficerOrAdmin) {
                          setSelectedTenderIdForDetail(t.id);
                        }
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        inlineSelectedTender?.id === t.id
                          ? 'bg-procure-500/10 border-procure-500/50 shadow-md shadow-procure-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-procure-400">
                          {t.reference_number}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                            t.status === 'published' || t.status === 'open' || t.status === 'OPEN' || t.status === 'PUBLISHED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : t.status === 'draft' || t.status === 'DRAFT'
                              ? 'bg-slate-800 text-slate-400'
                              : t.status === 'closed' || t.status === 'CLOSED'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{t.title}</h4>

                      <div className="text-[11px] text-slate-500 mt-2 flex justify-between font-mono">
                        <span className="truncate max-w-[120px]">{t.department}</span>
                        <span>
                          {t.submission_deadline_at
                            ? new Date(t.submission_deadline_at).toLocaleDateString()
                            : 'No deadline'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Pane: Selected Tender Overview / Actions */}
            <div className="lg:col-span-2 space-y-6">
              {inlineSelectedTender ? (
                <div className="card-glass p-6 space-y-6">
                  <div className="border-b border-slate-800 pb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-procure-400">
                        {inlineSelectedTender.reference_number}
                      </span>
                      <span className="badge-neutral text-[10px] font-mono uppercase">
                        {inlineSelectedTender.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100 mt-1">
                      {inlineSelectedTender.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {inlineSelectedTender.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">LIFECYCLE STATUS</span>
                        <span className="font-bold text-slate-200 uppercase">
                          {inlineSelectedTender.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">BUDGET</span>
                        <span className="font-bold text-emerald-400">
                          {inlineSelectedTender.estimated_budget_paisa
                            ? `₹${(Number(inlineSelectedTender.estimated_budget_paisa) / 10000000).toFixed(2)} Cr`
                            : 'Confidential'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">DEADLINE</span>
                        <span className="font-bold text-amber-400">
                          {inlineSelectedTender.submission_deadline_at
                            ? new Date(inlineSelectedTender.submission_deadline_at).toLocaleDateString()
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">DEPARTMENT</span>
                        <span className="text-slate-300 truncate block">
                          {inlineSelectedTender.department}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Officer Actions: Open Full Dossier */}
                  {isOfficerOrAdmin && (
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-200 font-mono">
                          Tender Lifecycle Controller
                        </span>
                        <p className="text-[11px] text-slate-400">
                          View full criteria, requirements, unsealed bids, and trigger state transitions.
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedTenderIdForDetail(inlineSelectedTender.id)}
                        className="px-4 py-2 rounded-lg bg-procure-600 hover:bg-procure-500 text-white font-semibold text-xs font-mono shadow-md transition-colors"
                      >
                        Inspect Dossier & Lifecycle →
                      </button>
                    </div>
                  )}

                  {/* Bidder Action: Submit Sealed Bid */}
                  {user?.role_code === 'BIDDER' && (
                    <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔒</span>
                          <h4 className="text-sm font-bold text-blue-300 font-mono">
                            Cryptographic Sealed Proposal Portal
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
                          AES-256-GCM • SHA-256
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Proposals are encrypted at rest and locked. Commercial values remain strictly confidential until the post-deadline opening ceremony.
                      </p>

                      <button
                        onClick={() => setIsSealedBidModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs font-mono shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <span>🔒 Open Sealed Bid Submission Wizard →</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-glass p-12 text-center text-xs text-slate-500">
                  Select a tender to view details and execute authorized operations.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tender Creation / Edit Modal */}
      <TenderFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          loadTenders();
          setActionSuccess('Tender created successfully.');
        }}
      />

      {/* Tender Detail & Lifecycle Stepper Modal */}
      {selectedTenderIdForDetail && (
        <TenderDetailModal
          tenderId={selectedTenderIdForDetail}
          isOpen={!!selectedTenderIdForDetail}
          onClose={() => setSelectedTenderIdForDetail(null)}
          onRefresh={() => loadTenders()}
        />
      )}

      {/* Cryptographic Sealed Bid Submission Wizard Modal */}
      {inlineSelectedTender && (
        <SealedBidSubmissionModal
          tender={inlineSelectedTender}
          isOpen={isSealedBidModalOpen}
          onClose={() => setIsSealedBidModalOpen(false)}
          onSuccess={() => {
            loadTenders();
            setActionSuccess('Proposal successfully encrypted and locked in sealed registry.');
          }}
        />
      )}
    </div>
  );
};
