import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, queryOne, queryRows, withTransaction } from '../config/database';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../utils/errors';

// ─── Lifecycle State Machine ──────────────────────────────────────────────────

export const TENDER_LIFECYCLE_SEQUENCE = [
  'DRAFT',
  'PUBLISHED',
  'OPEN',
  'CLOSED',
  'BIDS_REVEALED',
  'UNDER_EVALUATION',
  'RECOMMENDATION_READY',
  'DECISION_MADE',
  'COMPLETED',
] as const;

export type TenderLifecycleStatus = (typeof TENDER_LIFECYCLE_SEQUENCE)[number] | 'CANCELLED';

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED', 'OPEN', 'CANCELLED'],
  PUBLISHED: ['OPEN', 'CLOSED', 'CANCELLED'],
  OPEN: ['CLOSED', 'CANCELLED'],
  CLOSED: ['BIDS_REVEALED', 'CANCELLED'],
  BIDS_REVEALED: ['UNDER_EVALUATION', 'CANCELLED'],
  UNDER_EVALUATION: ['RECOMMENDATION_READY', 'CANCELLED'],
  RECOMMENDATION_READY: ['DECISION_MADE', 'CANCELLED'],
  DECISION_MADE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const eligibilityRequirementSchema = z.object({
  requirement_type: z.enum(['financial', 'technical', 'legal', 'capacity']),
  title: z.string().min(3),
  description: z.string().min(5),
  is_mandatory: z.boolean().default(true),
  threshold_value: z.number().optional(),
  threshold_unit: z.string().optional(),
  verification_method: z.string().optional(),
});

const evaluationCriteriaSchema = z.object({
  criteria_type: z.enum([
    'technical',
    'financial',
    'experience',
    'delivery_timeline',
    'quality',
    'social_impact',
    'environmental',
  ]),
  name: z.string().min(3),
  description: z.string().optional(),
  weight: z.number().min(1).max(100),
  max_score: z.number().positive().default(100),
  scoring_rubric: z.record(z.string(), z.string()).optional(),
  is_ai_scored: z.boolean().default(true),
});

const requiredDocumentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  required: z.boolean().default(true),
});

