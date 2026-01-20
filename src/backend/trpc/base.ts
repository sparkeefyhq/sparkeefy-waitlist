/**
 * tRPC Base Configuration
 * 
 * Defines the base tRPC instance and exports factories.
 * This file should NOT import any procedures or middleware.
 */

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { Context } from "./context.js";

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        requestId: error.cause instanceof Error ? undefined : error.cause,
      },
    };
  },
});

// ============================================================================
// EXPORT FACTORIES
// ============================================================================

export const router = t.router;
export const publicProcedure = t.procedure;
export const createMiddleware = t.middleware;
