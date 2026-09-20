export interface GovtDepartment {
  id: string;
  name: string;
  ministry: string;
  category:
    | 'Infrastructure & Construction'
    | 'Defence & Strategic'
    | 'Energy & Resources'
    | 'Technology & Telecom'
    | 'Healthcare & Water'
    | 'Education & Agriculture';
  code: string;
  popular?: boolean;
}

/**
 * Validated Tendering Departments & Agencies of the Government of India.
 * Strictly includes entities that actively float public tenders for civil works,
 * capital goods, technology, healthcare, and services. Non-tendering policy,
 * taxation, civil-service HR, and constitutional audit bodies (e.g. CAG, CVC,
 * DoPT, NITI Aayog, DEA) are excluded.
 */
export const GOVT_DEPARTMENTS: GovtDepartment[] = [
  // ── Infrastructure & Construction ──────────────────────────────────────────
  {
    id: 'cpwd',
    name: 'Central Public Works Department (CPWD)',
    ministry: 'Ministry of Housing & Urban Affairs',
    category: 'Infrastructure & Construction',
    code: 'CPWD-MOHUA',
    popular: true,
  },
  {
    id: 'nhai',
    name: 'National Highways Authority of India (NHAI)',
    ministry: 'Ministry of Road Transport & Highways',
    category: 'Infrastructure & Construction',
    code: 'NHAI-MORTH',
    popular: true,
  },
  {
    id: 'railways-board',
    name: 'Railway Board & Zonal Rail Procurement',
    ministry: 'Ministry of Railways',
    category: 'Infrastructure & Construction',
    code: 'RB-RAIL',
    popular: true,
  },
  {
    id: 'morth',
    name: 'Central Highway & Expressway Works Division',
    ministry: 'Ministry of Road Transport & Highways',
    category: 'Infrastructure & Construction',
    code: 'MORTH-ENG',
  },
  {
    id: 'aai',
    name: 'Airports Authority of India (AAI Engineering)',
    ministry: 'Ministry of Civil Aviation',
    category: 'Infrastructure & Construction',
    code: 'AAI-MCA',
    popular: true,
  },
  {
    id: 'nhidcl',
    name: 'National Highways & Infra Development Corp (NHIDCL)',
    ministry: 'Ministry of Road Transport & Highways',
    category: 'Infrastructure & Construction',
    code: 'NHIDCL-MORTH',
  },
  {
    id: 'dmrc',
    name: 'Delhi Metro Rail Corporation & Urban Transit',
    ministry: 'Ministry of Housing & Urban Affairs',
    category: 'Infrastructure & Construction',
    code: 'DMRC-MOHUA',
  },
  {
    id: 'iwai',
    name: 'Inland Waterways Authority of India (IWAI)',
    ministry: 'Ministry of Ports, Shipping & Waterways',
    category: 'Infrastructure & Construction',
    code: 'IWAI-MOPSW',
  },
  {
    id: 'smart-cities',
    name: 'Smart Cities Mission Project Directorate',
    ministry: 'Ministry of Housing & Urban Affairs',
    category: 'Infrastructure & Construction',
    code: 'SCM-MOHUA',
  },
  {
    id: 'nrida',
    name: 'National Rural Infrastructure Development Agency (NRIDA - PMGSY)',
    ministry: 'Ministry of Rural Development',
    category: 'Infrastructure & Construction',
    code: 'NRIDA-MORD',
  },

  // ── Defence & Strategic ───────────────────────────────────────────────────
  {
    id: 'mes',
    name: 'Military Engineer Services (MES)',
    ministry: 'Ministry of Defence',
    category: 'Defence & Strategic',
    code: 'MES-MOD',
    popular: true,
  },
  {
    id: 'drdo',
    name: 'Defence Research & Development Organisation (DRDO)',
    ministry: 'Ministry of Defence',
    category: 'Defence & Strategic',
    code: 'DRDO-MOD',
    popular: true,
  },
  {
    id: 'mod-acquisition',
    name: 'Department of Defence (Capital Acquisition Wing)',
    ministry: 'Ministry of Defence',
    category: 'Defence & Strategic',
    code: 'DOD-ACQ',
    popular: true,
  },
  {
    id: 'isro',
    name: 'Indian Space Research Organisation (ISRO Propulsion & Launch)',
    ministry: 'Department of Space',
    category: 'Defence & Strategic',
    code: 'ISRO-DOS',
    popular: true,
  },
  {
    id: 'dae-barc',
    name: 'Bhabha Atomic Research Centre (BARC Engineering)',
    ministry: 'Department of Atomic Energy',
    category: 'Defence & Strategic',
    code: 'BARC-DAE',
  },
  {
    id: 'mha-capf',
    name: 'Central Armed Police Forces (CAPF Consolidated Procurement)',
    ministry: 'Ministry of Home Affairs',
    category: 'Defence & Strategic',
    code: 'CAPF-MHA',
  },

  // ── Energy & Resources ────────────────────────────────────────────────────
  {
    id: 'seci',
    name: 'Solar Energy Corporation of India (SECI Renewable Grid)',
    ministry: 'Ministry of New & Renewable Energy',
    category: 'Energy & Resources',
    code: 'SECI-MNRE',
    popular: true,
  },
  {
    id: 'powergrid',
    name: 'Power Grid Corporation & Central Electricity Authority',
    ministry: 'Ministry of Power',
    category: 'Energy & Resources',
    code: 'PGCIL-POWER',
    popular: true,
  },
  {
    id: 'ntpc',
    name: 'NTPC Limited (Power Generation & EPC Plants)',
    ministry: 'Ministry of Power',
    category: 'Energy & Resources',
    code: 'NTPC-POWER',
  },
  {
    id: 'ongc',
    name: 'Oil & Natural Gas Corporation (ONGC Offshore & Drilling)',
    ministry: 'Ministry of Petroleum & Natural Gas',
    category: 'Energy & Resources',
    code: 'ONGC-MOPNG',
  },
  {
    id: 'eil-petro',
    name: 'Engineers India Limited (Energy Infra & Pipelines)',
    ministry: 'Ministry of Petroleum & Natural Gas',
    category: 'Energy & Resources',
    code: 'EIL-MOPNG',
  },

  // ── Technology & Telecom ──────────────────────────────────────────────────
  {
    id: 'nic',
    name: 'National Informatics Centre (NIC Central Procurement)',
    ministry: 'Ministry of Electronics & Information Technology',
    category: 'Technology & Telecom',
    code: 'NIC-MEITY',
    popular: true,
  },
  {
    id: 'dot',
    name: 'Department of Telecommunications (Telecom Infra & BharatNet)',
    ministry: 'Ministry of Communications',
    category: 'Technology & Telecom',
    code: 'DOT-MOC',
    popular: true,
  },
  {
    id: 'cdac',
    name: 'Centre for Development of Advanced Computing (C-DAC Supercomputing)',
    ministry: 'Ministry of Electronics & Information Technology',
    category: 'Technology & Telecom',
    code: 'CDAC-MEITY',
  },
  {
    id: 'digital-india',
    name: 'Digital India Corporation (DIC Platform Operations)',
    ministry: 'Ministry of Electronics & Information Technology',
    category: 'Technology & Telecom',
    code: 'DIC-MEITY',
  },
  {
    id: 'csir',
    name: 'Council of Scientific & Industrial Research (CSIR Central)',
    ministry: 'Ministry of Science & Technology',
    category: 'Technology & Telecom',
    code: 'CSIR-MST',
  },

  // ── Healthcare & Water ────────────────────────────────────────────────────
  {
    id: 'aiims-procure',
    name: 'AIIMS Centralized Medical Equipment Procurement Cell',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Healthcare & Water',
    code: 'AIIMS-MOHFW',
    popular: true,
  },
  {
    id: 'cmss',
    name: 'Central Medical Services Society (CMSS Pharma & Medical Logistics)',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Healthcare & Water',
    code: 'CMSS-MOHFW',
    popular: true,
  },
  {
    id: 'jal-jeevan',
    name: 'Department of Drinking Water & Sanitation (Jal Jeevan Mission)',
    ministry: 'Ministry of Jal Shakti',
    category: 'Healthcare & Water',
    code: 'JJM-MOJS',
    popular: true,
  },
  {
    id: 'nmcg',
    name: 'National Mission for Clean Ganga (NMCG Water Treatment & STPs)',
    ministry: 'Ministry of Jal Shakti',
    category: 'Healthcare & Water',
    code: 'NMCG-MOJS',
  },

  // ── Education & Agriculture ───────────────────────────────────────────────
  {
    id: 'edu-school',
    name: 'Department of School Education & Literacy',
    ministry: 'Ministry of Education',
    category: 'Education & Agriculture',
    code: 'DOSEL-MOE',
    popular: true,
  },
  {
    id: 'edu-higher',
    name: 'Department of Higher Education (Central Universities & IITs Infra)',
    ministry: 'Ministry of Education',
    category: 'Education & Agriculture',
    code: 'DHE-MOE',
  },
  {
    id: 'agri-infra',
    name: 'Department of Agriculture & Farmers Welfare (Farm Mechanization)',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Education & Agriculture',
    code: 'DAFW-MOA',
  },
];
