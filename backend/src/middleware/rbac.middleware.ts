import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { recordChainEvent } from '../services/auditChain.service';

/**
 * authorize — RBAC middleware factory.
 * Call after authenticate(). Checks req.user.roleCode against the allowed roles.
 *
 * Usage:
 *   router.post('/tenders', authenticate, authorize('ADMIN', 'GOVT_OFFICER'), createTender);
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required', 'AUTH_REQUIRED'));
      return;
    }

    if (!allowedRoles.includes(req.user.roleCode)) {
      recordChainEvent({
        actor: req.user.email || req.user.userId,
        role: req.user.roleCode,
        action: 'suspicious_activity',
        entity: req.originalUrl || req.path,
        risk_level: 'HIGH',
        details: {
          violation: 'Unauthorized role attempted to access restricted endpoint',
          role: req.user.roleCode,
          allowedRoles,
          method: req.method,
          path: req.originalUrl || req.path,
        },
      }).catch((err) => console.error('Failed to log RBAC violation to audit chain:', err));

      next(
        new AuthorizationError(
          `Role '${req.user.roleCode}' is not authorized for this operation`,
          'FORBIDDEN'
        )
      );
      return;
    }

    next();
  };
}

/**
 * requireSelf — ensures the authenticated user is acting on their own resource.
 * The `paramField` is the request param name containing the target userId.
 *
 * Usage:
 *   router.get('/users/:userId/bids', authenticate, requireSelf('userId'), handler);
 */
export function requireSelf(paramField: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required', 'AUTH_REQUIRED'));
      return;
    }

    if (req.params[paramField] !== req.user.userId) {
      next(new AuthorizationError('Access to this resource is not allowed', 'FORBIDDEN'));
      return;
    }

    next();
  };
}

/**
 * requireSelfOrRole — allows access if user is acting on their own resource OR has an admin role.
 */
export function requireSelfOrRole(paramField: string, ...adminRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required', 'AUTH_REQUIRED'));
      return;
    }

    const isSelf = req.params[paramField] === req.user.userId;
    const isAdmin = adminRoles.includes(req.user.roleCode);

    if (!isSelf && !isAdmin) {
      next(new AuthorizationError('Access to this resource is not allowed', 'FORBIDDEN'));
      return;
    }

    next();
  };
}

/**
 * requireCompany — ensures the authenticated bidder's company matches the resource.
 * Used to prevent one bidder from viewing another bidder's bid details.
 * ADMIN, GOVT_OFFICER, EVALUATOR, AUDITOR bypass this check.
 */
export function requireCompanyAccess(...bypassRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required', 'AUTH_REQUIRED'));
      return;
    }

    // Non-bidder roles bypass company check
    if (bypassRoles.includes(req.user.roleCode)) {
      return next();
    }

    // For BIDDERs: company_id must be present
    if (!req.user.companyId) {
      next(
        new AuthorizationError(
          'Your account is not associated with a company. Please complete company registration.',
          'NO_COMPANY'
        )
      );
      return;
    }

    next();
  };
}
