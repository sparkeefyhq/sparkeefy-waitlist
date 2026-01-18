/**
 * tRPC Middleware
 * 
 * Reusable middleware for authentication, rate limiting, and request validation.
 * Applied to specific procedures via .use() method.
 * 
 * @module trpc/middleware
 */

import { TRPCError } from "@trpc/server";
import { t } from "./router";
import { logger } from "../logging/logger";

// ============================================================================
// RATE LIMITING - IN-MEMORY IMPLEMENTATION
// ============================================================================

/**
 * Rate Limit Store
 * Maps IP address to request tracking data
 * In-memory for MVP - suitable for single-server deployment
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate Limit Configuration
 * 5 requests per IP per hour for waitlist.join
 */
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  maxRequests: 5,
  enabled: process.env.NODE_ENV === "production", // Disabled in development
};

/**
 * Cleanup old rate limit entries periodically
 * Prevents memory leak from storing stale IP records
 */
setInterval(() => {
  const now = Date.now();
  const staleThreshold = RATE_LIMIT_CONFIG.windowMs;

  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > staleThreshold) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

/**
 * Check Rate Limit for IP Address
 * Implements sliding window counter algorithm
 */
function checkRateLimit(ipAddress: string | undefined): void {
  // Skip rate limiting if disabled or no IP address
  if (!RATE_LIMIT_CONFIG.enabled || !ipAddress) {
    return;
  }

  const now = Date.now();
  const entry = rateLimitStore.get(ipAddress);

  if (!entry) {
    // First request from this IP
    rateLimitStore.set(ipAddress, {
      count: 1,
      windowStart: now,
    });
    return;
  }

  // Check if window has expired
  if (now - entry.windowStart >= RATE_LIMIT_CONFIG.windowMs) {
    // Reset window
    entry.count = 1;
    entry.windowStart = now;
    rateLimitStore.set(ipAddress, entry);
    return;
  }

  // Increment count within current window
  entry.count += 1;
  rateLimitStore.set(ipAddress, entry);

  // Check if limit exceeded
  if (entry.count > RATE_LIMIT_CONFIG.maxRequests) {
    const retryAfter = Math.ceil(
      (entry.windowStart + RATE_LIMIT_CONFIG.windowMs - now) / 1000
    );

    logger.warn("Rate limit exceeded", {
      ipAddress,
      count: entry.count,
      maxRequests: RATE_LIMIT_CONFIG.maxRequests,
      retryAfterSeconds: retryAfter,
    });

    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
    });
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require Authentication Middleware
 * 
 * Validates that user is authenticated via session cookie.
 * Throws UNAUTHORIZED error if ctx.user is undefined.
 * 
 * @usage Apply to protected procedures that require authentication
 * @example
 * ```typescript
 * const getMyStats = t.procedure
 *   .use(requireAuth)
 *   .query(async ({ ctx }) => {
 *     // ctx.user is guaranteed to exist here
 *     const user = ctx.user!;
 *   });
 * ```
 */
export const requireAuth = t.middleware(async ({ ctx, next }) => {
  // Check if user exists in context (hydrated by context factory)
  if (!ctx.user) {
    logger.warn("Unauthorized access attempt", {
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
      hasSessionToken: !!ctx.sessionToken,
    });

    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required. Please join the waitlist first.",
    });
  }

  // User is authenticated - proceed to procedure
  logger.debug("Authentication successful", {
    userId: ctx.user.id,
    email: ctx.user.email.substring(0, 5) + "***",
    requestId: ctx.requestId,
  });

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // TypeScript narrowing - user is now non-nullable
    },
  });
});

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

/**
 * Rate Limiting Middleware
 * 
 * Limits requests per IP address to prevent spam and abuse.
 * Configured for 5 requests per hour per IP.
 * 
 * @usage Apply to write operations (mutations) that modify state
 * @example
 * ```typescript
 * const join = t.procedure
 *   .use(rateLimit)
 *   .input(schema)
 *   .mutation(async ({ input, ctx }) => {
 *     // Rate limit checked before reaching here
 *   });
 * ```
 * 
 * @note Disabled in development mode for easier testing
 * @note Uses in-memory store - suitable for single-server MVP
 */
export const rateLimit = t.middleware(async ({ ctx, next }) => {
  const ipAddress = ctx.ipAddress;

  // Check rate limit for this IP
  checkRateLimit(ipAddress);

  // Log successful rate limit check
  if (RATE_LIMIT_CONFIG.enabled) {
    const entry = rateLimitStore.get(ipAddress || "");
    logger.debug("Rate limit check passed", {
      ipAddress,
      requestCount: entry?.count || 0,
      maxRequests: RATE_LIMIT_CONFIG.maxRequests,
      requestId: ctx.requestId,
    });
  }

  // Proceed to next middleware or procedure
  return next({ ctx });
});

// ============================================================================
// COMBINED MIDDLEWARE HELPERS
// ============================================================================

/**
 * Protected Procedure with Authentication
 * 
 * Convenience helper that combines authentication middleware.
 * Use for procedures that require user to be authenticated.
 * 
 * @example
 * ```typescript
 * const getMyStats = protectedProcedure
 *   .input(schema)
 *   .query(async ({ ctx }) => {
 *     // ctx.user is guaranteed to exist
 *   });
 * ```
 */
export const protectedProcedure = t.procedure.use(requireAuth);

/**
 * Rate Limited Procedure
 * 
 * Convenience helper that applies rate limiting.
 * Use for public write operations that need spam protection.
 * 
 * @example
 * ```typescript
 * const join = rateLimitedProcedure
 *   .input(schema)
 *   .mutation(async ({ input, ctx }) => {
 *     // Rate limit checked before reaching here
 *   });
 * ```
 */
export const rateLimitedProcedure = t.procedure.use(rateLimit);

// ============================================================================
// RATE LIMIT STATS (OPTIONAL - FOR MONITORING)
// ============================================================================

/**
 * Get Rate Limit Statistics
 * Useful for monitoring and debugging
 * 
 * @returns Object containing rate limit store statistics
 */
export function getRateLimitStats() {
  return {
    totalIPs: rateLimitStore.size,
    entries: Array.from(rateLimitStore.entries()).map(([ip, entry]) => ({
      ip: ip.substring(0, 8) + "...", // Redact IP for privacy
      count: entry.count,
      windowStart: new Date(entry.windowStart).toISOString(),
      windowExpires: new Date(
        entry.windowStart + RATE_LIMIT_CONFIG.windowMs
      ).toISOString(),
    })),
  };
}

/**
 * Clear Rate Limit Store
 * Useful for testing or manual reset
 * 
 * @warning Should only be called in development or by admin
 */
export function clearRateLimitStore() {
  const previousSize = rateLimitStore.size;
  rateLimitStore.clear();

  logger.info("Rate limit store cleared", {
    previousEntries: previousSize,
  });
}