import { Request } from 'express';

/**
 * Extends Express Request with the authenticated user payload.
 * Set by the `authenticate` middleware after verifying the JWT.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roleCode: string;
        companyId: string | null;
      };
    }
  }
}

export {};
