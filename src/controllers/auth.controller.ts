import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/index.js';
import { AuthService } from '../services/auth.service.js';
import { ValidationError } from '../utils/errors.js';
import { ResponseHandler } from '../utils/response.js';

export class AuthController {
  private readonly contactBaseSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().min(6).optional()
  });
  private readonly contactSchema = this.contactBaseSchema.refine(
    (value) => (value.email ? !value.phone : !!value.phone),
    {
      message: 'Provide either email or phone'
    }
  );

  private readonly registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });

  private readonly loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });

  private readonly otpRequestSchema = this.contactSchema;
  private readonly otpVerifySchema = this.contactBaseSchema
    .extend({
      code: z.string().length(6)
    })
    .refine((value) => (value.email ? !value.phone : !!value.phone), {
      message: 'Provide either email or phone'
    });
  private readonly otpSignupVerifySchema = this.contactBaseSchema
    .extend({
      code: z.string().length(6),
      password: z.string().min(8).optional()
    })
    .refine((value) => (value.email ? !value.phone : !!value.phone), {
      message: 'Provide either email or phone'
    });
  private readonly otpResetVerifySchema = this.contactBaseSchema
    .extend({
      code: z.string().length(6),
      newPassword: z.string().min(8)
    })
    .refine((value) => (value.email ? !value.phone : !!value.phone), {
      message: 'Provide either email or phone'
    });

  constructor(private readonly authService: AuthService) {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.requestSignupOtp = this.requestSignupOtp.bind(this);
    this.verifySignupOtp = this.verifySignupOtp.bind(this);
    this.requestLoginOtp = this.requestLoginOtp.bind(this);
    this.verifyLoginOtp = this.verifyLoginOtp.bind(this);
    this.requestPasswordResetOtp = this.requestPasswordResetOtp.bind(this);
    this.resetPasswordWithOtp = this.resetPasswordWithOtp.bind(this);
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = this.registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request';
      return next(new ValidationError(message));
    }

    try {
      const result = await this.authService.register(parsed.data.email, parsed.data.password);
      ResponseHandler.success(
        res,
        {
          user: result.user,
          token: result.token
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = this.loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request';
      return next(new ValidationError(message));
    }

    try {
      const result = await this.authService.login(parsed.data.email, parsed.data.password);
      ResponseHandler.success(res, {
        user: result.user,
        token: result.token
      });
    } catch (error) {
      next(error);
    }
  }

  async requestSignupOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = this.otpRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request';
      return next(new ValidationError(message));
    }

    try {
      const { identifier, channel } = this.extractContact(parsed.data);
      const result = await this.authService.requestSignupOtp({ identifier, channel });
      ResponseHandler.success(res, this.buildOtpResponse(identifier, result.expiresAt, result.code), 201);
    } catch (error) {
      next(error);
    }
  }

  async verifySignupOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = this.otpSignupVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request';
      return next(new ValidationError(message));
    }

    try {
      const { identifier, channel } = this.extractContact(parsed.data);
      const payload: {
        identifier: string;
        channel: 'email' | 'phone';
        code: string;
        password?: string;
      } = {
        identifier,
        channel,
        code: parsed.data.code
      };

      if (parsed.data.password !== undefined) {
        payload.password = parsed.data.password;
      }

      const result = await this.authService.verifySignupOtp(payload);
      ResponseHandler.success(res, { user: result.user, token: result.token }, 201);
    } catch (error) {
      next(error);
    }
  }

  async requestLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = this.otpRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request';
      return next(new ValidationError(message));
    }

    try {
      const { identifier, channel } = this.extractContact(parsed.data);
      const result = await this.authService.requestLoginOtp({ identifier, channel });
      ResponseHandler.success(res, this.buildOtpResponse(identifier, result.expiresAt, result.code), 201);
    } catch (error) {
      next(error);
    }
  }

  async verifyLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = this.otpVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request';
      return next(new ValidationError(message));
    }

    try {
      const { identifier, channel } = this.extractContact(parsed.data);
      const result = await this.authService.verifyLoginOtp({
        identifier,
        channel,
        code: parsed.data.code
      });
      ResponseHandler.success(res, { user: result.user, token: result.token });
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordResetOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = this.otpRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request';
      return next(new ValidationError(message));
    }

    try {
      const { identifier, channel } = this.extractContact(parsed.data);
      const result = await this.authService.requestPasswordResetOtp({ identifier, channel });
      ResponseHandler.success(res, this.buildOtpResponse(identifier, result.expiresAt, result.code), 201);
    } catch (error) {
      next(error);
    }
  }

  async resetPasswordWithOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = this.otpResetVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request';
      return next(new ValidationError(message));
    }

    try {
      const { identifier, channel } = this.extractContact(parsed.data);
      const result = await this.authService.resetPasswordWithOtp({
        identifier,
        channel,
        code: parsed.data.code,
        newPassword: parsed.data.newPassword
      });
      ResponseHandler.success(res, { user: result.user, token: result.token });
    } catch (error) {
      next(error);
    }
  }

  private extractContact(input: { email?: string | undefined; phone?: string | undefined }): {
    identifier: string;
    channel: 'email' | 'phone';
  } {
    if (input.email) {
      return { identifier: input.email, channel: 'email' };
    }
    return { identifier: input.phone ?? '', channel: 'phone' };
  }

  private buildOtpResponse(identifier: string, expiresAt: Date, code: string): {
    sentTo: string;
    expiresAt: Date;
    otp?: string;
  } {
    const data: { sentTo: string; expiresAt: Date; otp?: string } = {
      sentTo: identifier,
      expiresAt
    };

    if (env.NODE_ENV !== 'production') {
      data.otp = code;
    }

    return data;
  }
}
