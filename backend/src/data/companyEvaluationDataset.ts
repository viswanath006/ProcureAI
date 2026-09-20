import fs from 'fs';
import path from 'path';

export interface ContractorEvaluationProfile {
  bid_amount_ratio: number;
  completion_days_ratio: number;
  technical_proposal: string;
  technical_capabilities: Array<{ name: string; category?: string; level?: string }>;
  years_in_operation: number;
  completed_projects_count: number;
  flagship_projects?: string[];
  annual_turnover_inr: number;
  net_worth_inr: number;
  past_performance: {
    avg_rating: number;
    on_time_completion_pct: number;
    contractual_disputes: number;
    quality_audit_score?: number;
  };
  compliance_info: {
    is_debarred: boolean;
    litigation_count: number;
    gst_compliance_score: number;
    statutory_clearances_ready?: boolean;
  };
  osint_profile?: {
    verification_status: string;
    company_status: string;
    authorized_capital: number;
    paid_up_capital: number;
    collusion_flags: string[];
  };
}

export interface ContractorRecord {
  id: string;
  name: string;
  short_name: string;
  department_id: string;
  department: string;
  category: string;
  email: string;
  cin: string;
  incorporation_date: string;
  registered_address: string;
  directors: Array<{ name: string; din?: string; designation?: string }>;
  evaluation_profile: ContractorEvaluationProfile;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  sector: string;
  contractor_count: number;
}

let cachedDataset: {
  dataset_metadata: any;
  departments: DepartmentSummary[];
  contractors: ContractorRecord[];
} | null = null;

export function loadContractorsEvaluationDataset(): {
  dataset_metadata: any;
  departments: DepartmentSummary[];
  contractors: ContractorRecord[];
} {
  if (cachedDataset) return cachedDataset;

  const datasetPath = path.resolve(__dirname, '../../../data/indian_contractors_ai_evaluation_dataset.json');
  try {
    if (fs.existsSync(datasetPath)) {
      const raw = fs.readFileSync(datasetPath, 'utf-8');
      cachedDataset = JSON.parse(raw);
      return cachedDataset!;
    }
  } catch (err) {
    console.warn('[Evaluation Dataset] Failed to read JSON dataset file:', err);
  }

  // Minimal fallback
  return {
    dataset_metadata: { title: 'Fallback Dataset' },
    departments: [],
    contractors: [],
  };
}

/**
 * Returns all verified contractor records matching a department identifier or sector name.
 */
export function getContractorsForDepartment(deptIdOrName: string): ContractorRecord[] {
  const { contractors } = loadContractorsEvaluationDataset();
  if (!deptIdOrName) return contractors.slice(0, 4);

  const clean = deptIdOrName.toLowerCase().trim();
  const matched = contractors.filter(
    (c) =>
      c.department_id.toLowerCase() === clean ||
      c.department.toLowerCase().includes(clean) ||
      clean.includes(c.department_id.toLowerCase())
  );

  return matched.length > 0 ? matched : contractors.slice(0, 4);
}

/**
 * Generates ready-to-evaluate bid input structures for a tender from the contractor dataset.
 */
export function getEvaluationBiddersForDepartment(
  deptIdOrName: string,
  budgetInr: number = 100000000,
  deliveryDays: number = 180
): any[] {
  const contractors = getContractorsForDepartment(deptIdOrName);

  return contractors.map((c, idx) => {
    const ep = c.evaluation_profile;
    const bidAmount = Math.round(budgetInr * (ep.bid_amount_ratio || 0.9 + idx * 0.02));
    const completionDays = Math.max(30, Math.round(deliveryDays * (ep.completion_days_ratio || 0.92)));

    return {
      id: `bid-${c.id}`,
      bid_id: `bid-${c.id}`,
      bid_reference: `BID-${c.department_id.toUpperCase()}-2026-00${idx + 1}`,
      company_id: c.id,
      company_name: c.name,
      short_name: c.short_name,
      cin: c.cin,
      registered_address: c.registered_address,
      incorporation_date: c.incorporation_date,
      directors: c.directors,
      bid_amount_inr: bidAmount,
      completion_days: completionDays,
      technical_proposal: ep.technical_proposal,
      annual_turnover_inr: ep.annual_turnover_inr,
      net_worth_inr: ep.net_worth_inr,
      years_in_operation: ep.years_in_operation,
      completed_projects_count: ep.completed_projects_count,
      technical_capabilities: ep.technical_capabilities,
      compliance_info: ep.compliance_info,
      past_performance: ep.past_performance,
      is_synthetic: true,
      osint_profile: ep.osint_profile,
    };
  });
}
