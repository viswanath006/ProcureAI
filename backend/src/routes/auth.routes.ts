import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { env } from '../config/env';

const router = Router();

// Rate limiter for authentication attempts (anti-brute-force)
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'test' ? 1000 : Math.max(100, env.RATE_LIMIT_MAX_REQUESTS),
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public endpoints
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Authenticated endpoints
router.get('/me', authenticate, getMe);
router.post('/logout-all', authenticate, logoutAll);

export default router;
