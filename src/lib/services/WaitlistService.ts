/**
 * Waitlist Service
 * 
 * Core business logic for waitlist management.
 * Handles user registration, duplicate detection, referral code extraction,
 * and coordination with ReferralService.
 * 
 * @module services/WaitlistService
 */

import type { 
  WaitlistUser, 
  CreateUserInput, 
  JoinWaitlistInput,
  UserStatsResponse, 
  SlackAccessResponse,
  SlackAccessInput
} from "../types";
import { db } from "../db/client";
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
 * Abstract interface for database operations
 */
export interface DatabaseClient {
  findUserByEmail(email: string): Promise<WaitlistUser | null>;
  findUserByReferralCode(code: string): Promise<WaitlistUser | null>;
  findUserByMagicLinkToken(token: string): Promise<WaitlistUser | null>;
  findUserById(userId: string): Promise<WaitlistUser | null>;
  createUser(data: CreateUserInput): Promise<WaitlistUser>;
  updateUser(id: string, data: Partial<WaitlistUser>): Promise<WaitlistUser>;
  countUserReferrals(userId: string): Promise<number>;
  submitSlackAccessSurvey(userId: string, data: { q1Answer: string; q2Answer?: string }): Promise<any>;
  getSlackAccessSurvey(userId: string): Promise<any | null>;
}

// ============================================================================
// WAITLIST SERVICE CLASS
// ============================================================================

export class WaitlistService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  // ==========================================================================
  // CORE WAITLIST OPERATIONS
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
    } catch {
      throw new Error("Database error while checking email");
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
    } catch {
      throw new Error("Database error while validating referral code");
    }
  }

  /**
   * Find User by Magic Link Token
   * 
   * Retrieves user by their permanent magic link token.
   * Used for authentication via email links.
   * 
   * @param {string} magicLinkToken - 64-character hex token
   * @returns {Promise<WaitlistUser | null>} User if found, null otherwise
   * 
   * @example
   * const user = await service.findUserByMagicLinkToken(token);
   * if (user) {
   *   // User is authenticated
   * }
   */
  async findUserByMagicLinkToken(magicLinkToken: string): Promise<WaitlistUser | null> {
    try {
      if (!magicLinkToken || magicLinkToken.length !== 64) return null;
      return await this.db.findUserByMagicLinkToken(magicLinkToken);
    } catch {
      throw new Error("Database error during magic link authentication");
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
      // Check for unique constraint violation
      if ((error as any).code === "23505" || (error as any).code === "ER_DUP_ENTRY") {
        throw new Error("Email already exists");
      }

      throw new Error("Failed to create user account");
    }
  }

  /**
   * Generate Unique Referral Code
   * 
   * Generates a referral code and ensures it's unique in database.
   * Retries up to 5 times if collision occurs.
   * 
   * @returns {Promise<string>} Unique referral code
   * @throws {Error} If unable to generate unique code after max attempts
   */
  async generateUniqueReferralCode(): Promise<string> {
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
   * Submit Slack Access Survey
   * 
   * @param userId - Authenticated user ID
   * @param input - Survey answers
   * @returns SlackAccessResponse
   */
  async submitSlackAccess(userId: string, input: SlackAccessInput): Promise<SlackAccessResponse> {
    try {
      const survey = await this.db.submitSlackAccessSurvey(userId, {
        q1Answer: input.q1Answer,
        q2Answer: input.q2Answer,
      });

      return {
        success: true,
        submitted: true,
        q1Answer: survey.q1Answer,
        q2Answer: survey.q2Answer || undefined,
        submittedAt: survey.submittedAt.toISOString(),
        message: "Slack access survey submitted successfully!",
      };
    } catch {
      throw new Error("Failed to submit survey");
    }
  }

  /**
   * Get Slack Access Survey Status
   * 
   * @param userId - Authenticated user ID
   * @returns SlackAccessResponse
   */
  async getSlackAccessStatus(userId: string): Promise<SlackAccessResponse> {
    try {
      const survey = await this.db.getSlackAccessSurvey(userId);
      
      return {
        success: true,
        submitted: !!survey,
        ...(survey && {
          q1Answer: survey.q1Answer,
          q2Answer: survey.q2Answer || undefined,
          submittedAt: survey.submittedAt.toISOString(),
        }),
        message: survey ? "Survey already submitted" : "No survey submitted yet",
      };
    } catch {
      throw new Error("Failed to retrieve survey status");
    }
  }
}
