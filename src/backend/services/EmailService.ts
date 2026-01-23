/**
 * Email Service
 * 
 * Native Node.js SMTP implementation for sending magic link emails.
 * Uses TLS/STARTTLS for secure connections without external dependencies.
 * 
 * Features:
 * - Native Node.js TLS module (no nodemailer)
 * - Gmail SMTP support (587 STARTTLS)
 * - HTML + Plain text multipart emails
 * - Professional email template
 * - Comprehensive error handling
 * 
 * @module services/EmailService
 */

import * as tls from "tls";
import * as net from "net";
import { config } from "../config";
import { logger } from "../logging/logger";
import * as Sentry from "@sentry/node";

// ============================================================================
// CONSTANTS
// ============================================================================

const CRLF = "\r\n";
const SMTP_TIMEOUT = 10000; // 10 seconds

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Email Options
 * Configuration for sending an email
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Magic Link Email Data
 * Data for magic link template
 */
export interface MagicLinkEmailData {
  email: string;
  magicLinkUrl: string;
  referralCode: string;
  referralLink: string;
}

/**
 * SMTP Response
 * Parsed SMTP server response
 */
interface SMTPResponse {
  code: number;
  message: string;
  isMultiline: boolean;
}

// ============================================================================
// EMAIL SERVICE CLASS
// ============================================================================

export class EmailService {
  private host: string;
  private port: number;
  private user: string;
  private pass: string;
  private from: string;
  private enabled: boolean;

  constructor() {
    this.host = config.smtp.host;
    this.port = config.smtp.port;
    this.user = config.smtp.user;
    this.pass = config.smtp.pass;
    this.from = config.smtp.from;
    this.enabled = config.smtp.enabled;

    if (this.enabled) {
      logger.info("EmailService initialized", {
        host: this.host,
        port: this.port,
        from: this.from,
      });
    } else {
      logger.warn("EmailService disabled - SMTP credentials not configured");
    }
  }

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  /**
   * Send Magic Link Email
   * 
   * Sends welcome email with magic link authentication URL.
   * 
   * @param {MagicLinkEmailData} data - Email data
   * @returns {Promise<void>}
   * 
   * @example
   * await emailService.sendMagicLinkEmail({
   *   email: "user@example.com",
   *   magicLinkUrl: "https://app.com/auth/magic?token=...",
   *   referralCode: "ABC12XYZ",
   *   referralLink: "https://app.com?ref=ABC12XYZ"
   * });
   */
  async sendMagicLinkEmail(data: MagicLinkEmailData): Promise<void> {
    if (!this.enabled) {
      logger.warn("Email sending skipped - SMTP not configured", {
        to: data.email,
      });
      return;
    }

    const html = this.buildMagicLinkHTML(data);
    const text = this.buildMagicLinkPlainText(data);

    await this.sendEmail({
      to: data.email,
      subject: "🎉 Welcome to Sparkeefy - Your Magic Link Inside!",
      html,
      text,
    });

    logger.info("Magic link email sent successfully", {
      to: data.email,
      referralCode: data.referralCode,
    });
  }

