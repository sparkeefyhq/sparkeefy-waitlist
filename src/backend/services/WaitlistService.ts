/**
 * Waitlist Service
 * 
 * Core business logic for waitlist management.
 * Handles user registration, duplicate detection, referral code extraction,
 * and coordination with ReferralService and SessionService.
 * 
 * @module services/WaitlistService
 */

import { TRPCError } from "@trpc/server";
import type { 
  WaitlistUser, 
  CreateUserInput, 
  JoinWaitlistInput,
  UserStatsResponse 
} from "../types";
import { db } from "../db/client";
import { logger } from "../logging/logger";
import * as Sentry from "@sentry/node";
import { 
  generateReferralCode, 
  generateUniqueCode 
} from "../utils/generators";
import { 
  validateAndSanitizeEmail, 
  sanitizeString 
} from "../utils/validators";
import { extractReferralCode, buildReferralLink } from "../utils/links";
import { 
  calculateTier, 
  getTierInfo, 
  getNextTierThreshold,
  getDisplayReferralCount 
} from "../utils/tiers";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Database Client Interface
 * Abstract interface for database operations (Prisma, TypeORM, etc.)
 */
export interface DatabaseClient {
  findUserByEmail(email: string): Promise<WaitlistUser | null>;
  findUserByReferralCode(code: string): Promise<WaitlistUser | null>;
  findUserBySessionToken(token: string): Promise<WaitlistUser | null>;
  createUser(data: CreateUserInput): Promise<WaitlistUser>;
  updateUser(id: string, data: Partial<WaitlistUser>): Promise<WaitlistUser>;
  countUserReferrals(userId: string): Promise<number>;
}

// ============================================================================
// WAITLIST SERVICE CLASS
// ============================================================================

