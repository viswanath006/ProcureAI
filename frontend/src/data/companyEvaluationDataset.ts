import { BIDDER_COMPANIES, BidderCompany } from './bidderCompanies';

export interface ContractorEvaluationMetric {
  id: string;
  name: string;
  short_name: string;
  department: string;
  departmentId: string;
  category: string;
  email: string;
  cin: string;
  years_in_operation: number;
  completed_projects_count: number;
  annual_turnover_inr: number;
  net_worth_inr: number;
  technical_capabilities: string[];
  past_performance_rating: number;
  on_time_delivery_pct: number;
  flagship_projects: string[];
}

export const CONTRACTORS_EVALUATION_SUMMARY: Record<string, Partial<ContractorEvaluationMetric>> = {
  'lnt-infra': {
    years_in_operation: 78,
    completed_projects_count: 48,
    annual_turnover_inr: 1833410000000,
    net_worth_inr: 892000000000,
    technical_capabilities: ['IRC Accredited Paving Specialist', 'ISO 9001:2015', '3D Stringless Concrete Paving'],
    past_performance_rating: 4.85,
    on_time_delivery_pct: 97.2,
    flagship_projects: ['Mumbai Trans Harbour Link (Atal Setu)', 'Western Dedicated Freight Corridor'],
  },
  'dilip-buildcon': {
    years_in_operation: 18,
    completed_projects_count: 34,
    annual_turnover_inr: 105370000000,
    net_worth_inr: 48200000000,
    technical_capabilities: ['NHAI HAM Gold Standard', 'Captive Fleet (12,000+ Units)', 'ISO 9001:2015'],
    past_performance_rating: 4.72,
    on_time_delivery_pct: 98.1,
    flagship_projects: ['Zuari Bridge Goa (8-lane Cable Stayed)', 'Bhopal Metro Rail Phase 1'],
  },
  'irb-infra': {
    years_in_operation: 26,
    completed_projects_count: 28,
    annual_turnover_inr: 74090000000,
    net_worth_inr: 134200000000,
    technical_capabilities: ['BOT / TOT Concessionaire Specialist', 'ISO 9001:2015', 'FASTag ETC'],
    past_performance_rating: 4.65,
    on_time_delivery_pct: 95.0,
    flagship_projects: ['Mumbai-Pune Expressway Concession', 'Ganga Expressway Group 2'],
  },
  'gr-infra': {
    years_in_operation: 29,
    completed_projects_count: 27,
    annual_turnover_inr: 85000000000,
    net_worth_inr: 59000000000,
    technical_capabilities: ['NATM Tunneling & Viaducts', 'ISO 9001:2015 & ISO 14001:2015'],
    past_performance_rating: 4.68,
    on_time_delivery_pct: 96.0,
    flagship_projects: ['NH-24 Hapur Bypass', 'Purvanchal Expressway Package 4'],
  },
  'pnc-infratech': {
    years_in_operation: 25,
    completed_projects_count: 24,
    annual_turnover_inr: 79000000000,
    net_worth_inr: 42000000000,
    technical_capabilities: ['Runway & Heavy Pavement EPC', 'ISO 9001:2015', 'OHSAS 18001'],
    past_performance_rating: 4.60,
    on_time_delivery_pct: 94.5,
    flagship_projects: ['Agra-Lucknow Expressway Package', 'IAF Runway Modernization'],
  },
  'ashoka-buildcon': {
    years_in_operation: 31,
    completed_projects_count: 29,
    annual_turnover_inr: 81000000000,
    net_worth_inr: 36000000000,
    technical_capabilities: ['Bridge & Road Concessionaire', 'ISO 9001:2015', 'Laser Profiling'],
    past_performance_rating: 4.58,
    on_time_delivery_pct: 93.8,
    flagship_projects: ['Eastern Peripheral Expressway Package', 'Belgaum-Khanapur Highway HAM'],
  },
  'shapoorji-pallonji': {
    years_in_operation: 158,
    completed_projects_count: 65,
    annual_turnover_inr: 125000000000,
    net_worth_inr: 62000000000,
    technical_capabilities: ['BIM Level 3 Architecture', 'GRIHA 5-Star Green Construction', 'ISO 9001/14001/45001'],
    past_performance_rating: 4.88,
    on_time_delivery_pct: 96.5,
    flagship_projects: ['Bharat Mandapam (IECC Pragati Maidan)', 'RBI Mumbai HQ', 'MEA Jawaharlal Nehru Bhavan'],
  },
  'ahluwalia-contracts': {
    years_in_operation: 45,
    completed_projects_count: 42,
    annual_turnover_inr: 34000000000,
    net_worth_inr: 18500000000,
    technical_capabilities: ['Hospital & Healthcare Civil EPC', 'Clean-room HVAC', 'ISO 9001:2015'],
    past_performance_rating: 4.74,
    on_time_delivery_pct: 95.8,
    flagship_projects: ['AIIMS Jammu & AIIMS Bilaspur Hospitals', 'Nalanda University New Campus'],
  },
  'ncc-limited': {
    years_in_operation: 34,
    completed_projects_count: 51,
    annual_turnover_inr: 183000000000,
    net_worth_inr: 68000000000,
    technical_capabilities: ['Aluminum Formwork (Mivan)', 'ISO 9001:2015 Quality Systems'],
    past_performance_rating: 4.66,
    on_time_delivery_pct: 94.2,
    flagship_projects: ['AIIMS Guwahati Construction', 'Defence Housing Complex Hyderabad'],
  },
  'tata-projects': {
    years_in_operation: 45,
    completed_projects_count: 39,
    annual_turnover_inr: 178000000000,
    net_worth_inr: 38000000000,
    technical_capabilities: ['EPB-TBM Underground Tunneling', 'New Parliament EPC Constructor', 'ISO 9001/14001/45001'],
    past_performance_rating: 4.89,
    on_time_delivery_pct: 97.8,
    flagship_projects: ['New Parliament Building of India (Central Vista)', 'Noida International Airport Jewar'],
  },
  'titagarh-rail': {
    years_in_operation: 27,
    completed_projects_count: 31,
    annual_turnover_inr: 38500000000,
    net_worth_inr: 21500000000,
    technical_capabilities: ['RDSO Class-A Rolling Stock', 'IRIS ISO/TS 22163', 'EN 15085 CL-1 Welding'],
    past_performance_rating: 4.81,
    on_time_delivery_pct: 96.7,
    flagship_projects: ['Pune Metro Aluminium Car Body Trainsets', 'Vande Bharat Sleeper Coaches'],
  },
  'texmaco-rail': {
    years_in_operation: 26,
    completed_projects_count: 35,
    annual_turnover_inr: 36000000000,
    net_worth_inr: 17200000000,
    technical_capabilities: ['RDSO Approved Freight Wagon Builder', 'Flash-Butt Track Welding', 'ISO 9001:2015'],
    past_performance_rating: 4.69,
    on_time_delivery_pct: 94.8,
    flagship_projects: ['Indian Railways 20,000+ Wagon Supply', 'DFC Ballastless Track Package'],
  },
  'alstom-india': {
    years_in_operation: 30,
    completed_projects_count: 22,
    annual_turnover_inr: 48000000000,
    net_worth_inr: 26000000000,
    technical_capabilities: ['12,000 HP Electric Locomotive OEM', 'CBTC & ETCS Level 2 Signaling', 'Madhepura Make in India'],
    past_performance_rating: 4.90,
    on_time_delivery_pct: 98.2,
    flagship_projects: ['800 WAG-12B Electric Locomotives', 'Delhi-Meerut RRTS Namo Bharat Trainsets'],
  },
  'siemens-mobility': {
    years_in_operation: 67,
    completed_projects_count: 36,
    annual_turnover_inr: 196000000000,
    net_worth_inr: 115000000000,
    technical_capabilities: ['SIL-4 Railway Interlocking', '9,000 HP Electric Locomotive OEM', 'IRIS Certified'],
    past_performance_rating: 4.92,
    on_time_delivery_pct: 98.5,
    flagship_projects: ['1,200 Dahod Electric Locomotives', 'KAVACH Automatic Train Protection'],
  },
  'bel-defence': {
    years_in_operation: 70,
    completed_projects_count: 58,
    annual_turnover_inr: 202680000000,
    net_worth_inr: 154000000000,
    technical_capabilities: ['Navratna Defence PSU OEM', 'MIL-STD-810G', 'AS9100D Aerospace Quality', 'CMMI Level 5'],
    past_performance_rating: 4.91,
    on_time_delivery_pct: 97.4,
    flagship_projects: ['Akash Surface-to-Air Radars', 'Project Akashteer C4I', 'IACCS Air Command Control'],
  },
  'hal-aerospace': {
    years_in_operation: 61,
    completed_projects_count: 44,
    annual_turnover_inr: 298100000000,
    net_worth_inr: 268000000000,
    technical_capabilities: ['Maharatna Military Aircraft OEM', 'CEMILAC Airworthiness', 'AS9100 Rev D'],
    past_performance_rating: 4.86,
    on_time_delivery_pct: 96.0,
    flagship_projects: ['LCA Tejas Mk-1A Fighter', 'Prachand Light Combat Helicopter', 'ALH Dhruv Helicopter'],
  },
  'bharat-forge': {
    years_in_operation: 63,
    completed_projects_count: 32,
    annual_turnover_inr: 156000000000,
    net_worth_inr: 74000000000,
    technical_capabilities: ['155mm Artillery & Armored Vehicle OEM', 'ISO 9001:2015', 'IATF 16949'],
    past_performance_rating: 4.79,
    on_time_delivery_pct: 96.5,
    flagship_projects: ['ATAGS 155mm Artillery Gun', 'Kalyani M4 Armored Vehicles', 'Garuda 105mm Gun'],
  },
  'tata-advanced': {
    years_in_operation: 17,
    completed_projects_count: 25,
    annual_turnover_inr: 62000000000,
    net_worth_inr: 31000000000,
    technical_capabilities: ['Airbus C-295 Final Assembly Line', 'AS9100D Aerospace Certified', 'DRDO Missile Canisters'],
    past_performance_rating: 4.82,
    on_time_delivery_pct: 97.0,
    flagship_projects: ['C-295 Aircraft Manufacturing Vadodara', 'Pinaka Rocket Launchers', 'WhAP 8x8 Armored Vehicle'],
  },
  'data-patterns': {
    years_in_operation: 26,
    completed_projects_count: 28,
    annual_turnover_inr: 5400000000,
    net_worth_inr: 12800000000,
    technical_capabilities: ['DRDO Radar Processor Specialist', 'AS9100D & ISO 9001:2015', 'Clean-room Assembly'],
    past_performance_rating: 4.77,
    on_time_delivery_pct: 96.2,
    flagship_projects: ['Su-30 MKI Radar Display', 'BrahMos Missile Seeker Electronics', 'Arudhra Radar Processing'],
  },
  'adani-green': {
    years_in_operation: 9,
    completed_projects_count: 30,
    annual_turnover_inr: 104620000000,
    net_worth_inr: 92000000000,
    technical_capabilities: ['Utility Renewable Park Leader', 'IEC 61215/61730 Solar PV', 'ISO 9001/14001/45001'],
    past_performance_rating: 4.80,
    on_time_delivery_pct: 97.2,
    flagship_projects: ['Khavda 30 GW Renewable Park', 'Kamuthi 648 MW Solar', 'Jaisalmer 2.1 GW Hybrid Park'],
  },
  'tata-solar': {
    years_in_operation: 35,
    completed_projects_count: 48,
    annual_turnover_inr: 88400000000,
    net_worth_inr: 42000000000,
    technical_capabilities: ['TOPCon Solar Cell OEM', 'IEC & BIS Certified Modules', 'ISO 9001/14001/OHSAS 18001'],
    past_performance_rating: 4.88,
    on_time_delivery_pct: 98.0,
    flagship_projects: ['100 MW Floating Solar Kayamkulam', 'Raghanesda 100 MW Solar Park', '300 MW CPSU Dholera'],
  },
  'tcs-govt': {
    years_in_operation: 56,
    completed_projects_count: 82,
    annual_turnover_inr: 2408930000000,
    net_worth_inr: 904000000000,
    technical_capabilities: ['CMMI Level 5 DEV & SVC', 'ISO 27001:2022', 'ISO 20000-1', 'CERT-In Safe-to-Host'],
    past_performance_rating: 4.93,
    on_time_delivery_pct: 98.4,
    flagship_projects: ['Passport Seva 2.0 Mission-Mode', 'GeM Government e-Marketplace', 'India Post Core Banking'],
  },
  'infosys-public': {
    years_in_operation: 43,
    completed_projects_count: 68,
    annual_turnover_inr: 1536700000000,
    net_worth_inr: 860000000000,
    technical_capabilities: ['CMMI Level 5 Software Engineering', 'ISO 27001 & ISO 27701 Privacy'],
    past_performance_rating: 4.87,
    on_time_delivery_pct: 97.6,
    flagship_projects: ['Income Tax e-Filing 2.0 Portal', 'GSTN Infrastructure', 'MCA21 V3 Portal'],
  },
  'va-tech-wabag': {
    years_in_operation: 29,
    completed_projects_count: 48,
    annual_turnover_inr: 34200000000,
    net_worth_inr: 18200000000,
    technical_capabilities: ['Desalination & Water EPC Global Tier-1', 'Membrane Bioreactor (MBR)', 'ISO 9001/14001'],
    past_performance_rating: 4.86,
    on_time_delivery_pct: 97.4,
    flagship_projects: ['100 MLD Nemmeli Desalination Chennai', '400 MLD Perur Desalination', 'Namami Gange STPs'],
  },
  'wipro-ge-healthcare': {
    years_in_operation: 34,
    completed_projects_count: 52,
    annual_turnover_inr: 72000000000,
    net_worth_inr: 38000000000,
    technical_capabilities: ['AERB Type Approved Radiation Devices', 'ISO 13485 Medical Devices', 'US FDA 510(k) & CE'],
    past_performance_rating: 4.90,
    on_time_delivery_pct: 98.0,
    flagship_projects: ['AIIMS Delhi & New AIIMS Diagnostic Suites', 'PMSSY GMC Modernization'],
  },
  'mahindra-farm': {
    years_in_operation: 79,
    completed_projects_count: 62,
    annual_turnover_inr: 1390780000000,
    net_worth_inr: 582000000000,
    technical_capabilities: ['World Largest Tractor OEM', 'CFMTTI Certified', 'ISO 9001:2015 & IATF 16949'],
    past_performance_rating: 4.92,
    on_time_delivery_pct: 98.6,
    flagship_projects: ['Government of India SMAM Custom Hiring Center Supply', 'Pan-India Agri DBT'],
  },
};