  /**
   * Send Email (Generic)
   * 
   * Core SMTP sending logic with TLS encryption.
   * 
   * @param {EmailOptions} options - Email configuration
   * @returns {Promise<void>}
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      let socket: net.Socket | tls.TLSSocket;
      let buffer = "";
      let isSecure = false;
      let conversationStep = 0; // Track conversation state

      const timeout = setTimeout(() => {
        if (socket) socket.destroy();
        reject(new Error("SMTP timeout"));
      }, SMTP_TIMEOUT);

      // Create initial TCP connection
      socket = net.createConnection(this.port, this.host);

      const handleData = (data: Buffer) => {
        buffer += data.toString();

        let lineEnd: number;
        while ((lineEnd = buffer.indexOf(CRLF)) !== -1) {
          const line = buffer.substring(0, lineEnd);
          buffer = buffer.substring(lineEnd + CRLF.length);

          logger.debug("SMTP Response:", { line });

          const response = this.parseSMTPResponse(line);

          try {
            if (response.code === 220 && conversationStep === 0) {
              // Server greeting
              conversationStep = 1;
              this.send(socket, `EHLO ${this.host}${CRLF}`);
            } else if (response.code === 250 && line.includes("STARTTLS") && !isSecure) {
              // Found STARTTLS capability
              this.send(socket, `STARTTLS${CRLF}`);
            } else if (response.code === 220 && line.includes("Ready to start TLS")) {
              // Upgrade to TLS
              isSecure = true;
              conversationStep = 2;

              // Remove old listeners
              socket.removeAllListeners("data");
              socket.removeAllListeners("error");

              // Upgrade socket
              socket = tls.connect({
                socket: socket as net.Socket,
                host: this.host,
                rejectUnauthorized: true,
              });

              // Re-attach listeners to TLS socket
              socket.on("data", handleData);
              socket.on("error", handleError);

              // Send EHLO again after TLS
              this.send(socket, `EHLO ${this.host}${CRLF}`);
            } else if (response.code === 250 && isSecure && conversationStep === 2) {
              // After TLS EHLO, start AUTH
              conversationStep = 3;
              this.send(socket, `AUTH LOGIN${CRLF}`);
            } else if (response.code === 334 && response.message.includes("VXNlcm5hbWU")) {
              const username = Buffer.from(this.user).toString("base64");
              this.send(socket, `${username}${CRLF}`);
            } else if (response.code === 334 && response.message.includes("UGFzc3dvcmQ")) {
              const password = Buffer.from(this.pass).toString("base64");
              this.send(socket, `${password}${CRLF}`);
            } else if (response.code === 235) {
              // Auth success
              this.send(socket, `MAIL FROM:<${this.from}>${CRLF}`);
            } else if (response.code === 250 && line.match(/2\.1\.0.*OK/)) {
              // Sender OK
              this.send(socket, `RCPT TO:<${options.to}>${CRLF}`);
            } else if (response.code === 250 && line.match(/2\.1\.5.*OK/)) {
              // Recipient OK
              this.send(socket, `DATA${CRLF}`);
            } else if (response.code === 354) {
              // Ready for data
              const emailData = this.buildEmailMessage(options);
              this.send(socket, `${emailData}${CRLF}.${CRLF}`);
            } else if (response.code === 250 && (line.includes("2.0.0") || line.includes("OK:"))) {
              // Message accepted/queued - Gmail responds with various formats:
              // "250 2.0.0 OK: queued as ..."
              // "250 2.0.0 OK 1234567890 - gsmtp"
              // Only send QUIT if we haven't already sent DATA
              if (!line.includes("2.1.0") && !line.includes("2.1.5")) {
                this.send(socket, `QUIT${CRLF}`);
              }
            } else if (response.code === 221) {
              // Goodbye
              clearTimeout(timeout);
              socket.end();

              const duration = Date.now() - startTime;
              logger.info("Email sent successfully", {
                to: options.to,
                duration: `${duration}ms`,
              });

              resolve();
            } else if (response.code >= 400) {
              throw new Error(`SMTP Error ${response.code}: ${response.message}`);
            }
          } catch (error) {
            clearTimeout(timeout);
            if (socket) socket.destroy();
            reject(error);
          }
        }
      };

      const handleError = (error: Error) => {
        clearTimeout(timeout);
        logger.error("SMTP connection error", { error });
        Sentry.captureException(error);
        reject(error);
      };

      socket.on("connect", () => {
        logger.debug("Connected to SMTP server", {
          host: this.host,
          port: this.port,
        });
      });

      socket.on("data", handleData);
      socket.on("error", handleError);
      socket.on("close", () => {
        clearTimeout(timeout);
        logger.debug("SMTP connection closed");
      });
    });
  }


  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Send data to SMTP server
   */
  private send(socket: net.Socket | tls.TLSSocket, data: string): void {
    logger.debug("SMTP Send:", { data: data.trim() });
    socket.write(data);
  }

  /**
   * Upgrade TCP socket to TLS
   */
  private upgradeToTLS(socket: net.Socket): tls.TLSSocket {
    logger.debug("Upgrading connection to TLS");

    const tlsSocket = tls.connect({
      socket,
      host: this.host,
      rejectUnauthorized: true, // Verify SSL certificate
    });

    return tlsSocket;
  }

  /**
   * Parse SMTP response line
   */
  private parseSMTPResponse(line: string): SMTPResponse {
    const code = parseInt(line.substring(0, 3), 10);
    const separator = line.charAt(3);
    const message = line.substring(4);

    return {
      code,
      message,
      isMultiline: separator === "-",
    };
  }

