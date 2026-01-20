/**
 * Logger Module
 * 
 * Winston-based structured logger with multiple transports.
 * Logs to console and file in production.
 * 
 * @module logging/logger
 */

import winston from "winston";
import path from "path";

// ============================================================================
// LOG LEVELS
// ============================================================================

/**
 * Log Levels (ordered by severity)
 * 
 * error: 0   - Errors and exceptions
 * warn: 1    - Warnings
 * info: 2    - General information
 * http: 3    - HTTP requests (not used)
 * debug: 4   - Debugging information
 */

// ============================================================================
// LOG FORMAT
// ============================================================================

/**
 * Custom Log Format
 * 
 * Includes:
 * - timestamp: ISO 8601 format
 * - level: Log level (error, warn, info, debug)
 * - message: Log message
 * - metadata: Additional structured data
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console Format (Development)
 * 
 * Colorized output for better readability.
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// ============================================================================
// TRANSPORTS
// ============================================================================

const transports: winston.transport[] = [];

// Console Transport (All Environments)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === "production" ? logFormat : consoleFormat,
  })
);

// File Transports (Production Only)
if (process.env.NODE_ENV === "production") {
  // Error Log File
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "error.log"),
      level: "error",
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );

  // Combined Log File
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "combined.log"),
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// ============================================================================
// LOGGER INSTANCE
// ============================================================================

/**
 * Winston Logger Instance
 * 
 * Usage:
 * 
 * import { logger } from './logging/logger';
 * 
 * logger.info('User joined', { userId, email });
 * logger.error('Database error', { error });
 * logger.warn('Rate limit exceeded', { ip });
 * logger.debug('Processing request', { requestId });
 */
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports,
  exitOnError: false,
});

// ============================================================================
// STREAM FOR MORGAN (Optional)
// ============================================================================

/**
 * Stream for HTTP Request Logging
 * 
 * Used with morgan middleware (if needed):
 * app.use(morgan('combined', { stream: logger.stream }));
 */
logger.stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
} as any;