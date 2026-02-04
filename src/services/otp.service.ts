import crypto from 'crypto';
import { env } from '../config/index.js';
import type { OtpChannel, OtpPurpose, OtpRecord, OtpRepository } from '../types/database.js';
import { AuthError } from '../utils/errors.js';

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_CODE_LENGTH = 6;

export class OtpService {
  private readonly ttlMs: number;
  private readonly codeLength: number;

  constructor(
    private readonly otps: OtpRepository,
    options?: { ttlMs?: number; codeLength?: number }
  ) {
    this.ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
    this.codeLength = options?.codeLength ?? DEFAULT_CODE_LENGTH;
  }

  async requestOtp(input: {
    identifier: string;
    channel: OtpChannel;
    purpose: OtpPurpose;
    userId?: string | null;
  }): Promise<{ code: string; expiresAt: Date }> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.ttlMs);
    const codeHash = this.hashCode(code);

    await this.otps.create({
      identifier: input.identifier,
      channel: input.channel,
      purpose: input.purpose,
      codeHash,
      expiresAt,
      userId: input.userId ?? null
    });

    return { code, expiresAt };
  }

  async verifyOtp(input: {
    identifier: string;
    purpose: OtpPurpose;
    code: string;
  }): Promise<OtpRecord> {
    const now = new Date();
    const record = await this.otps.findLatestActive({
      identifier: input.identifier,
      purpose: input.purpose,
      now
    });

    if (!record) {
      throw new AuthError('Invalid or expired code');
    }

    const expected = this.hashCode(input.code);
    if (record.codeHash !== expected) {
      throw new AuthError('Invalid or expired code');
    }

    await this.otps.markConsumed(record.id, now);
    return record;
  }

  private generateCode(): string {
    const max = 10 ** this.codeLength;
    const value = crypto.randomInt(0, max);
    return value.toString().padStart(this.codeLength, '0');
  }

  private hashCode(code: string): string {
    return crypto.createHmac('sha256', env.JWT_SECRET).update(code).digest('hex');
  }
}
