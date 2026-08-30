/**
 * ProcureAI — Database TypeScript Types
 * Phase 2: Full Schema
 *
 * These types mirror the PostgreSQL schema exactly.
 * All UUID columns are typed as `string` (UUID v4 format).
 * Timestamps are `Date` when returned from the pg driver (with pg type parser).
 * JSONB columns are typed with their expected shape where known, `Record<string,unknown>` otherwise.
 * Monetary amounts in paisa are `bigint` (PostgreSQL BIGINT → Node.js BigInt).
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'deactivated';

export type CompanyStatus = 'pending_review' | 'verified' | 'rejected' | 'suspended' | 'deactivated';

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type DocumentType =
  | 'registration_certificate'
  | 'tax_clearance'
  | 'audited_financials'
  | 'director_id'
  | 'bank_statement'
  | 'iso_certification'
  | 'other';

export type TenderStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'OPEN'
  | 'CLOSED'
  | 'BIDS_REVEALED'
  | 'UNDER_EVALUATION'
  | 'RECOMMENDATION_READY'
  | 'DECISION_MADE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'draft'
  | 'published'
  | 'open'
  | 'closed'
  | 'bids_revealed'
  | 'under_evaluation'
  | 'recommendation_ready'
  | 'decision_made'
  | 'completed'
  | 'awarded'
  | 'clarification'
  | 'cancelled';

export type TenderCategory =
  | 'infrastructure'
  | 'information_technology'
  | 'healthcare'
  | 'education'
  | 'defense'
  | 'agriculture'
  | 'energy'
  | 'transport'
  | 'environment'
  | 'other';

export type RequirementType = 'financial' | 'technical' | 'legal' | 'capacity' | 'experience' | 'compliance';

export type CriteriaType =
  | 'technical'
  | 'financial'
  | 'experience'
  | 'delivery_timeline'
  | 'quality'
  | 'social_impact'
  | 'environmental';

export type BidStatus =
  | 'draft'
  | 'submitted'
  | 'withdrawn'
  | 'disqualified'
  | 'under_evaluation'
  | 'shortlisted'
  | 'rejected'
  | 'awarded';

export type SubmissionType = 'initial' | 'revision' | 'final';

export type EligibilityStatus = 'pass' | 'fail' | 'waived' | 'not_applicable';

export type EvaluationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type RecommendationType =
  | 'award'
  | 'reject'
  | 'shortlist'
  | 'request_clarification'
  | 'flag_for_review';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RiskCategory =
  | 'financial'
  | 'compliance'
  | 'capacity'
  | 'experience'
  | 'conflict_of_interest'
  | 'data_integrity'
  | 'bid_manipulation';

export type AnomalyType =
  | 'price_collusion'
  | 'bid_clustering'
  | 'shill_bidding'
  | 'document_tampering'
  | 'abnormal_low_bid'
  | 'abnormal_high_bid'
  | 'late_surge'
  | 'other';

export type AnomalySeverity = 'informational' | 'warning' | 'critical';

export type DecisionType = 'award' | 'reject' | 'defer' | 'cancel_tender' | 're_tender';

export type OverrideReasonType =
  | 'ai_error'
  | 'additional_information'
  | 'policy_exception'
  | 'emergency'
  | 'committee_directive'
  | 'other';

export type AuditAction =
  | 'user_registered' | 'user_verified' | 'user_suspended' | 'user_login' | 'user_logout'
  | 'company_created' | 'company_verified' | 'company_suspended' | 'document_uploaded' | 'document_approved'
  | 'tender_created' | 'tender_published' | 'tender_closed' | 'tender_cancelled'
  | 'bid_created' | 'bid_submitted' | 'bid_withdrawn' | 'bid_disqualified'
  | 'eligibility_check_run' | 'ai_evaluation_started' | 'ai_evaluation_completed' | 'ai_recommendation_generated'
  | 'decision_made' | 'decision_overridden'
  | 'anomaly_detected' | 'risk_flag_raised' | 'schema_migrated';

export type NotificationType =
  | 'tender_published'
  | 'bid_received'
  | 'bid_status_changed'
  | 'eligibility_result'
  | 'evaluation_completed'
  | 'decision_made'
  | 'document_expiry_warning'
  | 'anomaly_alert'
  | 'system_alert';

export type NotificationChannel = 'in_app' | 'email' | 'sms';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

// ─── Domain 1: Identity ────────────────────────────────────────────────────────

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  role_id: string;
  company_id: string | null;
  email: string;
  password_hash: string;        // never return to client
  full_name: string;
  phone_number: string | null;  // encrypted
  employee_id: string | null;
  department: string | null;
  designation: string | null;
  status: UserStatus;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  failed_login_count: number;
  locked_until: Date | null;
  avatar_url: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

/** User safe for API responses — sensitive fields omitted */
export type UserPublic = Omit<User, 'password_hash' | 'failed_login_count' | 'locked_until'>;

export interface CompletedProject {
  id: string;
  title: string;
  client_name: string;
  value_paisa?: number | string;
  completion_year: number;
  sector?: string;
  reference_contact?: string;
}

