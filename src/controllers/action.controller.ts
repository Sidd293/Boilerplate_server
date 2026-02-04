import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ActionService } from '../services/action.service.js';
import { AuthError, ValidationError } from '../utils/errors.js';
import { ResponseHandler } from '../utils/response.js';

export class ActionController {
  private readonly actionSchema = z.object({
    type: z.string().min(1),
    payload: z.unknown().optional()
  });

  constructor(private readonly actionService: ActionService) {
    this.createAction = this.createAction.bind(this);
  }

  async createAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = this.actionSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request';
      return next(new ValidationError(message));
    }

    if (!req.user) {
      return next(new AuthError('Authentication required'));
    }

    try {
      const action = await this.actionService.createAction({
        userId: req.user.id,
        type: parsed.data.type,
        payload: parsed.data.payload
      });

      ResponseHandler.success(res, action, 201);
    } catch (error) {
      next(error);
    }
  }
}
