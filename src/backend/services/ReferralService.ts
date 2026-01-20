/**
 * Referral Service
 * 
 * Core business logic for referral management.
 * Handles referral relationship creation, duplicate prevention,
 * referral counting, and real-time SSE event broadcasting.
 * 
 * @module services/ReferralService
 */

import { TRPCError } from "@trpc/server";
import type { Referral } from "../types";
import { db } from "../db/client";
import { logger } from "../logging/logger";
import * as Sentry from "@sentry/node";
import { sseManager } from "../sse/SSEManager";
import { 
  validateReferralRelationship, 
  referralExists 
} from "../utils/referrals";
import { isTierUpgraded } from "../utils/tiers";
import { PrismaClient } from "@prisma/client";


// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Database Client Interface for Referrals
 * Abstract interface for referral-specific database operations
 */
export interface ReferralDatabaseClient {
  createReferral(data: {
    referrerId: string;
    refereeId: string;
  }): Promise<Referral>;
  findReferralByUsers(
    referrerId: string,
    refereeId: string
  ): Promise<Referral | null>;
  countUserReferrals(userId: string): Promise<number>;
  getUserReferrals(userId: string): Promise<Referral[]>;
}

// ============================================================================
// REFERRAL SERVICE CLASS
// ============================================================================

export class ReferralService {
  private db: ReferralDatabaseClient;

  constructor(db: ReferralDatabaseClient) {
    this.db = db;
    logger.info("ReferralService initialized");
  }

  // ==========================================================================
  // CORE REFERRAL OPERATIONS
  // ==========================================================================

