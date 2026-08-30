import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize, requireCompanyAccess } from '../middleware/rbac.middleware';
import { query, queryOne, queryRows } from '../config/database';
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { z } from 'zod';
import {
  runAiEvaluation,
  runSyntheticBenchmark,
  DEFAULT_EVALUATION_WEIGHTS,
  validateWeights,
  EvaluationWeights,
} from '../services/ai.service';
import { decryptBidEnvelope } from '../services/sealedBid.service';
import {
  runAnomalyAndCollusionAnalysis,
  analyzeDecisionOverrides,
} from '../services/anomaly.service';
import {
  getTenderDecisionDossier,
  recordHumanDecision,
} from '../services/decision.service';
import {
  recordChainEvent,
  verifyAuditChain,
  queryAuditChainLogs,
  simulateTamperAttempt,
  restoreValidAuditChain,
} from '../services/auditChain.service';

const router = Router();

// All routes here require authentication
router.use(authenticate);

// ═════════════════════════════════════════════════════════════════════════════
// 1. TENDERS & PROCUREMENT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /tenders
 * Allowed: ALL authenticated roles (BIDDER, GOVT_OFFICER, AUDITOR, ADMIN)
 * Bidders only see published/closed tenders. Officers & Admin see drafts as well.
 */
router.get(
  '/tenders',
  authorize('BIDDER', 'GOVT_OFFICER', 'AUDITOR', 'ADMIN', 'EVALUATOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      let tenders;

      if (['GOVT_OFFICER', 'ADMIN', 'AUDITOR'].includes(user.roleCode)) {
        tenders = await queryRows(
          `SELECT id, reference_number, title, category, department,
                  estimated_budget_paisa, submission_start_at, submission_deadline_at,
                  status, created_at
           FROM tenders
           ORDER BY created_at DESC`
        );
      } else {
        // Bidders only see published tenders (or closed for archive)
        tenders = await queryRows(
          `SELECT id, reference_number, title, category, department,
                  submission_start_at, submission_deadline_at, status, created_at
           FROM tenders
           WHERE status IN ('published', 'clarification', 'closed', 'under_evaluation', 'awarded')
           ORDER BY submission_deadline_at ASC`
        );
      }

      res.json({ success: true, data: { tenders } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /tenders
 * Allowed: GOVERNMENT_OFFICER, ADMIN
 * Bidders & Auditors are blocked (403).
 */
const createTenderSchema = z.object({
  reference_number: z.string().min(3),
  title: z.string().min(5),
  description: z.string().min(10),
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
  department: z.string().min(2),
  estimated_budget_paisa: z.number().positive().optional(),
  submission_deadline_days: z.number().int().min(1).default(30),
});

router.post(
  '/tenders',
  authorize('GOVT_OFFICER', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createTenderSchema.parse(req.body);
      const user = req.user!;

      const start = new Date();
      const deadline = new Date(Date.now() + validated.submission_deadline_days * 24 * 60 * 60 * 1000);

      const tender = await queryOne(
        `INSERT INTO tenders (
          created_by, reference_number, title, description, category,
          department, estimated_budget_paisa, submission_start_at, submission_deadline_at, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published')
         RETURNING id, reference_number, title, status, submission_deadline_at, created_at`,
        [
          user.userId,
          validated.reference_number,
          validated.title,
          validated.description,
          validated.category,
          validated.department,
          validated.estimated_budget_paisa ?? null,
          start,
          deadline,
        ]
      );

      res.status(201).json({ success: true, data: { tender } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /tenders/:id/bids
 * Sealed bid rule:
 * - GOVT_OFFICER: Can view bids ONLY AFTER the tender submission deadline has passed!
 * - AUDITOR, ADMIN: Can view bids for audit/management.
 * - BIDDER: CANNOT view other bidders' submissions (403 Forbidden).
 */
router.get(
  '/tenders/:id/bids',
  authorize('GOVT_OFFICER', 'AUDITOR', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const tender = await queryOne<{
        id: string;
        title: string;
        submission_deadline_at: Date;
        status: string;
      }>('SELECT id, title, submission_deadline_at, status FROM tenders WHERE id = $1', [id]);

      if (!tender) {
        throw new NotFoundError('Tender not found', 'TENDER_NOT_FOUND');
      }

      // Sealed Envelope Check: Government officers cannot unseal bids before deadline!
      if (user.roleCode === 'GOVT_OFFICER') {
        const now = new Date();
        const deadline = new Date(tender.submission_deadline_at);

        if (now < deadline && tender.status === 'published') {
          throw new AuthorizationError(
            `Access Denied: Bids are cryptographically sealed until the submission deadline (${deadline.toISOString()}).`,
            'BIDS_STILL_SEALED'
          );
        }
      }

      const bids = await queryRows(
        `SELECT b.id, b.bid_reference, b.company_id, c.name AS company_name,
                b.status, b.submitted_at, b.completion_days
         FROM bids b
         JOIN companies c ON c.id = b.company_id
         WHERE b.tender_id = $1
         ORDER BY b.submitted_at ASC`,
        [id]
      );

      res.json({
        success: true,
        data: {
          tender: { id: tender.id, title: tender.title },
          bids,
          unsealedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /tenders/:id/bids
 * Allowed: BIDDER only.
 * Must belong to a verified company.
 */
const submitBidSchema = z.object({
  bid_reference: z.string().min(3),
  bid_amount_enc: z.string().min(1, 'Encrypted bid proposal required'),
  completion_days: z.number().int().positive(),
  technical_proposal: z.string().optional(),
});

router.post(
  '/tenders/:id/bids',
  authorize('BIDDER'),
  requireCompanyAccess(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: tenderId } = req.params;
      const user = req.user!;
      const validated = submitBidSchema.parse(req.body);

      // Verify tender is open
      const tender = await queryOne<{ status: string; submission_deadline_at: Date }>(
        'SELECT status, submission_deadline_at FROM tenders WHERE id = $1',
        [tenderId]
      );

      if (!tender) throw new NotFoundError('Tender not found', 'TENDER_NOT_FOUND');

      if (tender.status !== 'published' && tender.status !== 'clarification') {
        throw new ValidationError('Tender is not currently accepting bids', 'TENDER_CLOSED');
      }

      if (new Date() > new Date(tender.submission_deadline_at)) {
        throw new ValidationError('Tender submission deadline has passed', 'DEADLINE_PASSED');
      }

      // Insert sealed bid
      const bid = await queryOne(
        `INSERT INTO bids (
          tender_id, company_id, created_by, bid_reference,
          bid_amount_enc, completion_days, status, submitted_at
         ) VALUES ($1, $2, $3, $4, $5, $6, 'submitted', NOW())
         RETURNING id, bid_reference, status, submitted_at`,
        [
          tenderId,
          user.companyId,
          user.userId,
          validated.bid_reference,
          validated.bid_amount_enc,
          validated.completion_days,
        ]
      );

      res.status(201).json({
        success: true,
        data: {
          message: 'Bid successfully submitted and sealed.',
          bid,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 2. BIDDER SPECIFIC ROUTES (ISOLATION)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /bids/mine
 * Allowed: BIDDER only.
 * Bidders can ONLY see their own submissions.
 */
router.get(
  '/bids/mine',
  authorize('BIDDER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;

      const bids = await queryRows(
        `SELECT b.id, b.bid_reference, b.status, b.submitted_at, b.completion_days,
                t.id AS tender_id, t.title AS tender_title, t.reference_number AS tender_ref
         FROM bids b
         JOIN tenders t ON t.id = b.tender_id
         WHERE b.created_by = $1 OR b.company_id = $2
         ORDER BY b.submitted_at DESC`,
        [user.userId, user.companyId]
      );

      res.json({ success: true, data: { bids } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /companies/me
 * Allowed: BIDDER only.
 * Bidders view their own company information.
 */
router.get(
  '/companies/me',
  authorize('BIDDER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;

      if (!user.companyId) {
        throw new NotFoundError('No company profile associated with your user', 'NO_COMPANY');
      }

      const company = await queryOne(
        `SELECT id, registration_number, name, legal_name, industry,
                city, state, country, status, employee_count, years_in_operation,
                verified_at
         FROM companies
         WHERE id = $1`,
        [user.companyId]
      );

      if (!company) throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');

      res.json({ success: true, data: { company } });
    } catch (error) {
      next(error);
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 3. AI EVALUATION & DECISION PIPELINE (PHASE 7)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /tenders/:id/evaluate
 * Allowed: GOVERNMENT_OFFICER, ADMIN
 * Executes multi-factor weighted AI evaluation on eligible unsealed bids.
 */
router.post(
  '/tenders/:id/evaluate',
  authorize('GOVT_OFFICER', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user!;
      const customWeights: EvaluationWeights | undefined = req.body?.weights;

      const tender = await queryOne<any>(
        'SELECT id, reference_number, title, estimated_budget_paisa, status FROM tenders WHERE id = $1',
        [id]
      );
      if (!tender) throw new NotFoundError('Tender not found', 'TENDER_NOT_FOUND');

      const weights = customWeights || DEFAULT_EVALUATION_WEIGHTS;
      validateWeights(weights);

      // Fetch eligible bids (disqualified or withdrawn bids are excluded by Phase 5 rule)
      const bids = await queryRows<any>(
        `SELECT b.id, b.bid_reference, b.company_id, c.name AS company_name,
                b.bid_amount_enc, b.completion_days, b.technical_proposal,
                b.is_locked, b.unsealed_at,
                c.annual_turnover_paisa, c.net_worth_paisa, c.years_in_operation,
                c.completed_projects_count, c.technical_capabilities,
                c.compliance_info, c.past_performance
         FROM bids b
         JOIN companies c ON c.id = b.company_id
         WHERE b.tender_id = $1
           AND b.status NOT IN ('disqualified', 'withdrawn')
         ORDER BY b.created_at ASC`,
        [id]
      );

      if (bids.length === 0) {
        throw new ValidationError(
          'No eligible or unsealed bids found for this tender. Submit bids or run the Synthetic Benchmark Demo.',
          'NO_ELIGIBLE_BIDS'
        );
      }

      // Decrypt commercial amounts if sealed
      const processedBids = bids.map((b) => {
        let amountInr = 0;
        let proposal = b.technical_proposal || '';
        if (b.bid_amount_enc) {
          try {
            const dec = decryptBidEnvelope(b.bid_amount_enc);
            amountInr = Number(dec.amountPaisa) / 100;
            if (dec.technicalProposal) proposal = dec.technicalProposal;
          } catch {
            // If already unsealed or plaintext
            amountInr = Number(b.bid_amount_enc) || 0;
          }
        }
        return {
          id: b.id,
          bid_id: b.id,
          bid_reference: b.bid_reference,
          company_id: b.company_id,
          company_name: b.company_name,
          bid_amount_inr: amountInr,
          completion_days: b.completion_days || 180,
          technical_proposal: proposal,
          annual_turnover_inr: b.annual_turnover_paisa ? Number(b.annual_turnover_paisa) / 100 : 0,
          net_worth_inr: b.net_worth_paisa ? Number(b.net_worth_paisa) / 100 : 0,
          years_in_operation: b.years_in_operation || 0,
          completed_projects_count: b.completed_projects_count || 0,
          technical_capabilities: b.technical_capabilities || [],
          compliance_info: b.compliance_info || {},
          past_performance: b.past_performance || {},
          is_synthetic: false,
        };
      });

      // Execute AI evaluation
      const evalResult = await runAiEvaluation(tender, processedBids, weights);

      // Create evaluation record
      const evaluation = await queryOne<any>(
        `INSERT INTO ai_evaluations (
          tender_id, triggered_by, model_name, model_version, model_config,
          status, bids_evaluated, started_at, completed_at, weights, summary
        ) VALUES ($1, $2, 'procureai-multifactor-v1.7', '1.7.0', $3, 'completed', $4, NOW(), NOW(), $5, $6)
        RETURNING id, model_name, model_version, status, started_at, completed_at, weights, summary`,
        [
          id,
          user.userId,
          JSON.stringify({ weights }),
          evalResult.bids_evaluated,
          JSON.stringify(weights),
          evalResult.summary_notes,
        ]
      );

      // Clear any prior recommendation runs for this tender
      await query(
        `DELETE FROM ai_recommendations WHERE evaluation_id IN (
          SELECT id FROM ai_evaluations WHERE tender_id = $1 AND id != $2
        )`,
        [id, evaluation.id]
      );

      // Persist recommendations and per-criterion scores
      for (const ranking of evalResult.rankings) {
        await query(
          `INSERT INTO ai_recommendations (
            evaluation_id, bid_id, recommendation, total_score, rank,
            confidence, reasoning_summary, key_strengths, key_weaknesses,
            concerns, bias_check_passed, is_synthetic, criterion_breakdown,
            explanation_object
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, FALSE, $11, $12)`,
          [
            evaluation.id,
            ranking.bid_id,
            ranking.recommendation,
            ranking.total_score,
            ranking.rank,
            ranking.confidence_score,
            ranking.reasoning_summary,
            ranking.key_strengths,
            ranking.key_weaknesses,
            ranking.risk_indicators,
            JSON.stringify(ranking.criterion_scores),
            JSON.stringify(ranking.explanation || {}),
          ]
        );

        for (const [code, cs] of Object.entries(ranking.criterion_scores)) {
          await query(
            `INSERT INTO ai_scores (
              evaluation_id, bid_id, criteria_code, criteria_name,
              raw_score, weight, weighted_score, confidence, explanation, flags
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              evaluation.id,
              ranking.bid_id,
              code,
              cs.name,
              cs.raw_score,
              cs.weight,
              cs.weighted_score,
              cs.confidence,
              cs.explanation,
              cs.risk_indicators,
            ]
          );
        }
      }

      // Advance tender state to RECOMMENDATION_READY
      await query(
        "UPDATE tenders SET status = 'RECOMMENDATION_READY', updated_at = NOW() WHERE id = $1",
        [id]
      );

      // Tamper-evident Audit Log
      await query(
        `INSERT INTO audit_logs (
          event_type, action, entity_type, entity_id, actor_user_id,
          description, metadata
        ) VALUES (
          'system', 'AI_EVALUATION_COMPLETED', 'tender', $1, $2,
          'Phase 7 AI multi-criteria evaluation completed with 6 weighted factors.',
          $3
        )`,
        [
          id,
          user.userId,
          JSON.stringify({
            weights,
            bidsEvaluated: evalResult.bids_evaluated,
            topRecommendation: evalResult.top_recommendation?.company_name,
            topScore: evalResult.top_recommendation?.total_score,
          }),
        ]
      );

      res.json({
        success: true,
        data: {
          message: 'AI Multi-Criteria Evaluation completed successfully.',
          evaluation,
          result: evalResult,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /tenders/:id/evaluate/synthetic
 * Allowed: GOVERNMENT_OFFICER, ADMIN
 * Runs synthetic benchmark demonstration on the tender with configurable weights.
 */
router.post(
  '/tenders/:id/evaluate/synthetic',
  authorize('GOVT_OFFICER', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user!;
      const customWeights: EvaluationWeights | undefined = req.body?.weights;

      const tender = await queryOne<any>(
        'SELECT id, reference_number, title, estimated_budget_paisa, status FROM tenders WHERE id = $1',
        [id]
      );
      if (!tender) throw new NotFoundError('Tender not found', 'TENDER_NOT_FOUND');

      const weights = customWeights || DEFAULT_EVALUATION_WEIGHTS;
      validateWeights(weights);

      const evalResult = await runSyntheticBenchmark(
        {
          id: tender.id,
          reference_number: tender.reference_number,
          title: tender.title,
          estimated_budget_inr: tender.estimated_budget_paisa ? Number(tender.estimated_budget_paisa) / 100 : 100000000,
        },
        weights
      );

      // Create evaluation record
      const evaluation = await queryOne<any>(
        `INSERT INTO ai_evaluations (
          tender_id, triggered_by, model_name, model_version, model_config,
          status, bids_evaluated, started_at, completed_at, weights, summary
        ) VALUES ($1, $2, 'procureai-synthetic-benchmark', '1.7.0', $3, 'completed', $4, NOW(), NOW(), $5, $6)
        RETURNING id, model_name, model_version, status, started_at, completed_at, weights, summary`,
        [
          id,
          user.userId,
          JSON.stringify({ weights, isSynthetic: true }),
          evalResult.bids_evaluated,
          JSON.stringify(weights),
          `[SYNTHETIC BENCHMARK] ${evalResult.summary_notes}`,
        ]
      );

      // Clear any prior recommendations for this tender
      await query(
        `DELETE FROM ai_recommendations WHERE evaluation_id IN (
          SELECT id FROM ai_evaluations WHERE tender_id = $1 AND id != $2
        )`,
        [id, evaluation.id]
      );

      // Persist benchmark recommendations with explanation objects
      for (const ranking of evalResult.rankings) {
        await query(
          `INSERT INTO ai_recommendations (
            evaluation_id, bid_id, recommendation, total_score, rank,
            confidence, reasoning_summary, key_strengths, key_weaknesses,
            concerns, bias_check_passed, is_synthetic, criterion_breakdown,
            explanation_object
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, TRUE, $11, $12)`,
          [
            evaluation.id,
            ranking.bid_id,
            ranking.recommendation,
            ranking.total_score,
            ranking.rank,
            ranking.confidence_score,
            ranking.reasoning_summary,
            ranking.key_strengths,
            ranking.key_weaknesses,
            ranking.risk_indicators,
            JSON.stringify(ranking.criterion_scores),
            JSON.stringify(ranking.explanation || {}),
          ]
        );
      }

      res.json({
        success: true,
        data: {
          message: 'Synthetic benchmark evaluation completed with Explainable AI attribution.',
          evaluation,
          result: evalResult,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /tenders/:id/ai-recommendations
 * Allowed: GOVERNMENT_OFFICER, AUDITOR, ADMIN, EVALUATOR
 * Fetches latest AI evaluation recommendations, criterion breakdowns, and XAI explanation objects.
 */
router.get(
  '/tenders/:id/ai-recommendations',
  authorize('GOVT_OFFICER', 'AUDITOR', 'ADMIN', 'EVALUATOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const evaluation = await queryOne<any>(
        `SELECT id, model_name, model_version, status, weights, summary, completed_at, created_at
         FROM ai_evaluations
         WHERE tender_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [id]
      );

      const recommendations = await queryRows(
        `SELECT r.id, r.bid_id,
                COALESCE(b.bid_reference, 'SYNTH-BID') AS bid_reference,
                COALESCE(c.name, 'Synthetic Bidder') AS company_name,
                r.recommendation, r.total_score, r.rank, r.confidence,
                r.reasoning_summary, r.key_strengths, r.key_weaknesses,
                r.concerns, r.bias_check_passed, r.is_synthetic,
                r.criterion_breakdown, r.explanation_object
         FROM ai_recommendations r
         LEFT JOIN bids b ON b.id = r.bid_id
         LEFT JOIN companies c ON c.id = b.company_id
         WHERE r.evaluation_id = $1
         ORDER BY r.rank ASC`,
        [evaluation?.id || '00000000-0000-0000-0000-000000000000']
      );

      res.json({
        success: true,
        data: {
          evaluation,
          recommendations,
          weights: evaluation?.weights || DEFAULT_EVALUATION_WEIGHTS,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /tenders/:id/ai-explanation/:bidId
 * Allowed: GOVERNMENT_OFFICER, AUDITOR, ADMIN, EVALUATOR
 * Fetches targeted XAI explanation object for a single company/bid.
 */
router.get(
  '/tenders/:id/ai-explanation/:bidId',
  authorize('GOVT_OFFICER', 'AUDITOR', 'ADMIN', 'EVALUATOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, bidId } = req.params;

      const rec = await queryOne<any>(
        `SELECT r.id, r.bid_id, r.total_score, r.rank, r.recommendation,
                r.reasoning_summary, r.explanation_object, r.criterion_breakdown,
                COALESCE(b.bid_reference, 'SYNTH-BID') AS bid_reference,
                COALESCE(c.name, 'Bidder Company') AS company_name
         FROM ai_recommendations r
         LEFT JOIN bids b ON b.id = r.bid_id
         LEFT JOIN companies c ON c.id = b.company_id
         WHERE r.bid_id = $1
         ORDER BY r.created_at DESC
         LIMIT 1`,
        [bidId]
      );

      if (!rec) {
        throw new NotFoundError('Explanation dossier not found for bid', 'EXPLANATION_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          tender_id: id,
          bid_id: bidId,
          company_name: rec.company_name,
          bid_reference: rec.bid_reference,
          rank: rec.rank,
          total_score: rec.total_score,
          recommendation: rec.recommendation,
          explanation: rec.explanation_object,
          criterion_breakdown: rec.criterion_breakdown,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /tenders/:id/risk-analysis
 * Allowed: GOVERNMENT_OFFICER, AUDITOR, ADMIN, EVALUATOR
 * Executes Isolation Forest bid anomaly detection (NORMAL, LOW, MEDIUM, HIGH RISK)
 * and identifies potential bid collusion indicators.
 */
router.get(
  '/tenders/:id/risk-analysis',
  authorize('GOVT_OFFICER', 'AUDITOR', 'ADMIN', 'EVALUATOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tender = await queryOne<any>(
        'SELECT id, reference_number, title, estimated_budget_paisa, status, required_delivery_days, required_experience_years FROM tenders WHERE id = $1',
        [id]
      );
      if (!tender) throw new NotFoundError('Tender not found', 'TENDER_NOT_FOUND');

      const bids = await queryRows<any>(
        `SELECT b.id, b.bid_reference, b.company_id, b.bid_amount_paisa, b.completion_days,
                b.technical_proposal, c.name AS company_name, c.annual_turnover_paisa,
                c.net_worth_paisa, c.years_in_operation, c.completed_projects_count,
                c.certifications, c.past_performance
         FROM bids b
         LEFT JOIN companies c ON c.id = b.company_id
         WHERE b.tender_id = $1 AND b.status != 'draft' AND b.status != 'withdrawn'`,
        [id]
      );

      const analysis = await runAnomalyAndCollusionAnalysis(tender, bids);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /tenders/:id/override-analysis
 * Allowed: GOVERNMENT_OFFICER, AUDITOR, ADMIN, EVALUATOR
 * Compares AI recommendation vs Government final decision, tracking override status,
 * mandatory justifications, and repeated decision-making patterns.
 */
router.get(
  '/tenders/:id/override-analysis',
  authorize('GOVT_OFFICER', 'AUDITOR', 'ADMIN', 'EVALUATOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const summary = await analyzeDecisionOverrides(id);
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /tenders/:id/decision
 * Allowed: GOVERNMENT_OFFICER, ADMIN
 * Decision: approve/reject.
 * Mandatory Rule: If officer overrides AI recommendation (followed_ai === false),
 * a reason is strictly required with minimum length.
 */
/**
 * GET /tenders/:id/decision-dossier
 * Allowed: GOVERNMENT_OFFICER, AUDITOR, ADMIN, EVALUATOR
 * Gathers the complete 7-point decision dossier:
 * 1. Eligible bidders
 * 2. Bid values
 * 3. Evaluation scores
 * 4. AI recommendation
 * 5. Risk indicators
 * 6. Explainability report
 * 7. Audit information
 */
router.get(
  '/tenders/:id/decision-dossier',
  authorize('GOVT_OFFICER', 'AUDITOR', 'ADMIN', 'EVALUATOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenderId = String(req.params.id);
      const dossier = await getTenderDecisionDossier(tenderId);
      res.json({
        success: true,
        data: dossier,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /tenders/:id/decision
 * Allowed: ALL AUTHENTICATED
 * Retrieves authoritative finalized decision record for a tender.
 */
router.get(
  '/tenders/:id/decision',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenderId = String(req.params.id);
      const decision = await queryOne<any>(
        `SELECT d.*, u.full_name AS officer_name, c.name AS awarded_company_name,
                ov.reason_type, ov.reason_detail
         FROM government_decisions d
         LEFT JOIN users u ON u.id = d.decided_by
         LEFT JOIN bids b ON b.id = d.awarded_bid_id
         LEFT JOIN companies c ON c.id = b.company_id
         LEFT JOIN decision_overrides ov ON ov.decision_id = d.id
         WHERE d.tender_id = $1
         ORDER BY d.created_at DESC
         LIMIT 1`,
        [tenderId]
      );

      if (!decision) {
        return res.json({
          success: true,
          data: null,
        });
      }

      res.json({
        success: true,
        data: decision,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /tenders/:id/decision
 * Allowed: GOVERNMENT_OFFICER, ADMIN
 * Phase 10: Human-in-the-Loop Procurement Decision Workflow.
 * Enforces:
 * - AI recommendation NEVER automatically awards the tender
 * - Actions: [APPROVE RECOMMENDATION] or [REJECT RECOMMENDATION]
 * - If rejecting / selecting another bidder: mandatory reason & supporting note required
 * - Computes cryptographic SHA-256 integrity hash
 * - Locks the decision record from ordinary modification
 */
const humanDecisionSchema = z.object({
  action: z.enum(['approve', 'reject']).default('approve'),
  decision: z.enum(['award', 'reject', 'defer', 'cancel_tender']).default('award'),
  selected_bid_id: z.string().uuid().optional(),
  rationale: z.string().optional().default(''),
  override_reason_type: z.string().optional(),
  override_reason_detail: z.string().optional(),
  supporting_note: z.string().optional(),
});

router.post(
  '/tenders/:id/decision',
  authorize('GOVT_OFFICER', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenderId = String(req.params.id);
      const user = req.user!;
      const validated = humanDecisionSchema.parse(req.body);

      const decisionRecord = await recordHumanDecision(
        tenderId,
        {
          userId: user.userId,
          role: user.roleCode,
          fullName: user.email,
        },
        validated
      );

      res.status(201).json({
        success: true,
        data: {
          message: decisionRecord.override_status === 'NO'
            ? 'Official procurement decision recorded: AI recommendation approved & locked.'
            : 'Official procurement decision recorded: AI override documented & locked.',
          decision: decisionRecord,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 4. AUDITOR SPECIFIC ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /audit-logs and GET /audit/logs
 * Allowed: AUDITOR, ADMIN
 * 6-Factor Filtering: tender, user, company, event_type, date (start_date, end_date), risk_level
 */
const handleAuditLogsQuery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      tender: req.query.tender as string | undefined,
      user: req.query.user as string | undefined,
      company: req.query.company as string | undefined,
      event_type: req.query.event_type as string | undefined,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
      risk_level: req.query.risk_level as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const result = await queryAuditChainLogs(filters);
    res.json({
      success: true,
      data: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        logs: result.logs,
      },
    });
  } catch (error) {
    next(error);
  }
};

router.get('/audit-logs', authorize('AUDITOR', 'ADMIN'), handleAuditLogsQuery);
router.get('/audit/logs', authorize('AUDITOR', 'ADMIN'), handleAuditLogsQuery);

/**
 * GET /audit/verify
 * Allowed: AUDITOR, ADMIN, GOVT_OFFICER
 * Cryptographically traverses the entire hash chain from Genesis (N=0) to Head (N=L).
 * Returns status: "✓ AUDIT CHAIN VALID" or "⚠ AUDIT INTEGRITY FAILURE".
 */
router.get(
  '/audit/verify',
  authorize('AUDITOR', 'ADMIN', 'GOVT_OFFICER'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const verification = await verifyAuditChain();
      res.json({
        success: true,
        data: verification,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /audit/simulate-tamper
 * Allowed: AUDITOR, ADMIN (Demonstration / Test endpoint)
 */
router.post(
  '/audit/simulate-tamper',
  authorize('AUDITOR', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const seq = req.body.sequence ? parseInt(req.body.sequence, 10) : undefined;
      const tampered = simulateTamperAttempt(seq);
      res.json({
        success: true,
        data: {
          simulated: tampered,
          message: 'Malicious modification simulated. Run audit verification to detect failure.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /audit/restore-chain
 * Allowed: AUDITOR, ADMIN (Demonstration restoration)
 */
router.post(
  '/audit/restore-chain',
  authorize('AUDITOR', 'ADMIN'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      restoreValidAuditChain();
      res.json({
        success: true,
        data: {
          message: 'Cryptographic audit chain restored to canonical validity.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /decisions/history
 * Allowed: AUDITOR, ADMIN, GOVT_OFFICER
 * Full decision history with AI alignment tracking.
 */
router.get(
  '/decisions/history',
  authorize('AUDITOR', 'ADMIN', 'GOVT_OFFICER'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const decisions = await queryRows(
        `SELECT d.id, d.decision, d.rationale, d.followed_ai, d.effective_at,
                t.title AS tender_title, t.reference_number AS tender_ref,
                u.full_name AS officer_name,
                o.reason_type AS override_reason, o.reason_detail AS override_detail
         FROM government_decisions d
         JOIN tenders t ON t.id = d.tender_id
         JOIN users u ON u.id = d.decided_by
         LEFT JOIN decision_overrides o ON o.decision_id = d.id
         ORDER BY d.effective_at DESC`
      );

      res.json({ success: true, data: { decisions } });
    } catch (error) {
      next(error);
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 5. ADMIN SPECIFIC ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/users
 * Allowed: ADMIN only.
 */
router.get(
  '/admin/users',
  authorize('ADMIN'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await queryRows(
        `SELECT u.id, u.email, u.full_name, u.status, u.created_at,
                r.code AS role_code, r.name AS role_name,
                c.name AS company_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN companies c ON c.id = u.company_id
         ORDER BY u.created_at DESC`
      );

      res.json({ success: true, data: { users } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/system
 * Allowed: ADMIN only.
 */
router.get(
  '/admin/system',
  authorize('ADMIN'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [tableStats, activeSessions] = await Promise.all([
        queryRows<{ table_name: string; count: number }>(
          `SELECT
             c.relname AS table_name,
             c.reltuples::bigint AS count
           FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind = 'r'
           ORDER BY c.relname`
        ),
        queryOne<{ active_tokens: number }>(
          "SELECT COUNT(*) AS active_tokens FROM refresh_tokens WHERE is_revoked = FALSE AND expires_at > NOW()"
        ),
      ]);

      res.json({
        success: true,
        data: {
          tableStats,
          activeSessions: Number(activeSessions?.active_tokens ?? 0),
          nodeVersion: process.version,
          platform: process.platform,
          uptimeSeconds: Math.floor(process.uptime()),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
