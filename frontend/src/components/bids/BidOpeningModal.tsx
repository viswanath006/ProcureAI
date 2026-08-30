import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

interface BidOpeningModalProps {
  tenderId: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const STAGES = ['SUBMITTED', 'LOCKED', 'SEALED', 'DEADLINE CLOSED', 'REVEALED'];

export const BidOpeningModal: React.FC<BidOpeningModalProps> = ({
  tenderId,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnsealing, setIsUnsealing] = useState(false);
  const [tamperCheckMap, setTamperCheckMap] = useState<Record<string, any>>({});
  const [isVerifyingTamper, setIsVerifyingTamper] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const res = await api.getTenderBidsForOfficer(tenderId);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setStatusMessage({ type: 'error', text: res.error?.message || 'Failed to load tender bids.' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && tenderId) {
      loadData();
    }
  }, [isOpen, tenderId]);

  // Determine current lifecycle stage in the 5-state pipeline
  const getCurrentStageIndex = () => {
    if (!data) return 0;
    if (data.isUnsealed) return 4; // REVEALED
    if (data.isPastDeadline) return 3; // DEADLINE CLOSED
    if (data.bidsCount > 0) return 2; // SEALED
    return 1; // LOCKED
  };

  // Run on-demand tamper verification on all bids
  const handleVerifyAllTamper = async () => {
    if (!data || !data.bids) return;
    setIsVerifyingTamper(true);
    setStatusMessage(null);

    const resultMap: Record<string, any> = {};
    let mismatchCount = 0;

    for (const bid of data.bids) {
      const res = await api.verifyBidIntegrity(bid.id);
      if (res.success && res.data) {
        resultMap[bid.id] = res.data;
        if (res.data.status === 'MISMATCH') {
          mismatchCount++;
        }
      }
    }

    setTamperCheckMap(resultMap);
    setIsVerifyingTamper(false);

    if (mismatchCount > 0) {
      setStatusMessage({
        type: 'warning',
        text: `⚠️ Tamper verification completed with ${mismatchCount} detected discrepancy! Review audit log immediately.`,
      });
    } else {
      setStatusMessage({
        type: 'success',
        text: '✓ All submitted bids passed cryptographic tamper verification. Hashes match immutable baseline.',
      });
    }
  };

  // Unseal bids
  const handleTriggerUnsealing = async () => {
    setIsUnsealing(true);
    setStatusMessage(null);
    const res = await api.unsealTenderBids(tenderId);
    setIsUnsealing(false);

    if (res.success && res.data) {
      const hasTampering = Boolean(res.data.data?.hasTampering);
      setStatusMessage({
        type: hasTampering ? 'warning' : 'success',
        text: hasTampering
          ? '⚠️ Bids unsealed. Tampering discrepancies detected on one or more proposals.'
          : '✓ Official Bid Opening completed. All cryptographic envelopes unsealed and decrypted.',
      });
      loadData();
      onRefresh();
    } else {
      setStatusMessage({ type: 'error', text: res.error?.message || 'Unsealing failed.' });
    }
  };

  if (!isOpen) return null;

  const currentStageIdx = getCurrentStageIndex();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="card-glass max-w-5xl w-full max-h-[90vh] flex flex-col p-6 sm:p-8 space-y-6 animate-scale-up border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔓</span>
              <h3 className="text-lg font-bold text-slate-100 font-mono">
                Official Bid Opening & Tamper Verification Console
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Secure sealed-bid protocol. Cryptographic envelopes remain locked until the submission deadline passes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          >
            ✕
          </button>
        </div>

        {/* 5-State Visual Pipeline Stepper */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">
            Cryptographic Sealing Pipeline
          </span>
          <div className="flex items-center justify-between">
            {STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;

              return (
                <React.Fragment key={stage}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                        isPast
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                          : isCurrent
                          ? 'bg-procure-600 text-white ring-2 ring-procure-400 ring-offset-2 ring-offset-slate-950'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider text-center ${
                        isCurrent
                          ? 'text-procure-400 font-bold'
                          : isPast
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        idx < currentStageIdx ? 'bg-emerald-500/80' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'warning'
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}
          >
            <span>{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Controls & Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="space-y-0.5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">SUBMISSION DEADLINE:</span>
              <span className="text-slate-200 font-bold">
                {data ? new Date(data.deadline).toLocaleString() : '—'}
              </span>
            </div>
            <div>
              {data?.isPastDeadline ? (
                <span className="text-emerald-400 font-bold">
                  ✓ SUBMISSION WINDOW CLOSED — OFFICIAL BID OPENING PERMITTED
                </span>
              ) : (
                <span className="text-amber-400 font-bold">
                  ⏳ BIDDING IN PROGRESS — PRE-DEADLINE SECRECY ENFORCED
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyAllTamper}
              disabled={isVerifyingTamper || data?.bidsCount === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs font-mono border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              {isVerifyingTamper ? 'Verifying...' : '⚡ Verify Tamper Hashes'}
            </button>

            {!data?.isUnsealed && (
              <button
                onClick={handleTriggerUnsealing}
                disabled={!data?.isPastDeadline || isUnsealing || data?.bidsCount === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs font-mono shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                {isUnsealing ? 'Unsealing...' : '🔓 Unseal Bids (Ceremony)'}
              </button>
            )}
          </div>
        </div>

        {/* Sealed Bids Table */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono animate-pulse">
              Loading cryptographic sealed envelopes...
            </div>
          ) : data?.bids?.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No sealed bids submitted for this tender yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data?.bids?.map((b: any) => {
                const tamper = tamperCheckMap[b.id];

                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border space-y-2.5 ${
                      tamper?.status === 'MISMATCH'
                        ? 'bg-red-500/10 border-red-500/40'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-bold text-procure-300">{b.bid_reference}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              b.envelope_status === 'REVEALED'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {b.envelope_status}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200 mt-0.5">{b.company_name}</h4>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <span className="text-[10px] text-slate-500 block uppercase">Commercial Value</span>
                        {b.amount_inr !== null ? (
                          <span className="text-emerald-400 font-bold text-sm">
                            ₹{(b.amount_inr / 10000000).toFixed(2)} Cr (₹{b.amount_inr.toLocaleString()})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            [ENCRYPTED_SEALED_ENVELOPE]
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hash & Verification Details */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-mono text-slate-400 gap-2">
                      <div className="truncate max-w-lg">
                        <span className="text-slate-500">ORIGINAL HASH: </span>
                        <span>{b.canonical_hash || 'Recorded at submission'}</span>
                      </div>

                      <div>
                        {tamper ? (
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              tamper.status === 'MATCH'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {tamper.status === 'MATCH'
                              ? '✓ Bid integrity verified'
                              : '⚠ Possible tampering detected'}
                          </span>
                        ) : (
                          <span className="text-slate-500">Integrity: {b.integrity_status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs">
          <span className="text-slate-500 font-mono text-[10px]">
            🛡️ Strict Auditor Rule: Unsealing is cryptographically blocked before submission deadline.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold font-mono"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
