/**
 * Database Client
 * 
 * Prisma-based database client singleton with connection pooling.
 * Implements interfaces required by WaitlistService and ReferralService.
 * 
 * @module db/client
 */

import { PrismaClient } from "@prisma/client";
import type {
  WaitlistUser,
  Referral,
  CreateUserInput,
} from "../types";
import { logger } from "../logging/logger";
import * as Sentry from "@sentry/node";

// ============================================================================
// PRISMA CLIENT CONFIGURATION
// ============================================================================

/**
 * Prisma Client Singleton
 * 
 * Configured with:
 * - Connection pooling (default: 10 connections)
 * - Query timeout: 10 seconds
 * - Query logging in development
 * - Error logging in all environments
 */
const prisma = new PrismaClient({
  log: [
    { level: "error", emit: "event" },
    { level: "warn", emit: "event" },
    process.env.NODE_ENV === "development"
      ? { level: "query", emit: "event" }
      : { level: "query", emit: "event" },
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// ============================================================================
// PRISMA EVENT LOGGING
// ============================================================================

// Log errors
prisma.$on("error" as never, (e: any) => {
  logger.error("Prisma error", { error: e });
  Sentry.captureException(e);
});

// Log warnings
prisma.$on("warn" as never, (e: any) => {
  logger.warn("Prisma warning", { warning: e });
});

// Log queries (development only)
if (process.env.NODE_ENV === "development") {
  prisma.$on("query" as never, (e: any) => {
    logger.debug("Prisma query", {
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  });
}

// ============================================================================
// CONNECTION LIFECYCLE
// ============================================================================

/**
 * Connect to Database
 * 
 * Establishes connection pool to database.
 * Called on application startup.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Failed to connect to database", { error });
    Sentry.captureException(error);
    throw error;
  }
}

/**
 * Disconnect from Database
 * 
 * Closes all database connections.
 * Called on application shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Database disconnected successfully");
  } catch (error) {
    logger.error("Failed to disconnect from database", { error });
    Sentry.captureException(error);
  }
}

// ============================================================================
// DATABASE CLIENT CLASS
// ============================================================================

/**
 * Database Client
 * 
 * Wrapper around Prisma Client implementing service interfaces.
 * Provides type-safe database operations for all services.
 */
export class DatabaseClient {
  private prisma: PrismaClient;
  waitlistUser: any;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  // ==========================================================================
  // WAITLIST USER OPERATIONS
  // ==========================================================================

  /**
   * Find User by Email
   * 
   * @param {string} email - User email (normalized to lowercase)
   * @returns {Promise<WaitlistUser | null>} User or null if not found
   */
  async findUserByEmail(email: string): Promise<WaitlistUser | null> {
    return await this.prisma.waitlistUser.findUnique({
      where: { email: email.toLowerCase() },
    }) as WaitlistUser | null;
  }

  /**
   * Find User by Referral Code
   * 
   * @param {string} code - Referral code (8 characters)
   * @returns {Promise<WaitlistUser | null>} User or null if not found
   */
  async findUserByReferralCode(code: string): Promise<WaitlistUser | null> {
    return await this.prisma.waitlistUser.findUnique({
      where: { referralCode: code.toUpperCase() },
    }) as WaitlistUser | null;
  }

    /**
   * Find User by Magic Link Token
   * 
   * @param {string} token - Magic link token
   * @returns {Promise<WaitlistUser | null>} User or null if not found
   */
  async findUserByMagicLinkToken(token: string): Promise<WaitlistUser | null> {
    return await this.prisma.waitlistUser.findUnique({
      where: { magicLinkToken: token },
    }) as WaitlistUser | null;
  }

  /**
   * Find User by Session Token
   * 
   * @param {string} token - Session token (64 hex characters)
   * @returns {Promise<WaitlistUser | null>} User or null if not found
   */
  async findUserBySessionToken(token: string): Promise<WaitlistUser | null> {
    return await this.prisma.waitlistUser.findUnique({
      where: { sessionToken: token },
    }) as WaitlistUser | null;
  }

  /**
   * Find User by ID
   * 
   * @param {string} id - User ID (UUID)
   * @returns {Promise<WaitlistUser | null>} User or null if not found
   */
  async findUserById(id: string): Promise<WaitlistUser | null> {
    return await this.prisma.waitlistUser.findUnique({
      where: { id },
    }) as WaitlistUser | null;
  }

  /**
   * Create User
   * 
   * @param {CreateUserInput} data - User data
   * @returns {Promise<WaitlistUser>} Created user
   */
  async createUser(data: CreateUserInput): Promise<WaitlistUser> {
    return await this.prisma.waitlistUser.create({
      data: {
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        marketingOptIn: data.marketingOptIn,
        additionalRemarks: data.additionalRemarks,
        referralCode: data.referralCode,
        magicLinkToken: data.magicLinkToken,
        sessionToken: data.sessionToken,
        sessionExpiresAt: data.sessionExpiresAt,
      },
    }) as WaitlistUser;
  }

  /**
   * Update User
   * 
   * @param {string} id - User ID
   * @param {Partial<WaitlistUser>} data - Fields to update
   * @returns {Promise<WaitlistUser>} Updated user
   */
  async updateUser(
    id: string,
    data: Partial<WaitlistUser>
  ): Promise<WaitlistUser> {
    return await this.prisma.waitlistUser.update({
      where: { id },
      data,
    }) as WaitlistUser;
  }

  // ==========================================================================
  // REFERRAL OPERATIONS
  // ==========================================================================

  /**
   * Create Referral
   * 
   * @param {object} data - Referral data
   * @param {string} data.referrerId - Referrer user ID
   * @param {string} data.refereeId - Referee user ID
   * @returns {Promise<Referral>} Created referral
   */
  async createReferral(data: {
    referrerId: string;
    refereeId: string;
  }): Promise<Referral> {
    return await this.prisma.referral.create({
      data: {
        referrerId: data.referrerId,
        refereeId: data.refereeId,
      },
    }) as Referral;
  }

  /**
   * Find Referral by Users
   * 
   * Checks if referral relationship exists between two users.
   * 
   * @param {string} referrerId - Referrer user ID
   * @param {string} refereeId - Referee user ID
   * @returns {Promise<Referral | null>} Referral or null if not found
   */
  async findReferralByUsers(
    referrerId: string,
    refereeId: string
  ): Promise<Referral | null> {
    return await this.prisma.referral.findFirst({
      where: {
        referrerId,
        refereeId,
      },
    }) as Referral | null;
  }

  /**
   * Count User Referrals
   * 
   * Returns total number of successful referrals for a user.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<number>} Referral count
   */
  async countUserReferrals(userId: string): Promise<number> {
    return await this.prisma.referral.count({
      where: { referrerId: userId },
    });
  }

  /**
   * Get User Referrals
   * 
   * Returns all referral records for a user.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Referral[]>} Array of referrals
   */
  async getUserReferrals(userId: string): Promise<Referral[]> {
    return await this.prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "asc" },
    }) as Referral[];
  }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  /**
   * Health Check
   * 
   * Tests database connectivity.
   * 
   * @returns {Promise<boolean>} True if database is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error("Database health check failed", { error });
      return false;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton Database Client Instance
 * 
 * Import this in services and procedures.
 * 
 * @example
 * import { db } from './db/client';
 * const user = await db.findUserByEmail('user@example.com');
 */
export const db = new DatabaseClient(prisma);

// Export Prisma client for advanced usage
export { prisma };