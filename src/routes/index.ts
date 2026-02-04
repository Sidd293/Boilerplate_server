import type { Express } from 'express';
import { ActionRoutes } from './action.routes.js';
import { AuthRoutes } from './auth.routes.js';
import { HealthRoutes } from './health.routes.js';
import { SwaggerRoutes } from './swagger.routes.js';

export class AppRoutes {
  constructor(
    private readonly authRoutes: AuthRoutes,
    private readonly actionRoutes: ActionRoutes,
    private readonly healthRoutes: HealthRoutes,
    private readonly swaggerRoutes: SwaggerRoutes
  ) {}

  register(app: Express): void {
    app.use('/auth', this.authRoutes.register());
    app.use('/action', this.actionRoutes.register());
    app.use('/health', this.healthRoutes.register());
    app.use('/docs', this.swaggerRoutes.register());
  }
}
