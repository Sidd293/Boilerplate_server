import type { Router } from 'express';
import { ActionController } from '../controllers/action.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { BaseRoutes } from './base.routes.js';

export class ActionRoutes extends BaseRoutes {
  constructor(
    private readonly actionController: ActionController,
    private readonly authMiddleware: AuthMiddleware
  ) {
    super();
  }

  register(): Router {
    this.router.post('/', this.authMiddleware.requireAuth, this.actionController.createAction);
    return this.router;
  }
}
