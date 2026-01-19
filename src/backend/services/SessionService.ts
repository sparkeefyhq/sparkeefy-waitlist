/**
 * Session Service
 * 
 * Handles session token generation and cookie management.
 * Provides secure, httpOnly cookie-based authentication without passwords.
 * 
 * @module services/SessionService
 */

import { Response } from "express";
import { randomBytes } from "crypto";
import { logger } from "../logging/logger";
import * as Sentry from "@sentry/node";
import { 
  SESSION_COOKIE_NAME, 
  getCookieConfig 
} from "../utils/cookies";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Session Configuration
 */
export interface SessionConfig {
  tokenLength: number;        // Number of bytes for token (default: 32)
  sessionDuration: number;     // Session duration in days (default: 30)
}

// ============================================================================
// SESSION SERVICE CLASS
// ============================================================================

export class SessionService {
  private config: SessionConfig;

  constructor(config?: Partial<SessionConfig>) {
    this.config = {
      tokenLength: config?.tokenLength || 32,      // 32 bytes = 64 hex chars
      sessionDuration: config?.sessionDuration || 30, // 30 days
    };

    logger.info("SessionService initialized", {
      tokenLength: this.config.tokenLength,
      sessionDuration: this.config.sessionDuration,
    });
  }

  // ==========================================================================
  // TOKEN GENERATION
  // ==========================================================================

  /**
   * Generate Session Token
   * 
   * Generates a cryptographically secure random token.
   * Uses Node.js crypto.randomBytes for security.
   * 
   * @returns {string} 64-character hexadecimal token (32 bytes)
   * 
   * @example
   * const token = sessionService.generateToken();
   * console.log(token); // "a3f2...9c1b" (64 chars)
   */
  generateToken(): string {
    try {
      const token = randomBytes(this.config.tokenLength).toString("hex");

      logger.debug("Session token generated", {
        tokenLength: token.length,
      });

      return token;
    } catch (error) {
      logger.error("Failed to generate session token", { error });
      Sentry.captureException(error);
      throw new Error("Failed to generate secure session token");
    }
  }

  // ==========================================================================
  // COOKIE MANAGEMENT
  // ==========================================================================

  /**
   * Set Session Cookie
   * 
   * Sets httpOnly session cookie with secure configuration.
   * Cookie is automatically sent with all subsequent requests.
   * 
   * @param {Response} res - Express response object
   * @param {string} token - Session token to store
   * @param {boolean} isProduction - Whether running in production
   * 
   * @example
   * sessionService.setSessionCookie(res, sessionToken, true);
   * // Cookie set with httpOnly, secure, sameSite flags
   */
  setSessionCookie(
    res: Response,
    token: string,
    isProduction: boolean = false
  ): void {
    try {
      const cookieOptions = getCookieConfig(isProduction);

      res.cookie(SESSION_COOKIE_NAME, token, cookieOptions);

      logger.info("Session cookie set", {
        cookieName: SESSION_COOKIE_NAME,
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
      });
    } catch (error) {
      logger.error("Failed to set session cookie", { error });
      Sentry.captureException(error);
      throw new Error("Failed to set session cookie");
    }
  }

  /**
   * Clear Session Cookie
   * 
   * Removes session cookie (logout functionality).
   * Cookie is immediately expired and cleared from browser.
   * 
   * @param {Response} res - Express response object
   * @param {boolean} isProduction - Whether running in production
   * 
   * @example
   * sessionService.clearSessionCookie(res, true);
   * // User is now logged out
   */
  clearSessionCookie(
    res: Response,
    isProduction: boolean = false
  ): void {
    try {
      const cookieOptions = getCookieConfig(isProduction);

      res.clearCookie(SESSION_COOKIE_NAME, cookieOptions);

      logger.info("Session cookie cleared", {
        cookieName: SESSION_COOKIE_NAME,
      });
    } catch (error) {
      logger.error("Failed to clear session cookie", { error });
      Sentry.captureException(error);
      throw new Error("Failed to clear session cookie");
    }
  }

  // ==========================================================================
  // SESSION EXPIRATION CALCULATION
  // ==========================================================================

