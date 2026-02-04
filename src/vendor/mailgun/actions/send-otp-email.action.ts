import type { OtpPurpose } from '../../../types/database.js';
import { MailgunClient } from '../mailgun.client.js';

export class SendOtpEmailAction {
  constructor(
    private readonly client: MailgunClient,
    private readonly fromAddress: string
  ) {}

  async execute(input: {
    to: string;
    code: string;
    purpose: OtpPurpose;
    expiresAt: Date;
  }): Promise<void> {
    const subject = `Your ${this.describePurpose(input.purpose)} code`;
    const text = this.buildText(input);

    await this.client.sendMessage({
      from: this.fromAddress,
      to: input.to,
      subject,
      text
    });
  }

  private describePurpose(purpose: OtpPurpose): string {
    switch (purpose) {
      case 'SIGNUP':
        return 'signup';
      case 'LOGIN':
        return 'login';
      case 'RESET':
        return 'password reset';
      default:
        return 'verification';
    }
  }

  private buildText(input: { code: string; purpose: OtpPurpose; expiresAt: Date }): string {
    const purpose = this.describePurpose(input.purpose);
    return `Your ${purpose} OTP code is ${input.code}. It expires at ${input.expiresAt.toISOString()}.`;
  }
}
