/**
 * Email Service (No-op)
 *
 * Placeholder for email sending. Magic link emails are not sent.
 * To enable emails, integrate a provider (e.g. Resend, SendGrid).
 *
 * @module services/EmailService
 */

import { logger } from "../logging/logger";

export interface MagicLinkEmailData {
  email: string;
  magicLinkUrl: string;
  referralCode: string;
  referralLink: string;
}

class EmailService {
  async sendMagicLinkEmail(data: MagicLinkEmailData): Promise<void> {
    logger.debug("Email sending disabled - magic link not sent", {
      to: data.email,
      referralCode: data.referralCode,
    });
  }
}

export const emailService = new EmailService();
