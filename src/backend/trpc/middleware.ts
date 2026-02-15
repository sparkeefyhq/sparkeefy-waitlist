/**
 * tRPC Middleware
 *
 * Reusable middleware for authentication and request validation.
 * Applied to specific procedures via .use() method.
 *
 * @module trpc/middleware
 */

import { TRPCError } from "@trpc/server";
import { createMiddleware } from './base.js';
import { logger } from "../logging/logger";

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
export const requireAuth = createMiddleware(async ({ ctx, next }) => {
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
