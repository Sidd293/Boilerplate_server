import cors from 'cors';
import express, { type Express, json } from 'express';
import path from 'path';
import { AppRoutes } from './routes/index.js';
import { AuthController } from './controllers/auth.controller.js';
import { ActionController } from './controllers/action.controller.js';
import { AuthService } from './services/auth.service.js';
import { ActionService } from './services/action.service.js';
import { TokenService } from './services/token.service.js';
import { OtpService } from './services/otp.service.js';
import { OtpDeliveryService } from './services/otp-delivery.service.js';
import { env } from './config/index.js';
import { MailgunClient } from './vendor/mailgun/mailgun.client.js';
import { SendOtpEmailAction } from './vendor/mailgun/actions/send-otp-email.action.js';
import { PostgresDatabase } from './plugins/database/index.js';
import { ErrorMiddleware } from './middlewares/error.middleware.js';
import { AuthMiddleware } from './middlewares/auth.middleware.js';
import { AuthRoutes } from './routes/auth.routes.js';
import { ActionRoutes } from './routes/action.routes.js';
import { HealthRoutes } from './routes/health.routes.js';
import { SwaggerRoutes } from './routes/swagger.routes.js';
import { logger } from './utils/logger.js';
import { NotFoundError } from './utils/errors.js';

export class App {
  private readonly app: Express;
  private readonly database: PostgresDatabase;
  private readonly routes: AppRoutes;
  private readonly errorMiddleware: ErrorMiddleware;
  private readonly webRoot: string;

  constructor() {
    this.app = express();
    this.database = new PostgresDatabase();
    this.webRoot = path.resolve(process.cwd(), 'web');

    const tokenService = new TokenService();
    const otpService = new OtpService(this.database.otps);
    const sendOtpEmailAction =
      env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN
        ? new SendOtpEmailAction(
            new MailgunClient({
              apiKey: env.MAILGUN_API_KEY,
              domain: env.MAILGUN_DOMAIN
            }),
            env.MAILGUN_FROM ?? `no-reply@${env.MAILGUN_DOMAIN}`
          )
        : null;
    const otpDeliveryService = new OtpDeliveryService(sendOtpEmailAction);
    const authService = new AuthService(
      this.database.users,
      tokenService,
      otpService,
      otpDeliveryService
    );
    const actionService = new ActionService(this.database.actions);

    const authController = new AuthController(authService);
    const actionController = new ActionController(actionService);
    const authMiddleware = new AuthMiddleware(tokenService);

    const authRoutes = new AuthRoutes(authController);
    const actionRoutes = new ActionRoutes(actionController, authMiddleware);
    const healthRoutes = new HealthRoutes();
    const swaggerRoutes = new SwaggerRoutes();

    this.routes = new AppRoutes(authRoutes, actionRoutes, healthRoutes, swaggerRoutes);
    this.errorMiddleware = new ErrorMiddleware();
  }

  async init(): Promise<void> {
    this.registerMiddleware();
    this.routes.register(this.app);

    this.registerSpaFallback();

    this.app.use((_req, _res, next) => {
      next(new NotFoundError('Route not found'));
    });

    this.app.use(this.errorMiddleware.handle);

    await this.database.connect();
    logger.info('Database connected');
  }

  getExpressApp(): Express {
    return this.app;
  }

  async shutdown(): Promise<void> {
    await this.database.disconnect();
  }

  private registerMiddleware(): void {
    this.app.use(cors());
    this.app.use(json({ limit: '1mb' }));
    this.app.use(express.static(this.webRoot));
  }

  private registerSpaFallback(): void {
    this.app.get('*', (req, res, next) => {
      if (!req.accepts('html')) {
        return next();
      }

      if (
        req.path.startsWith('/auth') ||
        req.path.startsWith('/action') ||
        req.path.startsWith('/health') ||
        req.path.startsWith('/docs')
      ) {
        return next();
      }

      res.sendFile(path.join(this.webRoot, 'index.html'));
    });
  }
}
