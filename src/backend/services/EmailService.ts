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
      subject: "Welcome to Sparkeefy",
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
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sparkeefy</title>
</head>

<body style="margin:0;padding:0;background:#f3f3f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:50px 20px;">

<!-- White Card Container -->
<table role="presentation" width="640" style="max-width:100%;background:#ffffff;padding:50px;border:1px solid #e5e5e5;">

<!-- Logo -->
<tr>
<td style="padding-bottom:40px;">
  <img src="https://sparkeefy.com/logo.svg"
       alt="Sparkeefy"
       width="160"
       style="display:block;border:0;margin-bottom:10px;" />
</td>
</tr>

<!-- Heading -->
<tr>
<td style="padding-bottom:30px;">
  <h1 style="margin:0;font-size:42px;font-weight:700;line-height:1.2;">
    You’re on the list.
  </h1>
</td>
</tr>

<!-- Body Text -->
<tr>
<td style="padding-bottom:20px;font-size:18px;line-height:1.7;color:#555;">
  You’re officially on the Sparkeefy waitlist.<br/>
  Early access opens soon.
</td>
</tr>

<!-- Referral Label -->
<tr>
<td style="padding-top:25px;padding-bottom:8px;font-size:16px;font-weight:600;">
  Your referral link
</td>
</tr>

<!-- Referral Link -->
<tr>
<td style="padding-bottom:35px;font-size:16px;">
  <a href="${data.referralLink}"
     style="color:#1a73e8;text-decoration:underline;word-break:break-all;">
     ${data.referralLink}
  </a>
</td>
</tr>

<!-- CTA Button -->
<tr>
<td style="padding-bottom:40px;">
  <a href="${data.magicLinkUrl}"
     style="display:inline-block;padding:14px 28px;background:#111;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:3px;">
     View your progress
  </a>
</td>
</tr>

</table>

<!-- Footer -->
<table role="presentation" width="640" style="max-width:100%;margin-top:25px;">
<tr>
<td align="center" style="font-size:14px;color:#777;padding-top:20px;">
  No spam. No unnecessary notifications. Just thoughtful updates.
</td>
</tr>

<tr>
<td align="center" style="font-size:12px;color:#aaa;padding-top:8px;">
  © ${new Date().getFullYear()} Sparkeefy
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
You’re on the list.

You’re officially on the Sparkeefy waitlist.
Early access opens soon.

Your referral link:
${data.referralLink}

View your progress:
${data.magicLinkUrl}

No spam. No unnecessary notifications. Just thoughtful updates.

© ${new Date().getFullYear()} Sparkeefy
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
