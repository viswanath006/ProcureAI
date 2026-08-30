import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BidReceiptCard } from './BidReceiptCard';

interface SealedBidSubmissionModalProps {
  tender: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SealedBidSubmissionModal: React.FC<SealedBidSubmissionModalProps> = ({
  tender,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [bidAmountInr, setBidAmountInr] = useState<number>(450000000);
  const [completionDays, setCompletionDays] = useState<number>(180);
  const [technicalProposal, setTechnicalProposal] = useState(
    'Tier-3 Compliant Cloud Infrastructure Architecture Specification v2.4'
  );
  const [financialProposal, setFinancialProposal] = useState(
    'Itemized Commercial Schedule: Hardware, Licensing, 5-Year Comprehensive SLA'
  );
  const [coverLetter, setCoverLetter] = useState(
    'We hereby submit our formal, sealed bid proposal adhering strictly to all tender guidelines.'
  );
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const [companyProfile, setCompanyProfile] = useState<any | null>(null);
  const [companyDocs, setCompanyDocs] = useState<any[]>([]);
  const [eligibilityPassed, setEligibilityPassed] = useState<boolean | null>(null);
  const [eligibilityChecking, setEligibilityChecking] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sealingStep, setSealingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<any | null>(null);

  useEffect(() => {
    async function checkEligibilityAndDocs() {
      if (!isOpen || !tender) return;
      setEligibilityChecking(true);
      setErrorMessage(null);

      const [profileRes, precheckRes] = await Promise.all([
        api.getCompanyProfile(),
        api.precheckEligibility(tender.id),
      ]);

      if (profileRes.success && profileRes.data) {
        setCompanyProfile(profileRes.data.company);
        setCompanyDocs(profileRes.data.documents || []);
      }

      if (precheckRes.success && precheckRes.data) {
        setEligibilityPassed(precheckRes.data.report.isEligible);
      } else {
        setEligibilityPassed(false);
      }
      setEligibilityChecking(false);
    }

    if (isOpen) {
      checkEligibilityAndDocs();
      setSubmittedReceipt(null);
    }
  }, [isOpen, tender]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declarationAccepted) {
      setErrorMessage('You must accept the statutory declaration confirming this submission is final.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Visual sealing pipeline simulation
    setSealingStep('1/3: Encrypting commercial proposal with AES-256-GCM...');
    await new Promise((r) => setTimeout(r, 600));

    setSealingStep('2/3: Computing canonical SHA-256 integrity hash...');
    await new Promise((r) => setTimeout(r, 600));

    setSealingStep('3/3: Locking sealed envelope into cryptographic registry...');

    const payload = {
      tenderId: tender.id,
      bidAmountInr: Number(bidAmountInr),
      completionDays: Number(completionDays),
      technicalProposal,
      financialProposal,
      coverLetter,
      declarationAccepted: true,
      documents: companyDocs.map((d) => ({
        fileName: d.file_name,
        sha256Hash: d.sha256_hash,
      })),
    };

    const res = await api.submitSealedBid(payload);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setSubmittedReceipt(res.data.data);
      onSuccess();
    } else {
      setErrorMessage(res.error?.message || 'Bid submission failed.');
    }
  };

  if (!isOpen || !tender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="card-glass max-w-2xl w-full max-h-[90vh] flex flex-col p-6 sm:p-8 space-y-6 animate-scale-up border-slate-700 shadow-2xl">
        {submittedReceipt ? (
          <BidReceiptCard
            receipt={submittedReceipt}
            onClose={() => {
              setSubmittedReceipt(null);
              onClose();
            }}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔒</span>
                  <h3 className="text-lg font-bold text-slate-100 font-mono">
                    Submit Cryptographically Sealed Bid
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  [{tender.reference_number}] {tender.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Eligibility Gate Banner */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">BIDDER QUALIFICATION GATE</span>
                <span className="font-bold text-slate-200">{companyProfile?.name || 'Your Company'}</span>
              </div>
              <div>
                {eligibilityChecking ? (
                  <span className="text-slate-400 font-mono">Checking qualifications...</span>
                ) : eligibilityPassed ? (
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    ✓ ELIGIBILITY VERIFIED
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 font-mono font-bold">
                    ❌ ELIGIBILITY DEFICIT
                  </span>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {errorMessage}
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    TOTAL COMMERCIAL OFFER (INR ₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={bidAmountInr}
                    onChange={(e) => setBidAmountInr(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-bold text-sm"
                  />
                  <span className="text-[10px] text-emerald-400 mt-1 block font-mono">
                    ≈ ₹{(bidAmountInr / 10000000).toFixed(2)} Crore
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    EXECUTION SCHEDULE (DAYS)
                  </label>
                  <input
                    type="number"
                    required
                    value={completionDays}
                    onChange={(e) => setCompletionDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                    ≈ {(completionDays / 30).toFixed(1)} Months to Delivery
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                  TECHNICAL PROPOSAL HIGHLIGHTS
                </label>
                <textarea
                  rows={2}
                  value={technicalProposal}
                  onChange={(e) => setTechnicalProposal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                  FINANCIAL & PRICING BREAKDOWN
                </label>
                <textarea
                  rows={2}
                  value={financialProposal}
                  onChange={(e) => setFinancialProposal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                  FORMAL COVER LETTER
                </label>
                <textarea
                  rows={2}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                />
              </div>

              {/* Document Vault attachments info */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center font-mono text-[10px]">
                  <span className="text-slate-400 uppercase">Attached Compliance Dossier</span>
                  <span className="text-procure-400">{companyDocs.length} SHA-256 Hashed Documents</span>
                </div>
                <div className="space-y-1">
                  {companyDocs.map((doc, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span className="truncate max-w-xs">• {doc.file_name}</span>
                      <span className="text-[9px] text-slate-500 truncate max-w-[120px]">{doc.sha256_hash}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statutory Declaration Checkbox */}
              <div className="p-4 rounded-xl bg-procure-950/20 border border-procure-800/40 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-900 border-slate-700 text-procure-500 focus:ring-procure-500"
                  />
                  <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    <span className="font-bold text-slate-100 block mb-0.5">
                      Statutory Sealed-Bid Declaration & Finality Agreement
                    </span>
                    I solemnly declare that this submission is final, legally binding, and will be cryptographically sealed using AES-256-GCM. I acknowledge that once submitted, this proposal <strong className="text-rose-300">cannot be edited, deleted, or replaced</strong>.
                  </div>
                </label>
              </div>

              {/* Actions & Sealing Animation */}
              <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
                {isSubmitting ? (
                  <div className="flex items-center gap-2 text-xs text-procure-300 font-mono animate-pulse">
                    <div className="w-4 h-4 rounded-full border-2 border-procure-400 border-t-transparent animate-spin" />
                    <span>{sealingStep}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">
                    🛡️ Zero Pre-Opening Leakage: Protected until official deadline unseal.
                  </span>
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold font-mono border border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || eligibilityPassed === false}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-procure-600 to-indigo-600 hover:from-procure-500 hover:to-indigo-500 text-white font-semibold font-mono shadow-lg shadow-procure-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>🔒 Lock & Seal Bid</span>
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
