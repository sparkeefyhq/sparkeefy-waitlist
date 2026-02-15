/**
 * Database Client
 *
 * Drizzle-based database client with connection pooling.
 * Implements interfaces required by WaitlistService and ReferralService.
 *
 * @module db/client
 */

import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql, and, asc, count } from "drizzle-orm";
import { Pool } from "pg";
import type { WaitlistUser, Referral, CreateUserInput } from "../types";
import { logger } from "../logging/logger";
import {
  waitlistUsers,
  referrals,
  slackAccessSurveys,
} from "./schema";

// ============================================================================
// POOL AND DRIZZLE INSTANCE
// ============================================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

const drizzleDb = drizzle(pool);

// ============================================================================
// CONNECTION LIFECYCLE
// ============================================================================

/**
 * Connect to Database
 *
 * Verifies connectivity by running a simple query.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await drizzleDb.execute(sql`SELECT 1`);
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Failed to connect to database", { error });
    throw error;
  }
}

/**
 * Disconnect from Database
 *
 * Closes all database connections in the pool.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await pool.end();
    logger.info("Database disconnected successfully");
  } catch (error) {
    logger.error("Failed to disconnect from database", { error });
  }
}

// ============================================================================
// DATABASE CLIENT CLASS
// ============================================================================

/**
 * Database Client
 *
 * Wrapper around Drizzle implementing service interfaces.
 * Provides type-safe database operations for all services.
 */
export class DatabaseClient {
  constructor(private _db: typeof drizzleDb = drizzleDb) {}

  // ==========================================================================
  // WAITLIST USER OPERATIONS
  // ==========================================================================

  async findUserByEmail(email: string): Promise<WaitlistUser | null> {
    const rows = await this._db
      .select()
      .from(waitlistUsers)
      .where(eq(waitlistUsers.email, email.toLowerCase()))
      .limit(1);
    return (rows[0] as WaitlistUser | undefined) ?? null;
  }

  async findUserByReferralCode(code: string): Promise<WaitlistUser | null> {
    try {
      const rows = await this._db
        .select()
        .from(waitlistUsers)
        .where(sql`lower(${waitlistUsers.referralCode}) = lower(${code})`)
        .limit(1);
      return (rows[0] as WaitlistUser | undefined) ?? null;
    } catch (error) {
      logger.error("Database error: findUserByReferralCode", { error, code });
      throw error;
    }
  }

  async findUserByMagicLinkToken(token: string): Promise<WaitlistUser | null> {
    try {
      const rows = await this._db
        .select()
        .from(waitlistUsers)
        .where(eq(waitlistUsers.magicLinkToken, token))
        .limit(1);
      return (rows[0] as WaitlistUser | undefined) ?? null;
    } catch (error) {
      logger.error("Database error: findUserByMagicLinkToken", {
        error,
        tokenPrefix: token.substring(0, 8) + "***",
      });
      throw error;
    }
  }


  async findUserById(userId: string): Promise<WaitlistUser | null> {
    try {
      const rows = await this._db
        .select()
        .from(waitlistUsers)
        .where(eq(waitlistUsers.id, userId))
        .limit(1);
      return (rows[0] as WaitlistUser | undefined) ?? null;
    } catch (error) {
      logger.error("Database error: findUserById", { error, userId });
      throw error;
    }
  }

  async createUser(data: CreateUserInput): Promise<WaitlistUser> {
    const [row] = await this._db
      .insert(waitlistUsers)
      .values({
        email: data.email,
        username: data.username ?? null,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        phoneNumber: data.phoneNumber ?? null,
        marketingOptIn: data.marketingOptIn ?? false,
        additionalRemarks: data.additionalRemarks ?? null,
        referralCode: data.referralCode,
        magicLinkToken: data.magicLinkToken,
      })
      .returning();
    return row as WaitlistUser;
  }

  async updateUser(
    id: string,
    data: Partial<WaitlistUser>
  ): Promise<WaitlistUser> {
    const [row] = await this._db
      .update(waitlistUsers)
      .set(data as Record<string, unknown>)
      .where(eq(waitlistUsers.id, id))
      .returning();
    if (!row) throw new Error("updateUser: no row returned");
    return row as WaitlistUser;
  }


  // ==========================================================================
  // REFERRAL OPERATIONS
  // ==========================================================================

  async createReferral(data: {
    referrerId: string;
    refereeId: string;
  }): Promise<Referral> {
    const [row] = await this._db
      .insert(referrals)
      .values({
        referrerId: data.referrerId,
        refereeId: data.refereeId,
      })
      .returning();
    if (!row) throw new Error("createReferral: no row returned");
    return row as Referral;
  }

  async findReferralByUsers(
    referrerId: string,
    refereeId: string
  ): Promise<Referral | null> {
    const rows = await this._db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, referrerId),
          eq(referrals.refereeId, refereeId)
        )
      )
      .limit(1);
    return (rows[0] as Referral | undefined) ?? null;
  }

  async countUserReferrals(userId: string): Promise<number> {
    const result = await this._db
      .select({ value: count() })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));
    const n = result[0]?.value;
    return typeof n === "number" ? n : Number(n ?? 0);
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    const rows = await this._db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .orderBy(asc(referrals.createdAt));
    return rows as Referral[];
  }

  // ==========================================================================
  // SLACK ACCESS SURVEY
  // ==========================================================================

  async submitSlackAccessSurvey(
    userId: string,
    data: { q1Answer: string; q2Answer?: string }
  ): Promise<{ userId: string; q1Answer: string; q2Answer: string | null; submittedAt: Date; updatedAt: Date }> {
    const [row] = await this._db
      .insert(slackAccessSurveys)
      .values({
        userId,
        q1Answer: data.q1Answer,
        q2Answer: data.q2Answer ?? null,
      })
      .onConflictDoUpdate({
        target: slackAccessSurveys.userId,
        set: {
          q1Answer: data.q1Answer,
          q2Answer: data.q2Answer ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error("submitSlackAccessSurvey: no row returned");
    return row;
  }

  async getSlackAccessSurvey(
    userId: string
  ): Promise<{ userId: string; q1Answer: string; q2Answer: string | null; submittedAt: Date; updatedAt: Date } | null> {
    const rows = await this._db
      .select()
      .from(slackAccessSurveys)
      .where(eq(slackAccessSurveys.userId, userId))
      .limit(1);
    return (rows[0] as typeof rows[0] | undefined) ?? null;
  }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  async healthCheck(): Promise<boolean> {
    try {
      await this._db.execute(sql`SELECT 1`);
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

export const db = new DatabaseClient(drizzleDb);
