/**
 * Referral Service
 * 
 * Core business logic for referral management.
 * Handles referral relationship creation, duplicate prevention,
 * referral counting.
 * 
 * @module services/ReferralService
 */

import type { Referral } from "../types";
import { db } from "../db/client";
import { logger } from "../logging/logger";
import { 
  validateReferralRelationship, 
  referralExists 
} from "../utils/referrals";
import { isTierUpgraded } from "../utils/tiers";

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
   * Validates relationship and checks for duplicates.
   * 
   * @param {string} referrerId - User who referred (referral code owner)
   * @param {string} refereeId - User who was referred (new user)
   * @returns {Promise<Referral>} Created referral record
   * 
   * @throws {Error} BAD_REQUEST - Invalid relationship (self-referral)
   * @throws {Error} CONFLICT - Referral already exists
   * @throws {Error} INTERNAL_SERVER_ERROR - Database error
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
        throw new Error(validation.error || "Invalid referral relationship");
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
        throw new Error("This referral relationship already exists");
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

      return referral;
    } catch (error) {
      // Log error with context
      logger.error("Error creating referral", {
        error,
        referrerId,
        refereeId,
        correlationId,
      });

      // Re-throw error
      throw error;
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
      throw new Error("Failed to count referrals");
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
      throw new Error("Failed to fetch referrals");
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
      throw new Error("Failed to check referral existence");
    }
  }
}
