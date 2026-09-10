import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
<<<<<<< HEAD
=======
import { CalendarDatePicker } from '../common/CalendarDatePicker';

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
>>>>>>> 4169a4f (Recreated professional README and organized assets)

export const AuditorPortal: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chain' | 'decisions'>('chain');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  // 6-Factor Filter State
  const [filters, setFilters] = useState({
    tender: '',
    user: '',
    company: '',
    event_type: 'ALL',
    start_date: '',
    end_date: '',
    risk_level: 'ALL',
  });

  // Expanded log row details
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [chainRes, decRes, verifyRes] = await Promise.all([
        api.getAuditChainLogs(filters),
        api.getDecisionsHistory(),
        api.verifyAuditChain(),
      ]);

      if (chainRes.success && chainRes.data) {
        setLogs(chainRes.data.logs);
      } else {
        setError(chainRes.error?.message || 'Failed to load cryptographic audit ledger');
      }

      if (decRes.success && decRes.data) {
        setDecisions(decRes.data.decisions);
      }

      if (verifyRes.success && verifyRes.data) {
        setVerificationResult(verifyRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Audit data fetch error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const res = await api.verifyAuditChain();
      if (res.success && res.data) {
        setVerificationResult(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Chain verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    setIsVerifying(true);
    try {
      await api.simulateTamper();
      await loadData();
      const res = await api.verifyAuditChain();
      if (res.success && res.data) {
        setVerificationResult(res.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRestoreChain = async () => {
    setIsVerifying(true);
    try {
      await api.restoreAuditChain();
      await loadData();
      const res = await api.verifyAuditChain();
      if (res.success && res.data) {
        setVerificationResult(res.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      tender: '',
      user: '',
      company: '',
      event_type: 'ALL',
      start_date: '',
      end_date: '',
      risk_level: 'ALL',
    });
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
<<<<<<< HEAD
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
=======
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'LOW':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
>>>>>>> 4169a4f (Recreated professional README and organized assets)
    }
  };

  const isValid = verificationResult?.isValid ?? true;

  return (
<<<<<<< HEAD
    <div className="space-y-6 text-slate-100 font-sans text-xs">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⛓️</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-mono tracking-wide">
                  Tamper-Evident Audit System & Cryptographic Ledger
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-procure-500/20 text-procure-300 border border-procure-500/30">
                  PHASE 11
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                HASH(N) = SHA256(event_data + HASH(N-1)) · Permanent Cryptographic Chaining
=======
    <div style={{ fontFamily: FONT }} className="space-y-6 text-xs">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/90 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  Tamper-Evident CAG Audit System & Cryptographic Ledger
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  CAG Oversight
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                HASH(N) = SHA256(event_data + HASH(N-1)) · Immutable Cryptographic Chaining
>>>>>>> 4169a4f (Recreated professional README and organized assets)
              </p>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => setActiveTab('chain')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chain'
                ? 'bg-procure-600 text-white shadow-lg shadow-procure-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Cryptographic Audit Chain ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'decisions'
                ? 'bg-procure-600 text-white shadow-lg shadow-procure-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Decisions History ({decisions.length})
          </button>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Refresh Ledger"
          >
            🔄
=======
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-full bg-[#F4F4F5] border border-gray-200/90 gap-1">
            <button
              onClick={() => setActiveTab('chain')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out cursor-pointer select-none ${
                activeTab === 'chain'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              Audit Chain ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('decisions')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out cursor-pointer select-none ${
                activeTab === 'decisions'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              Decisions ({decisions.length})
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 transition-colors shadow-xs cursor-pointer"
            title="Refresh Ledger"
          >
            <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-6.19" />
            </svg>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
          </button>
        </div>
      </div>

      {/* ── Cryptographic Verification Status Banner ────────────────────────── */}
      <div
<<<<<<< HEAD
        className={`p-4 rounded-2xl border transition-all ${
          isValid
            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
            : 'bg-rose-500/15 border-rose-500/60 shadow-xl shadow-rose-500/10 animate-pulse'
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold ${
                isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/30 text-rose-400'
              }`}
            >
              {isValid ? '🛡️' : '⚠️'}
            </div>
            <div>
              <h3
                className={`text-base font-black font-mono tracking-wider ${
                  isValid ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {verificationResult?.statusText || (isValid ? '✓ AUDIT CHAIN VALID' : '⚠ AUDIT INTEGRITY FAILURE')}
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
=======
        className={`p-5 rounded-2xl border transition-all ${
          isValid
            ? 'bg-emerald-50/70 border-emerald-200 shadow-xs text-emerald-950'
            : 'bg-rose-50 border-rose-200 shadow-xs text-rose-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
                isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isValid ? (
                <svg className="w-6 h-6 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
            </div>
            <div>
              <h3 className={`text-sm font-bold tracking-tight ${isValid ? 'text-emerald-950' : 'text-rose-950'}`}>
                {verificationResult?.statusText || (isValid ? 'AUDIT CHAIN VALID & IMMUTABLE' : 'AUDIT INTEGRITY FAILURE')}
              </h3>
              <p className={`text-xs mt-0.5 ${isValid ? 'text-emerald-800' : 'text-rose-800'}`}>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                {isValid
                  ? `Cryptographic proof verified across ${verificationResult?.totalBlocks || logs.length} sequential blocks without tampering.`
                  : `TAMPER ALERT: ${verificationResult?.failureDetails?.reason || 'Unauthorized block alteration detected'}`}
              </p>
            </div>
          </div>

<<<<<<< HEAD
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {isVerifying ? (
                <>
                  <div className="w-3 h-3 border-2 border-slate-200 border-t-transparent rounded-full animate-spin" />
=======
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-4 py-2 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                  <span>Verifying Chain...</span>
                </>
              ) : (
                <>
<<<<<<< HEAD
                  <span>🔍</span> Verify Cryptographic Audit Chain
=======
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Verify Cryptographic Audit Chain</span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                </>
              )}
            </button>

            {isValid ? (
              <button
                onClick={handleSimulateTamper}
<<<<<<< HEAD
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-colors"
                title="Demonstrates tamper-detection capability"
              >
                Simulate Tamper ⚠
=======
                className="px-3.5 py-2 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Demonstrates tamper-detection capability"
              >
                <span>Simulate Tamper</span>
                <svg className="w-3.5 h-3.5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
              </button>
            ) : (
              <button
                onClick={handleRestoreChain}
<<<<<<< HEAD
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors"
              >
                Restore Valid Chain ✓
=======
                className="px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Restore Valid Chain</span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
              </button>
            )}
          </div>
        </div>

        {/* Chain Hash Info Bar */}
<<<<<<< HEAD
        <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
          <div>
            <span>Verified Sequential Blocks: </span>
            <strong className="text-slate-200">{verificationResult?.totalBlocks || logs.length}</strong>
          </div>
          <div className="truncate" title={verificationResult?.rootHash || 'Genesis Block Hash'}>
            <span>Root Hash: </span>
            <strong className="text-procure-300">
=======
        <div className={`mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs ${isValid ? 'border-emerald-200 text-emerald-900' : 'border-rose-200 text-rose-900'}`}>
          <div>
            <span>Verified Sequential Blocks: </span>
            <strong className="font-bold">{verificationResult?.totalBlocks || logs.length}</strong>
          </div>
          <div className="truncate" title={verificationResult?.rootHash || 'Genesis Block Hash'}>
            <span>Root Hash: </span>
            <strong className="font-bold">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
              {verificationResult?.rootHash ? `${verificationResult.rootHash.slice(0, 16)}...` : 'Genesis Block'}
            </strong>
          </div>
          <div className="truncate" title={verificationResult?.latestHash || 'Chain Head Hash'}>
            <span>Chain Head Hash: </span>
<<<<<<< HEAD
            <strong className="text-procure-300">
=======
            <strong className="font-bold">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
              {verificationResult?.latestHash ? `${verificationResult.latestHash.slice(0, 16)}...` : 'Latest Verified'}
            </strong>
          </div>
        </div>
      </div>

      {error && (
<<<<<<< HEAD
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono">
=======
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
          {error}
        </div>
      )}

<<<<<<< HEAD
      {/* ── Active View: Cryptographic Audit Chain ──────────────────────────── */}
      {activeTab === 'chain' ? (
        <div className="space-y-4">
          {/* ── 6-Factor Filter Bar ─────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>🎯</span> 6-Factor Auditor Filters
              </span>
              <button
                onClick={handleResetFilters}
                className="text-procure-400 hover:text-procure-300 text-[10px] underline"
=======
      {/* ── Active View: Cryptographic Audit Chain or Decisions ──────────────────────────── */}
      <div key={activeTab} className="tab-pane-fade">
        {activeTab === 'chain' ? (
          <div className="space-y-4">
          {/* ── 6-Factor Filter Bar ─────────────────────────────────────────── */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>6-Factor Auditor Filters</span>
              </span>
              <button
                onClick={handleResetFilters}
                className="text-blue-600 hover:text-blue-700 text-xs font-medium underline"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* 1. Tender */}
              <div>
<<<<<<< HEAD
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">1. Tender Ref / ID</label>
=======
                <label className="text-[10px] text-gray-400 font-semibold block mb-1 uppercase">1. Tender Ref / ID</label>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                <input
                  type="text"
                  placeholder="e.g. PROC-2026..."
                  value={filters.tender}
                  onChange={(e) => setFilters({ ...filters, tender: e.target.value })}
<<<<<<< HEAD
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-600 focus:border-procure-500"
=======
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-gray-200 text-gray-900 text-xs placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                />
              </div>

              {/* 2. User */}
              <div>
<<<<<<< HEAD
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">2. Actor / User</label>
=======
                <label className="text-[10px] text-gray-400 font-semibold block mb-1 uppercase">2. Actor / User</label>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                <input
                  type="text"
                  placeholder="e.g. suresh@..."
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
<<<<<<< HEAD
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-600 focus:border-procure-500"
=======
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-gray-200 text-gray-900 text-xs placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                />
              </div>

              {/* 3. Company */}
              <div>
<<<<<<< HEAD
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">3. Company</label>
=======
                <label className="text-[10px] text-gray-400 font-semibold block mb-1 uppercase">3. Company</label>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                <input
                  type="text"
                  placeholder="e.g. Alpha..."
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
<<<<<<< HEAD
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-600 focus:border-procure-500"
=======
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-gray-200 text-gray-900 text-xs placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                />
              </div>

              {/* 4. Event Type */}
              <div>
<<<<<<< HEAD
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">4. Event Action</label>
                <select
                  value={filters.event_type}
                  onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs"
=======
                <label className="text-[10px] text-gray-400 font-semibold block mb-1 uppercase">4. Event Action</label>
                <select
                  value={filters.event_type}
                  onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                >
                  <option value="ALL">All 16 Event Types</option>
                  <option value="login">login</option>
                  <option value="tender_creation">tender_creation</option>
                  <option value="tender_publication">tender_publication</option>
                  <option value="tender_modification">tender_modification</option>
                  <option value="bidder_registration">bidder_registration</option>
                  <option value="document_upload">document_upload</option>
                  <option value="bid_submission">bid_submission</option>
                  <option value="bid_locking">bid_locking</option>
                  <option value="bid_opening">bid_opening</option>
                  <option value="ai_evaluation">ai_evaluation</option>
                  <option value="recommendation_generation">recommendation_generation</option>
                  <option value="government_approval">government_approval</option>
                  <option value="government_rejection">government_rejection</option>
                  <option value="recommendation_override">recommendation_override</option>
                  <option value="decision_modification_attempt">decision_modification_attempt</option>
                  <option value="suspicious_activity">suspicious_activity</option>
                </select>
              </div>

              {/* 5. Date */}
              <div>
<<<<<<< HEAD
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">5. Start Date</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs"
=======
                <CalendarDatePicker
                  label="5. Start Date"
                  value={filters.start_date}
                  onChange={(val) => setFilters({ ...filters, start_date: val })}
                  placeholder="Filter by date..."
                  align="left"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                />
              </div>

              {/* 6. Risk Level */}
              <div>
<<<<<<< HEAD
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">6. Risk Tier</label>
                <select
                  value={filters.risk_level}
                  onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs"
=======
                <label className="text-[10px] text-gray-400 font-semibold block mb-1 uppercase">6. Risk Tier</label>
                <select
                  value={filters.risk_level}
                  onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-gray-200 text-gray-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                >
                  <option value="ALL">All Risk Tiers</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Cryptographic Audit Chain Ledger Table ───────────────────────── */}
<<<<<<< HEAD
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden font-mono">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px]">
=======
          <div className="rounded-2xl bg-white border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#F9FAFB] text-gray-500 text-[10px]">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                    <th className="py-3 px-3.5 font-bold uppercase">Seq #</th>
                    <th className="py-3 px-3 font-bold uppercase">Timestamp</th>
                    <th className="py-3 px-3 font-bold uppercase">Action</th>
                    <th className="py-3 px-3 font-bold uppercase">Actor & Role</th>
                    <th className="py-3 px-3 font-bold uppercase">Entity</th>
                    <th className="py-3 px-3 font-bold uppercase">Previous Hash</th>
                    <th className="py-3 px-3 font-bold uppercase">Current Hash</th>
                    <th className="py-3 px-3 font-bold uppercase text-center">Status</th>
                  </tr>
                </thead>
<<<<<<< HEAD
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
=======
                <tbody className="divide-y divide-gray-100 text-xs">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                        No audit events matched the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <React.Fragment key={log.id}>
                          <tr
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
<<<<<<< HEAD
                            className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3.5 text-procure-400 font-bold">
                              #{log.chain_sequence}
                            </td>
                            <td className="py-3 px-3 text-slate-400 whitespace-nowrap text-[10px]">
                              {new Date(log.timestamp).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-200 border border-slate-800 font-bold text-[10px]">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                              <div className="font-bold text-[11px] truncate max-w-[140px]">{log.actor}</div>
                              <span className="text-[9px] text-slate-500">{log.role}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-[10px]">
                              <span className="capitalize">{log.entity}</span>
                              <span className={`ml-1.5 px-1 py-0.2 rounded text-[8px] font-bold border ${getRiskBadge(log.risk_level)}`}>
                                {log.risk_level}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[10px] truncate max-w-[90px]" title={log.prev_hash}>
=======
                            className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3.5 text-blue-600 font-bold">
                              #{log.chain_sequence}
                            </td>
                            <td className="py-3 px-3 text-gray-500 whitespace-nowrap text-[11px]">
                              {new Date(log.timestamp).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200 font-medium text-[11px]">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap text-gray-900">
                              <div className="font-semibold text-xs truncate max-w-[140px]">{log.actor}</div>
                              <span className="text-[10px] text-gray-400">{log.role}</span>
                            </td>
                            <td className="py-3 px-3 text-gray-600 text-xs">
                              <span className="capitalize">{log.entity}</span>
                              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${getRiskBadge(log.risk_level)}`}>
                                {log.risk_level}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-400 text-xs truncate max-w-[90px]" title={log.prev_hash}>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                              {log.prev_hash === '0000000000000000000000000000000000000000000000000000000000000000'
                                ? 'GENESIS (0x0)'
                                : `${log.prev_hash.slice(0, 8)}...`}
                            </td>
<<<<<<< HEAD
                            <td className="py-3 px-3 text-procure-300 text-[10px] font-bold truncate max-w-[90px]" title={log.curr_hash}>
                              {log.curr_hash.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
=======
                            <td className="py-3 px-3 text-blue-600 text-xs font-semibold truncate max-w-[90px]" title={log.curr_hash}>
                              {log.curr_hash.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                                ⛓️ LINKED
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Event Details */}
                          {isExpanded && (
<<<<<<< HEAD
                            <tr className="bg-slate-950/80">
                              <td colSpan={8} className="p-4 space-y-2 border-t border-b border-procure-500/20">
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                  <span>Event ID: <strong className="text-white select-all">{log.id}</strong></span>
=======
                            <tr className="bg-[#FBFBFD]">
                              <td colSpan={8} className="p-4 space-y-2 border-t border-b border-gray-200">
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                  <span>Event ID: <strong className="text-gray-900 select-all">{log.id}</strong></span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                                  <span>Sequence: #{log.chain_sequence}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
<<<<<<< HEAD
                                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                    <span className="text-[9px] text-slate-500 block uppercase">Cryptographic Hashes</span>
                                    <div className="text-[10px] text-slate-300 break-all select-all font-mono">
                                      <span className="text-slate-500">PREV: </span>{log.prev_hash}
                                    </div>
                                    <div className="text-[10px] text-procure-300 break-all select-all font-mono font-bold">
                                      <span className="text-slate-500">CURR: </span>{log.curr_hash}
                                    </div>
                                  </div>

                                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                    <span className="text-[9px] text-slate-500 block uppercase">Structured Event Details</span>
                                    <pre className="text-[10px] text-slate-300 overflow-x-auto p-1 max-h-24">
=======
                                  <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1 shadow-xs">
                                    <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">Cryptographic Hashes</span>
                                    <div className="text-xs text-gray-700 break-all select-all font-medium">
                                      <span className="text-gray-400 font-normal">PREV: </span>{log.prev_hash}
                                    </div>
                                    <div className="text-xs text-blue-600 break-all select-all font-semibold">
                                      <span className="text-gray-400 font-normal">CURR: </span>{log.curr_hash}
                                    </div>
                                  </div>

                                  <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1 shadow-xs">
                                    <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">Structured Event Details</span>
                                    <pre className="text-xs text-gray-800 overflow-x-auto p-1 max-h-28">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ── Decisions History Tab ─────────────────────────────────────────── */
        <div className="space-y-4">
<<<<<<< HEAD
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 font-mono">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                Authoritative Government Decisions & Overrides Ledger
              </span>
              <span className="text-[10px] text-slate-500">
=======
          <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-bold text-gray-900 uppercase tracking-wider text-xs">
                Authoritative Government Decisions & Overrides Ledger
              </span>
              <span className="text-xs text-gray-400">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                Audited Decisions: {decisions.length}
              </span>
            </div>

<<<<<<< HEAD
            <div className="space-y-3 font-mono">
              {decisions.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white font-sans text-sm">{d.tender_title}</span>
                      <span className="text-[10px] text-procure-400 ml-2">({d.tender_ref})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {d.decision.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          d.followed_ai
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
=======
            <div className="space-y-3">
              {decisions.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs text-xs space-y-2.5 hover:border-gray-300 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-900 text-sm">{d.tender_title}</span>
                      <span className="text-xs font-medium text-blue-600 ml-2">({d.tender_ref})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        {d.decision.toUpperCase()}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          d.followed_ai
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                        }`}
                      >
                        {d.followed_ai ? 'Followed AI' : 'Overrode AI'}
                      </span>
                    </div>
                  </div>

<<<<<<< HEAD
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
=======
                  <p className="text-xs text-gray-600 leading-relaxed">
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                    "{d.rationale}"
                  </p>

                  {d.override_reason && (
<<<<<<< HEAD
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
                      <span className="text-amber-400 font-bold block">
                        DOCUMENTED OVERRIDE JUSTIFICATION [{d.override_reason}]:
                      </span>
                      <p className="text-slate-300 font-sans">{d.override_detail}</p>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 pt-1 flex justify-between border-t border-white/5">
                    <span>Deciding Officer: <strong className="text-slate-300">{d.officer_name}</strong></span>
=======
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1 text-amber-900">
                      <span className="font-bold block">
                        DOCUMENTED OVERRIDE JUSTIFICATION [{d.override_reason}]:
                      </span>
                      <p className="text-amber-800">{d.override_detail}</p>
                    </div>
                  )}

                  <div className="text-[11px] text-gray-400 pt-2 flex justify-between border-t border-gray-100">
                    <span>Deciding Officer: <strong className="text-gray-900 font-semibold">{d.officer_name}</strong></span>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                    <span>Effective: {new Date(d.effective_at).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
<<<<<<< HEAD
=======
      </div>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
    </div>
  );
};
