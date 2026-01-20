/**
 * Cookie Utilities and Configuration
 * 
 * Centralized cookie management for session tokens.
 * Handles httpOnly cookies with security best practices.
 * 
 * @module utils/cookies
 */

import type { Response } from "express";

// ============================================================================
// COOKIE CONFIGURATION
// ============================================================================

/**
 * Session Cookie Name
 * Used to identify session token in cookies
 */
export const SESSION_COOKIE_NAME = "sparkeefy_session";

/**
 * Session TTL (Time To Live)
 * Default: 30 days in milliseconds
 */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Cookie Configuration Interface
 * Defines all cookie options for session management
 */
export interface CookieConfig {
  name: string;
  maxAge: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
  domain?: string;
}

/**
 * Get Cookie Configuration
 * 
 * Returns cookie settings based on environment.
 * Production uses secure cookies, development allows HTTP.
 * 
 * @param {boolean} isProduction - Whether running in production
 * @returns {CookieConfig} Cookie configuration object
 * 
 * @example
 * const config = getCookieConfig(true);
 * console.log(config.secure); // true
 */
export function getCookieConfig(isProduction: boolean): CookieConfig {
  return {
    name: SESSION_COOKIE_NAME,
    maxAge: SESSION_TTL_MS,
    httpOnly: true, // Prevent JavaScript access (XSS protection)
    secure: isProduction, // HTTPS only in production
    sameSite: "strict", // CSRF protection
    path: "/", // Available on all routes
    // domain: undefined, // Let browser infer from request
  };
}

// ============================================================================
// COOKIE UTILITIES
// ============================================================================

/**
 * Set Session Cookie
 * 
 * Sets httpOnly session cookie with security flags.
 * Cookie contains session token for user authentication.
 * 
 * @param {Response} res - Express response object
 * @param {string} sessionToken - Session token to store
 * @param {boolean} isProduction - Whether running in production
 * 
 * @example
 * setSessionCookie(res, "a3f5b2c1...", true);
 * 
 * @note Cookie is httpOnly - not accessible via JavaScript
 * @note Secure flag enabled in production (HTTPS only)
 */
export function setSessionCookie(
  res: Response,
  sessionToken: string,
  isProduction: boolean = process.env.NODE_ENV === "production"
): void {
  const config = getCookieConfig(isProduction);

  res.cookie(config.name, sessionToken, {
    maxAge: config.maxAge,
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    path: config.path,
    domain: config.domain,
  });
}

/**
 * Clear Session Cookie
 * 
 * Removes session cookie from client.
 * Used for logout or session invalidation.
 * 
 * @param {Response} res - Express response object
 * 
 * @example
 * clearSessionCookie(res);
 * 
 * @note Sets maxAge to 0 to force immediate expiration
 */
export function clearSessionCookie(res: Response): void {
  res.cookie(SESSION_COOKIE_NAME, "", {
    maxAge: 0,
    httpOnly: true,
    path: "/",
  });
}

/**
 * Extract Session Token from Cookies
 * 
 * Retrieves session token from cookie header.
 * Returns undefined if cookie not present.
 * 
 * @param {Record<string, string | undefined>} cookies - Parsed cookies object
 * @returns {string | undefined} Session token or undefined
 * 
 * @example
 * const token = getSessionTokenFromCookies(req.cookies);
 * if (token) {
 *   // User has session
 * }
 * 
 * @note Requires cookie-parser middleware in Express
 */
export function getSessionTokenFromCookies(
  cookies: Record<string, string | undefined>
): string | undefined {
  return cookies[SESSION_COOKIE_NAME];
}

/**
 * Check if Session Cookie Exists
 * 
 * Quick check for session presence without extracting token.
 * 
 * @param {Record<string, string | undefined>} cookies - Parsed cookies object
 * @returns {boolean} True if session cookie present
 * 
 * @example
 * if (hasSessionCookie(req.cookies)) {
 *   console.log("User has active session");
 * }
 */
