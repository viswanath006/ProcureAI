import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import {
  registerUser,
  loginUser,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getUserById,
} from '../services/auth.service';
import { AuthenticationError } from '../utils/errors';

// ─── Input Validation Schemas ────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  role_code: z.enum(['GOVT_OFFICER', 'EVALUATOR', 'BIDDER', 'AUDITOR'], {
    errorMap: () => ({ message: 'Invalid role for self-registration' }),
  }),
  company_id: z.string().uuid().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Cookie Helpers ──────────────────────────────────────────────────────────

function setRefreshTokenCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    maxAge: maxAgeMs,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/api/v1/auth',
  });
}

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/api/v1/auth',
  });
}

// ─── Controller Handlers ─────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Register a new user and return user + tokens.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);
    const { user, tokens } = await registerUser(validated);

    setRefreshTokenCookie(res, tokens.rawRefreshToken, tokens.refreshExpiresMs);

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 * Authenticate with email + password.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;

    const { user, tokens } = await loginUser(validated, ipAddress);

    setRefreshTokenCookie(res, tokens.rawRefreshToken, tokens.refreshExpiresMs);

    res.json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Silent refresh: exchange refresh token for new access + refresh token pair.
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Check cookie first, then body fallback
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawToken) {
      throw new AuthenticationError('Refresh token required', 'REFRESH_TOKEN_REQUIRED');
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const { user, tokens } = await rotateRefreshToken(rawToken, ipAddress);

    setRefreshTokenCookie(res, tokens.rawRefreshToken, tokens.refreshExpiresMs);

    res.json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    clearRefreshTokenCookie(res);
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout
 * Invalidate the refresh token in the DB and clear cookie.
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (rawToken) {
      await revokeRefreshToken(rawToken);
    }

    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout-all
 * Invalidate all sessions for the authenticated user.
 */
export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
    }

    await revokeAllUserTokens(req.user.userId);
    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      data: { message: 'All sessions logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Return profile of authenticated user.
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
    }

    const user = await getUserById(req.user.userId);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