  /**
   * Build complete email message with headers
   */
  private buildEmailMessage(options: EmailOptions): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
    const date = new Date().toUTCString();

    return [
      `From: ${this.from}`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      `Date: ${date}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      options.text,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      options.html,
      ``,
      `--${boundary}--`,
    ].join(CRLF);
  }

  // ==========================================================================
  // EMAIL TEMPLATES
  // ==========================================================================

  /**
   * Build Magic Link HTML Email
   */
  private buildMagicLinkHTML(data: MagicLinkEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Sparkeefy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">🎉 Welcome to Sparkeefy!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #18181b; font-size: 16px; line-height: 1.6;">
                Hi there! 👋
              </p>
              <p style="margin: 0 0 20px; color: #18181b; font-size: 16px; line-height: 1.6;">
                You've successfully joined the <strong>Sparkeefy waitlist</strong>! We're thrilled to have you on board.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.magicLinkUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      🔐 Access My Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                <strong>Note:</strong> This magic link never expires and works on any device. Bookmark it for easy access!
              </p>

              <!-- Referral Section -->
              <table role="presentation" style="width: 100%; margin: 30px 0; padding: 20px; background-color: #f4f4f5; border-radius: 6px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 15px; color: #18181b; font-size: 18px; font-weight: 600;">
                      🚀 Invite Friends & Earn Rewards
                    </h2>
                    <p style="margin: 0 0 15px; color: #52525b; font-size: 14px; line-height: 1.6;">
                      Share your unique referral link and unlock exclusive perks:
                    </p>
                    <table role="presentation" style="width: 100%; margin: 15px 0;">
                      <tr>
                        <td style="padding: 12px; background-color: #ffffff; border-radius: 4px; border: 1px solid #e4e4e7;">
                          <p style="margin: 0; color: #71717a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            Your Referral Code
                          </p>
                          <p style="margin: 5px 0 0; color: #18181b; font-size: 20px; font-weight: 700; font-family: 'Courier New', monospace;">
                            ${data.referralCode}
                          </p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 15px 0 0; color: #52525b; font-size: 13px; line-height: 1.6;">
                      <strong>Share your link:</strong><br>
                      <a href="${data.referralLink}" style="color: #667eea; text-decoration: none; word-break: break-all;">${data.referralLink}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Rewards Tiers -->
              <table role="presentation" style="width: 100%; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; color: #18181b; font-size: 14px; font-weight: 600;">
                      Referral Rewards:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #52525b; font-size: 14px; line-height: 1.8;">
                      <li><strong>1 referrals</strong> → 1 month free premium</li>
                      <li><strong>3 referrals</strong> → 3 months free premium</li>
                      <li><strong>10+ referrals</strong> → Lifetime Founder Seat 🎖️</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #71717a; font-size: 12px; line-height: 1.6;">
                Questions? Reply to this email or visit our <a href="https://sparkeefy.com/support" style="color: #667eea; text-decoration: none;">support center</a>.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 11px; line-height: 1.6;">
                © ${new Date().getFullYear()} Sparkeefy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Build Magic Link Plain Text Email
   */
  private buildMagicLinkPlainText(data: MagicLinkEmailData): string {
    return `
🎉 Welcome to Sparkeefy!

Hi there! 👋

You've successfully joined the Sparkeefy waitlist. We're thrilled to have you on board!

🔐 ACCESS YOUR DASHBOARD
Click this magic link to access your stats anytime:
${data.magicLinkUrl}

Note: This link never expires and works on any device. Bookmark it for easy access!

🚀 INVITE FRIENDS & EARN REWARDS
Share your unique referral link and unlock exclusive perks:

Your Referral Code: ${data.referralCode}
Your Referral Link: ${data.referralLink}

REFERRAL REWARDS:
• 3 referrals → 1 month free premium
• 6 referrals → 3 months free premium  
• 10+ referrals → Lifetime Founder Seat 🎖️

---
Questions? Reply to this email or visit: https://sparkeefy.com/support
© ${new Date().getFullYear()} Sparkeefy. All rights reserved.
    `.trim();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global EmailService instance
 * Import this to send emails throughout the application
 */
export const emailService = new EmailService();
