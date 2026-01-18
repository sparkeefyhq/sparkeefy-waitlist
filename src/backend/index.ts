/**
 * Sparkeefy Waitlist Backend
 * 
 * Main application entry point.
 * Configures Express server, tRPC, SSE, and all middleware.
 * 
 * @module index
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import * as trpcExpress from "@trpc/server/adapters/express";
import { config } from "./config";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";
import { connectDatabase, disconnectDatabase } from "./db/client";
import { logger } from "./logging/logger";
import { initializeSentry, sentryErrorHandler } from "./logging/sentry";
import { sseReferralUpdatesHandler } from "./sse/handler";

// ============================================================================
// SENTRY INITIALIZATION
// ============================================================================

initializeSentry();

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * Helmet - Security Headers
 * 
 * Sets various HTTP headers for security:
 * - X-DNS-Prefetch-Control
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - X-XSS-Protection
 */
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for SSE
    crossOriginEmbedderPolicy: false, // Allow SSE connections
  })
);

/**
 * CORS Configuration
 * 
 * Allows cross-origin requests from frontend.
 * Credentials enabled for cookie-based authentication.
 */
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * Compression
 * 
 * Compresses response bodies for better performance.
 */
app.use(compression());

// ============================================================================
// BODY PARSING MIDDLEWARE
// ============================================================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Cookie Parser
 * 
 * Parses cookies from Cookie header.
 * Required for session token extraction.
 */
app.use(cookieParser());

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================

/**
 * Request Logger
 * 
 * Logs all incoming requests with:
 * - Method, URL, IP
 * - User agent
 * - Request ID (for tracing)
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = Math.random().toString(36).substring(7);

  logger.info("Incoming request", {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Attach request ID to response headers
  res.setHeader("X-Request-Id", requestId);

  // Log response
  const originalSend = res.send;
  res.send = function (data: any) {
    logger.info("Outgoing response", {
      requestId,
      statusCode: res.statusCode,
      contentType: res.get("content-type"),
    });
    return originalSend.call(this, data);
  };

  next();
});

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Global Rate Limiter
 * 
 * Limits: 100 requests per 15 minutes per IP
 * Applies to all endpoints except health check
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      url: req.url,
    });
    res.status(429).json({
      error: "Too many requests",
      message: "Please try again later",
    });
  },
});

/**
 * Waitlist Join Rate Limiter
 * 
 * Limits: 5 requests per hour per IP
 * Prevents spam signups
 */
const joinLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: "Too many signup attempts, please try again later",
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    logger.warn("Join rate limit exceeded", {
      ip: req.ip,
    });
    res.status(429).json({
      error: "Too many signup attempts",
      message: "Please try again in an hour",
    });
  },
});

// Apply global rate limiter
app.use(globalLimiter);

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * Health Check
 * 
 * GET /health
 * 
 * Returns server and database health status.
 * Used for load balancer health checks.
 */
app.get("/health", async (req: Request, res: Response) => {
  try {
    const { db } = await import("./db/client");
    const dbHealthy = await db.healthCheck();

    const health = {
      status: dbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealthy ? "connected" : "disconnected",
      memory: process.memoryUsage(),
    };

    const statusCode = dbHealthy ? 200 : 503;

    logger.info("Health check", health);

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Health check failed", { error });

    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
});

// ============================================================================
// tRPC ROUTER
// ============================================================================

/**
 * tRPC HTTP Handler
 * 
 * POST /trpc/*
 * 
 * Handles all tRPC procedure calls:
 * - waitlist.join
 * - waitlist.getMyStats
 * - waitlist.validateReferralCode
 */
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ path, error, type }) => {
      logger.error("tRPC error", {
        path: path || "unknown",
        type,
        code: error.code,
        message: error.message,
        cause: error.cause,
      });
    },
  })
);

// ============================================================================
// SSE ENDPOINT
// ============================================================================

/**
 * Server-Sent Events Endpoint
 * 
 * GET /sse/referral-updates
 * 
 * Establishes SSE connection for real-time referral count updates.
 * Requires authentication via session cookie.
 */
app.get("/sse/referral-updates", sseReferralUpdatesHandler);

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req: Request, res: Response) => {
  logger.warn("Route not found", {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist",
    path: req.url,
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

/**
 * Sentry Error Handler
 * 
 * Captures all unhandled errors and sends to Sentry.
 * Must be registered before other error handlers.
 */
app.use(sentryErrorHandler);

/**
 * Global Error Handler
 * 
 * Catches all errors thrown in route handlers.
 * Logs error and returns appropriate response.
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    error: "Internal Server Error",
    message: config.nodeEnv === "production" 
      ? "An unexpected error occurred" 
      : err.message,
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Start Server
 * 
 * 1. Connect to database
 * 2. Start HTTP server
 * 3. Log startup information
 */
async function startServer() {
  try {
    // Connect to database
    logger.info("Connecting to database...");
    await connectDatabase();
    logger.info("Database connected successfully");

    // Start server
    const server = app.listen(config.port, () => {
      logger.info("Server started", {
        port: config.port,
        nodeEnv: config.nodeEnv,
        frontendUrl: config.frontendUrl,
      });

      logger.info("Available endpoints:", {
        health: `http://localhost:${config.port}/health`,
        trpc: `http://localhost:${config.port}/trpc`,
        sse: `http://localhost:${config.port}/sse/referral-updates`,
      });
    });

    // ========================================================================
    // GRACEFUL SHUTDOWN
    // ========================================================================

    /**
     * Graceful Shutdown Handler
     * 
     * Handles SIGTERM and SIGINT signals:
     * 1. Stop accepting new requests
     * 2. Close existing connections
     * 3. Disconnect from database
     * 4. Exit process
     */
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          // Disconnect from database
          await disconnectDatabase();
          logger.info("Database disconnected");

          logger.info("Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown", { error });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // ========================================================================
    // UNHANDLED REJECTIONS
    // ========================================================================

    /**
     * Unhandled Promise Rejection Handler
     * 
     * Logs unhandled promise rejections.
     * In production, triggers graceful shutdown.
     */
    process.on("unhandledRejection", (reason: any) => {
      logger.error("Unhandled promise rejection", {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });

      if (config.nodeEnv === "production") {
        gracefulShutdown("unhandledRejection");
      }
    });

    /**
     * Uncaught Exception Handler
     * 
     * Logs uncaught exceptions.
     * Triggers graceful shutdown.
     */
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught exception", {
        error: error.message,
        stack: error.stack,
      });

      gracefulShutdown("uncaughtException");
    });

  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

// ============================================================================
// START APPLICATION
// ============================================================================

startServer();

// Export app for testing
export { app };