  /**
   * Calculate Session Expiration
   * 
   * Returns expiration date for new session (default: 30 days from now).
   * 
   * @returns {Date} Expiration timestamp
   * 
   * @example
   * const expiresAt = sessionService.calculateExpiration();
   * console.log(expiresAt); // Date 30 days in future
   */
  calculateExpiration(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.config.sessionDuration);
    return expiresAt;
  }

  /**
   * Check if Session is Expired
   * 
   * Validates whether session expiration date has passed.
   * 
   * @param {Date} expiresAt - Session expiration date
   * @returns {boolean} True if session is expired
   * 
   * @example
   * const expired = sessionService.isExpired(user.sessionExpiresAt);
   * if (expired) {
   *   throw new Error("Session expired");
   * }
   */
  isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get Session Duration in Milliseconds
   * 
   * Returns session duration for cookie maxAge calculation.
   * 
   * @returns {number} Duration in milliseconds
   * 
   * @example
   * const duration = sessionService.getSessionDurationMs();
   * console.log(duration); // 2592000000 (30 days)
   */
  getSessionDurationMs(): number {
    return this.config.sessionDuration * 24 * 60 * 60 * 1000;
  }

  /**
   * Validate Token Format
   * 
   * Checks if token has correct format (64 hex characters).
   * Does NOT validate if token exists in database.
   * 
   * @param {string} token - Token to validate
   * @returns {boolean} True if format is valid
   * 
   * @example
   * const valid = sessionService.validateTokenFormat(token);
   * if (!valid) {
   *   throw new Error("Invalid token format");
   * }
   */
  validateTokenFormat(token: string): boolean {
    // Token should be 64 hex characters (32 bytes)
    const expectedLength = this.config.tokenLength * 2; // 2 hex chars per byte
    return (
      typeof token === "string" &&
      token.length === expectedLength &&
      /^[a-f0-9]+$/i.test(token)
    );
  }

  // ==========================================================================
  // SESSION RENEWAL
  // ==========================================================================

  /**
   * Renew Session
   * 
   * Generates new token and expiration for session renewal.
   * Used for "Remember me" or session extension functionality.
   * 
   * @returns {{ token: string; expiresAt: Date }}
   * 
   * @example
   * const renewed = sessionService.renewSession();
   * // Update user in database with new token and expiration
   * await db.updateUser(userId, {
   *   sessionToken: renewed.token,
   *   sessionExpiresAt: renewed.expiresAt
   * });
   */
  renewSession(): { token: string; expiresAt: Date } {
    const token = this.generateToken();
    const expiresAt = this.calculateExpiration();

    logger.info("Session renewed", {
      expiresAt: expiresAt.toISOString(),
    });

    return { token, expiresAt };
  }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  /**
   * Get Service Health
   * 
   * Returns health status of SessionService.
   * Used for monitoring and health checks.
   * 
   * @returns {{ status: "healthy"; timestamp: string }}
   * 
   * @example
   * const health = sessionService.getHealth();
   * console.log(health.status); // "healthy"
   */
  getHealth(): {
    status: "healthy" | "unhealthy";
    timestamp: string;
    config: SessionConfig;
  } {
    try {
      // Test token generation
      const testToken = this.generateToken();
      const isValid = this.validateTokenFormat(testToken);

      if (!isValid) {
        throw new Error("Token generation validation failed");
      }

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        config: this.config,
      };
    } catch (error) {
      logger.error("Health check failed", { error });
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        config: this.config,
      };
    }
  }
}

// 1. Install Dependencies
// bash
// npm install prisma @prisma/client
// npm install -D prisma
// 2. Configure Environment
// Create .env:

// text
// DATABASE_URL="postgresql://user:password@localhost:5432/sparkeefy_waitlist"
// # or
// # DATABASE_URL="mysql://user:password@localhost:3306/sparkeefy_waitlist"
// 3. Generate Prisma Client
// bash
// npx prisma generate
// 4. Create Database Migration
// bash
// # Development
// npx prisma migrate dev --name init

// # Production
// npx prisma migrate deploy
// 5. Verify Setup
// bash
// # Open Prisma Studio GUI
// npx prisma studio

// # Test connection
// npx prisma db pull
