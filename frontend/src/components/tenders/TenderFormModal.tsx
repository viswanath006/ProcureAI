import React, { useState, useMemo } from 'react';
import { api } from '../../api/client';

interface TenderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export const TenderFormModal: React.FC<TenderFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [activeStep, setActiveStep] = useState<'info' | 'eligibility' | 'criteria' | 'documents'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Basic Info
  const [referenceNumber, setReferenceNumber] = useState(
    initialData?.reference_number || `TENDER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'infrastructure');
  const [department, setDepartment] = useState(
    initialData?.department || 'Ministry of Infrastructure & Urban Development'
  );
  const [estimatedValueInr, setEstimatedValueInr] = useState<number>(
    initialData?.estimated_budget_paisa ? Number(initialData.estimated_budget_paisa) / 100 : 250000000
  );
  const [openingDate, setOpeningDate] = useState(
    initialData?.submission_start_at ? initialData.submission_start_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [closingDate, setClosingDate] = useState(
    initialData?.submission_deadline_at
      ? initialData.submission_deadline_at.slice(0, 10)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // 2. Eligibility Requirements
  const [requirements, setRequirements] = useState<any[]>(
    initialData?.requirements || [
      {
        requirement_type: 'financial',
        title: 'Minimum Annual Turnover',
        description: 'Audited annual turnover of at least ₹50 Crore in the last 3 financial years.',
        is_mandatory: true,
        threshold_value: 500000000,
        threshold_unit: 'INR',
      },
      {
        requirement_type: 'technical',
        title: 'Tier-3 Data Center Deployment Experience',
        description: 'Successfully deployed and managed at least 2 Tier-3 mission critical data centers.',
        is_mandatory: true,
        threshold_value: 2,
        threshold_unit: 'projects',
      },
      {
        requirement_type: 'legal',
        title: 'Non-Debarment Statutory Affidavit',
        description: 'Sworn affidavit confirming bidder is not debarred or blacklisted by any Government agency.',
        is_mandatory: true,
      },
    ]
  );

  // 3. Evaluation Criteria & Weights
  const [criteria, setCriteria] = useState<any[]>(
    initialData?.criteria || [
      {
        criteria_type: 'technical',
        name: 'Technical Architecture & Methodology',
        description: 'Proposed system architecture, resilience, scalability, and integration plan.',
        weight: 40,
        max_score: 100,
      },
      {
        criteria_type: 'financial',
        name: 'Financial Cost Proposal & Price Competitiveness',
        description: 'Total evaluated cost of ownership, transparent bill of quantities, and fee structure.',
        weight: 30,
        max_score: 100,
      },
      {
        criteria_type: 'experience',
        name: 'Past Performance & Proven Track Record',
        description: 'Documented track record on similar government/enterprise deployments with reference letters.',
        weight: 20,
        max_score: 100,
      },
      {
        criteria_type: 'delivery_timeline',
        name: 'Implementation Timeline & SLA Commitments',
        description: 'Feasibility of work breakdown schedule and committed SLA response thresholds.',
        weight: 10,
        max_score: 100,
      },
    ]
  );

  // 4. Required Documents Checklist
  const [documents, setDocuments] = useState<any[]>(
    initialData?.documents || [
      { name: 'Audited Financial Statements (Last 3 Years)', required: true, description: 'Balance sheet and P&L' },
      { name: 'Technical Methodology & Solution Blueprint', required: true, description: 'PDF technical proposal' },
      { name: 'ISO 27001 / SOC 2 Compliance Certificates', required: false, description: 'Security accreditations' },
      { name: 'Non-Debarment Sworn Declaration', required: true, description: 'Legal affidavit on stamp paper' },
    ]
  );

  // Live Weight Calculation
  const totalWeight = useMemo(() => {
    return criteria.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
  }, [criteria]);

  const isWeightBalanced = Math.abs(totalWeight - 100) < 0.01;

  // Handlers for Eligibility
  const addRequirement = () => {
    setRequirements([
      ...requirements,
      {
        requirement_type: 'technical',
        title: '',
        description: '',
        is_mandatory: true,
        threshold_value: undefined,
        threshold_unit: '',
      },
    ]);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  // Handlers for Criteria
  const addCriterion = () => {
    const remaining = Math.max(0, 100 - totalWeight);
    setCriteria([
      ...criteria,
      {
        criteria_type: 'technical',
        name: '',
        description: '',
        weight: remaining,
        max_score: 100,
      },
    ]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  // Handlers for Documents
  const addDocument = () => {
    setDocuments([
      ...documents,
      { name: '', required: true, description: '' },
    ]);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  // Submission handler (Save as Draft or Publish)
  const handleSubmit = async (submitStatus: 'DRAFT' | 'PUBLISHED') => {
    setError(null);

    // Validation for publishing
    if (submitStatus === 'PUBLISHED') {
      if (!isWeightBalanced) {
        setError(`Evaluation criteria weights must sum to exactly 100%. Current sum: ${totalWeight}%.`);
        setActiveStep('criteria');
        return;
      }
      if (new Date(closingDate) <= new Date(openingDate)) {
        setError('Submission deadline must be set after the opening date.');
        setActiveStep('info');
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      reference_number: referenceNumber,
      title,
      description,
      category,
      department,
      estimated_project_value: Number(estimatedValueInr),
      opening_date: openingDate,
      closing_date: closingDate,
      status: submitStatus,
      eligibility_requirements: requirements,
      evaluation_criteria: criteria,
      required_documents: documents,
    };

    let res;
    if (initialData?.id) {
      res = await api.updateTenderDraft(initialData.id, payload);
    } else {
      res = await api.createTender(payload);
    }

    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error?.message || 'Failed to save tender');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="card-glass max-w-4xl w-full max-h-[90vh] flex flex-col p-6 sm:p-8 space-y-6 animate-scale-up border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h3 className="text-xl font-bold text-slate-100">
                {initialData ? 'Update Procurement Tender' : 'Create Government Procurement Tender'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Author tender specifications, configure strict eligibility gates, and calibrate weighted evaluation criteria.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Step Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveStep('info')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeStep === 'info'
                ? 'bg-procure-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            1. General Info & Budget
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('eligibility')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeStep === 'eligibility'
                ? 'bg-procure-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Eligibility Criteria ({requirements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('criteria')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeStep === 'criteria'
                ? 'bg-procure-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Evaluation Weights ({totalWeight}%)
            {isWeightBalanced ? (
              <span className="text-emerald-400 font-bold">✓</span>
            ) : (
              <span className="text-amber-400 font-bold">!</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('documents')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeStep === 'documents'
                ? 'bg-procure-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Required Documents ({documents.length})
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* STEP 1: General Info */}
          {activeStep === 'info' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    TENDER REFERENCE NUMBER
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    PROCURING DEPARTMENT
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                  OFFICIAL TENDER TITLE
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Nationwide High-Speed Optical Transport Backbone Upgrade"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">
                  PROJECT DESCRIPTION & SCOPE OF WORK
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide comprehensive scope of work, technical guidelines, and performance metrics..."
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    CATEGORY
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  >
                    <option value="infrastructure">Infrastructure</option>
                    <option value="information_technology">Information Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="defense">Defense</option>
                    <option value="energy">Energy</option>
                    <option value="transport">Transport</option>
                    <option value="environment">Environment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    ESTIMATED VALUE (INR ₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={estimatedValueInr}
                    onChange={(e) => setEstimatedValueInr(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                  <span className="text-[10px] text-emerald-400 mt-0.5 block font-mono">
                    ≈ ₹{(estimatedValueInr / 10000000).toFixed(2)} Crore
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    OPENING DATE
                  </label>
                  <input
                    type="date"
                    required
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    SUBMISSION DEADLINE (CLOSING DATE)
                  </label>
                  <input
                    type="date"
                    required
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Eligibility Requirements */}
          {activeStep === 'eligibility' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono text-[11px]">
                  Bidders failing any mandatory eligibility condition are disqualified prior to technical scoring.
                </span>
                <button
                  type="button"
                  onClick={addRequirement}
                  className="px-3 py-1 rounded bg-procure-600 hover:bg-procure-500 text-white font-semibold"
                >
                  + Add Requirement
                </button>
              </div>

              <div className="space-y-3">
                {requirements.map((req, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-procure-300">
                        Requirement #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(idx)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">TYPE</label>
                        <select
                          value={req.requirement_type}
                          onChange={(e) => {
                            const copy = [...requirements];
                            copy[idx].requirement_type = e.target.value;
                            setRequirements(copy);
                          }}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
                        >
                          <option value="financial">Financial</option>
                          <option value="technical">Technical</option>
                          <option value="legal">Legal</option>
                          <option value="capacity">Capacity</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">TITLE</label>
                        <input
                          type="text"
                          required
                          value={req.title}
                          onChange={(e) => {
                            const copy = [...requirements];
                            copy[idx].title = e.target.value;
                            setRequirements(copy);
                          }}
                          placeholder="e.g. Minimum Net Worth"
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
                        />
                      </div>

                      <div className="flex items-center pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={req.is_mandatory}
                            onChange={(e) => {
                              const copy = [...requirements];
                              copy[idx].is_mandatory = e.target.checked;
                              setRequirements(copy);
                            }}
                            className="rounded bg-slate-950 border-slate-700 text-procure-500"
                          />
                          <span className="text-slate-300 font-semibold text-[11px]">Mandatory Gate</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">DESCRIPTION & VERIFICATION</label>
                      <input
                        type="text"
                        value={req.description}
                        onChange={(e) => {
                          const copy = [...requirements];
                          copy[idx].description = e.target.value;
                          setRequirements(copy);
                        }}
                        placeholder="Detailed verification criteria..."
                        className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Evaluation Criteria & Live Weights Calculator */}
          {activeStep === 'criteria' && (
            <div className="space-y-4 text-xs">
              {/* Weight Status Bar */}
              <div className={`p-4 rounded-xl border flex justify-between items-center ${
                isWeightBalanced
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              }`}>
                <div>
                  <div className="font-bold flex items-center gap-2 font-mono text-sm">
                    <span>{isWeightBalanced ? '✅' : '⚠️'}</span>
                    Total Evaluation Weight: {totalWeight}% / 100%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                    {isWeightBalanced
                      ? 'Weights are calibrated and compliant with government procurement policy.'
                      : `Weights must equal exactly 100% before publishing. Difference: ${100 - totalWeight}%.`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addCriterion}
                  className="px-3 py-1 rounded bg-procure-600 hover:bg-procure-500 text-white font-semibold"
                >
                  + Add Criterion
                </button>
              </div>

              <div className="space-y-3">
                {criteria.map((crit, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-indigo-300">
                        Criterion #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCriterion(idx)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">TYPE</label>
                        <select
                          value={crit.criteria_type}
                          onChange={(e) => {
                            const copy = [...criteria];
                            copy[idx].criteria_type = e.target.value;
                            setCriteria(copy);
                          }}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
                        >
                          <option value="technical">Technical</option>
                          <option value="financial">Financial</option>
                          <option value="experience">Experience</option>
                          <option value="quality">Quality</option>
                          <option value="delivery_timeline">Timeline</option>
                          <option value="social_impact">Social Impact</option>
                          <option value="environmental">Environmental</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">CRITERIA NAME</label>
                        <input
                          type="text"
                          required
                          value={crit.name}
                          onChange={(e) => {
                            const copy = [...criteria];
                            copy[idx].name = e.target.value;
                            setCriteria(copy);
                          }}
                          placeholder="e.g. Technical Feasibility & Solution Architecture"
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">WEIGHT (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          required
                          value={crit.weight}
                          onChange={(e) => {
                            const copy = [...criteria];
                            copy[idx].weight = Number(e.target.value);
                            setCriteria(copy);
                          }}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">SCORING RUBRIC DESCRIPTION</label>
                      <input
                        type="text"
                        value={crit.description || ''}
                        onChange={(e) => {
                          const copy = [...criteria];
                          copy[idx].description = e.target.value;
                          setCriteria(copy);
                        }}
                        placeholder="Define how AI scoring algorithms will evaluate proposals against this criteria..."
                        className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Required Documents */}
          {activeStep === 'documents' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono text-[11px]">
                  Bidders must upload cryptographic sealed PDF/excel attachments matching these requirements.
                </span>
                <button
                  type="button"
                  onClick={addDocument}
                  className="px-3 py-1 rounded bg-procure-600 hover:bg-procure-500 text-white font-semibold"
                >
                  + Add Document Requirement
                </button>
              </div>

              <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-300">
                        Document Requirement #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDocument(idx)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">DOCUMENT NAME</label>
                        <input
                          type="text"
                          required
                          value={doc.name}
                          onChange={(e) => {
                            const copy = [...documents];
                            copy[idx].name = e.target.value;
                            setDocuments(copy);
                          }}
                          placeholder="e.g. Audited Financial Statements (Last 3 Years)"
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
                        />
                      </div>

                      <div className="flex items-center pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={doc.required}
                            onChange={(e) => {
                              const copy = [...documents];
                              copy[idx].required = e.target.checked;
                              setDocuments(copy);
                            }}
                            className="rounded bg-slate-950 border-slate-700 text-procure-500"
                          />
                          <span className="text-slate-300 font-semibold text-[11px]">Strictly Mandatory</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">FILE SPECIFICATION</label>
                      <input
                        type="text"
                        value={doc.description || ''}
                        onChange={(e) => {
                          const copy = [...documents];
                          copy[idx].description = e.target.value;
                          setDocuments(copy);
                        }}
                        placeholder="Format and certification requirements..."
                        className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">
            {isWeightBalanced ? (
              <span className="text-emerald-400">✓ Ready to Publish (100% weight sum)</span>
            ) : (
              <span className="text-amber-400">Weights total: {totalWeight}% (Draft save allowed)</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('DRAFT')}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting || !isWeightBalanced}
              onClick={() => handleSubmit('PUBLISHED')}
              className="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-gradient-to-r from-procure-600 to-indigo-600 hover:from-procure-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-procure-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Publish Tender</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
