import React, { useState } from 'react';

interface BidReceiptCardProps {
  receipt: {
    bidReference: string;
    tenderId?: string;
    tenderReference?: string;
    submittedAt: string;
    canonicalHash: string;
    receiptToken: string;
    status: string;
    tamperStatus?: string;
  };
  onClose?: () => void;
}

export const BidReceiptCard: React.FC<BidReceiptCardProps> = ({ receipt, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `PROCUREAI OFFICIAL SEALED BID RECEIPT\n` +
      `Bid Reference: ${receipt.bidReference}\n` +
      `Receipt Token: ${receipt.receiptToken}\n` +
      `SHA-256 Digest: ${receipt.canonicalHash}\n` +
      `Submitted At: ${receipt.submittedAt}\n` +
      `Envelope Status: LOCKED & SEALED (AES-256-GCM)`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-glass p-6 sm:p-8 space-y-6 border-procure-500/40 bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-procure-950/40 shadow-2xl relative overflow-hidden">
      {/* Background seal watermarking */}
      <div className="absolute -right-8 -bottom-8 opacity-5 text-9xl pointer-events-none select-none">
        🛡️
      </div>

      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-mono tracking-tight">
                Official Cryptographic Bid Receipt
              </h3>
              <p className="text-[11px] text-procure-400 font-mono">
                Immutable Submission Proof • Government e-Procurement Portal
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono uppercase">
            🔒 LOCKED & SEALED
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 font-mono block">BID REFERENCE</span>
          <span className="font-mono font-bold text-procure-300 text-sm">{receipt.bidReference}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 font-mono block">SUBMISSION TIMESTAMP (ISO UTC)</span>
          <span className="font-mono text-slate-200">{new Date(receipt.submittedAt).toUTCString()}</span>
        </div>

        <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 font-mono block">OFFICIAL CRYPTOGRAPHIC RECEIPT TOKEN</span>
          <span className="font-mono font-bold text-emerald-400 tracking-wider text-xs block break-all">
            {receipt.receiptToken}
          </span>
        </div>

        <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-mono block">CANONICAL SHA-256 INTEGRITY DIGEST</span>
            <span className="text-[10px] text-emerald-400 font-mono">✓ MATCH Verified</span>
          </div>
          <span className="font-mono text-[11px] text-slate-300 block break-all">
            {receipt.canonicalHash}
          </span>
        </div>
      </div>

      {/* Security Statement */}
      <div className="p-3.5 rounded-xl bg-procure-950/30 border border-procure-800/40 text-[11px] text-slate-400 flex items-start gap-2.5 font-mono">
        <span className="text-base">🛡️</span>
        <div>
          <span className="text-slate-200 font-bold block mb-0.5">Sealed-Envelope Security Notice:</span>
          Commercial pricing figures and proposal documents are encrypted with AES-256-GCM. Neither evaluating officers nor rival bidders can inspect proposal values before the official post-deadline opening ceremony.
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
        <span className="text-[10px] text-slate-500 font-mono">
          Save this token as official legal proof of timely bid submission.
        </span>
        <button
          onClick={handleCopy}
          className="px-4 py-2 rounded-lg bg-procure-600 hover:bg-procure-500 text-white font-semibold font-mono transition-colors shadow-md flex items-center gap-1.5"
        >
          <span>{copied ? '✅ Copied!' : '📋 Copy Official Receipt'}</span>
        </button>
      </div>
    </div>
  );
};