export class WaitlistService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
    logger.info("WaitlistService initialized");
  }

  // ==========================================================================
  // CORE WAITLIST OPERATIONS
  // ==========================================================================

  /**
   * Join Waitlist
   * 
   * Main method for user registration with optional referral handling.
   * 
   * @param {JoinWaitlistInput} input - User registration data
   * @param {string} sessionToken - Generated session token
   * @returns {Promise<WaitlistUser>} Created user
   * 
   * @throws {TRPCError} CONFLICT - Email already exists
   * @throws {TRPCError} NOT_FOUND - Invalid referral code
   * @throws {TRPCError} INTERNAL_SERVER_ERROR - Database error
   * 
   * @example
   * const user = await waitlistService.joinWaitlist({
   *   email: "user@example.com",
   *   username: "johndoe",
   *   referralCode: "ABC12XYZ"
   * }, sessionToken);
   */
  async joinWaitlist(
    input: JoinWaitlistInput,
    sessionToken: string
  ): Promise<WaitlistUser> {
    const correlationId = `join-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.info("Processing waitlist join", {
        email: input.email,
        hasReferralCode: !!input.referralCode,
        correlationId,
      });

      // ======================================================================
      // STEP 1: VALIDATE AND SANITIZE EMAIL
      // ======================================================================

      const emailValidation = validateAndSanitizeEmail(input.email);
      if (!emailValidation.valid) {
        logger.warn("Invalid email format", {
          email: input.email,
          error: emailValidation.error,
          correlationId,
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: emailValidation.error || "Invalid email format",
        });
      }

      const normalizedEmail = emailValidation.email!;

      // ======================================================================
      // STEP 2: CHECK FOR DUPLICATE EMAIL
      // ======================================================================

      const existingUser = await this.findUserByEmail(normalizedEmail);
      if (existingUser) {
        logger.warn("Email already exists in waitlist", {
          email: normalizedEmail,
          userId: existingUser.id,
          correlationId,
        });
        throw new TRPCError({
          code: "CONFLICT",
          message: "This email is already registered on the waitlist",
        });
      }

      // ======================================================================
      // STEP 3: EXTRACT AND VALIDATE REFERRAL CODE
      // ======================================================================

      let referrerUser: WaitlistUser | null = null;
      let extractedReferralCode: string | null = null;

      if (input.referralCode) {
        // Extract code from URL or use directly
        extractedReferralCode = extractReferralCode(input.referralCode);

        if (extractedReferralCode) {
          referrerUser = await this.findUserByReferralCode(extractedReferralCode);

          if (!referrerUser) {
            logger.warn("Invalid referral code provided", {
              referralCode: extractedReferralCode,
              email: normalizedEmail,
              correlationId,
            });
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Invalid referral code. Please check and try again.",
            });
          }

          logger.info("Valid referral code found", {
            referralCode: extractedReferralCode,
            referrerId: referrerUser.id,
            referrerEmail: referrerUser.email,
            correlationId,
          });
        }
      }

      // ======================================================================
      // STEP 4: GENERATE UNIQUE REFERRAL CODE
      // ======================================================================

      const userReferralCode = await this.generateUniqueReferralCode();

      logger.info("Generated unique referral code", {
        referralCode: userReferralCode,
        email: normalizedEmail,
        correlationId,
      });

      // ======================================================================
      // STEP 5: PREPARE USER DATA
      // ======================================================================

      // Calculate session expiration (30 days from now)
      const sessionExpiresAt = new Date();
      sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 30);

      const userData: CreateUserInput = {
        email: normalizedEmail,
        username: input.username ? sanitizeString(input.username) : null,
        firstName: input.firstName ? sanitizeString(input.firstName) : null,
        lastName: input.lastName ? sanitizeString(input.lastName) : null,
        phoneNumber: input.phoneNumber || null,
        marketingOptIn: input.marketingOptIn || false,
        additionalRemarks: input.additionalRemarks 
          ? sanitizeString(input.additionalRemarks) 
          : null,
        referralCode: userReferralCode,
        sessionToken,
        sessionExpiresAt,
      };

      // ======================================================================
      // STEP 6: CREATE USER IN DATABASE
      // ======================================================================

      const newUser = await this.createUser(userData);

      logger.info("User created successfully", {
        userId: newUser.id,
        email: newUser.email,
        referralCode: newUser.referralCode,
        hasReferrer: !!referrerUser,
        correlationId,
      });

      // ======================================================================
      // STEP 7: CREATE REFERRAL RELATIONSHIP (if applicable)
      // ======================================================================

      // Note: Referral creation is handled by ReferralService
      // The procedure in waitlist.ts will call ReferralService.createReferral()
      // after user creation to maintain separation of concerns

      // ======================================================================
      // STEP 8: TRACK SUCCESS IN SENTRY
      // ======================================================================

      Sentry.addBreadcrumb({
        category: "waitlist",
        message: "User joined waitlist",
        level: "info",
        data: {
          userId: newUser.id,
          email: newUser.email,
          hasReferrer: !!referrerUser,
        },
      });

      return newUser;
    } catch (error) {
      // Log error with context
      logger.error("Error joining waitlist", {
        error,
        email: input.email,
        correlationId,
      });

      // Track error in Sentry
      Sentry.captureException(error, {
        tags: {
          operation: "join_waitlist",
          email: input.email,
        },
        contexts: {
          waitlist: {
            email: input.email,
            hasReferralCode: !!input.referralCode,
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
        message: "Failed to join waitlist. Please try again later.",
        cause: error,
      });
    }
  }

  /**
   * Get User Stats
   * 
   * Retrieves comprehensive statistics for authenticated user.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<UserStatsResponse>} User statistics
   * 
   * @throws {TRPCError} NOT_FOUND - User not found
   * @throws {TRPCError} INTERNAL_SERVER_ERROR - Database error
   * 
   * @example
   * const stats = await waitlistService.getUserStats(userId);
   * console.log(stats.actualReferralCount); // 15
   * console.log(stats.displayReferralCount); // 10 (capped)
   */
  async getUserStats(userId: string): Promise<UserStatsResponse> {
    try {
      logger.info("Fetching user stats", { userId });

      // Get user
      const user = await this.findUserById(userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Get referral count
      const actualReferralCount = await this.db.countUserReferrals(userId);

      // Calculate tier and display count
      const tier = calculateTier(actualReferralCount);
      const tierInfo = getTierInfo(tier);
      const displayReferralCount = getDisplayReferralCount(actualReferralCount);
      const nextTierAt = getNextTierThreshold(actualReferralCount);

      // Build referral link
      const referralLink = buildReferralLink(user.referralCode);

      const stats: UserStatsResponse = {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          referralCode: user.referralCode,
          createdAt: user.createdAt.toISOString(),  // ✅ Convert to string
        },
        referralStats: {
          actualReferralCount,
          displayReferralCount,
          tier,
          tierLabel: tierInfo.label,
          tierDescription: tierInfo.description,
          nextTierAt: nextTierAt ?? undefined,  // ✅ Convert null to undefined
        },
        referralLink,
      };

      logger.info("User stats retrieved", {
        userId,
        actualReferralCount,
        tier,
      });

      return stats;
    } catch (error) {
      logger.error("Error fetching user stats", { error, userId });

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve user statistics",
        cause: error,
      });
    }
  }

  // ==========================================================================
  // DATABASE QUERY METHODS
  // ==========================================================================

  /**
   * Find User by Email
   * 
   * @param {string} email - User email (normalized)
   * @returns {Promise<WaitlistUser | null>} User or null
   */
  async findUserByEmail(email: string): Promise<WaitlistUser | null> {
    try {
      return await this.db.findUserByEmail(email.toLowerCase());
    } catch (error) {
      logger.error("Error finding user by email", { error, email });
      Sentry.captureException(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database error while checking email",
        cause: error,
      });
    }
  }

  /**
   * Find User by Referral Code
   * 
   * @param {string} code - Referral code
   * @returns {Promise<WaitlistUser | null>} User or null
   */
  async findUserByReferralCode(code: string): Promise<WaitlistUser | null> {
    try {
      return await this.db.findUserByReferralCode(code.toUpperCase());
    } catch (error) {
      logger.error("Error finding user by referral code", { error, code });
      Sentry.captureException(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database error while validating referral code",
        cause: error,
      });
    }
  }

  /**
   * Find User by Session Token
   * 
   * @param {string} token - Session token
   * @returns {Promise<WaitlistUser | null>} User or null
   */
  async findUserBySessionToken(token: string): Promise<WaitlistUser | null> {
    try {
      return await this.db.findUserBySessionToken(token);
    } catch (error) {
      logger.error("Error finding user by session token", { error });
      Sentry.captureException(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database error during authentication",
        cause: error,
      });
    }
  }

  /**
   * Find User by ID
   * 
   * Internal method for getUserStats.
   * Assumes database client has this method or uses findUserBySessionToken alternative.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<WaitlistUser | null>} User or null
   */
  private async findUserById(userId: string): Promise<WaitlistUser | null> {
    try {
      // This assumes db client has findUserById method
      // If not available, this would be implemented in the actual database client
      // For now, we'll use a type assertion since this is abstracted
      return await (this.db as any).findUserById?.(userId) || null;
    } catch (error) {
      logger.error("Error finding user by ID", { error, userId });
      Sentry.captureException(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database error while fetching user",
        cause: error,
      });
    }
  }

  /**
   * Create User
   * 
   * @param {CreateUserInput} data - User data
   * @returns {Promise<WaitlistUser>} Created user
   */
  async createUser(data: CreateUserInput): Promise<WaitlistUser> {
    try {
      return await this.db.createUser(data);
    } catch (error) {
      logger.error("Error creating user", { error, email: data.email });
      Sentry.captureException(error);

      // Check for unique constraint violation
      if ((error as any).code === "23505" || (error as any).code === "ER_DUP_ENTRY") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already exists",
          cause: error,
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create user account",
        cause: error,
      });
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Generate Unique Referral Code
   * 
   * Generates a referral code and ensures it's unique in database.
   * Retries up to 5 times if collision occurs.
   * 
   * @returns {Promise<string>} Unique referral code
   * @throws {Error} If unable to generate unique code after max attempts
   */
  private async generateUniqueReferralCode(): Promise<string> {
    return await generateUniqueCode(
      generateReferralCode,
      async (code: string) => {
        const existing = await this.db.findUserByReferralCode(code);
        return !!existing; // Return true if code exists (collision)
      },
      5 // Max attempts
    );
  }

  /**
   * Validate Referral Code Format
   * 
   * Public method to validate referral code format without database lookup.
   * Used by validateReferralCode procedure for UX enhancement.
   * 
   * @param {string} code - Code to validate
   * @returns {boolean} True if format is valid
   * 
   * @example
   * const isValid = waitlistService.validateReferralCodeFormat("ABC12XYZ");
   */
  validateReferralCodeFormat(code: string): boolean {
    // 8 characters, alphanumeric
    return /^[A-Za-z0-9]{8}$/.test(code);
  }

  /**
   * Check if Referral Code Exists
   * 
   * Public method to check if referral code exists in database.
   * Used by validateReferralCode procedure.
   * 
   * @param {string} code - Referral code to check
   * @returns {Promise<boolean>} True if code exists
   * 
   * @example
   * const exists = await waitlistService.referralCodeExists("ABC12XYZ");
   */
  async referralCodeExists(code: string): Promise<boolean> {
    try {
      const user = await this.findUserByReferralCode(code);
      return !!user;
    } catch (error) {
      logger.error("Error checking referral code existence", { error, code });
      return false;
    }
  }

  // ==========================================================================
  // STATISTICS & MONITORING
  // ==========================================================================

  /**
   * Get Service Health
   * 
   * Returns health status of WaitlistService.
   * Used for monitoring and health checks.
   * 
   * @returns {Promise<object>} Health status
   * 
   * @example
   * const health = await waitlistService.getHealth();
   * console.log(health.status); // "healthy"
   */
  async getHealth(): Promise<{
    status: "healthy" | "unhealthy";
    timestamp: string;
    database: "connected" | "disconnected";
  }> {
    try {
      // Test database connection by attempting to find a non-existent user
      await this.db.findUserByEmail("health-check@test.com");

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

//  async joinWaitlist(input, sessionToken) {
//     // Check duplicate
//     const existing = await db.findUserByEmail(input.email);
    
//     // Create user
//     const user = await db.createUser({
//       email: input.email,
//       // ...
//       sessionToken
//     });
    
//     return user;
//   }
// }