import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
=======
import { createPortal } from 'react-dom';
>>>>>>> 4169a4f (Recreated professional README and organized assets)
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { CompanyProfileEditor } from '../company/CompanyProfileEditor';
import { EligibilityPreCheckModal } from '../eligibility/EligibilityPreCheckModal';
import { SealedBidSubmissionModal } from '../bids/SealedBidSubmissionModal';

<<<<<<< HEAD
=======
const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

>>>>>>> 4169a4f (Recreated professional README and organized assets)
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
<<<<<<< HEAD
        // Filter tenders that are open for bidding
=======
>>>>>>> 4169a4f (Recreated professional README and organized assets)
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
<<<<<<< HEAD
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
=======
    <div style={{ fontFamily: FONT }} className="space-y-6 text-xs animate-fadeIn">
      {/* ── Action Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  Bidder Commercial & Qualification Workspace
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {user?.full_name || 'Bidder Principal'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                AES-256-GCM Client-Sealed Bids · Qualification Gates · Cryptographic Receipts
              </p>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <div className="flex items-center gap-2 font-mono">
=======
        <div className="flex items-center gap-2.5">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
          <button
            onClick={() => {
              setPrecheckTenderId(undefined);
              setIsPrecheckOpen(true);
            }}
<<<<<<< HEAD
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-600/25 transition-all flex items-center gap-1.5"
          >
            <span>🛡️</span> Pre-Check Tender Eligibility
=======
            className="px-4 py-1.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Pre-Check Eligibility</span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
          </button>
          <button
            onClick={loadData}
            disabled={isLoading}
<<<<<<< HEAD
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            🔄
=======
            className="p-2 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            title="Refresh"
          >
            <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-6.19" />
            </svg>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
          </button>
        </div>
      </div>

      {error && (
<<<<<<< HEAD
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono">
=======
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
          {error}
        </div>
      )}

      {/* ── Navigation Tabs ───────────────────────────────────────────────── */}
<<<<<<< HEAD
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
=======
      <div className="inline-flex p-1 rounded-full bg-[#F4F4F5] border border-gray-200/90 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-1.5 rounded-full font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out flex items-center gap-2 cursor-pointer select-none ${
            activeTab === 'available'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>Available Tenders ({availableTenders.length})</span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
        </button>

        <button
          onClick={() => setActiveTab('bids')}
