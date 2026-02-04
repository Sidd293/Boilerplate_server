import bcrypt from 'bcrypt';
import { User } from '../models/user.model.js';
import type { OtpChannel, OtpPurpose, UserRepository } from '../types/database.js';
import { AuthError, ConflictError } from '../utils/errors.js';
import { OtpDeliveryService } from './otp-delivery.service.js';
import { OtpService } from './otp.service.js';
import { TokenService } from './token.service.js';

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
    private readonly otpDeliveryService: OtpDeliveryService
  ) {}

  async register(email: string, password: string): Promise<{ user: User; token: string }> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await this.users.create({ email, passwordHash });

    const token = this.tokenService.sign({
      sub: created.id,
      email: created.email,
      phone: created.phone
    });
    return { user: new User(created.id, created.email, created.phone, created.createdAt), token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new AuthError('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new AuthError('Invalid credentials');
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new AuthError('Invalid credentials');
    }

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      phone: user.phone
    });
    return { user: new User(user.id, user.email, user.phone, user.createdAt), token };
  }

  async requestSignupOtp(input: {
    identifier: string;
    channel: OtpChannel;
  }): Promise<{ code: string; expiresAt: Date }> {
    const existing =
      input.channel === 'email'
        ? await this.users.findByEmail(input.identifier)
        : await this.users.findByPhone(input.identifier);

    if (existing) {
      throw new ConflictError('Account already exists');
    }

    const result = await this.requestOtp({
      identifier: input.identifier,
      channel: input.channel,
      purpose: 'SIGNUP'
    });

    await this.otpDeliveryService.sendOtp({
      channel: input.channel,
      identifier: input.identifier,
      code: result.code,
      purpose: 'SIGNUP',
      expiresAt: result.expiresAt
    });

    return result;
  }

  async verifySignupOtp(input: {
    identifier: string;
    channel: OtpChannel;
    code: string;
    password?: string;
  }): Promise<{ user: User; token: string }> {
    const existing =
      input.channel === 'email'
        ? await this.users.findByEmail(input.identifier)
        : await this.users.findByPhone(input.identifier);
    if (existing) {
      throw new ConflictError('Account already exists');
    }

    await this.otpService.verifyOtp({
      identifier: input.identifier,
      purpose: 'SIGNUP',
      code: input.code
    });

    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : null;
    const created = await this.users.create({
      email: input.channel === 'email' ? input.identifier : null,
      phone: input.channel === 'phone' ? input.identifier : null,
      passwordHash
    });

    const token = this.tokenService.sign({
      sub: created.id,
      email: created.email,
      phone: created.phone
    });

    return { user: new User(created.id, created.email, created.phone, created.createdAt), token };
  }

  async requestLoginOtp(input: {
    identifier: string;
    channel: OtpChannel;
  }): Promise<{ code: string; expiresAt: Date }> {
    const user =
      input.channel === 'email'
        ? await this.users.findByEmail(input.identifier)
        : await this.users.findByPhone(input.identifier);

    if (!user) {
      throw new AuthError('Invalid credentials');
    }

    const result = await this.requestOtp({
      identifier: input.identifier,
      channel: input.channel,
      purpose: 'LOGIN',
      userId: user.id
    });

    await this.otpDeliveryService.sendOtp({
      channel: input.channel,
      identifier: input.identifier,
      code: result.code,
      purpose: 'LOGIN',
      expiresAt: result.expiresAt
    });

    return result;
  }

  async verifyLoginOtp(input: {
    identifier: string;
    channel: OtpChannel;
    code: string;
  }): Promise<{ user: User; token: string }> {
    const record = await this.otpService.verifyOtp({
      identifier: input.identifier,
      purpose: 'LOGIN',
      code: input.code
    });

    const user =
      record.userId
        ? await this.users.findById(record.userId)
        : input.channel === 'email'
          ? await this.users.findByEmail(input.identifier)
          : await this.users.findByPhone(input.identifier);

    if (!user) {
      throw new AuthError('Invalid credentials');
    }

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      phone: user.phone
    });

    return { user: new User(user.id, user.email, user.phone, user.createdAt), token };
  }

  async requestPasswordResetOtp(input: {
    identifier: string;
    channel: OtpChannel;
  }): Promise<{ code: string; expiresAt: Date }> {
    const user =
      input.channel === 'email'
        ? await this.users.findByEmail(input.identifier)
        : await this.users.findByPhone(input.identifier);

    const payload: {
      identifier: string;
      channel: OtpChannel;
      purpose: OtpPurpose;
      userId?: string;
    } = {
      identifier: input.identifier,
      channel: input.channel,
      purpose: 'RESET'
    };

    if (user) {
      payload.userId = user.id;
    }

    const result = await this.requestOtp(payload);

    await this.otpDeliveryService.sendOtp({
      channel: input.channel,
      identifier: input.identifier,
      code: result.code,
      purpose: 'RESET',
      expiresAt: result.expiresAt
    });

    return result;
  }

  async resetPasswordWithOtp(input: {
    identifier: string;
    channel: OtpChannel;
    code: string;
    newPassword: string;
  }): Promise<{ user: User; token: string }> {
    const record = await this.otpService.verifyOtp({
      identifier: input.identifier,
      purpose: 'RESET',
      code: input.code
    });

    const user =
      record.userId
        ? await this.users.findById(record.userId)
        : input.channel === 'email'
          ? await this.users.findByEmail(input.identifier)
          : await this.users.findByPhone(input.identifier);

    if (!user) {
      throw new AuthError('Invalid or expired code');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    const updated = await this.users.updatePassword(user.id, passwordHash);

    const token = this.tokenService.sign({
      sub: updated.id,
      email: updated.email,
      phone: updated.phone
    });

    return { user: new User(updated.id, updated.email, updated.phone, updated.createdAt), token };
  }

  private requestOtp(input: {
    identifier: string;
    channel: OtpChannel;
    purpose: OtpPurpose;
    userId?: string;
  }): Promise<{ code: string; expiresAt: Date }> {
    const payload: {
      identifier: string;
      channel: OtpChannel;
      purpose: OtpPurpose;
      userId?: string | null;
    } = {
      identifier: input.identifier,
      channel: input.channel,
      purpose: input.purpose
    };

    if (input.userId !== undefined) {
      payload.userId = input.userId;
    }

    return this.otpService.requestOtp(payload);
  }
}
