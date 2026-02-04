import type { NextFunction, Request, Response } from 'express';
import { AuthError } from '../utils/errors.js';
import { TokenService } from '../services/token.service.js';

export class AuthMiddleware {
  constructor(private readonly tokenService: TokenService) {
    this.requireAuth = this.requireAuth.bind(this);
  }

  requireAuth(req: Request, _res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new AuthError('Missing or invalid authorization header'));
    }

    const token = header.replace('Bearer ', '').trim();
    try {
      const payload = this.tokenService.verify(token);
      req.user = {
        id: payload.sub,
        email: payload.email ?? null,
        phone: payload.phone ?? null
      };
      next();
    } catch {
      next(new AuthError('Invalid token'));
    }
  }
}
