import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../utils/errors';
import { verifyAccessToken } from '../utils/tokens';
import jwt from 'jsonwebtoken';

/**
 * authenticate — verifies the Bearer JWT in the Authorization header.
 * On success, sets req.user with the decoded payload.
 * On failure, passes an AuthenticationError to next().
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization header missing or malformed', 'AUTH_REQUIRED');
    }

    const token = authHeader.slice(7); // remove "Bearer "
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
      roleCode: payload.roleCode,
      companyId: payload.companyId,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Access token has expired', 'TOKEN_EXPIRED'));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid access token', 'TOKEN_INVALID'));
    } else {
      next(err);
    }
  }
}

/**
 * optionalAuthenticate — same as authenticate but does NOT error on missing token.
 * Sets req.user if token is present and valid, otherwise req.user remains undefined.
 * Useful for routes that behave differently for authenticated vs anonymous users.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      roleCode: payload.roleCode,
      companyId: payload.companyId,
    };
  } catch {
    // Silently ignore invalid/expired tokens in optional mode
  }

  next();
}
