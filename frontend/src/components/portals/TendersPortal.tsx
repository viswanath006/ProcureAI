import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { OfficerDashboard } from '../tenders/OfficerDashboard';
import { TenderFormModal } from '../tenders/TenderFormModal';
import { TenderDetailModal } from '../tenders/TenderDetailModal';
import { SealedBidSubmissionModal } from '../bids/SealedBidSubmissionModal';

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

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
    <div style={{ fontFamily: FONT }} className="space-y-6">
      {/* View Switcher for Officers/Admins */}
      {isOfficerOrAdmin && (
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-200/90 pb-4">
          <div className="inline-flex p-1 rounded-full bg-[#F4F4F5] border border-gray-200/90 gap-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out flex items-center gap-2 cursor-pointer select-none ${
                viewMode === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Executive Dashboard</span>
            </button>

            <button
              onClick={() => setViewMode('registry')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out flex items-center gap-2 cursor-pointer select-none ${
                viewMode === 'registry'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span>Full Registry ({tenders.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadTenders}
              className="p-2 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs transition-colors shadow-xs cursor-pointer"
              title="Refresh Registry"
            >
              <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-6.19" />
              </svg>
            </button>

            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-4 py-1.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="text-sm leading-none">+</span>
              <span>Create New Tender</span>
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 shadow-xs">
          <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>{actionError}</div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 shadow-xs">
          <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>{actionSuccess}</div>
        </div>
      )}

      {/* View Mode Panels with Smooth Fade */}
      <div key={viewMode} className="tab-pane-fade">
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
                  placeholder="Search tender reference, title, or department..."
                  className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#22C55E] shadow-xs transition-colors"
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#22C55E'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
                <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                {['ALL', 'DRAFT', 'PUBLISHED', 'OPEN', 'CLOSED', 'UNDER_EVALUATION', 'RECOMMENDATION_READY', 'DECISION_MADE', 'COMPLETED'].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors duration-150 cursor-pointer select-none ${
                        statusFilter === st
                          ? 'bg-[#18181B] text-white shadow-xs'
                          : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
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
              <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                <span>Tenders ({filteredTenders.length})</span>
                <span>Click to inspect</span>
              </div>

              {isLoading ? (
                <div className="card-glass p-8 text-center text-xs text-slate-400 animate-pulse">
                  Loading tenders...
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
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        inlineSelectedTender?.id === t.id
                          ? 'bg-blue-50/60 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold text-blue-600">
                          {t.reference_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            t.status === 'published' || t.status === 'open' || t.status === 'OPEN' || t.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : t.status === 'draft' || t.status === 'DRAFT'
                              ? 'bg-gray-100 text-gray-600 border border-gray-200'
                              : t.status === 'closed' || t.status === 'CLOSED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{t.title}</h4>

                      <div className="text-[11px] text-gray-500 mt-2 flex justify-between">
                        <span className="truncate max-w-[140px] font-medium">{t.department}</span>
                        <span className="text-gray-400">
                          {t.submission_deadline_at
                            ? `Closes ${new Date(t.submission_deadline_at).toLocaleDateString()}`
                            : 'Open'}
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
                <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 shadow-xs space-y-6">
                  <div className="border-b border-gray-100 pb-5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-blue-600">
                        {inlineSelectedTender.reference_number}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200 uppercase">
                        {inlineSelectedTender.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mt-2">
                      {inlineSelectedTender.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      {inlineSelectedTender.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 font-medium block">STATUS</span>
                        <span className="font-semibold text-gray-900 uppercase">
                          {inlineSelectedTender.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-medium block">BUDGET</span>
                        <span className="font-bold text-emerald-600">
                          {inlineSelectedTender.estimated_budget_paisa
                            ? `₹${(Number(inlineSelectedTender.estimated_budget_paisa) / 10000000).toFixed(2)} Cr`
                            : 'Confidential'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-medium block">DEADLINE</span>
                        <span className="font-semibold text-amber-700">
                          {inlineSelectedTender.submission_deadline_at
                            ? new Date(inlineSelectedTender.submission_deadline_at).toLocaleDateString()
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-medium block">DEPARTMENT</span>
                        <span className="text-gray-700 font-medium truncate block">
                          {inlineSelectedTender.department}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Officer Actions: Open Full Dossier */}
                  {isOfficerOrAdmin && (
                    <div className="p-4 rounded-xl bg-[#FBFBFD] border border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="text-xs font-bold text-gray-900">
                          Tender Lifecycle Controller
                        </span>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Inspect AI criteria, sealed bidder envelopes, and execute sovereign award transitions.
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedTenderIdForDetail(inlineSelectedTender.id)}
                        className="px-4 py-2 rounded-full bg-[#18181B] hover:bg-black text-white font-medium text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Inspect Dossier & Lifecycle</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Bidder Action: Submit Sealed Bid */}
                  {user?.role_code === 'BIDDER' && (
                    <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <h4 className="text-sm font-bold text-blue-900">
                          Submit Your Cryptographic Sealed Bid
                        </h4>
                      </div>
                      <p className="text-xs text-blue-800/80">
                        Your bid will be mathematically encrypted (AES-256) and cannot be inspected until the official deadline passes.
                      </p>

                      <button
                        onClick={() => setIsSealedBidModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-full bg-[#18181B] hover:bg-black text-white font-medium text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Submit Sealed Bid Envelope</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-400 shadow-xs">
                  Select a tender from the registry to view its details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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
            setActionSuccess('Bid submitted successfully.');
          }}
        />
      )}
    </div>
  );
};
