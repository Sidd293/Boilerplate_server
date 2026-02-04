import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { config } from '../config/index.js';

export interface TokenPayload {
  sub: string;
  email?: string | null;
  phone?: string | null;
}

export class TokenService {
  private readonly secret: Secret;
  private readonly signOptions: SignOptions;

  constructor(
    secret: Secret = config.jwt.secret,
    expiresIn: StringValue = config.jwt.expiresIn as StringValue
  ) {
    this.secret = secret;
    this.signOptions = { expiresIn };
  }

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, this.signOptions);
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}
