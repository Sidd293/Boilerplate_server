import type { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { BaseRoutes } from './base.routes.js';

export class AuthRoutes extends BaseRoutes {
  constructor(private readonly authController: AuthController) {
    super();
  }

  register(): Router {
    this.router.post('/register', this.authController.register);
    this.router.post('/login', this.authController.login);
    this.router.post('/signup/otp/request', this.authController.requestSignupOtp);
    this.router.post('/signup/otp/verify', this.authController.verifySignupOtp);
    this.router.post('/login/otp/request', this.authController.requestLoginOtp);
    this.router.post('/login/otp/verify', this.authController.verifyLoginOtp);
    this.router.post('/forgot-password/request', this.authController.requestPasswordResetOtp);
    this.router.post('/forgot-password/verify', this.authController.resetPasswordWithOtp);
    return this.router;
  }
}