const createTenderSchema = z.object({
  reference_number: z.string().optional(),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum([
    'infrastructure',
    'information_technology',
    'healthcare',
    'education',
    'defense',
    'agriculture',
    'energy',
    'transport',
    'environment',
    'other',
  ]),
  department: z.string().min(2, 'Department is required'),
  estimated_project_value: z.number().positive('Project value must be positive').optional(),
  currency: z.string().default('INR'),
  opening_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  closing_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  tags: z.array(z.string()).default([]),
  eligibility_requirements: z.array(eligibilityRequirementSchema).default([]),
  evaluation_criteria: z.array(evaluationCriteriaSchema).default([]),
  required_documents: z.array(requiredDocumentSchema).default([]),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeStatus(st: string): string {
  return st.toUpperCase();
}

function calculatePaisa(inrValue?: number): bigint | null {
  if (!inrValue) return null;
  return BigInt(Math.round(inrValue * 100));
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/tenders
 * Create a new tender as DRAFT or PUBLISHED.
 */
export async function createTender(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createTenderSchema.parse(req.body);
    const user = req.user!;

    const openingDate = new Date(validated.opening_date);
    const closingDate = new Date(validated.closing_date);

    if (closingDate <= openingDate) {
      throw new ValidationError('Closing date must be after opening date', 'INVALID_DATES');
    }

    // Weight validation: If publishing, weights MUST sum to 100
    if (validated.status === 'PUBLISHED') {
      if (closingDate <= new Date()) {
        throw new ValidationError('Submission deadline must be in the future to publish', 'DEADLINE_IN_PAST');
      }

      if (validated.evaluation_criteria.length > 0) {
        const sumWeights = validated.evaluation_criteria.reduce((acc, c) => acc + c.weight, 0);
        if (Math.abs(sumWeights - 100) > 0.01) {
          throw new ValidationError(
            `Evaluation criteria weights must sum to exactly 100%. Current sum: ${sumWeights}%`,
            'INVALID_CRITERIA_WEIGHTS'
          );
        }
      }
    }

    const refNum = validated.reference_number || `TENDER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const budgetPaisa = calculatePaisa(validated.estimated_project_value);

    // Initial status determined by opening date if published
    let initialStatus: string = validated.status;
    if (initialStatus === 'PUBLISHED' && openingDate <= new Date()) {
      initialStatus = 'OPEN';
    }

    const result = await withTransaction(async (client) => {
      // 1. Insert Tender
      const tenderRes = await client.query<{ id: string; reference_number: string; status: string; created_at: Date }>(
        `INSERT INTO tenders (
          created_by, reference_number, title, description, category,
          department, estimated_budget_paisa, currency,
          submission_start_at, submission_deadline_at, status,
          published_at, contact_email, contact_phone, tags, documents
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, reference_number, status, created_at`,
        [
          user.userId,
          refNum,
          validated.title,
          validated.description,
          validated.category,
          validated.department,
          budgetPaisa ? budgetPaisa.toString() : null,
          validated.currency,
          openingDate,
          closingDate,
          initialStatus,
          initialStatus !== 'DRAFT' ? new Date() : null,
          validated.contact_email ?? user.email,
          validated.contact_phone ?? null,
          validated.tags,
          JSON.stringify(validated.required_documents),
        ]
      );

      const tender = tenderRes.rows[0];

      // 2. Insert Eligibility Requirements
      for (let i = 0; i < validated.eligibility_requirements.length; i++) {
        const reqItem = validated.eligibility_requirements[i];
        await client.query(
          `INSERT INTO tender_requirements (
            tender_id, requirement_type, title, description, is_mandatory,
            threshold_value, threshold_unit, verification_method, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            tender.id,
            reqItem.requirement_type,
            reqItem.title,
            reqItem.description,
            reqItem.is_mandatory,
            reqItem.threshold_value ?? null,
            reqItem.threshold_unit ?? null,
            reqItem.verification_method ?? null,
            i + 1,
          ]
        );
      }

      // 3. Insert Evaluation Criteria
      for (let i = 0; i < validated.evaluation_criteria.length; i++) {
        const critItem = validated.evaluation_criteria[i];
        await client.query(
          `INSERT INTO tender_evaluation_criteria (
            tender_id, criteria_type, name, description, weight,
            max_score, scoring_rubric, is_ai_scored, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            tender.id,
            critItem.criteria_type,
            critItem.name,
            critItem.description ?? null,
            critItem.weight,
            critItem.max_score,
            JSON.stringify(critItem.scoring_rubric ?? {}),
            critItem.is_ai_scored,
            i + 1,
          ]
        );
      }

      // 4. Log Audit Event
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, target_type, target_id, target_ref, new_state)
         VALUES ($1, $2, 'tenders', $3, $4, $5)`,
        [
          user.userId,
          initialStatus === 'DRAFT' ? 'tender_created' : 'tender_published',
          tender.id,
          tender.reference_number,
          JSON.stringify({ status: initialStatus, title: validated.title }),
        ]
      );

      return tender;
    });

    res.status(201).json({
      success: true,
      data: {
        message: initialStatus === 'DRAFT' ? 'Tender draft saved successfully.' : 'Tender published successfully.',
        tender: result,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/tenders/:id
 * Update an existing tender draft. Only permitted in DRAFT state.
 */
export async function updateTenderDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const validated = createTenderSchema.partial().parse(req.body);
    const user = req.user!;

    const existing = await queryOne<{ id: string; status: string; created_by: string }>(
      'SELECT id, status, created_by FROM tenders WHERE id = $1',
      [id]
    );

    if (!existing) throw new NotFoundError('Tender not found', 'TENDER_NOT_FOUND');

    const currentStatus = normalizeStatus(existing.status);
    if (currentStatus !== 'DRAFT') {
      throw new ValidationError(
        `Cannot edit tender in '${currentStatus}' status. Modifications are only permitted while in 'DRAFT'.`,
        'DRAFT_ONLY_UPDATE'
      );
    }

    const budgetPaisa = validated.estimated_project_value ? calculatePaisa(validated.estimated_project_value) : undefined;

    await withTransaction(async (client) => {
      // 1. Update Tender base attributes
      await client.query(
        `UPDATE tenders SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          department = COALESCE($4, department),
          estimated_budget_paisa = COALESCE($5, estimated_budget_paisa),
          submission_start_at = COALESCE($6, submission_start_at),
          submission_deadline_at = COALESCE($7, submission_deadline_at),
          documents = COALESCE($8, documents),
          updated_at = NOW()
        WHERE id = $9`,
        [
          validated.title,
          validated.description,
          validated.category,
          validated.department,
          budgetPaisa ? budgetPaisa.toString() : null,
          validated.opening_date ? new Date(validated.opening_date) : null,
          validated.closing_date ? new Date(validated.closing_date) : null,
          validated.required_documents ? JSON.stringify(validated.required_documents) : null,
          id,
        ]
      );

      // 2. If requirements provided, refresh them
      if (validated.eligibility_requirements) {
        await client.query('DELETE FROM tender_requirements WHERE tender_id = $1', [id]);
        for (let i = 0; i < validated.eligibility_requirements.length; i++) {
          const r = validated.eligibility_requirements[i];
          await client.query(
            `INSERT INTO tender_requirements (
              tender_id, requirement_type, title, description, is_mandatory,
              threshold_value, threshold_unit, verification_method, sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [id, r.requirement_type, r.title, r.description, r.is_mandatory, r.threshold_value ?? null, r.threshold_unit ?? null, r.verification_method ?? null, i + 1]
          );
        }
      }

      // 3. If criteria provided, refresh them
      if (validated.evaluation_criteria) {
        await client.query('DELETE FROM tender_evaluation_criteria WHERE tender_id = $1', [id]);
        for (let i = 0; i < validated.evaluation_criteria.length; i++) {
          const c = validated.evaluation_criteria[i];
          await client.query(
            `INSERT INTO tender_evaluation_criteria (
              tender_id, criteria_type, name, description, weight,
              max_score, scoring_rubric, is_ai_scored, sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [id, c.criteria_type, c.name, c.description ?? null, c.weight, c.max_score, JSON.stringify(c.scoring_rubric ?? {}), c.is_ai_scored, i + 1]
          );
        }
      }
    });

    res.json({
      success: true,
      data: { message: 'Tender draft updated successfully.' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/tenders/:id/publish
 * Transition DRAFT -> PUBLISHED or OPEN.
 */
export async function publishTender(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const tender = await queryOne<{
      id: string;
      reference_number: string;
      status: string;
      submission_start_at: Date;
      submission_deadline_at: Date;
    }>(
      'SELECT id, reference_number, status, submission_start_at, submission_deadline_at FROM tenders WHERE id = $1',
      [id]
    );

    if (!tender) throw new NotFoundError('Tender not found', 'TENDER_NOT_FOUND');

    const currentStatus = normalizeStatus(tender.status);
    if (currentStatus !== 'DRAFT') {
      throw new ValidationError(`Tender is already in status '${currentStatus}'`, 'ALREADY_PUBLISHED');
    }

    const now = new Date();
    const deadline = new Date(tender.submission_deadline_at);
    if (deadline <= now) {
      throw new ValidationError('Cannot publish tender with submission deadline in the past', 'DEADLINE_IN_PAST');
    }

    // Verify evaluation criteria weights sum to 100
    const criteria = await queryRows<{ weight: string }>(
      'SELECT weight FROM tender_evaluation_criteria WHERE tender_id = $1',
      [id]
    );

    if (criteria.length > 0) {
      const sumWeights = criteria.reduce((acc, c) => acc + parseFloat(c.weight), 0);
      if (Math.abs(sumWeights - 100) > 0.01) {
        throw new ValidationError(
          `Cannot publish tender: evaluation criteria weights must sum to 100%. Current sum: ${sumWeights}%`,
          'INVALID_CRITERIA_WEIGHTS'
        );
      }
    }

    const openingDate = new Date(tender.submission_start_at);
    const nextStatus = openingDate <= now ? 'OPEN' : 'PUBLISHED';

    await query(
      'UPDATE tenders SET status = $1, published_at = NOW(), updated_at = NOW() WHERE id = $2',
      [nextStatus, id]
    );

    await query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, target_ref, new_state)
       VALUES ($1, 'tender_published', 'tenders', $2, $3, $4)`,
      [user.userId, id, tender.reference_number, JSON.stringify({ status: nextStatus })]
    );

    res.json({
      success: true,
      data: {
        message: `Tender published successfully. Current state: ${nextStatus}.`,
        status: nextStatus,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/tenders/:id/transition
 * Enforce the strict 9-stage lifecycle transition sequence.
 */
export async function transitionTender(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { next_status, reason } = req.body;
    const user = req.user!;

    if (!next_status) {
      throw new ValidationError('next_status is required', 'STATUS_REQUIRED');
    }

    const targetStatus = normalizeStatus(next_status);

    const tender = await queryOne<{
      id: string;
      reference_number: string;
      status: string;
      submission_deadline_at: Date;
    }>(
      'SELECT id, reference_number, status, submission_deadline_at FROM tenders WHERE id = $1',
      [id]
    );

    if (!tender) throw new NotFoundError('Tender not found', 'TENDER_NOT_FOUND');

    const currentStatus = normalizeStatus(tender.status);
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(targetStatus)) {
      throw new ValidationError(
        `Invalid lifecycle transition from '${currentStatus}' to '${targetStatus}'. Permitted transitions from '${currentStatus}' are: ${allowed.join(', ') || 'None (Terminal state)'}.`,
        'INVALID_STATE_TRANSITION'
      );
    }

    // Special validation for revealing bids
    if (targetStatus === 'BIDS_REVEALED') {
      const now = new Date();
      const deadline = new Date(tender.submission_deadline_at);
      if (now < deadline) {
        throw new AuthorizationError(
          `Bids remain cryptographically sealed until deadline (${deadline.toISOString()}).`,
          'BIDS_STILL_SEALED'
        );
      }
    }

    // Special validation for entering AI evaluation: Eligibility must be completed first
    if (targetStatus === 'UNDER_EVALUATION') {
      const unverified = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM bids b
         LEFT JOIN (
           SELECT DISTINCT bid_id FROM eligibility_results
         ) er ON er.bid_id = b.id
         WHERE b.tender_id = $1 AND b.status != 'withdrawn' AND er.bid_id IS NULL`,
        [id]
      );

      if (unverified && Number(unverified.count) > 0) {
        throw new ValidationError(
          `Cannot transition to UNDER_EVALUATION: ${unverified.count} bid(s) have not completed eligibility screening. Bidder eligibility verification must be completed before AI ranking.`,
          'ELIGIBILITY_SCREENING_REQUIRED'
        );
      }
    }

    await query(
      `UPDATE tenders SET
        status = $1,
        closed_at = CASE WHEN $1 = 'CLOSED' AND closed_at IS NULL THEN NOW() ELSE closed_at END,
        updated_at = NOW()
       WHERE id = $2`,
      [targetStatus, id]
    );

    await query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, target_ref, previous_state, new_state)
       VALUES ($1, 'tender_status_changed', 'tenders', $2, $3, $4, $5)`,
      [
        user.userId,
        id,
        tender.reference_number,
        JSON.stringify({ status: currentStatus }),
        JSON.stringify({ status: targetStatus, reason: reason ?? null }),
      ]
    );

    res.json({
      success: true,
      data: {
        message: `Tender transitioned from ${currentStatus} to ${targetStatus}.`,
        previousStatus: currentStatus,
        status: targetStatus,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/tenders/:id/close
 * Close tender from OPEN or PUBLISHED to CLOSED.
 */
export async function closeTender(req: Request, res: Response, next: NextFunction): Promise<void> {
  req.body.next_status = 'CLOSED';
  return transitionTender(req, res, next);
}

/**
 * POST /api/v1/tenders/:id/reveal-bids
 * Transition from CLOSED to BIDS_REVEALED.
 */
export async function revealBids(req: Request, res: Response, next: NextFunction): Promise<void> {
  req.body.next_status = 'BIDS_REVEALED';
  return transitionTender(req, res, next);
}

/**
 * GET /api/v1/tenders/:id/details
 * Retrieve complete tender dossier including requirements, criteria, documents, bids, and AI findings.
 */
export async function getTenderDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const tender = await queryOne<any>(
      `SELECT t.*,
              u.full_name AS creator_name,
              u.email AS creator_email
       FROM tenders t
       LEFT JOIN users u ON u.id = t.created_by
       WHERE t.id = $1`,
      [id]
    );

    if (!tender) throw new NotFoundError('Tender not found', 'TENDER_NOT_FOUND');

    const [requirements, criteria, bidsCountRes] = await Promise.all([
      queryRows('SELECT * FROM tender_requirements WHERE tender_id = $1 ORDER BY sort_order ASC', [id]),
      queryRows('SELECT * FROM tender_evaluation_criteria WHERE tender_id = $1 ORDER BY sort_order ASC', [id]),
      queryOne<{ total_bids: string }>('SELECT COUNT(*) AS total_bids FROM bids WHERE tender_id = $1', [id]),
    ]);

    const statusNorm = normalizeStatus(tender.status);
    let unsealedBids: any[] = [];
    let recommendations: any[] = [];

    // Bids visible to officers/auditors only after BIDS_REVEALED
    const bidsUnsealedStages = ['BIDS_REVEALED', 'UNDER_EVALUATION', 'RECOMMENDATION_READY', 'DECISION_MADE', 'COMPLETED', 'AWARDED'];
    if (bidsUnsealedStages.includes(statusNorm) && ['GOVT_OFFICER', 'AUDITOR', 'ADMIN'].includes(user.roleCode)) {
      unsealedBids = await queryRows(
        `SELECT b.id, b.bid_reference, b.status, b.submitted_at, b.completion_days,
                c.name AS company_name, c.registration_number
         FROM bids b
         JOIN companies c ON c.id = b.company_id
         WHERE b.tender_id = $1
         ORDER BY b.submitted_at ASC`,
        [id]
      );
    }

    // AI recommendations visible once ready
    const recStages = ['RECOMMENDATION_READY', 'DECISION_MADE', 'COMPLETED', 'AWARDED'];
    if (recStages.includes(statusNorm) && ['GOVT_OFFICER', 'AUDITOR', 'ADMIN', 'EVALUATOR'].includes(user.roleCode)) {
      recommendations = await queryRows(
        `SELECT r.*, b.bid_reference, c.name AS company_name
         FROM ai_recommendations r
         JOIN bids b ON b.id = r.bid_id
         JOIN companies c ON c.id = b.company_id
         JOIN ai_evaluations e ON e.id = r.evaluation_id
         WHERE e.tender_id = $1
         ORDER BY r.rank ASC`,
        [id]
      );
    }

    res.json({
      success: true,
      data: {
        tender,
        requirements,
        criteria,
        bidsCount: Number(bidsCountRes?.total_bids ?? 0),
        unsealedBids,
        recommendations,
        allowedNextTransitions: ALLOWED_TRANSITIONS[statusNorm] || [],
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/officer/dashboard
 * Aggregated metrics for the Executive Government Officer Dashboard.
 */
export async function getOfficerDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const urgentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [
      activeTenders,
      upcomingDeadlines,
      closedTenders,
      evaluatingTenders,
      pendingRecommendations,
      highRiskTenders,
      summaryCounts,
    ] = await Promise.all([
      // 1. Active Tenders (OPEN, PUBLISHED)
      queryRows(
        `SELECT id, reference_number, title, department, category, estimated_budget_paisa,
                submission_start_at, submission_deadline_at, status,
                (SELECT COUNT(*) FROM bids WHERE tender_id = tenders.id) AS bid_count
         FROM tenders
         WHERE UPPER(status::text) IN ('OPEN', 'PUBLISHED')
         ORDER BY submission_deadline_at ASC`
      ),

      // 2. Upcoming Deadlines (Closing in ≤ 14 days)
      queryRows(
        `SELECT id, reference_number, title, department, submission_deadline_at, status,
                EXTRACT(DAY FROM (submission_deadline_at - NOW())) AS days_left
         FROM tenders
         WHERE UPPER(status::text) IN ('OPEN', 'PUBLISHED')
           AND submission_deadline_at > NOW()
           AND submission_deadline_at <= NOW() + INTERVAL '14 days'
         ORDER BY submission_deadline_at ASC`
      ),

      // 3. Closed Tenders (CLOSED, BIDS_REVEALED)
      queryRows(
        `SELECT id, reference_number, title, department, closed_at, status,
                (SELECT COUNT(*) FROM bids WHERE tender_id = tenders.id) AS bid_count
         FROM tenders
         WHERE UPPER(status::text) IN ('CLOSED', 'BIDS_REVEALED')
         ORDER BY closed_at DESC NULLS LAST`
      ),

      // 4. Evaluation Status (UNDER_EVALUATION, RECOMMENDATION_READY)
      queryRows(
        `SELECT id, reference_number, title, department, status, updated_at,
                (SELECT COUNT(*) FROM bids WHERE tender_id = tenders.id) AS bid_count
         FROM tenders
         WHERE UPPER(status::text) IN ('UNDER_EVALUATION', 'RECOMMENDATION_READY')
         ORDER BY updated_at DESC`
      ),

      // 5. Recommendations Pending Decision
      queryRows(
        `SELECT t.id, t.reference_number, t.title, t.department, t.status,
                e.completed_at AS evaluation_date
         FROM tenders t
         JOIN ai_evaluations e ON e.tender_id = t.id
         LEFT JOIN government_decisions d ON d.tender_id = t.id
         WHERE (UPPER(t.status::text) = 'RECOMMENDATION_READY' OR e.status = 'completed')
           AND d.id IS NULL
         ORDER BY e.completed_at DESC`
      ),

      // 6. High-Risk Tenders (Flagged by risk_assessments or anomaly_results)
      queryRows(
        `SELECT DISTINCT t.id, t.reference_number, t.title, t.department, t.status,
                r.risk_level, r.title AS risk_title
         FROM tenders t
         JOIN bids b ON b.tender_id = t.id
         JOIN risk_assessments r ON r.bid_id = b.id
         WHERE r.risk_level IN ('high', 'critical') AND r.is_resolved = FALSE
         LIMIT 10`
      ),

      // 7. Executive metric counters
      queryOne<{
        total_tenders: string;
        active_count: string;
        closed_count: string;
        eval_count: string;
        completed_count: string;
      }>(
        `SELECT
           COUNT(*)::text AS total_tenders,
           COUNT(*) FILTER (WHERE UPPER(status::text) IN ('OPEN', 'PUBLISHED'))::text AS active_count,
           COUNT(*) FILTER (WHERE UPPER(status::text) IN ('CLOSED', 'BIDS_REVEALED'))::text AS closed_count,
           COUNT(*) FILTER (WHERE UPPER(status::text) IN ('UNDER_EVALUATION', 'RECOMMENDATION_READY'))::text AS eval_count,
           COUNT(*) FILTER (WHERE UPPER(status::text) IN ('COMPLETED', 'AWARDED', 'DECISION_MADE'))::text AS completed_count
         FROM tenders`
      ),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalTenders: Number(summaryCounts?.total_tenders ?? 0),
          activeTenders: Number(summaryCounts?.active_count ?? 0),
          closedTenders: Number(summaryCounts?.closed_count ?? 0),
          underEvaluation: Number(summaryCounts?.eval_count ?? 0),
          completedTenders: Number(summaryCounts?.completed_count ?? 0),
          recommendationsPending: pendingRecommendations.length,
          highRiskCount: highRiskTenders.length,
        },
        activeTenders,
        upcomingDeadlines,
        closedTenders,
        evaluatingTenders,
        pendingRecommendations,
        highRiskTenders,
      },
    });
  } catch (error) {
    next(error);
  }
}
