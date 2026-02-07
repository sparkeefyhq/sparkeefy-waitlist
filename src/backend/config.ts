/**
 * Configuration Module
 * 
 * Validates and exports environment variables.
 * Uses Zod for runtime validation with type inference.
 * 
 * @module config
 */

import { z } from "zod";

// ============================================================================
// ENVIRONMENT SCHEMA
// ============================================================================

/**
 * Environment Variables Schema
 * 
 * Validates all required environment variables at startup.
 * Throws error if any required variable is missing or invalid.
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default("3000"),

  // Database Configuration
  // DATABASE_URL: z.string().url(),

  // // Frontend Configuration
  // FRONTEND_URL: z.string().url(),

  // CORS Configuration
  CORS_ORIGIN: z.string().default("*"),

  // Sentry Configuration (Optional in development)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // SMTP Email Configuration
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default("587"),
  SMTP_USER: z.string().email("Invalid SMTP user email").optional(),
  SMTP_PASS: z.string().min(1, "SMTP password required").optional(),
  SMTP_FROM: z.string().email("Invalid FROM email").optional(),

  // Session Configuration
  SESSION_COOKIE_NAME: z.string().default("sparkeefy_session"),
  SESSION_DURATION_DAYS: z.string().transform(Number).pipe(z.number().min(1).max(365)).default("30"),

  // Rate Limiting (Optional)
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().min(1000)).default("900000"), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().min(1)).default("100"),
  JOIN_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().min(1000)).default("3600000"), // 1 hour
  JOIN_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().min(1)).default("5"),
});

// ============================================================================
// VALIDATE ENVIRONMENT
// ============================================================================

/**
 * Parse and Validate Environment Variables
 * 
 * Throws detailed error if validation fails.
 * Logs all configuration values on success.
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));

      console.error("❌ Environment validation failed:");
      console.error(JSON.stringify(missingVars, null, 2));
      console.error("\nPlease check your .env file and ensure all required variables are set.");

      process.exit(1);
    }
    throw error;
  }
}

const env = validateEnv();

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

/**
 * Application Configuration
 * 
 * Type-safe configuration object.
 * All values validated at startup.
 */
export const config = {
  // Server
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test",

  // Database
  // databaseUrl: env.DATABASE_URL,

  // // Frontend
  // frontendUrl: env.FRONTEND_URL,

  // CORS
  cors: {
    origin: env.CORS_ORIGIN === "*" 
      ? "*" 
      : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  },

  // Sentry
  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
    enabled: !!env.SENTRY_DSN && env.NODE_ENV === "production",
  },

  // Session
  session: {
    cookieName: env.SESSION_COOKIE_NAME,
    durationDays: env.SESSION_DURATION_DAYS,
  },

  // SMTP Email
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER || "",
    pass: env.SMTP_PASS || "",
    from: env.SMTP_FROM || env.SMTP_USER || "sparkeefy@gmail.com", // TODO: change this to your actual email
    enabled: !!(env.SMTP_USER && env.SMTP_PASS), // Only enabled if credentials provided, real gmail/email access required here
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  joinRateLimit: {
    windowMs: env.JOIN_RATE_LIMIT_WINDOW_MS,
    maxRequests: env.JOIN_RATE_LIMIT_MAX_REQUESTS,
  },
} as const;

// Log configuration on startup (development only)
if (config.isDevelopment) {
  console.log("✅ Configuration loaded:");
  console.log({
    nodeEnv: config.nodeEnv,
    port: config.port,
    // frontendUrl: config.frontendUrl,
    // databaseUrl: config.databaseUrl.replace(/:\/\/.*@/, "://***:***@"), // Hide credentials
    sentryEnabled: config.sentry.enabled,
    smtpEnabled: config.smtp.enabled,
  });
  
}