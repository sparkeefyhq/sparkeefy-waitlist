/**
 * Email Service (No-op)
 *
 * Placeholder for email sending. Magic link emails are not sent.
 * To enable emails, integrate a provider (e.g. Resend, SendGrid).
 *
 * @module services/EmailService
 */

export interface MagicLinkEmailData {
  email: string;
  magicLinkUrl: string;
  referralCode: string;
  referralLink: string;
}

class EmailService {
  async sendMagicLinkEmail(_data: MagicLinkEmailData): Promise<void> {
    // No-op
  }
}

export const emailService = new EmailService();
