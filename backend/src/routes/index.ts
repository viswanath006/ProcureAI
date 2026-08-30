import { Router } from 'express';
import {
  apiInfo,
  aiHealthProxy,
  healthCheck,
  systemStatus,
} from '../controllers/health.controller';
import { pingAiService } from '../services/ai.service';
import authRoutes from './auth.routes';
import protectedRoutes from './protected.routes';
import tenderRoutes from './tender.routes';
import eligibilityRoutes from './eligibility.routes';
import bidRoutes from './bid.routes';
import demoRoutes from './demo.routes';
import { getOfficerDashboard } from '../controllers/tender.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

// ── Public Infrastructure & Health Endpoints ─────────────────────────────────
router.get('/', apiInfo);
router.get('/health', healthCheck);
router.get('/status', systemStatus);
router.get('/ai/health', aiHealthProxy);
router.get('/ai/ping', async (_req, res, next) => {
  try {
    const result = await pingAiService();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// ── Authentication Routes (/api/v1/auth/*) ────────────────────────────────────
router.use('/auth', authRoutes);

// ── Tender Management & Lifecycle Routes (/api/v1/tenders/*) ─────────────────
router.use('/tenders', tenderRoutes);

// ── Officer Dashboard Dedicated Route (/api/v1/officer/dashboard) ─────────────
router.get(
  '/officer/dashboard',
  authenticate,
  authorize('GOVT_OFFICER', 'ADMIN', 'AUDITOR'),
  getOfficerDashboard
);

// ── Bidder Eligibility Engine & Company Profiles (/api/v1/eligibility/*) ─────
router.use('/eligibility', eligibilityRoutes);

// ── Cryptographic Sealed-Bid Procurement Routes (/api/v1/bids/*) ─────────────
router.use('/bids', bidRoutes);

// ── Synthetic Demonstration Scenario Routes (/api/v1/demo/*) ───────────────
router.use('/demo', demoRoutes);

// ── RBAC Protected Procurement & Governance Routes ───────────────────────────
router.use('/', protectedRoutes);

export default router;
