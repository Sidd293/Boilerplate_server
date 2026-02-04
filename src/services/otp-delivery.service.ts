import { config } from '../config/index.js';
import type { OtpChannel, OtpPurpose } from '../types/database.js';
import { logger } from '../utils/logger.js';
import type { SendOtpEmailAction } from '../vendor/mailgun/actions/send-otp-email.action.js';

export class OtpDeliveryService {
  constructor(private readonly sendEmailAction: SendOtpEmailAction | null) {}

  async sendOtp(input: {
    channel: OtpChannel;
    identifier: string;
    code: string;
    purpose: OtpPurpose;
    expiresAt: Date;
  }): Promise<void> {
    if (input.channel === 'email') {
      if (!this.sendEmailAction) {
        this.handleMissingProvider('email');
        return;
      }

      await this.sendEmailAction.execute({
        to: input.identifier,
        code: input.code,
        purpose: input.purpose,
        expiresAt: input.expiresAt
      });
      return;
    }

    logger.warn({ channel: input.channel }, 'OTP delivery channel not configured');
  }

  private handleMissingProvider(channel: 'email'): void {
    if (config.env === 'production') {
      throw new Error(`${channel} OTP provider not configured`);
    }

    logger.warn({ channel }, 'OTP provider not configured, skipping send');
  }
}
