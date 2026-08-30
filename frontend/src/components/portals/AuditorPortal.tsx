import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

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
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const isValid = verificationResult?.isValid ?? true;

  return (
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
              </p>
            </div>
          </div>
        </div>

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
          </button>
        </div>
      </div>

      {/* ── Cryptographic Verification Status Banner ────────────────────────── */}
      <div
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
                {isValid
                  ? `Cryptographic proof verified across ${verificationResult?.totalBlocks || logs.length} sequential blocks without tampering.`
                  : `TAMPER ALERT: ${verificationResult?.failureDetails?.reason || 'Unauthorized block alteration detected'}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {isVerifying ? (
                <>
                  <div className="w-3 h-3 border-2 border-slate-200 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Chain...</span>
                </>
              ) : (
                <>
                  <span>🔍</span> Verify Cryptographic Audit Chain
                </>
              )}
            </button>

            {isValid ? (
              <button
                onClick={handleSimulateTamper}
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-colors"
                title="Demonstrates tamper-detection capability"
              >
                Simulate Tamper ⚠
              </button>
            ) : (
              <button
                onClick={handleRestoreChain}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors"
              >
                Restore Valid Chain ✓
              </button>
            )}
          </div>
        </div>

        {/* Chain Hash Info Bar */}
        <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
          <div>
            <span>Verified Sequential Blocks: </span>
            <strong className="text-slate-200">{verificationResult?.totalBlocks || logs.length}</strong>
          </div>
          <div className="truncate" title={verificationResult?.rootHash || 'Genesis Block Hash'}>
            <span>Root Hash: </span>
            <strong className="text-procure-300">
              {verificationResult?.rootHash ? `${verificationResult.rootHash.slice(0, 16)}...` : 'Genesis Block'}
            </strong>
          </div>
          <div className="truncate" title={verificationResult?.latestHash || 'Chain Head Hash'}>
            <span>Chain Head Hash: </span>
            <strong className="text-procure-300">
              {verificationResult?.latestHash ? `${verificationResult.latestHash.slice(0, 16)}...` : 'Latest Verified'}
            </strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono">
          {error}
        </div>
      )}

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
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* 1. Tender */}
              <div>
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">1. Tender Ref / ID</label>
                <input
                  type="text"
                  placeholder="e.g. PROC-2026..."
                  value={filters.tender}
                  onChange={(e) => setFilters({ ...filters, tender: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-600 focus:border-procure-500"
                />
              </div>

              {/* 2. User */}
              <div>
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">2. Actor / User</label>
                <input
                  type="text"
                  placeholder="e.g. suresh@..."
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-600 focus:border-procure-500"
                />
              </div>

              {/* 3. Company */}
              <div>
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">3. Company</label>
                <input
                  type="text"
                  placeholder="e.g. Alpha..."
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-600 focus:border-procure-500"
                />
              </div>

              {/* 4. Event Type */}
              <div>
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">4. Event Action</label>
                <select
                  value={filters.event_type}
                  onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs"
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
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">5. Start Date</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                />
              </div>

              {/* 6. Risk Level */}
              <div>
                <label className="text-[9px] text-slate-500 block mb-0.5 uppercase">6. Risk Tier</label>
                <select
                  value={filters.risk_level}
                  onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs"
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
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden font-mono">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px]">
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
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
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
                              {log.prev_hash === '0000000000000000000000000000000000000000000000000000000000000000'
                                ? 'GENESIS (0x0)'
                                : `${log.prev_hash.slice(0, 8)}...`}
                            </td>
                            <td className="py-3 px-3 text-procure-300 text-[10px] font-bold truncate max-w-[90px]" title={log.curr_hash}>
                              {log.curr_hash.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                ⛓️ LINKED
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Event Details */}
                          {isExpanded && (
                            <tr className="bg-slate-950/80">
                              <td colSpan={8} className="p-4 space-y-2 border-t border-b border-procure-500/20">
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                  <span>Event ID: <strong className="text-white select-all">{log.id}</strong></span>
                                  <span>Sequence: #{log.chain_sequence}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
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
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 font-mono">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                Authoritative Government Decisions & Overrides Ledger
              </span>
              <span className="text-[10px] text-slate-500">
                Audited Decisions: {decisions.length}
              </span>
            </div>

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
                        }`}
                      >
                        {d.followed_ai ? 'Followed AI' : 'Overrode AI'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    "{d.rationale}"
                  </p>

                  {d.override_reason && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
                      <span className="text-amber-400 font-bold block">
                        DOCUMENTED OVERRIDE JUSTIFICATION [{d.override_reason}]:
                      </span>
                      <p className="text-slate-300 font-sans">{d.override_detail}</p>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 pt-1 flex justify-between border-t border-white/5">
                    <span>Deciding Officer: <strong className="text-slate-300">{d.officer_name}</strong></span>
                    <span>Effective: {new Date(d.effective_at).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
