/**
 * tRPC Context Factory
 * 
 * Creates context for every tRPC request, extracting session information,
 * IP address, request IDs, and hydrating user data from session tokens.
 * 
 * @module trpc/context
 */

import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { db } from "../db/client";
import { logger } from "../logging/logger";

/**
 * tRPC Context Interface
 * Available to all procedures via ctx parameter
 */
export interface TRPCContext {
  sessionToken?: string;
  user?: any; // WaitlistUser type from Prisma/DB
  ipAddress?: string;
  requestId: string;
  req?: Request;
  res?: Response;
}

/**
 * Extract IP address from request
 * Handles proxy forwarding (x-forwarded-for) and direct connections
 */
function extractIpAddress(req: Request): string | undefined {
  // Prefer x-forwarded-for header if behind proxy
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be comma-separated list, take first IP
    return forwarded.split(",")[0].trim();
  }

  // Fall back to socket remote address
  return req.socket.remoteAddress;
}

/**
 * Extract session token from httpOnly cookie
 */
function extractSessionToken(req: Request): string | undefined {
  // Cookie parser middleware provides req.cookies
  return req.cookies?.sessionToken;
}

/**
 * Generate or extract request ID for distributed tracing
 */
function extractRequestId(req: Request): string {
  // Use existing request ID if provided by upstream proxy/gateway
  const existingId = req.get("x-request-id");
  if (existingId) {
    return existingId;
  }

  // Generate new UUID for this request
  return randomUUID();
}

/**
 * Hydrate user from session token
 * Returns user if session is valid and not expired, undefined otherwise
 */
async function hydrateUser(sessionToken: string | undefined): Promise<any | undefined> {
  if (!sessionToken) {
    return undefined;
  }

  try {
    // Query database for user with matching session token
    const user = await db.waitlistUser.findUnique({
      where: {
        sessionToken: sessionToken,
      },
    });

    // Check if user exists and session is not expired
    if (!user) {
      return undefined;
    }

    // Check session expiration
    const now = new Date();
    if (user.sessionExpiresAt < now) {
      logger.debug("Session expired", {
        userId: user.id,
        expiredAt: user.sessionExpiresAt.toISOString(),
      });
      return undefined;
    }

    // Session is valid
    return user;
  } catch (error) {
    // Log database error but don't throw - let procedures handle authentication
    logger.error("Failed to hydrate user from session", {
      error: error instanceof Error ? error.message : String(error),
      sessionToken: sessionToken.substring(0, 8) + "...", // Redact full token
    });
    return undefined;
  }
}

/**
 * Create tRPC Context
 * Called on every request to provide session and request metadata to procedures
 * 
 * @important Context creation must NEVER throw errors
 * Unauthenticated procedures should proceed with user=undefined
 * Protected procedures check ctx.user and throw UNAUTHORIZED if needed
 */
export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<TRPCContext> {
  // Extract session token from httpOnly cookie
  const sessionToken = extractSessionToken(req);

  // Extract IP address for rate limiting and fraud detection
  const ipAddress = extractIpAddress(req);

  // Generate/extract request ID for correlation
  const requestId = extractRequestId(req);

  // Hydrate user if session token exists
  // This is async but we await it here - context creation waits
  const user = await hydrateUser(sessionToken);

  // Log context creation (debug level - not needed in production)
  logger.debug("Context created", {
    hasSession: !!sessionToken,
    hasUser: !!user,
    userId: user?.id,
    ipAddress,
    requestId,
  });

  // Return context object
  return {
    sessionToken,
    user,
    ipAddress,
    requestId,
    req,
    res,
  };
}

/**
 * Context type helper for tRPC router initialization
 */
export type Context = TRPCContext;