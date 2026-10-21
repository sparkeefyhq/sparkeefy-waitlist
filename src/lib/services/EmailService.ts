/**
 * Email Service (Resend)
 *
 * Sends transactional emails via Resend using React Email components.
 * Falls back to a no-op when RESEND_API_KEY is not configured.
 *
 * @module services/EmailService
 */

import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

export interface WelcomeEmailData {
  email: string;
  magicLinkUrl: string;
  referralCode: string;
  referralLink: string;
}

/** Re-export under the old name so existing imports keep working */
export type MagicLinkEmailData = WelcomeEmailData;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM =
  process.env.EMAIL_FROM ?? "Sparkeefy <welcome@sparkeefy.com>";

class EmailService {
  /**
   * Send the welcome / early-access confirmation email.
   * Throws if Resend returns an error so callers can surface it.
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ id: string }> {
    if (!resend) {
      throw new Error(
        "Email sending is not configured. Set RESEND_API_KEY in your environment."
      );
    }
    // Reserved test domains (synthetic staging data) are never emailed.
    if (/\.test$/i.test(data.email.trim())) {
      throw new Error("Refusing to email a reserved .test address (synthetic data).");
    }

    const { data: result, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: data.email,
      subject: "You're in - welcome to Sparkeefy Early Access",
      react: WelcomeEmail({
        email: data.email,
        magicLinkUrl: data.magicLinkUrl,
        referralCode: data.referralCode,
        referralLink: data.referralLink,
      }),
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return { id: result?.id ?? "unknown" };
  }

  /** Backwards-compatible alias used by the join flow. */
  async sendMagicLinkEmail(
    data: MagicLinkEmailData
  ): Promise<{ sent: boolean; id?: string; error?: string }> {
    try {
      const { id } = await this.sendWelcomeEmail(data);
      return { sent: true, id };
    } catch (err) {
      // Swallow in the join flow — email is best-effort there.
      // But return enough info so callers can avoid marking it as "sent".
      return {
        sent: false,
        error: err instanceof Error ? err.message : "Unknown email error",
      };
    }
  }

  /** Check whether the service is configured and ready to send. */
  get isConfigured(): boolean {
    return resend !== null;
  }
}

export const emailService = new EmailService();
