import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import {
  submitSealedBid,
  getMyBids,
  getTenderBidsForOfficer,
  unsealTenderBids,
  verifyBidIntegrity,
  getBidById,
  rejectBidModification,
} from '../controllers/bid.controller';

const router = Router();

// Bidder submission & isolated view
router.post('/submit', authenticate, authorize('BIDDER', 'ADMIN'), submitSealedBid);
router.get('/mine', authenticate, authorize('BIDDER', 'ADMIN'), getMyBids);

// Government Officer & Auditor sealed view and unsealing
router.get('/tender/:tenderId', authenticate, authorize('GOVT_OFFICER', 'AUDITOR', 'ADMIN'), getTenderBidsForOfficer);
router.post('/tender/:tenderId/unseal', authenticate, authorize('GOVT_OFFICER', 'ADMIN'), unsealTenderBids);

// On-demand Tamper Verification
router.post('/:bidId/verify-tamper', authenticate, authorize('GOVT_OFFICER', 'AUDITOR', 'ADMIN'), verifyBidIntegrity);

// Single Bid View with IDOR & Pre-Deadline Secrecy Protection
router.get('/:bidId', authenticate, getBidById);

// Rejection of any attempt to modify or mutate submitted sealed bids
router.put('/:bidId', authenticate, rejectBidModification);
router.patch('/:bidId', authenticate, rejectBidModification);

export default router;
