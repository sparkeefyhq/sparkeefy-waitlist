/**
 * Configuration Module
 * 
 * Validates and exports environment variables.
 * Uses Zod for runtime validation with type inference.
 * 
 * @module config
 */

import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

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
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default("4000"),

  // Database Configuration
  DATABASE_URL: z.string().url(),

  // // Frontend Configuration
  // FRONTEND_URL: z.string().url(),

  // CORS Configuration
  CORS_ORIGIN: z.string().default("*"),

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

} as const;

// Log configuration on startup (development only)
if (config.isDevelopment) {
  console.log("✅ Configuration loaded:");
  console.log({
    nodeEnv: config.nodeEnv,
    port: config.port,
    // frontendUrl: config.frontendUrl,
    // databaseUrl: config.databaseUrl.replace(/:\/\/.*@/, "://***:***@"), // Hide credentials
  });
  
}