let rawBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
if (rawBase && !rawBase.startsWith('http://') && !rawBase.startsWith('https://')) {
  rawBase = `https://${rawBase}`;
}
if (rawBase.endsWith('/')) {
  rawBase = rawBase.slice(0, -1);
}
if (!rawBase.endsWith('/api/v1')) {
  rawBase = `${rawBase}/api/v1`;
}
const API_BASE = rawBase;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role_code: 'ADMIN' | 'GOVT_OFFICER' | 'BIDDER' | 'AUDITOR' | 'EVALUATOR';
  company_id: string | null;
  status: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
}

export interface HealthData {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  environment: string;
  checks: {
    database: string;
  };
}

export interface SystemStatusData {
  status: string;
  timestamp: string;
  services: {
    backend: { status: string; version: string };
    database: { status: string; healthLogEntries: number };
    aiService: {
      status: string;
      url: string;
      details: unknown;
      error: string | null;
    };
  };
}

export interface PingData {
  message: string;
  aiResponse: {
    message: string;
    from_service: string;
    timestamp: string;
  };
}

// In-memory access token storage (XSS safe)
let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Universal request function with authorization headers, cookie credentials,
 * and automatic 401 token refresh retry.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (currentAccessToken) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include', // sends refresh token cookie
    });

    // Handle token expiration
    if (response.status === 401 && !isRetry && !path.startsWith('/auth/')) {
      if (isRefreshing) {
        // Wait for current refresh to finish
        return new Promise<ApiResponse<T>>((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (token) {
                headers.set('Authorization', `Bearer ${token}`);
                resolve(request<T>(path, { ...options, headers }, true));
              } else {
                reject(new Error('Session expired'));
              }
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });

        const refreshData: ApiResponse<AuthResponseData> = await refreshRes.json();

        if (refreshData.success && refreshData.data?.accessToken) {
          const newToken = refreshData.data.accessToken;
          setAccessToken(newToken);
          processQueue(null, newToken);
          isRefreshing = false;
          return request<T>(path, options, true);
        } else {
          setAccessToken(null);
          processQueue(new Error('Refresh failed'), null);
          isRefreshing = false;
        }
      } catch (err) {
        setAccessToken(null);
        processQueue(err, null);
        isRefreshing = false;
      }
    }

    const data = (await response.json()) as ApiResponse<T>;
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network request failed',
        code: 'NETWORK_ERROR',
      },
    };
  }
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export const api = {
  // Public & Health
  getHealth: () => request<any>('/health'),
  getStatus: () => request<any>('/status'),
  pingAi: () => request<any>('/ai/ping'),

  // Auth Endpoints
  login: (credentials: { email: string; password: string }) =>
    request<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    role_code: string;
    company_id?: string;
  }) =>
    request<AuthResponseData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  refresh: () =>
    request<AuthResponseData>('/auth/refresh', {
      method: 'POST',
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  // Tenders (All authenticated roles)
  getTenders: () => request<{ tenders: any[] }>('/tenders'),

  createTender: (payload: {
    reference_number?: string;
    title: string;
    description: string;
    category: string;
    department: string;
    estimated_project_value?: number;
    opening_date: string;
    closing_date: string;
    status?: 'DRAFT' | 'PUBLISHED';
    eligibility_requirements?: any[];
    evaluation_criteria?: any[];
    required_documents?: any[];
  }) =>
    request<{ message: string; tender: any }>('/tenders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTenderDraft: (
    tenderId: string,
    payload: {
      title?: string;
      description?: string;
      category?: string;
      department?: string;
      estimated_project_value?: number;
      opening_date?: string;
      closing_date?: string;
      eligibility_requirements?: any[];
      evaluation_criteria?: any[];
      required_documents?: any[];
    }
  ) =>
    request<{ message: string }>(`/tenders/${tenderId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  publishTender: (tenderId: string) =>
    request<{ message: string; status: string }>(`/tenders/${tenderId}/publish`, {
      method: 'POST',
    }),

  closeTender: (tenderId: string) =>
    request<{ message: string; status: string }>(`/tenders/${tenderId}/close`, {
      method: 'POST',
    }),

  revealBids: (tenderId: string) =>
    request<{ message: string; status: string }>(`/tenders/${tenderId}/reveal-bids`, {
      method: 'POST',
    }),

  transitionTender: (tenderId: string, nextStatus: string, reason?: string) =>
    request<{ message: string; previousStatus: string; status: string }>(
      `/tenders/${tenderId}/transition`,
      {
        method: 'POST',
        body: JSON.stringify({ next_status: nextStatus, reason }),
      }
    ),

  getTenderDetails: (tenderId: string) =>
    request<{
      tender: any;
      requirements: any[];
      criteria: any[];
      bidsCount: number;
      unsealedBids: any[];
      recommendations: any[];
      allowedNextTransitions: string[];
    }>(`/tenders/${tenderId}/details`),

  getOfficerDashboard: () =>
    request<{
      summary: {
        totalTenders: number;
        activeTenders: number;
        closedTenders: number;
        underEvaluation: number;
        completedTenders: number;
        recommendationsPending: number;
        highRiskCount: number;
      };
      activeTenders: any[];
      upcomingDeadlines: any[];
      closedTenders: any[];
      evaluatingTenders: any[];
      pendingRecommendations: any[];
      highRiskTenders: any[];
    }>('/officer/dashboard'),

  // Bids & Sealed Envelope
  getTenderBids: (tenderId: string) =>
    request<{ tender: any; bids: any[]; unsealedAt?: string }>(`/tenders/${tenderId}/bids`),

  submitBid: (
    tenderId: string,
    payload: {
      bid_reference: string;
      bid_amount_enc: string;
      completion_days: number;
      technical_proposal?: string;
    }
  ) =>
    request<{ message: string; bid: any }>(`/tenders/${tenderId}/bids`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Bidder Isolated Access
  getMyBids: () => request<{ bids: any[] }>('/bids/mine'),
  getMyCompany: () => request<{ company: any }>('/companies/me'),

  // Phase 5 — Company Profile & Bidder Eligibility Engine
  getCompanyProfile: () =>
    request<{ company: any; documents: any[] }>('/eligibility/company/profile'),

  updateCompanyProfile: (payload: {
    name?: string;
    legal_name?: string;
    tax_id?: string;
    industry?: string;
    address_line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    website?: string;
    annual_turnover_inr?: number;
    net_worth_inr?: number;
    years_in_operation?: number;
    employee_count?: number;
    completed_projects?: any[];
    technical_capabilities?: any[];
    financial_capacity?: any;
    compliance_info?: any;
  }) =>
    request<{ message: string; company: any }>('/eligibility/company/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  uploadCompanyDocument: (payload: {
    document_type: string;
    file_name: string;
    file_size_bytes?: number;
    mime_type?: string;
    sha256_hash?: string;
    valid_until?: string | null;
    metadata?: Record<string, any>;
  }) =>
    request<{ message: string; document: any }>('/eligibility/company/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteCompanyDocument: (docId: string) =>
    request<{ message: string }>(`/eligibility/company/documents/${docId}`, {
      method: 'DELETE',
    }),

  precheckEligibility: (tenderId: string) =>
    request<{ report: any }>(`/eligibility/precheck/${tenderId}`, {
      method: 'POST',
    }),

  evaluateBidEligibility: (bidId: string) =>
    request<{ message: string; report: any }>(`/eligibility/evaluate-bid/${bidId}`, {
      method: 'POST',
    }),

  evaluateTenderEligibility: (tenderId: string) =>
    request<{
      message: string;
      tenderId: string;
      totalBids: number;
      eligibleBids: number;
      disqualifiedBids: number;
      reports: any[];
    }>(`/eligibility/evaluate-tender/${tenderId}`, {
      method: 'POST',
    }),

  getTenderEligibilitySummary: (tenderId: string) =>
    request<{
      tenderId: string;
      totalBids: number;
      eligibleBids: number;
      disqualifiedBids: number;
      bids: any[];
    }>(`/eligibility/tender/${tenderId}/summary`),

  // Phase 6 — Cryptographic Sealed-Bid Procurement
  submitSealedBid: (payload: {
    tenderId: string;
    bidAmountInr: number;
    completionDays: number;
    technicalProposal?: string;
    financialProposal?: string;
    coverLetter?: string;
    notes?: string;
    documents?: any[];
    declarationAccepted: boolean;
  }) =>
    request<{ message: string; data: any }>('/bids/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTenderBidsForOfficer: (tenderId: string) =>
    request<{
      tenderId: string;
      status: string;
      deadline: string;
      isPastDeadline: boolean;
      isUnsealed: boolean;
      bidsCount: number;
      bids: any[];
    }>(`/bids/tender/${tenderId}`),

  unsealTenderBids: (tenderId: string) =>
    request<{ message: string; data: any }>(`/bids/tender/${tenderId}/unseal`, {
      method: 'POST',
    }),

  verifyBidIntegrity: (bidId: string) =>
    request<{
      isIntact: boolean;
      status: 'MATCH' | 'MISMATCH';
      originalHash: string;
      currentCalculatedHash: string;
      details: string;
      checkedAt: string;
    }>(`/bids/${bidId}/verify-tamper`, {
      method: 'POST',
    }),

  // Phase 7 — AI Evaluation Pipeline & Decisions
  startEvaluation: (
    tenderId: string,
    weights?: {
      price: number;
      technical: number;
      experience: number;
      financial: number;
      past_performance: number;
      risk: number;
    }
  ) =>
    request<{ message: string; evaluation: any; result: any }>(`/tenders/${tenderId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ weights }),
    }),

  runSyntheticBenchmarkDemo: (
    tenderId: string,
    weights?: {
      price: number;
      technical: number;
      experience: number;
      financial: number;
      past_performance: number;
      risk: number;
    }
  ) =>
    request<{ message: string; evaluation: any; result: any }>(
      `/tenders/${tenderId}/evaluate/synthetic`,
      {
        method: 'POST',
        body: JSON.stringify({ weights }),
      }
    ),

  getAiRecommendations: (tenderId: string) =>
    request<{
      evaluation: any;
      recommendations: any[];
      weights: {
        price: number;
        technical: number;
        experience: number;
        financial: number;
        past_performance: number;
        risk: number;
      };
    }>(`/tenders/${tenderId}/ai-recommendations`),

  getBidExplanation: (tenderId: string, bidId: string) =>
    request<{
      tender_id: string;
      bid_id: string;
      company_name: string;
      bid_reference: string;
      rank: number;
      total_score: number;
      recommendation: string;
      explanation: any;
      criterion_breakdown: any;
    }>(`/tenders/${tenderId}/ai-explanation/${bidId}`),

  getDecisionDossier: (tenderId: string) =>
    request<any>(`/tenders/${tenderId}/decision-dossier`),

  getTenderDecision: (tenderId: string) =>
    request<any>(`/tenders/${tenderId}/decision`),

  submitDecision: (
    tenderId: string,
    payload: {
      action?: 'approve' | 'reject';
      decision: 'award' | 'reject' | 'defer' | 'cancel_tender';
      selected_bid_id?: string;
      awarded_bid_id?: string;
      followed_ai?: boolean;
      rationale?: string;
      override_reason_type?: string;
      override_reason_detail?: string;
      supporting_note?: string;
    }
  ) =>
    request<{ message: string; decision?: any }>(`/tenders/${tenderId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTenderRiskAnalysis: (tenderId: string) =>
    request<{
      tender_id: string;
      bids_evaluated: number;
      bid_anomalies: any[];
      collusion_indicators: any[];
      has_collusion_pattern: boolean;
      summary: string;
      disclaimer: string;
    }>(`/tenders/${tenderId}/risk-analysis`),

  getTenderOverrideAnalysis: (tenderId: string) =>
    request<{
      tender_id: string;
      tender_title: string;
      ai_recommendation: {
        bid_id: string;
        company_name: string;
        total_score: number;
      } | null;
      government_selection: {
        bid_id: string;
        company_name: string;
      } | null;
      is_override: boolean;
      override_status: 'YES' | 'NO';
      mandatory_reason: string | null;
      reason_type: string | null;
      decided_by_name: string | null;
      decided_at: string | null;
      pattern_analysis: {
        repeated_pattern_detected: boolean;
        pattern_label: string | null;
        summary: string | null;
        officer_override_count: number;
        officer_total_decisions: number;
        explainable_risk_indicators: string[];
      };
    }>(`/tenders/${tenderId}/override-analysis`),

  // Auditor Endpoints
  getAuditLogs: () => request<{ logs: any[] }>('/audit-logs'),
  getAuditChainLogs: (filters: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        params.append(k, String(v));
      }
    });
    const qs = params.toString();
    return request<{ total: number; limit: number; offset: number; logs: any[] }>(
      `/audit-logs${qs ? `?${qs}` : ''}`
    );
  },
  verifyAuditChain: () =>
    request<{
      isValid: boolean;
      statusText: '✓ AUDIT CHAIN VALID' | '⚠ AUDIT INTEGRITY FAILURE';
      totalBlocks: number;
      rootHash?: string;
      latestHash?: string;
      verifiedAt: string;
      failureDetails?: {
        sequence: number;
        eventId: string;
        expectedHash: string;
        actualHash: string;
        reason: string;
      };
    }>('/audit/verify'),
  simulateTamper: (sequence?: number) =>
    request<{ simulated: boolean; message: string }>('/audit/simulate-tamper', {
      method: 'POST',
      body: JSON.stringify({ sequence }),
    }),
  restoreAuditChain: () =>
    request<{ message: string }>('/audit/restore-chain', {
      method: 'POST',
    }),
  getDecisionsHistory: () => request<{ decisions: any[] }>('/decisions/history'),

  // Admin Endpoints
  getAdminUsers: () => request<{ users: any[] }>('/admin/users'),
  getAdminSystem: () => request<any>('/admin/system'),

  // Phase 14 Synthetic Demonstration Endpoints
  getDemoStatus: () => request<any>('/demo/status'),
  resetDemoScenario: () => request<any>('/demo/reset', { method: 'POST' }),
  runDemoScenario1: () => request<any>('/demo/scenario-1', { method: 'POST' }),
  runDemoScenario2: () => request<any>('/demo/scenario-2', { method: 'POST' }),
};
