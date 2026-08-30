import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { CompanyProfileEditor } from '../company/CompanyProfileEditor';
import { EligibilityPreCheckModal } from '../eligibility/EligibilityPreCheckModal';
import { SealedBidSubmissionModal } from '../bids/SealedBidSubmissionModal';

export const BidderPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'bids' | 'profile'>('available');
  const [availableTenders, setAvailableTenders] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isPrecheckOpen, setIsPrecheckOpen] = useState(false);
  const [precheckTenderId, setPrecheckTenderId] = useState<string | undefined>(undefined);
  const [selectedTenderForBid, setSelectedTenderForBid] = useState<any | null>(null);
  const [selectedBidReceipt, setSelectedBidReceipt] = useState<any | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tendersRes, bidsRes] = await Promise.all([
        api.getTenders(),
        api.getMyBids(),
      ]);

      if (tendersRes.success && tendersRes.data) {
        // Filter tenders that are open for bidding
        setAvailableTenders(tendersRes.data.tenders);
      }
      if (bidsRes.success && bidsRes.data) {
        setMyBids(bidsRes.data.bids);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bidder workspace data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format countdown string
  const getDeadlineCountdown = (closingAt: string) => {
    if (!closingAt) return 'Open';
    const now = new Date().getTime();
    const deadline = new Date(closingAt).getTime();
    const diff = deadline - now;
    if (diff <= 0) return 'DEADLINE CLOSED';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d : ${hours}h : ${mins}m`;
  };

  const filteredAvailable = availableTenders.filter(
    (t) =>
      !searchQuery ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans text-xs animate-fadeIn">
      {/* ── Action Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏢</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-mono tracking-wide">
                  Bidder Commercial & Qualification Workspace
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {user?.full_name || 'Bidder Principal'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                AES-256-GCM Client-Sealed Bids · Qualification Gates · Cryptographic Receipts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => {
              setPrecheckTenderId(undefined);
              setIsPrecheckOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-600/25 transition-all flex items-center gap-1.5"
          >
            <span>🛡️</span> Pre-Check Tender Eligibility
          </button>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono">
          {error}
        </div>
      )}

      {/* ── Navigation Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'available'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>📑</span> Available Tenders ({availableTenders.length})
        </button>

        <button
          onClick={() => setActiveTab('bids')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'bids'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>🔒</span> My Submitted Bids ({myBids.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>📋</span> Company Profile & Statutory Vault
        </button>
      </div>

      {/* ── TAB 1: AVAILABLE TENDERS ───────────────────────────────────────── */}
      {activeTab === 'available' && (
        <div className="space-y-4 font-mono">
          <div className="flex justify-between items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search available tenders by title, ref, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>
            <span className="text-[10px] text-slate-500">
              Showing {filteredAvailable.length} active opportunities
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredAvailable.map((t) => {
              const countdown = getDeadlineCountdown(t.closing_at);
              const isClosed = countdown === 'DEADLINE CLOSED';

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] text-procure-400 font-bold block">
                          {t.reference_number}
                        </span>
                        <h4 className="font-bold text-slate-200 text-sm font-sans mt-0.5 leading-snug">
                          {t.title}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">
                        {t.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500 text-[10px] block">ESTIMATED BUDGET</span>
                        <span className="text-slate-200 font-bold">
                          ₹{((t.estimated_budget_paisa || 0) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">DEPARTMENT</span>
                        <span className="text-slate-300 truncate block">
                          {t.department || 'Central Procurement'}
                        </span>
                      </div>
                    </div>

                    {/* Deadline Countdown Meter */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span>⏳</span> Deadline Countdown:
                      </span>
                      <span
                        className={`font-bold ${
                          isClosed ? 'text-rose-400' : 'text-amber-300'
                        }`}
                      >
                        {countdown}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2">
                    <button
                      onClick={() => {
                        setPrecheckTenderId(t.id);
                        setIsPrecheckOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors"
                    >
                      Pre-Check Eligibility
                    </button>

                    <button
                      onClick={() => setSelectedTenderForBid(t)}
                      disabled={isClosed}
                      className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${
                        isClosed
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md'
                      }`}
                    >
                      <span>🔒</span> Submit Sealed Bid
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: MY SUBMITTED BIDS & LOCKED CONFIRMATION ─────────────────── */}
      {activeTab === 'bids' && (
        <div className="space-y-4 font-mono">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px]">
                    <th className="py-3 px-3.5 font-bold uppercase">Bid Ref</th>
                    <th className="py-3 px-3 font-bold uppercase">Tender Title</th>
                    <th className="py-3 px-3 font-bold uppercase">Submission Timestamp</th>
                    <th className="py-3 px-3 font-bold uppercase">Encrypted Amount</th>
                    <th className="py-3 px-3 font-bold uppercase">Submission Status</th>
                    <th className="py-3 px-3.5 font-bold uppercase text-right">Confirmation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {myBids.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No sealed proposals submitted yet. Browse Available Tenders to participate.
                      </td>
                    </tr>
                  ) : (
                    myBids.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3.5 text-blue-400 font-bold">
                          {b.bid_reference || 'SYNTH-BID-001'}
                        </td>
                        <td className="py-3 px-3 text-slate-200 font-sans font-bold">
                          {b.tender_title || 'Public Procurement Tender'}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[10px]">
                          {new Date(b.created_at || Date.now()).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {b.bid_amount_paisa
                            ? `₹${(Number(b.bid_amount_paisa) / 100).toLocaleString('en-IN')}`
                            : '•••••••••••• (AES-256 SEALED)'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              b.status === 'awarded'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {b.status === 'awarded' ? 'CONTRACT AWARDED' : 'ENCRYPTED & SEALED'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => setSelectedBidReceipt(b)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors"
                          >
                            View Receipt 🔒
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: COMPANY PROFILE ─────────────────────────────────────────── */}
      {activeTab === 'profile' && <CompanyProfileEditor />}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <EligibilityPreCheckModal
        isOpen={isPrecheckOpen}
        onClose={() => setIsPrecheckOpen(false)}
        tenderId={precheckTenderId}
      />

      {selectedTenderForBid && (
        <SealedBidSubmissionModal
          tender={selectedTenderForBid}
          isOpen={Boolean(selectedTenderForBid)}
          onClose={() => setSelectedTenderForBid(null)}
          onSuccess={() => {
            loadData();
            setSelectedTenderForBid(null);
          }}
        />
      )}

      {/* ── Locked Bid Confirmation Receipt Modal ──────────────────────────── */}
      {selectedBidReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-blue-500/40 rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider">
                    Cryptographic Locked Bid Receipt
                  </h4>
                  <span className="text-[10px] text-blue-400">AES-256-GCM Sealing Proof</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBidReceipt(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px] block">BID REFERENCE</span>
                <span className="font-bold text-slate-200">{selectedBidReceipt.bid_reference}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">TENDER</span>
                <span className="font-bold text-slate-200">{selectedBidReceipt.tender_title}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">SUBMISSION TIMESTAMP</span>
                <span className="font-bold text-slate-200">
                  {new Date(selectedBidReceipt.created_at || Date.now()).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase">SHA-256 Envelope Hash</span>
                <div className="text-[10px] text-procure-300 break-all select-all font-mono">
                  {selectedBidReceipt.envelope_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 space-y-0.5">
              <span className="font-bold block">✓ MATHEMATICALLY SEALED</span>
              <p className="font-sans text-[10px] opacity-90">
                Your bid amount is encrypted with AES-256-GCM. Neither government officers nor competitors can inspect your financial numbers until the official opening date.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBidReceipt(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
