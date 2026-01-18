/**
 * Sentry Module
 * 
 * Initializes Sentry for error tracking and performance monitoring.
 * Only enabled in production with valid DSN.
 * 
 * @module logging/sentry
 */

import * as Sentry from "@sentry/node";
// import { ProfilingIntegration } from "@sentry/profiling-node";
import { config } from "../config.js";
import { logger } from "./logger.js";

// ============================================================================
// SENTRY INITIALIZATION
// ============================================================================

/**
 * Initialize Sentry
 * 
 * Called at application startup (before any handlers).
 * Only initializes if:
 * - SENTRY_DSN is set
 * - NODE_ENV is production
 */
export function initializeSentry(): void {
  if (!config.sentry.enabled) {
    logger.info("Sentry disabled (no DSN or not in production)");
    return;
  }

  try {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,

      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions

      // Profiling
      // profilesSampleRate: 0.1, // 10% of transactions
      // integrations: [
      //   new ProfilingIntegration(),
      // ],

      // Error Filtering
      beforeSend(event, hint) {
        // Don't send errors in test environment
        if (config.isTest) {
          return null;
        }

        // Log error locally
        logger.error("Sentry captured error", {
          error: hint.originalException,
          event: event.event_id,
        });

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        "ECONNREFUSED",
        "ENOTFOUND",
        "Network request failed",
      ],
    });

    logger.info("Sentry initialized", {
      environment: config.sentry.environment,
    });
  } catch (error) {
    logger.error("Failed to initialize Sentry", { error });
  }
}

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

/**
 * Sentry Error Handler Middleware
 * 
 * Must be registered BEFORE other error handlers:
 * app.use(sentryErrorHandler);
 * app.use(globalErrorHandler);
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler();

// ============================================================================
// REQUEST HANDLER MIDDLEWARE (Optional)
// ============================================================================

/**
 * Sentry Request Handler Middleware
 * 
 * Attaches request context to Sentry events.
 * Optional - only use if you want request details in Sentry.
 * 
 * app.use(sentryRequestHandler);
 */
export const sentryRequestHandler = Sentry.Handlers.requestHandler();

// ============================================================================
// MANUAL ERROR CAPTURE
// ============================================================================

/**
 * Capture Exception Manually
 * 
 * Use for errors that don't trigger middleware:
 * 
 * try {
 *   // ...
 * } catch (error) {
 *   captureException(error, { userId });
 * }
 */
export function captureException(
  error: Error,
  context?: Record<string, any>
): void {
  if (!config.sentry.enabled) {
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture Message Manually
 * 
 * Use for non-error events:
 * 
 * captureMessage('User exceeded quota', 'warning', { userId });
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>
): void {
  if (!config.sentry.enabled) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}