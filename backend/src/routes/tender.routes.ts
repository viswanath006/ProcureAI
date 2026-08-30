import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import {
  createTender,
  updateTenderDraft,
  publishTender,
  closeTender,
  revealBids,
  transitionTender,
  getTenderDetails,
  getOfficerDashboard,
} from '../controllers/tender.controller';

const router = Router();

// All tender management routes require authentication
router.use(authenticate);

// ── Officer Dashboard Analytics ───────────────────────────────────────────────
router.get(
  '/dashboard/officer',
  authorize('GOVT_OFFICER', 'ADMIN', 'AUDITOR'),
  getOfficerDashboard
);

// ── Tender Management Endpoints ───────────────────────────────────────────────
router.post(
  '/',
  authorize('GOVT_OFFICER', 'ADMIN'),
  createTender
);

router.get(
  '/:id/details',
  authorize('BIDDER', 'GOVT_OFFICER', 'AUDITOR', 'ADMIN', 'EVALUATOR'),
  getTenderDetails
);

router.put(
  '/:id',
  authorize('GOVT_OFFICER', 'ADMIN'),
  updateTenderDraft
);

router.post(
  '/:id/publish',
  authorize('GOVT_OFFICER', 'ADMIN'),
  publishTender
);

router.post(
  '/:id/close',
  authorize('GOVT_OFFICER', 'ADMIN'),
  closeTender
);

router.post(
  '/:id/reveal-bids',
  authorize('GOVT_OFFICER', 'ADMIN'),
  revealBids
);

router.post(
  '/:id/transition',
  authorize('GOVT_OFFICER', 'ADMIN'),
  transitionTender
);

export default router;
