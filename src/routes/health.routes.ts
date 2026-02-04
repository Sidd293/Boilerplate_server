import type { Router, Request, Response } from 'express';
import { BaseRoutes } from './base.routes.js';
import { ResponseHandler } from '../utils/response.js';

export class HealthRoutes extends BaseRoutes {
  register(): Router {
    this.router.get('/', (_req: Request, res: Response) => {
      ResponseHandler.success(res, { status: 'ok' });
    });
    return this.router;
  }
}
