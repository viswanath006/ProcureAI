import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export const CompanyProfileEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'projects' | 'technical' | 'compliance' | 'documents'>('general');
  const [company, setCompany] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General & Identity Form State
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Financial Form State
  const [annualTurnoverInr, setAnnualTurnoverInr] = useState<number>(500000000);
  const [netWorthInr, setNetWorthInr] = useState<number>(250000000);
  const [creditRating, setCreditRating] = useState('CRISIL AA+');
  const [solvencyRatio, setSolvencyRatio] = useState(2.4);

  // Experience Form State
  const [yearsInOperation, setYearsInOperation] = useState<number>(8);
  const [employeeCount, setEmployeeCount] = useState<number>(350);
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);

  // Technical Form State
  const [technicalCapabilities, setTechnicalCapabilities] = useState<any[]>([]);

  // Compliance Form State
  const [isDebarred, setIsDebarred] = useState(false);
  const [taxClearanceStatus, setTaxClearanceStatus] = useState('valid');
  const [laborCompliance, setLaborCompliance] = useState(true);
  const [swornDeclarationDate, setSwornDeclarationDate] = useState('2026-01-15');

  // Document Upload State
  const [newDocType, setNewDocType] = useState('tax_clearance');
  const [newDocName, setNewDocName] = useState('');
  const [newDocValidUntil, setNewDocValidUntil] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const loadProfile = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const res = await api.getCompanyProfile();
    if (res.success && res.data) {
      const c = res.data.company;
      setCompany(c);
      setDocuments(res.data.documents || []);

      // Pre-fill form state
      setName(c.name || '');
      setLegalName(c.legal_name || '');
      setRegistrationNumber(c.registration_number || '');
      setTaxId(c.tax_id || 'GSTIN27AABCT3518Q1Z4');
      setIndustry(c.industry || 'Information Technology');
      setWebsite(c.website || 'https://techcorp.example.com');
      setAddressLine1(c.address_line1 || 'Tech Park Sector 5');
      setCity(c.city || 'Bengaluru');
      setState(c.state || 'Karnataka');
      setPostalCode(c.postal_code || '560001');

      if (c.annual_turnover_paisa) {
        setAnnualTurnoverInr(Number(c.annual_turnover_paisa) / 100);
      }
      if (c.net_worth_paisa) {
        setNetWorthInr(Number(c.net_worth_paisa) / 100);
      }
      setYearsInOperation(c.years_in_operation || 8);
      setEmployeeCount(c.employee_count || 350);

      // Financial capacity
      if (c.financial_capacity) {
        setCreditRating(c.financial_capacity.credit_rating || 'CRISIL AA+');
        setSolvencyRatio(c.financial_capacity.solvency_ratio || 2.4);
      }

      // Projects
      setCompletedProjects(
        c.completed_projects && c.completed_projects.length > 0
          ? c.completed_projects
          : [
              { id: 'p1', title: 'State Cloud Infrastructure Deployment', client_name: 'Dept of Electronics & IT', completion_year: 2024, sector: 'IT Infrastructure' },
              { id: 'p2', title: 'Enterprise Fiber WAN Backbone', client_name: 'National Highways Authority', completion_year: 2023, sector: 'Telecom' },
              { id: 'p3', title: 'Tier-3 Mission Critical Data Center', client_name: 'Ministry of Finance', completion_year: 2022, sector: 'Datacenter' },
            ]
      );

      // Capabilities
      setTechnicalCapabilities(
        c.technical_capabilities && c.technical_capabilities.length > 0
          ? c.technical_capabilities
          : [
              { name: 'Tier-3 Data Center Deployment', category: 'Datacenter', level: 'Certified' },
              { name: 'ISO 27001 Information Security Management', category: 'Compliance', level: 'Accredited' },
              { name: 'Kubernetes High-Availability Clustering', category: 'DevOps', level: 'Advanced' },
              { name: 'Optical Fiber Splicing & OTDR Testing', category: 'Telecom', level: 'Specialist' },
            ]
      );

      // Compliance
      if (c.compliance_info) {
        setIsDebarred(!!c.compliance_info.is_debarred);
        setTaxClearanceStatus(c.compliance_info.tax_clearance_status || 'valid');
        setLaborCompliance(c.compliance_info.labor_compliance !== false);
        setSwornDeclarationDate(c.compliance_info.sworn_declaration_date || '2026-01-15');
      }
    } else {
      setStatusMessage({ type: 'error', text: res.error?.message || 'Failed to load company profile.' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const payload = {
      name,
      legal_name: legalName,
      tax_id: taxId,
      industry,
      website,
      address_line1: addressLine1,
      city,
      state,
      postal_code: postalCode,
      annual_turnover_inr: Number(annualTurnoverInr),
      net_worth_inr: Number(netWorthInr),
      years_in_operation: Number(yearsInOperation),
      employee_count: Number(employeeCount),
      completed_projects: completedProjects,
      technical_capabilities: technicalCapabilities,
      financial_capacity: {
        credit_rating: creditRating,
        solvency_ratio: Number(solvencyRatio),
      },
      compliance_info: {
        is_debarred: isDebarred,
        tax_clearance_status: taxClearanceStatus,
        labor_compliance: laborCompliance,
        sworn_declaration_date: swornDeclarationDate,
      },
    };

    const res = await api.updateCompanyProfile(payload);
    setIsSaving(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Company profile and qualifications successfully updated.' });
      loadProfile();
    } else {
      setStatusMessage({ type: 'error', text: res.error?.message || 'Update failed.' });
    }
  };

  // Document Upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;

    setIsUploadingDoc(true);
    const res = await api.uploadCompanyDocument({
      document_type: newDocType,
      file_name: newDocName,
      valid_until: newDocValidUntil || null,
    });
    setIsUploadingDoc(false);

    if (res.success) {
      setNewDocName('');
      setNewDocValidUntil('');
      setStatusMessage({ type: 'success', text: 'Document uploaded and SHA-256 integrity token recorded.' });
      loadProfile();
    } else {
      setStatusMessage({ type: 'error', text: res.error?.message || 'Document registration failed.' });
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    const res = await api.deleteCompanyDocument(docId);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Document removed from vault.' });
      loadProfile();
    } else {
      setStatusMessage({ type: 'error', text: res.error?.message || 'Delete failed.' });
    }
  };

  if (isLoading) {
    return (
      <div className="card-glass p-8 text-center space-y-3 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-procure-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Loading corporate qualification dossier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-100 font-mono">
              Corporate Qualification & Eligibility Profile
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono uppercase">
              {company?.status || 'Active'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified corporate credentials evaluated by the automated Bidder Eligibility Engine.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-procure-600 to-indigo-600 hover:from-procure-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-procure-600/30 transition-all flex items-center gap-2"
        >
          {isSaving ? 'Saving...' : '💾 Save Profile Changes'}
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          <span>{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'general' ? 'bg-procure-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Identity & Registration
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'financial' ? 'bg-procure-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Financial Turnover
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'projects' ? 'bg-procure-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Completed Projects ({completedProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('technical')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'technical' ? 'bg-procure-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          4. Technical Capabilities ({technicalCapabilities.length})
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'compliance' ? 'bg-procure-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          5. Statutory Compliance
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'documents' ? 'bg-procure-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          6. Document Vault ({documents.length})
        </button>
      </div>

      {/* Tab 1: General & Identity */}
      {activeTab === 'general' && (
        <div className="card-glass p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">COMPANY NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">LEGAL NAME</label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">REGISTRATION NUMBER (CIN / ROC)</label>
              <input
                type="text"
                disabled
                value={registrationNumber}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">TAX ID (PAN / GSTIN)</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">INDUSTRY DOMAIN</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">OFFICIAL WEBSITE</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Financial Capacity */}
      {activeTab === 'financial' && (
        <div className="card-glass p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">
                AUDITED ANNUAL TURNOVER (INR ₹)
              </label>
              <input
                type="number"
                value={annualTurnoverInr}
                onChange={(e) => setAnnualTurnoverInr(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-bold text-sm"
              />
              <span className="text-[10px] text-emerald-400 mt-1 block font-mono">
                ≈ ₹{(annualTurnoverInr / 10000000).toFixed(2)} Crore
              </span>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">
                NET WORTH (INR ₹)
              </label>
              <input
                type="number"
                value={netWorthInr}
                onChange={(e) => setNetWorthInr(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                ≈ ₹{(netWorthInr / 10000000).toFixed(2)} Crore
              </span>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">
                CREDIT RATING
              </label>
              <input
                type="text"
                value={creditRating}
                onChange={(e) => setCreditRating(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">
                SOLVENCY RATIO
              </label>
              <input
                type="number"
                step="0.1"
                value={solvencyRatio}
                onChange={(e) => setSolvencyRatio(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Completed Projects */}
      {activeTab === 'projects' && (
        <div className="card-glass p-6 space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-200 font-mono">Verified Project Track Record</h4>
              <p className="text-[11px] text-slate-400">
                Completed deployments used to satisfy tender project count & capacity gates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCompletedProjects([
                  ...completedProjects,
                  { id: `p-${Date.now()}`, title: '', client_name: '', completion_year: 2025, sector: 'IT' },
                ]);
              }}
              className="px-3 py-1 rounded-lg bg-procure-600 hover:bg-procure-500 text-white font-semibold font-mono"
            >
              + Add Project
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">YEARS IN OPERATION</label>
              <input
                type="number"
                value={yearsInOperation}
                onChange={(e) => setYearsInOperation(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">TOTAL WORKFORCE</label>
              <input
                type="number"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="space-y-3">
            {completedProjects.map((p, idx) => (
              <div key={p.id || idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-procure-300">Project #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => setCompletedProjects(completedProjects.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">PROJECT TITLE</label>
                    <input
                      type="text"
                      value={p.title}
                      onChange={(e) => {
                        const copy = [...completedProjects];
                        copy[idx].title = e.target.value;
                        setCompletedProjects(copy);
                      }}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">CLIENT</label>
                    <input
                      type="text"
                      value={p.client_name}
                      onChange={(e) => {
                        const copy = [...completedProjects];
                        copy[idx].client_name = e.target.value;
                        setCompletedProjects(copy);
                      }}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">YEAR</label>
                    <input
                      type="number"
                      value={p.completion_year}
                      onChange={(e) => {
                        const copy = [...completedProjects];
                        copy[idx].completion_year = Number(e.target.value);
                        setCompletedProjects(copy);
                      }}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Technical Capabilities */}
      {activeTab === 'technical' && (
        <div className="card-glass p-6 space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-200 font-mono">Certified Technical Capabilities</h4>
              <p className="text-[11px] text-slate-400">
                Accreditations and capabilities verified against tender technical criteria.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTechnicalCapabilities([
                  ...technicalCapabilities,
                  { name: '', category: 'General', level: 'Certified' },
                ]);
              }}
              className="px-3 py-1 rounded-lg bg-procure-600 hover:bg-procure-500 text-white font-semibold font-mono"
            >
              + Add Capability
            </button>
          </div>

          <div className="space-y-3">
            {technicalCapabilities.map((cap, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">CAPABILITY / ACCREDITATION</label>
                    <input
                      type="text"
                      value={cap.name}
                      onChange={(e) => {
                        const copy = [...technicalCapabilities];
                        copy[idx].name = e.target.value;
                        setTechnicalCapabilities(copy);
                      }}
                      placeholder="e.g. ISO 27001 Information Security Management"
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">LEVEL / STATUS</label>
                    <input
                      type="text"
                      value={cap.level || 'Certified'}
                      onChange={(e) => {
                        const copy = [...technicalCapabilities];
                        copy[idx].level = e.target.value;
                        setTechnicalCapabilities(copy);
                      }}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTechnicalCapabilities(technicalCapabilities.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-300 text-xs px-2 pt-3"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Statutory Compliance */}
      {activeTab === 'compliance' && (
        <div className="card-glass p-6 space-y-4 text-xs">
          <h4 className="text-sm font-bold text-slate-200 font-mono border-b border-slate-800 pb-3">
            Statutory Legal Compliance & Declarations
          </h4>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-200 block">Non-Debarment Statutory Status</span>
                <p className="text-[11px] text-slate-400">
                  Sworn affidavit confirming entity is NOT blacklisted by any Government department.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-mono">
                <input
                  type="checkbox"
                  checked={!isDebarred}
                  onChange={(e) => setIsDebarred(!e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                />
                <span className={!isDebarred ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {!isDebarred ? 'Not Debarred (Compliant)' : 'FLAGGED (Debarred)'}
                </span>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-200 block">Tax Clearance Certificate</span>
                <p className="text-[11px] text-slate-400">Valid clearance from direct and indirect tax authorities.</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                {taxClearanceStatus.toUpperCase()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-200 block">Labor Law Compliance</span>
                <p className="text-[11px] text-slate-400">Statutory provident fund, ESI, and minimum wages adherence.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-mono">
                <input
                  type="checkbox"
                  checked={laborCompliance}
                  onChange={(e) => setLaborCompliance(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                />
                <span className="text-slate-200">{laborCompliance ? 'Compliant' : 'Non-Compliant'}</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Document Vault */}
      {activeTab === 'documents' && (
        <div className="card-glass p-6 space-y-6 text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-200 font-mono">Cryptographic Document Vault</h4>
              <p className="text-[11px] text-slate-400">
                Tamper-evident verification repository. All compliance documents are SHA-256 hash verified.
              </p>
            </div>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleUploadDocument} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="font-bold text-slate-200 font-mono text-[11px] block">
              + Register New Compliance Document
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">DOCUMENT TYPE</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono"
                >
                  <option value="tax_clearance">Tax Clearance Certificate</option>
                  <option value="audited_financials">Audited Financial Statements</option>
                  <option value="registration_certificate">Registration Certificate</option>
                  <option value="iso_certification">ISO Security Certification</option>
                  <option value="other">Statutory Declaration</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[9px] text-slate-500 block mb-0.5 font-mono">DOCUMENT FILE NAME</label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Audited_Financials_FY25_Certified.pdf"
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isUploadingDoc}
                  className="w-full py-2 px-3 rounded-lg bg-procure-600 hover:bg-procure-500 text-white font-semibold font-mono transition-colors"
                >
                  {isUploadingDoc ? 'Hashing...' : 'Upload & Hash'}
                </button>
              </div>
            </div>
          </form>

          {/* Documents List */}
          <div className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No compliance documents uploaded yet.</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{doc.file_name}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 font-mono uppercase">
                          {doc.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        Type: {doc.document_type}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-mono"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between text-[10px] font-mono text-slate-500">
                    <span className="truncate max-w-md">SHA-256: {doc.sha256_hash}</span>
                    <span>Added: {new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
