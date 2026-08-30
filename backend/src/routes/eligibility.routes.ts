import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import {
  getMyCompanyProfile,
  updateMyCompanyProfile,
  uploadCompanyDocument,
  deleteCompanyDocument,
  precheckEligibility,
  evaluateBidEligibility,
  evaluateTenderEligibility,
  getTenderEligibilitySummary,
} from '../controllers/eligibility.controller';

const router = Router();

router.use(authenticate);

// ── Bidder Company Profile & Documents ─────────────────────────────────────────
router.get(
  '/company/profile',
  authorize('BIDDER', 'ADMIN'),
  getMyCompanyProfile
);

router.put(
  '/company/profile',
  authorize('BIDDER', 'ADMIN'),
  updateMyCompanyProfile
);

router.post(
  '/company/documents',
  authorize('BIDDER', 'ADMIN'),
  uploadCompanyDocument
);

router.delete(
  '/company/documents/:docId',
  authorize('BIDDER', 'ADMIN'),
  deleteCompanyDocument
);

// ── Bidder Self Pre-check ─────────────────────────────────────────────────────
router.post(
  '/precheck/:tenderId',
  authorize('BIDDER', 'ADMIN'),
  precheckEligibility
);

// ── Government Officer Screening Gates ────────────────────────────────────────
router.post(
  '/evaluate-bid/:bidId',
  authorize('GOVT_OFFICER', 'ADMIN'),
  evaluateBidEligibility
);

router.post(
  '/evaluate-tender/:tenderId',
  authorize('GOVT_OFFICER', 'ADMIN'),
  evaluateTenderEligibility
);

router.get(
  '/tender/:tenderId/summary',
  authorize('GOVT_OFFICER', 'ADMIN', 'AUDITOR'),
  getTenderEligibilitySummary
);

export default router;