export function hasSessionCookie(cookies: Record<string, string | undefined>): boolean {
  return SESSION_COOKIE_NAME in cookies && !!cookies[SESSION_COOKIE_NAME];
}

// ============================================================================
// SESSION EXPIRATION HELPERS
// ============================================================================

/**
 * Calculate Session Expiration Date
 * 
 * Returns Date object representing when session expires.
 * Used when creating new session records in database.
 * 
 * @param {number} ttlMs - Time to live in milliseconds (default: 30 days)
 * @returns {Date} Expiration date
 * 
 * @example
 * const expiresAt = getSessionExpirationDate();
 * console.log(expiresAt); // Date 30 days from now
 */
export function getSessionExpirationDate(ttlMs: number = SESSION_TTL_MS): Date {
  return new Date(Date.now() + ttlMs);
}

/**
 * Check if Session is Expired
 * 
 * Compares expiration date against current time.
 * 
 * @param {Date} expiresAt - Session expiration date
 * @returns {boolean} True if session expired
 * 
 * @example
 * const expired = isSessionExpired(user.sessionExpiresAt);
 * if (expired) {
 *   throw new Error("Session expired");
 * }
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}

/**
 * Get Session Remaining Time
 * 
 * Returns milliseconds until session expires.
 * Negative value indicates expired session.
 * 
 * @param {Date} expiresAt - Session expiration date
 * @returns {number} Milliseconds until expiration (negative if expired)
 * 
 * @example
 * const remaining = getSessionRemainingTime(user.sessionExpiresAt);
 * console.log(Math.floor(remaining / 1000 / 60)); // Minutes remaining
 */
export function getSessionRemainingTime(expiresAt: Date): number {
  return expiresAt.getTime() - Date.now();
}

// ============================================================================
// COOKIE SECURITY VALIDATION
// ============================================================================

/**
 * Validate Cookie Security Configuration
 * 
 * Ensures cookie settings meet security requirements.
 * Throws error if production without secure flag.
 * 
 * @param {CookieConfig} config - Cookie configuration to validate
 * @throws {Error} If configuration violates security requirements
 * 
 * @example
 * validateCookieSecurity(getCookieConfig(true)); // OK
 * validateCookieSecurity({ ...config, secure: false }); // Throws in prod
 */
export function validateCookieSecurity(config: CookieConfig): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !config.secure) {
    throw new Error(
      "Cookie 'secure' flag must be true in production. HTTPS required."
    );
  }

  if (!config.httpOnly) {
    throw new Error(
      "Cookie 'httpOnly' flag must be true. Prevents XSS attacks."
    );
  }

  if (config.sameSite === "none" && !config.secure) {
    throw new Error(
      "Cookie 'sameSite=none' requires 'secure=true'. Use 'strict' or 'lax' instead."
    );
  }

  if (config.maxAge < 60000) {
    console.warn(
      `Cookie maxAge is very short (${config.maxAge}ms). Consider increasing for better UX.`
    );
  }
}

// ============================================================================
// MONITORING & DEBUGGING
// ============================================================================

/**
 * Get Cookie Statistics
 * 
 * Returns current cookie configuration for monitoring.
 * 
 * @returns {object} Cookie configuration stats
 * 
 * @example
 * const stats = getCookieStats();
 * console.log(stats);
 */
export function getCookieStats() {
  const isProduction = process.env.NODE_ENV === "production";
  const config = getCookieConfig(isProduction);

  return {
    name: config.name,
    ttlMs: config.maxAge,
    ttlDays: config.maxAge / (24 * 60 * 60 * 1000),
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    path: config.path,
    environment: process.env.NODE_ENV || "development",
  };
}

/**
 * Log Cookie Configuration (Development Only)
 * 
 * Logs cookie settings to console for debugging.
 * Only runs in development mode.
 * 
 * @example
 * logCookieConfig(); // Logs in development only
 */
export function logCookieConfig(): void {
  if (process.env.NODE_ENV !== "production") {
    console.log("🍪 Cookie Configuration:", getCookieStats());
  }
}