import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

/** Payload embedded in access JWT — no PII beyond email */
export interface AccessTokenPayload {
  userId: string;
  email: string;
  roleCode: string;
  companyId: string | null;
  type: 'access';
}

/** Payload embedded in refresh JWT */
export interface RefreshTokenPayload {
  userId: string;
  family: string;  // rotation family for theft detection
  type: 'refresh';
}

/**
 * Sign an access JWT (short-lived, 15m by default).
 */
export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' } satisfies AccessTokenPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

/**
 * Sign a refresh JWT (long-lived, 7d by default).
 */
export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

/**
 * Verify an access JWT. Returns the payload or throws jwt.JsonWebTokenError.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  if (payload.type !== 'access') throw new jwt.JsonWebTokenError('Invalid token type');
  return payload;
}

/**
 * Verify a refresh JWT. Returns the payload or throws.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (payload.type !== 'refresh') throw new jwt.JsonWebTokenError('Invalid token type');
  return payload;
}

/**
 * Compute SHA-256 hex digest of a raw refresh token for DB storage.
 * We store the HASH, not the raw token — so DB theft doesn't expose tokens.
 */
export function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Generate a cryptographically random opaque refresh token string (48 bytes → 96 hex chars).
 * This is embedded in the JWT as the `jti`-equivalent, and its hash is stored in DB.
 */
export function generateRawRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Parse JWT expiry string (e.g. "7d", "15m") to milliseconds for cookie maxAge.
 */
export function parseExpiryMs(expiry: string): number {
  const match = expiry.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback 7d
  const [, n, unit] = match;
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return parseInt(n) * multipliers[unit];
}