<<<<<<< HEAD
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'bids'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>🔒</span> My Submitted Bids ({myBids.length})
=======
          className={`px-4 py-1.5 rounded-full font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out flex items-center gap-2 cursor-pointer select-none ${
            activeTab === 'bids'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>My Submitted Bids ({myBids.length})</span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
        </button>

        <button
          onClick={() => setActiveTab('profile')}
<<<<<<< HEAD
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
=======
          className={`px-4 py-1.5 rounded-full font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out flex items-center gap-2 cursor-pointer select-none ${
            activeTab === 'profile'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Company Profile & Vault</span>
        </button>
      </div>

      {/* ── Active Tab Panes with Smooth Fade ─────────────────────────────── */}
      <div key={activeTab} className="tab-pane-fade">
        {/* ── TAB 1: AVAILABLE TENDERS ───────────────────────────────────────── */}
        {activeTab === 'available' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search available tenders by title, ref, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
<<<<<<< HEAD
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>
            <span className="text-[10px] text-slate-500">
=======
                className="w-full px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-900 text-xs placeholder:text-gray-400 focus:border-blue-500 focus:outline-none shadow-xs transition-all"
              />
            </div>
            <span className="text-xs text-gray-500">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
              Showing {filteredAvailable.length} active opportunities
            </span>
          </div>

<<<<<<< HEAD
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
=======
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
            {filteredAvailable.map((t) => {
              const countdown = getDeadlineCountdown(t.closing_at);
              const isClosed = countdown === 'DEADLINE CLOSED';

              return (
                <div
                  key={t.id}
<<<<<<< HEAD
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
=======
                  className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-xs transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-semibold text-blue-600 block">
                          {t.reference_number}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm mt-0.5 leading-snug">
                          {t.title}
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap uppercase">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                        {t.status}
                      </span>
                    </div>

<<<<<<< HEAD
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500 text-[10px] block">ESTIMATED BUDGET</span>
                        <span className="text-slate-200 font-bold">
=======
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-gray-400 font-semibold text-[10px] uppercase block">ESTIMATED BUDGET</span>
                        <span className="text-gray-900 font-bold">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                          ₹{((t.estimated_budget_paisa || 0) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
<<<<<<< HEAD
                        <span className="text-slate-500 text-[10px] block">DEPARTMENT</span>
                        <span className="text-slate-300 truncate block">
=======
                        <span className="text-gray-400 font-semibold text-[10px] uppercase block">DEPARTMENT</span>
                        <span className="text-gray-700 truncate block">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                          {t.department || 'Central Procurement'}
                        </span>
                      </div>
                    </div>

                    {/* Deadline Countdown Meter */}
<<<<<<< HEAD
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span>⏳</span> Deadline Countdown:
                      </span>
                      <span
                        className={`font-bold ${
                          isClosed ? 'text-rose-400' : 'text-amber-300'
=======
                    <div className="p-3 rounded-xl bg-[#FBFBFD] border border-gray-200 flex justify-between items-center text-xs">
                      <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                        <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>Deadline Countdown:</span>
                      </span>
                      <span
                        className={`font-semibold ${
                          isClosed ? 'text-rose-600' : 'text-amber-700'
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                        }`}
                      >
                        {countdown}
                      </span>
                    </div>
                  </div>

<<<<<<< HEAD
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2">
=======
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center gap-2">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                    <button
                      onClick={() => {
                        setPrecheckTenderId(t.id);
                        setIsPrecheckOpen(true);
                      }}
<<<<<<< HEAD
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors"
=======
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium transition-colors shadow-xs cursor-pointer"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                    >
                      Pre-Check Eligibility
                    </button>

                    <button
                      onClick={() => setSelectedTenderForBid(t)}
                      disabled={isClosed}
<<<<<<< HEAD
                      className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${
                        isClosed
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md'
                      }`}
                    >
                      <span>🔒</span> Submit Sealed Bid
=======
                      className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                        isClosed
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          : 'bg-[#18181B] hover:bg-black text-white'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <span>Submit Sealed Bid</span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
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
<<<<<<< HEAD
        <div className="space-y-4 font-mono">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px]">
=======
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#F9FAFB] text-gray-500 text-[10px]">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                    <th className="py-3 px-3.5 font-bold uppercase">Bid Ref</th>
                    <th className="py-3 px-3 font-bold uppercase">Tender Title</th>
                    <th className="py-3 px-3 font-bold uppercase">Submission Timestamp</th>
                    <th className="py-3 px-3 font-bold uppercase">Encrypted Amount</th>
                    <th className="py-3 px-3 font-bold uppercase">Submission Status</th>
                    <th className="py-3 px-3.5 font-bold uppercase text-right">Confirmation</th>
                  </tr>
                </thead>
<<<<<<< HEAD
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {myBids.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
=======
                <tbody className="divide-y divide-gray-100 text-xs">
                  {myBids.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                        No sealed proposals submitted yet. Browse Available Tenders to participate.
                      </td>
                    </tr>
                  ) : (
                    myBids.map((b) => (
<<<<<<< HEAD
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
=======
                      <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3.5 text-blue-600 font-bold">
                          {b.bid_reference || 'SYNTH-BID-001'}
                        </td>
                        <td className="py-3 px-3 text-gray-900 font-semibold">
                          {b.tender_title || 'Public Procurement Tender'}
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-[11px]">
                          {new Date(b.created_at || Date.now()).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-gray-700 font-medium">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                          {b.bid_amount_paisa
                            ? `₹${(Number(b.bid_amount_paisa) / 100).toLocaleString('en-IN')}`
                            : '•••••••••••• (AES-256 SEALED)'}
                        </td>
                        <td className="py-3 px-3">
                          <span
<<<<<<< HEAD
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              b.status === 'awarded'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
=======
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              b.status === 'awarded'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                            }`}
                          >
                            {b.status === 'awarded' ? 'CONTRACT AWARDED' : 'ENCRYPTED & SEALED'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => setSelectedBidReceipt(b)}
<<<<<<< HEAD
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors"
=======
                            className="px-3 py-1 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium shadow-xs transition-colors"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
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
<<<<<<< HEAD
=======
      </div>
>>>>>>> 4169a4f (Recreated professional README and organized assets)

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
<<<<<<< HEAD
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
=======
      {selectedBidReceipt && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl space-y-4 text-xs my-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔒</span>
                <div>
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider">
                    Cryptographic Locked Bid Receipt
                  </h4>
                  <span className="text-[10px] text-blue-600 font-medium">AES-256-GCM Sealing Proof</span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                </div>
              </div>
              <button
                onClick={() => setSelectedBidReceipt(null)}
<<<<<<< HEAD
                className="text-slate-400 hover:text-white"
=======
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
              >
                ✕
              </button>
            </div>

<<<<<<< HEAD
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
=======
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-400 font-semibold text-[10px] uppercase block">BID REFERENCE</span>
                <span className="font-bold text-gray-900">{selectedBidReceipt.bid_reference}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold text-[10px] uppercase block">TENDER</span>
                <span className="font-semibold text-gray-900">{selectedBidReceipt.tender_title}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold text-[10px] uppercase block">SUBMISSION TIMESTAMP</span>
                <span className="text-gray-700">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                  {new Date(selectedBidReceipt.created_at || Date.now()).toLocaleString('en-IN')}
                </span>
              </div>

<<<<<<< HEAD
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase">SHA-256 Envelope Hash</span>
                <div className="text-[10px] text-procure-300 break-all select-all font-mono">
=======
              <div className="p-3 rounded-xl bg-[#F9FAFB] border border-gray-200 space-y-1">
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">SHA-256 Envelope Hash</span>
                <div className="text-xs text-gray-800 break-all select-all font-medium">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                  {selectedBidReceipt.envelope_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </div>
            </div>

<<<<<<< HEAD
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 space-y-0.5">
              <span className="font-bold block">✓ MATHEMATICALLY SEALED</span>
              <p className="font-sans text-[10px] opacity-90">
=======
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <span className="font-bold block">✓ MATHEMATICALLY SEALED</span>
              <p className="opacity-90 leading-relaxed text-[11px]">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                Your bid amount is encrypted with AES-256-GCM. Neither government officers nor competitors can inspect your financial numbers until the official opening date.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBidReceipt(null)}
<<<<<<< HEAD
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
=======
                className="px-4 py-1.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
              >
                Close Receipt
              </button>
            </div>
          </div>
<<<<<<< HEAD
        </div>
=======
        </div>,
        document.body
>>>>>>> 4169a4f (Recreated professional README and organized assets)
      )}
    </div>
  );
};