export interface TechnicalCapability {
  name: string;
  category?: string;
  certified_by?: string;
  valid_until?: string;
  level?: string;
}

export interface FinancialCapacity {
  net_worth_paisa?: number | string;
  credit_rating?: string;
  solvency_ratio?: number;
  working_capital_paisa?: number | string;
  bank_name?: string;
}

export interface ComplianceInfo {
  is_debarred: boolean;
  tax_clearance_status?: string;
  labor_compliance?: boolean;
  litigation_status?: string;
  sworn_declaration_date?: string;
}

export interface PastPerformance {
  avg_rating?: number;
  on_time_completion_pct?: number;
  projects_evaluated?: number;
  blacklisted?: boolean;
}

export interface Company {
  id: string;
  created_by: string;
  registration_number: string;
  name: string;
  legal_name: string;
  industry: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  website: string | null;
  annual_turnover_paisa: bigint | null;   // encrypted — bigint in DB
  net_worth_paisa: bigint | null;          // encrypted
  employee_count: number | null;
  years_in_operation: number | null;
  tax_id?: string | null;
  incorporation_date?: string | null;
  completed_projects_count?: number;
  completed_projects?: CompletedProject[];
  technical_capabilities?: TechnicalCapability[];
  financial_capacity?: FinancialCapacity;
  compliance_info?: ComplianceInfo;
  past_performance?: PastPerformance;
  status: CompanyStatus;
  verified_at: Date | null;
  verified_by: string | null;
  rejection_reason: string | null;
  metadata: Record<string, unknown>;
  encryption_key_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyDocument {
  id: string;
  company_id: string;
  uploaded_by: string;
  document_type: DocumentType;
  file_name: string;
  file_size_bytes: bigint;
  mime_type: string;
  storage_key: string;
  sha256_hash: string;
  status: DocumentStatus;
  valid_from: string | null;   // DATE as ISO string
  valid_until: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// ─── Domain 2: Procurement ─────────────────────────────────────────────────────

export interface TenderDocument {
  name: string;
  storage_key: string;
  sha256: string;
  uploaded_at: string;
}

export interface Tender {
  id: string;
  created_by: string;
  reference_number: string;
  title: string;
  description: string;
  category: TenderCategory;
  department: string;
  estimated_budget_paisa: bigint | null;
  budget_is_public: boolean;
  currency: string;
  submission_start_at: Date;
  submission_deadline_at: Date;
  evaluation_deadline_at: Date | null;
  project_start_date: string | null;  // DATE
  project_duration_days: number | null;
  status: TenderStatus;
  published_at: Date | null;
  closed_at: Date | null;
  awarded_at: Date | null;
  awarded_to_bid_id: string | null;
  cancellation_reason: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  documents: TenderDocument[];
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface TenderRequirement {
  id: string;
  tender_id: string;
  requirement_type: RequirementType;
  title: string;
  description: string;
  is_mandatory: boolean;
  threshold_value: string | null;   // NUMERIC as string to avoid float loss
  threshold_unit: string | null;
  verification_method: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface ScoringRubric {
  [score: string]: string;  // {"90": "Excellent...", "75": "Good..."}
}

export interface TenderEvaluationCriteria {
  id: string;
  tender_id: string;
  criteria_type: CriteriaType;
  name: string;
  description: string | null;
  weight: string;      // NUMERIC as string
  max_score: string;
  scoring_rubric: ScoringRubric;
  is_ai_scored: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// ─── Domain 3: Bids ────────────────────────────────────────────────────────────

export interface Bid {
  id: string;
  tender_id: string;
  company_id: string;
  created_by: string;
  bid_reference: string;
  bid_amount_enc: string | null;        // AES-GCM ciphertext
  bid_amount_currency: string;
  technical_proposal: string | null;    // ciphertext of storage path
  financial_proposal: string | null;
  cover_letter: string | null;
  completion_days: number | null;
  status: BidStatus;
  disqualification_reason: string | null;
  submitted_at: Date | null;
  withdrawn_at: Date | null;
  encryption_key_id: string | null;
  is_locked: boolean;
  integrity_status: 'verified' | 'tampered' | 'unverified';
  unsealed_at: Date | null;
  unsealed_by: string | null;
  canonical_hash: string | null;
  receipt_token: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface TamperAuditLog {
  id: string;
  bid_id: string;
  checked_by: string | null;
  original_hash: string;
  calculated_hash: string;
  status: 'MATCH' | 'MISMATCH';
  details: string | null;
  created_at: Date;
}

export interface BidDocument {
  id: string;
  bid_id: string;
  uploaded_by: string;
  document_type: DocumentType;
  file_name: string;
  file_size_bytes: bigint;
  mime_type: string;
  storage_key: string;
  sha256_hash: string;
  is_encrypted: boolean;
  encryption_key_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface BidHash {
  id: string;
  bid_id: string;
  version: number;
  hash_algorithm: string;
  content_hash: string;
  hash_input_json: string;
  signed_by: string | null;
  signed_at: Date | null;
  created_at: Date;
}

export interface BidSubmission {
  id: string;
  bid_id: string;
  submitted_by: string;
  submission_type: SubmissionType;
  bid_hash_id: string;
  ip_address: string | null;
  user_agent: string | null;
  declaration_accepted: boolean;
  receipt_token: string;
  notes: string | null;
  submitted_at: Date;
  is_withdrawn: boolean;
  withdrawn_at: Date | null;
  withdrawn_by: string | null;
  withdrawal_reason: string | null;
}

// ─── Domain 4: AI Pipeline ─────────────────────────────────────────────────────

export interface EligibilityResult {
  id: string;
  bid_id: string;
  requirement_id: string;
  checked_by_user: string | null;
  status: EligibilityStatus;
  rule_type?: string | null;
  score: string | null;
  evidence_summary: string | null;
  evidence_detail?: Record<string, unknown>;
  verification_notes: string | null;
  is_disqualifying?: boolean;
  waiver_reason: string | null;
  waived_by: string | null;
  checked_at: Date;
  metadata: Record<string, unknown>;
}

export interface AiEvaluation {
  id: string;
  tender_id: string;
  triggered_by: string | null;
  model_name: string;
  model_version: string;
  model_config: Record<string, unknown>;
  status: EvaluationStatus;
  bids_evaluated: number;
  started_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  runtime_seconds: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface EvidenceRef {
  source: string;
  excerpt: string;
  relevance_score: number;
}

export interface AiScore {
  id: string;
  evaluation_id: string;
  bid_id: string;
  criteria_id: string;
  raw_score: string;
  weighted_score: string;
  confidence: string | null;
  explanation: string;
  evidence_refs: EvidenceRef[];
  flags: string[];
  created_at: Date;
}

export interface AiRecommendation {
  id: string;
  evaluation_id: string;
  bid_id: string;
  recommendation: RecommendationType;
  total_score: string;
  rank: number | null;
  confidence: string;
  reasoning_summary: string;
  key_strengths: string[];
  key_weaknesses: string[];
  concerns: string[];
  bias_check_passed: boolean;
  bias_check_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

// ─── Domain 5: Risk & Anomaly ──────────────────────────────────────────────────

export interface RiskAssessment {
  id: string;
  bid_id: string;
  evaluation_id: string | null;
  assessed_by: string | null;
  risk_category: RiskCategory;
  risk_level: RiskLevel;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  mitigation_notes: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: Date | null;
  resolution_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface AnomalyResult {
  id: string;
  tender_id: string;
  evaluation_id: string | null;
  detected_by: string | null;
  anomaly_type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  affected_bid_ids: string[];
  detection_data: Record<string, unknown>;
  confidence_score: string | null;
  is_confirmed: boolean | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_notes: string | null;
  escalated_to: string | null;
  escalated_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// ─── Domain 6: Decisions ──────────────────────────────────────────────────────

export interface GovernmentDecision {
  id: string;
  tender_id: string;
  decided_by: string;
  ai_recommendation_id: string | null;
  decision: DecisionType;
  awarded_bid_id: string | null;
  rationale: string;
  followed_ai: boolean;
  ai_agreement_score: string | null;
  committee_approval: boolean;
  committee_ref: string | null;
  appeal_deadline_at: Date | null;
  is_final: boolean;
  effective_at: Date;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface DecisionOverride {
  id: string;
  decision_id: string;
  override_by: string;
  reason_type: OverrideReasonType;
  reason_detail: string;
  ai_score_at_time: string | null;
  human_score: string | null;
  supporting_docs: Array<{ name: string; storage_key: string }>;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  is_approved: boolean | null;
  compliance_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

// ─── Domain 7: Observability ──────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  target_type: string;
  target_id: string | null;
  target_ref: string | null;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  correlation_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  subject: string;
  body: string;
  related_tender_id: string | null;
  related_bid_id: string | null;
  priority: 0 | 1 | 2;
  send_after_at: Date;
  sent_at: Date | null;
  delivered_at: Date | null;
  read_at: Date | null;
  failed_reason: string | null;
  retry_count: number;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceHealthLog {
  id: string;
  service_name: string;
  status: string;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

// ─── Composite / Join Types ────────────────────────────────────────────────────

/** Tender with full related data for evaluation view */
export interface TenderWithDetails extends Tender {
  requirements: TenderRequirement[];
  criteria: TenderEvaluationCriteria[];
  bid_count: number;
  submitted_bid_count: number;
}

/** Bid with company, hash, and latest submission */
export interface BidWithDetails extends Bid {
  company: Pick<Company, 'id' | 'name' | 'registration_number' | 'status'>;
  latest_submission: BidSubmission | null;
  latest_hash: BidHash | null;
  documents: BidDocument[];
}

/** AI evaluation result bundled for a single bid */
export interface BidEvaluationBundle {
  bid: Bid;
  eligibility_results: EligibilityResult[];
  scores: AiScore[];
  recommendation: AiRecommendation | null;
  risks: RiskAssessment[];
}
