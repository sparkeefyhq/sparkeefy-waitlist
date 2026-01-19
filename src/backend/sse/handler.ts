/**
 * SSE HTTP Handler
 * 
 * Express route handler for Server-Sent Events endpoint.
 * Handles authentication, connection setup, and error handling.
 * 
 * @module sse/handler
 */

import { Request, Response } from "express";
import { sseManager } from "./SSEManager";
import { logger } from "../logging/logger";
import { getSessionTokenFromCookies } from "../utils/cookies";
import { isSessionExpired } from "../utils/cookies";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Authenticated Request
 * Request with attached user information
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    sessionExpiresAt: Date;
  };
  headers: Record<string, string | string[] | undefined>;
  cookies: Record<string, string>;
}

// ============================================================================
// SSE HANDLER
// ============================================================================

/**
 * SSE Referral Updates Handler
 * 
 * Handles GET /sse/referral-updates endpoint.
 * 
 * Authentication:
 * - Requires valid session cookie
 * - Returns 401 if not authenticated
 * 
 * Response Format:
 * - Content-Type: text/event-stream
 * - Cache-Control: no-cache
 * - Connection: keep-alive
 * 
 * Events:
 * - connected: Initial connection success
 * - referral_updated: Referral count changed
 * - tier_upgraded: User reached new tier
 * - milestone_reached: User hit milestone
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * 
 * @example
 * // Express route setup
 * app.get("/sse/referral-updates", sseReferralUpdatesHandler);
 * 
 * // Frontend usage
 * const eventSource = new EventSource("/sse/referral-updates", {
 *   withCredentials: true
 * });
 * eventSource.addEventListener("referral_updated", (event) => {
 *   const data = JSON.parse(event.data);
 *   updateCounterUI(data.newCount);
 * });
 */
export async function sseReferralUpdatesHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const requestId = (req.headers["x-request-id"] as string) || `sse-${Date.now()}`;

  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    // Extract session token from cookies
    const sessionToken = getSessionTokenFromCookies(req.cookies);

    if (!sessionToken) {
      logger.warn("SSE connection attempt without session token", { requestId });
      res.status(401).json({
        error: "Unauthorized",
        message: "Session token required. Please join waitlist first.",
      });
      return;
    }

    // Validate user session (this should be done by your database service)
    // For now, we'll assume the user is attached to req by middleware
    const user = req.user;

    if (!user) {
      logger.warn("SSE connection attempt with invalid session", { requestId, sessionToken });
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired session. Please join waitlist again.",
      });
      return;
    }

    // Check session expiration
    if (isSessionExpired(user.sessionExpiresAt)) {
      logger.warn("SSE connection attempt with expired session", {
        requestId,
        userId: user.id,
        sessionExpiresAt: user.sessionExpiresAt,
      });
      res.status(401).json({
        error: "Unauthorized",
        message: "Session expired. Please join waitlist again.",
      });
      return;
    }

    // ========================================================================
    // SSE CONNECTION SETUP
    // ========================================================================

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Prevent request timeout
    res.setTimeout(0);

    // Flush headers immediately
    res.flushHeaders();

    logger.info("SSE connection setup complete", {
      userId: user.id,
      email: user.email,
      requestId,
    });

    // ========================================================================
    // REGISTER CONNECTION
    // ========================================================================

    const connectionId = sseManager.addConnection(user.id, res, requestId);

    // ========================================================================
    // CONNECTION CLEANUP
    // ========================================================================

    // Handle client disconnect
    (req as any).on("close", () => {
      logger.info("SSE client disconnected", {
        userId: user.id,
        connectionId,
        requestId,
      });
      sseManager.removeConnection(user.id, connectionId);
    });

    // Handle connection error
    (req as any).on("error", (error: any) => {
      logger.error("SSE connection error", {
        error,
        userId: user.id,
        connectionId,
        requestId,
      });
      sseManager.removeConnection(user.id, connectionId);
    });

    // Handle response finish
    res.on("finish", () => {
      logger.info("SSE response finished", {
        userId: user.id,
        connectionId,
        requestId,
      });
      sseManager.removeConnection(user.id, connectionId);
    });

    // Connection established and will remain open until client disconnects
  } catch (error) {
    logger.error("SSE handler error", {
      error,
      requestId,
      userId: req.user?.id,
    });

    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to establish SSE connection",
      });
    } else {
      // If headers already sent, close connection
      res.end();
    }
  }
}

// ============================================================================
// MIDDLEWARE FOR USER ATTACHMENT
// ============================================================================

/**
 * Attach User Middleware
 * 
 * Middleware to attach user to request object.
 * This should be called before sseReferralUpdatesHandler.
 * 
 * @param {Function} findUserBySessionToken - Function to find user by session token
 * @returns {Function} Express middleware
 * 
 * @example
 * import { attachUserMiddleware } from "./sse/handler";
 * 
 * app.get(
 *   "/sse/referral-updates",
 *   attachUserMiddleware(db.findUserBySessionToken),
 *   sseReferralUpdatesHandler
 * );
 */
export function attachUserMiddleware(
  findUserBySessionToken: (token: string) => Promise<{
    id: string;
    email: string;
    sessionExpiresAt: Date;
  } | null>
) {
  return async (req: AuthenticatedRequest, res: Response, next: Function) => {
    try {
      const sessionToken = getSessionTokenFromCookies(req.cookies);

      if (sessionToken) {
        const user = await findUserBySessionToken(sessionToken);
        if (user) {
          req.user = user;
        }
      }

      next();
    } catch (error) {
      logger.error("Error attaching user to request", { error });
      next(error);
    }
  };
}

// ============================================================================
// HEALTH CHECK HANDLER
// ============================================================================

/**
 * SSE Health Check Handler
 * 
 * Returns SSE connection statistics.
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * 
 * @example
 * app.get("/sse/health", sseHealthCheckHandler);
 */
export function sseHealthCheckHandler(req: Request, res: Response): void {
  const stats = sseManager.getConnectionStats();

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    stats,
  });
}

// ============================================================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================================================

/**
 * Graceful Shutdown Handler
 * 
 * Closes all SSE connections during server shutdown.
 * 
 * @example
 * process.on("SIGTERM", () => {
 *   handleGracefulShutdown();
 *   process.exit(0);
 * });
 */
export function handleGracefulShutdown(): void {
  logger.info("Initiating graceful shutdown for SSE connections");
  sseManager.closeAllConnections();
}