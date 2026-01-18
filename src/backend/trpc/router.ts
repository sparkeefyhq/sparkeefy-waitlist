/**
 * tRPC Router Definition
 * 
 * Main tRPC router that combines all procedure routers and exports
 * type-safe API contract for frontend consumption.
 * 
 * @module trpc/router
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { Context } from "./context";
import { waitlistRouter } from "./procedures/waitlist";
import { logger } from "../logging/logger";

/**
 * Initialize tRPC with context type
 * SuperJSON enables passing Date objects and other non-JSON types
 */
export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Custom error formatting for consistent client responses
    return {
      ...shape,
      data: {
        ...shape.data,
        // Add custom fields if needed
        requestId: error.cause instanceof Error ? undefined : error.cause,
      },
    };
  },
});

/**
 * Export base procedure builder
 * Used by individual procedure files to create endpoints
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Create reusable logging middleware
 * Logs all procedure calls with execution time and outcome
 */
const loggingMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const requestId = ctx.requestId;

  logger.info("tRPC request started", {
    procedure: path,
    type,
    requestId,
    userId: ctx.user?.id,
    hasSession: !!ctx.sessionToken,
  });

  try {
    const result = await next({ ctx });

    const duration = Date.now() - start;
    logger.info("tRPC request completed", {
      procedure: path,
      type,
      requestId,
      duration: `${duration}ms`,
      success: true,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    // Log error with context
    logger.error("tRPC request failed", {
      procedure: path,
      type,
      requestId,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof TRPCError ? error.code : "UNKNOWN",
    });

    // Re-throw to client
    throw error;
  }
});

/**
 * Create procedure with logging middleware
 * All procedures should use this instead of t.procedure directly
 */
export const procedure = t.procedure.use(loggingMiddleware);

/**
 * Main Application Router
 * Combines all feature routers into unified API
 */
export const appRouter = router({
  // Waitlist and referral procedures
  waitlist: waitlistRouter,

  // Health check endpoint (public, no auth required)
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "sparkeefy-waitlist",
      version: "1.0.0",
    };
  }),
});

/**
 * Export router type for frontend client generation
 * Frontend imports this type to get full type safety
 * 
 * @example
 * ```typescript
 * // Frontend code
 * import type { AppRouter } from '../backend/trpc/router';
 * import { createTRPCProxyClient } from '@trpc/client';
 * 
 * const client = createTRPCProxyClient<AppRouter>({
 *   links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],
 * });
 * 
 * // Fully typed API calls
 * const result = await client.waitlist.join.mutate({
 *   email: 'user@example.com'
 * });
 * ```
 */
export type AppRouter = typeof appRouter;