  /**
   * Create Referral
   * 
   * Creates a referral relationship between referrer and referee.
   * Validates relationship, checks for duplicates, and broadcasts SSE update.
   * 
   * @param {string} referrerId - User who referred (referral code owner)
   * @param {string} refereeId - User who was referred (new user)
   * @returns {Promise<Referral>} Created referral record
   * 
   * @throws {TRPCError} BAD_REQUEST - Invalid relationship (self-referral)
   * @throws {TRPCError} CONFLICT - Referral already exists
   * @throws {TRPCError} INTERNAL_SERVER_ERROR - Database error
   * 
   * @example
   * const referral = await referralService.createReferral(
   *   referrerUserId,
   *   newUserId
   * );
   */
  async createReferral(
    referrerId: string,
    refereeId: string
  ): Promise<Referral> {
    const correlationId = `referral-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.info("Creating referral relationship", {
        referrerId,
        refereeId,
        correlationId,
      });

      // ======================================================================
      // STEP 1: VALIDATE REFERRAL RELATIONSHIP
      // ======================================================================

      const validation = validateReferralRelationship(referrerId, refereeId);
      if (!validation.valid) {
        logger.warn("Invalid referral relationship", {
          referrerId,
          refereeId,
          error: validation.error,
          correlationId,
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error || "Invalid referral relationship",
        });
      }

      // ======================================================================
      // STEP 2: CHECK FOR DUPLICATE REFERRAL
      // ======================================================================

      const existingReferral = await this.findReferralByUsers(
        referrerId,
        refereeId
      );

      if (existingReferral) {
        logger.warn("Duplicate referral attempt", {
          referrerId,
          refereeId,
          existingReferralId: existingReferral.id,
          correlationId,
        });
        throw new TRPCError({
          code: "CONFLICT",
          message: "This referral relationship already exists",
        });
      }

      // ======================================================================
      // STEP 3: GET PREVIOUS REFERRAL COUNT (for tier comparison)
      // ======================================================================

      const previousCount = await this.countUserReferrals(referrerId);

      logger.info("Previous referral count retrieved", {
        referrerId,
        previousCount,
        correlationId,
      });

      // ======================================================================
      // STEP 4: CREATE REFERRAL RECORD
      // ======================================================================

      const referral = await this.db.createReferral({
        referrerId,
        refereeId,
      });

      logger.info("Referral created successfully", {
        referralId: referral.id,
        referrerId,
        refereeId,
        correlationId,
      });

      // ======================================================================
      // STEP 5: CALCULATE NEW REFERRAL COUNT
      // ======================================================================

      const newCount = previousCount + 1;

      logger.info("Referral count updated", {
        referrerId,
        previousCount,
        newCount,
        correlationId,
      });

      // ======================================================================
      // STEP 6: BROADCAST SSE UPDATE TO REFERRER
      // ======================================================================

      try {
        sseManager.sendReferralUpdated(referrerId, previousCount, newCount);

        logger.info("SSE event broadcasted", {
          referrerId,
          previousCount,
          newCount,
          correlationId,
        });
      } catch (sseError) {
        // Don't fail the referral creation if SSE fails
        // SSE is non-critical - user can refresh to see updated count
        logger.warn("Failed to broadcast SSE event", {
          error: sseError,
          referrerId,
          correlationId,
        });
      }

      // ======================================================================
      // STEP 7: TRACK SUCCESS IN SENTRY
      // ======================================================================

      Sentry.addBreadcrumb({
        category: "referral",
        message: "Referral created",
        level: "info",
        data: {
          referralId: referral.id,
          referrerId,
          refereeId,
          newCount,
          tierUpgraded: isTierUpgraded(previousCount, newCount),
        },
      });

      return referral;
    } catch (error) {
      // Log error with context
      logger.error("Error creating referral", {
        error,
        referrerId,
        refereeId,
        correlationId,
      });

      // Track error in Sentry
      Sentry.captureException(error, {
        tags: {
          operation: "create_referral",
        },
        contexts: {
          referral: {
            referrerId,
            refereeId,
          },
        },
      });

      // Re-throw if already TRPCError
      if (error instanceof TRPCError) {
        throw error;
      }

      // Wrap unknown errors
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create referral relationship",
        cause: error,
      });
    }
  }

  // ==========================================================================
  // REFERRAL COUNTING & QUERIES
  // ==========================================================================

  /**
   * Count User Referrals
   * 
   * Returns the total number of successful referrals for a user.
   * 
   * @param {string} userId - User ID to count referrals for
   * @returns {Promise<number>} Total referral count
   * 
   * @example
   * const count = await referralService.countUserReferrals(userId);
   * console.log(count); // 15
   */
  async countUserReferrals(userId: string): Promise<number> {
    try {
      return await this.db.countUserReferrals(userId);
    } catch (error) {
      logger.error("Error counting user referrals", { error, userId });
      Sentry.captureException(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to count referrals",
        cause: error,
      });
    }
  }

  /**
 * Check if referral already exists
 * Prevents duplicate referrals
 */
async referralExists(referrerId: string, refereeId: string): Promise<boolean> {
  try {
    const existingReferral = await this.findReferralByUsers(
      referrerId,
      refereeId
    );

    return !!existingReferral;
  } catch (error) {
    logger.error("Error checking referral existence", { 
      error, 
      referrerId, 
      refereeId 
    });
    throw error;
  }
}

  /**
   * Get User Referrals
   * 
   * Returns all referral records for a user.
   * 
   * @param {string} userId - User ID to get referrals for
   * @returns {Promise<Referral[]>} Array of referral records
   * 
   * @example
   * const referrals = await referralService.getUserReferrals(userId);
   * console.log(referrals.length); // 15
   */
  async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      return await this.db.getUserReferrals(userId);
    } catch (error) {
      logger.error("Error fetching user referrals", { error, userId });
      Sentry.captureException(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch referrals",
        cause: error,
      });
    }
  }

  /**
   * Find Referral by Users
   * 
   * Checks if a referral relationship exists between two users.
   * 
   * @param {string} referrerId - Referrer user ID
   * @param {string} refereeId - Referee user ID
   * @returns {Promise<Referral | null>} Referral record or null
   * 
   * @example
   * const referral = await referralService.findReferralByUsers(
   *   referrerId,
   *   refereeId
   * );
   */
  async findReferralByUsers(
    referrerId: string,
    refereeId: string
  ): Promise<Referral | null> {
    try {
      return await this.db.findReferralByUsers(referrerId, refereeId);
    } catch (error) {
      logger.error("Error finding referral by users", {
        error,
        referrerId,
        refereeId,
      });
      Sentry.captureException(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check referral existence",
        cause: error,
      });
    }
  }

  // ==========================================================================
  // VALIDATION METHODS
  // ==========================================================================

  /**
   * Check if Referral Exists
   * 
   * Public method to check if referral relationship exists.
   * 
   * @param {string} referrerId - Referrer user ID
   * @param {string} refereeId - Referee user ID
   * @returns {Promise<boolean>} True if referral exists
   * 
   * @example
   * const exists = await referralService.referralExists(
   *   referrerId,
   *   refereeId
   * );
   */
  async referralAlreadyExists(
    referrerId: string,
    refereeId: string
  ): Promise<boolean> {
    try {
      const referral = await this.findReferralByUsers(referrerId, refereeId);
      return !!referral;
    } catch (error) {
      logger.error("Error checking referral existence", {
        error,
        referrerId,
        refereeId,
      });
      return false; // Assume doesn't exist on error to allow creation attempt
    }
  }

  /**
   * Validate Referral Relationship
   * 
   * Public method to validate referral relationship before creation.
   * 
   * @param {string} referrerId - Referrer user ID
   * @param {string} refereeId - Referee user ID
   * @returns {{ valid: boolean; error?: string }}
   * 
   * @example
   * const validation = referralService.validateRelationship(
   *   referrerId,
   *   refereeId
   * );
   * if (!validation.valid) {
   *   console.error(validation.error);
   * }
   */
  validateRelationship(
    referrerId: string,
    refereeId: string
  ): { valid: boolean; error?: string } {
    return validateReferralRelationship(referrerId, refereeId);
  }

  // ==========================================================================
  // STATISTICS & ANALYTICS
  // ==========================================================================

  /**
   * Get Referral Statistics
   * 
   * Returns comprehensive statistics about a user's referrals.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<object>} Referral statistics
   * 
   * @example
   * const stats = await referralService.getReferralStats(userId);
   * console.log(stats);
   * // {
   * //   totalReferrals: 15,
   * //   firstReferralDate: Date,
   * //   lastReferralDate: Date,
   * //   averageInterval: 86400000
   * // }
   */
  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    firstReferralDate: Date | null;
    lastReferralDate: Date | null;
    averageInterval: number | null;
  }> {
    try {
      const referrals = await this.getUserReferrals(userId);

      if (referrals.length === 0) {
        return {
          totalReferrals: 0,
          firstReferralDate: null,
          lastReferralDate: null,
          averageInterval: null,
        };
      }

      // Sort by creation date
      const sorted = [...referrals].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      const firstReferral = sorted[0]!;
      const lastReferral = sorted[sorted.length - 1]!;

      // Calculate average interval between referrals
      let averageInterval: number | null = null;
      if (sorted.length > 1) {
        const totalTime =
          lastReferral.createdAt.getTime() - firstReferral.createdAt.getTime();
        averageInterval = totalTime / (sorted.length - 1);
      }

      return {
        totalReferrals: referrals.length,
        firstReferralDate: firstReferral.createdAt,
        lastReferralDate: lastReferral.createdAt,
        averageInterval,
      };
    } catch (error) {
      logger.error("Error calculating referral stats", { error, userId });
      Sentry.captureException(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to calculate referral statistics",
        cause: error,
      });
    }
  }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  /**
   * Get Service Health
   * 
   * Returns health status of ReferralService.
   * Used for monitoring and health checks.
   * 
   * @returns {Promise<object>} Health status
   * 
   * @example
   * const health = await referralService.getHealth();
   * console.log(health.status); // "healthy"
   */
  async getHealth(): Promise<{
    status: "healthy" | "unhealthy";
    timestamp: string;
    database: "connected" | "disconnected";
  }> {
    try {
      // Test database connection by attempting to count referrals
      // Use a UUID that won't exist but tests the query
      await this.db.countUserReferrals(
        "00000000-0000-0000-0000-000000000000"
      );

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      };
    } catch (error) {
      logger.error("Health check failed", { error });
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      };
    }
  }
}

// import { db } from '../db/client';

// export class ReferralService {
//   async createReferral(referrerId, refereeId) {
//     // Check duplicate
//     const existing = await db.findReferralByUsers(referrerId, refereeId);
    
//     // Create referral
//     const referral = await db.createReferral({
//       referrerId,
//       refereeId
//     });
    
//     // Count referrals
//     const count = await db.countUserReferrals(referrerId);
    
//     return referral;
//   }
// }