export function getContractorEvaluationDetails(companyId: string): ContractorEvaluationMetric | null {
  const company = BIDDER_COMPANIES.find((c) => c.id === companyId);
  if (!company) return null;

  const extra = CONTRACTORS_EVALUATION_SUMMARY[companyId] || {};
  return {
    id: company.id,
    name: company.name,
    short_name: company.name.split('(')[0].trim(),
    department: company.department,
    departmentId: company.departmentId,
    category: company.category,
    email: company.email,
    cin: company.cin,
    years_in_operation: extra.years_in_operation || 15,
    completed_projects_count: extra.completed_projects_count || 12,
    annual_turnover_inr: extra.annual_turnover_inr || 25000000000,
    net_worth_inr: extra.net_worth_inr || 12000000000,
    technical_capabilities: extra.technical_capabilities || ['ISO 9001:2015 Certified', 'Statutory Registered Vendor'],
    past_performance_rating: extra.past_performance_rating || 4.7,
    on_time_delivery_pct: extra.on_time_delivery_pct || 95.0,
    flagship_projects: extra.flagship_projects || ['Verified Landmark Government Project Deliveries'],
  };
}

export function getDepartmentContractors(deptIdOrName: string): BidderCompany[] {
  if (!deptIdOrName) return BIDDER_COMPANIES.slice(0, 4);
  const clean = deptIdOrName.toLowerCase().trim();
  const matched = BIDDER_COMPANIES.filter(
    (c) =>
      c.departmentId.toLowerCase() === clean ||
      c.department.toLowerCase().includes(clean) ||
      clean.includes(c.departmentId.toLowerCase())
  );
  return matched.length > 0 ? matched : BIDDER_COMPANIES.slice(0, 4);
}
