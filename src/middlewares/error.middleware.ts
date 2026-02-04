import type { NextFunction, Request, Response } from 'express';
import { isAppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class ErrorMiddleware {
  constructor() {
    this.handle = this.handle.bind(this);
  }

  handle(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (isAppError(err)) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message
        }
      });
      return;
    }

    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
}
