/**
 * Database Client
 *
 * Drizzle-based database client with connection pooling.
 * Implements interfaces required by WaitlistService and ReferralService.
 *
 * @module db/client
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql, and, asc, desc, count } from "drizzle-orm";
import { Pool } from "pg";
import type { WaitlistUser, Referral, CreateUserInput } from "../types";
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

/** Who the bulk "Send all unsent" may email. Synthetic and restored rows never qualify. */
const BULK_WELCOME_ELIGIBLE = sql`(welcome_email_sent_at IS NULL AND NOT is_synthetic
  AND data_source = 'organic' AND welcome_email_status IS NULL)`;

export type BackupListRow = {
  id: number;
  email: string;
  backupSignedUpAt: Date | null;
  backupReferralCount: number;
};

export type AllEmailRow = {
  email: string;
  at: Date | null;
  referrals: number;
  source: "signup" | "backup sheet";
};

export type AdminStats = {
  totalSignups: number;
  totalReferrals: number;
  signupsLast7Days: number;
  welcomeSent: number;
  bulkUnsent: number;
  heldImport: number;
  imported: number;
  syntheticSignups: number;
  syntheticReferrals: number;
};

export type AdminSignupRow = Omit<WaitlistUser, "magicLinkToken" | "updatedAt"> & {
  referralCount: number;
};

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
  } catch (error) {
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
  } catch {
    // Ignore
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
      throw error;
    }
  }

  async listWaitlistUsers(options?: {
    limit?: number;
    offset?: number;
  }): Promise<WaitlistUser[]> {
    const limit = options?.limit ?? 10000;
    const offset = options?.offset ?? 0;
    const rows = await this._db
      .select()
      .from(waitlistUsers)
      .orderBy(desc(waitlistUsers.createdAt))
      .limit(limit)
      .offset(offset);
    return rows as WaitlistUser[];
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


  async deleteUser(id: string): Promise<void> {
    await this._db.delete(waitlistUsers).where(eq(waitlistUsers.id, id));
  }

  async markWelcomeEmailSent(id: string, sentAt?: Date): Promise<void> {
    await this._db
      .update(waitlistUsers)
      .set({ welcomeEmailSentAt: sentAt ?? new Date(), welcomeEmailStatus: null })
      .where(eq(waitlistUsers.id, id));
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

  async countAllReferrals(): Promise<number> {
    const result = await this._db
      .select({ value: count() })
      .from(referrals);
    const n = result[0]?.value;
    return typeof n === "number" ? n : Number(n ?? 0);
  }

  // ==========================================================================
  // ADMIN DASHBOARD (server-side aggregates and pagination)
  // ==========================================================================

  /** Dashboard metrics. "Real" excludes synthetic rows; times are stored UTC. */
  async getAdminStats(): Promise<AdminStats> {
    const result = await this._db.execute(sql`
      SELECT
        count(*) FILTER (WHERE NOT is_synthetic)::int AS total_signups,
        count(*) FILTER (WHERE NOT is_synthetic AND created_at >= (now() AT TIME ZONE 'UTC') - interval '7 days')::int AS signups_last_7_days,
        count(*) FILTER (WHERE NOT is_synthetic AND welcome_email_sent_at IS NOT NULL)::int AS welcome_sent,
        count(*) FILTER (WHERE ${BULK_WELCOME_ELIGIBLE})::int AS bulk_unsent,
        count(*) FILTER (WHERE welcome_email_status = 'held_import' AND welcome_email_sent_at IS NULL)::int AS held_import,
        count(*) FILTER (WHERE data_source = 'historical_import')::int AS imported,
        count(*) FILTER (WHERE is_synthetic)::int AS synthetic_signups,
        (SELECT count(*) FROM referrals WHERE data_source <> 'synthetic_seed')::int AS total_referrals,
        (SELECT count(*) FROM referrals WHERE data_source = 'synthetic_seed')::int AS synthetic_referrals
      FROM waitlist_users`);
    const r = result.rows[0] as Record<string, number>;
    return {
      totalSignups: r.total_signups,
      totalReferrals: r.total_referrals,
      signupsLast7Days: r.signups_last_7_days,
      welcomeSent: r.welcome_sent,
      bulkUnsent: r.bulk_unsent,
      heldImport: r.held_import,
      imported: r.imported,
      syntheticSignups: r.synthetic_signups,
      syntheticReferrals: r.synthetic_referrals,
    };
  }

  /**
   * One page of the backup list (21 Oct xlsx), newest backup date first, plus its
   * totals. Separate table: never part of the signup/referral numbers or emails.
   */
  async listBackupList(options: { limit: number; offset: number }): Promise<{
    rows: BackupListRow[];
    total: number;
    referralTotal: number;
  }> {
    const [page, totals] = await Promise.all([
      this._db.execute(sql`
        SELECT id, email, (backup_signed_up_at AT TIME ZONE 'UTC') AS backup_signed_up_at, backup_referral_count
          FROM backup_list
         ORDER BY backup_signed_up_at DESC NULLS LAST, id
         LIMIT ${options.limit} OFFSET ${options.offset}`),
      this._db.execute(sql`
        SELECT count(*)::int AS n, coalesce(sum(backup_referral_count), 0)::int AS referrals
          FROM backup_list`),
    ]);
    const t = totals.rows[0] as { n: number; referrals: number };
    return {
      rows: (page.rows as Record<string, unknown>[]).map((r) => ({
        id: r.id as number,
        email: r.email as string,
        backupSignedUpAt: r.backup_signed_up_at === null ? null : new Date(r.backup_signed_up_at as string),
        backupReferralCount: r.backup_referral_count as number,
      })),
      total: t.n,
      referralTotal: t.referrals,
    };
  }

  /**
   * Every email in one list: real signups and the backup list, newest first,
   * each tagged with where it came from. For viewing and export only; the
   * signup numbers and email sends still read waitlist_users alone.
   */
  async listAllEmails(options: { limit?: number; offset?: number }): Promise<{
    rows: AllEmailRow[];
    total: number;
    signups: number;
    backup: number;
  }> {
    const combined = sql`
      SELECT u.email, (u.created_at AT TIME ZONE 'UTC') AS at,
             (SELECT count(*) FROM referrals r WHERE r.referrer_id = u.id)::int AS referrals,
             'signup' AS source
        FROM waitlist_users u WHERE NOT u.is_synthetic
      UNION ALL
      SELECT b.email, (b.backup_signed_up_at AT TIME ZONE 'UTC'), b.backup_referral_count, 'backup sheet'
        FROM backup_list b`;
    const [page, totals] = await Promise.all([
      this._db.execute(sql`
        SELECT * FROM (${combined}) AS e ORDER BY e.at DESC NULLS LAST, e.email
        ${options.limit === undefined ? sql`` : sql`LIMIT ${options.limit} OFFSET ${options.offset ?? 0}`}`),
      this._db.execute(sql`
        SELECT (SELECT count(*) FROM waitlist_users WHERE NOT is_synthetic)::int AS signups,
               (SELECT count(*) FROM backup_list)::int AS backup`),
    ]);
    const t = totals.rows[0] as { signups: number; backup: number };
    return {
      rows: (page.rows as Record<string, unknown>[]).map((r) => ({
        email: r.email as string,
        at: r.at === null ? null : new Date(r.at as string),
        referrals: r.referrals as number,
        source: r.source as AllEmailRow["source"],
      })),
      total: t.signups + t.backup,
      signups: t.signups,
      backup: t.backup,
    };
  }

  /** One page of signups with referral counts, newest first. */
  async listAdminSignups(options: {
    limit: number;
    offset: number;
    query?: string;
    source?: string;
  }): Promise<{ rows: AdminSignupRow[]; total: number }> {
    const like = options.query ? `%${options.query.replace(/[\\%_]/g, "\\$&")}%` : null;
    const where = sql`
      (${like}::text IS NULL OR u.email ILIKE ${like} OR u.username ILIKE ${like}
        OR concat_ws(' ', u.first_name, u.last_name) ILIKE ${like})
      AND (${options.source ?? null}::text IS NULL OR u.data_source = ${options.source ?? null})`;
    const [page, total] = await Promise.all([
      this._db.execute(sql`
        SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.phone_number,
               u.marketing_opt_in, u.additional_remarks, u.referral_code,
               (u.created_at AT TIME ZONE 'UTC') AS created_at,
               (u.welcome_email_sent_at AT TIME ZONE 'UTC') AS welcome_email_sent_at,
               u.welcome_email_status, u.data_source, u.is_synthetic,
               (SELECT count(*) FROM referrals r WHERE r.referrer_id = u.id)::int AS referral_count
          FROM waitlist_users u
         WHERE ${where}
         ORDER BY u.created_at DESC, u.id
         LIMIT ${options.limit} OFFSET ${options.offset}`),
      this._db.execute(sql`SELECT count(*)::int AS n FROM waitlist_users u WHERE ${where}`),
    ]);
    const rows = (page.rows as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      email: r.email as string,
      username: r.username as string | null,
      firstName: r.first_name as string | null,
      lastName: r.last_name as string | null,
      phoneNumber: r.phone_number as string | null,
      marketingOptIn: r.marketing_opt_in as boolean,
      additionalRemarks: r.additional_remarks as string | null,
      referralCode: r.referral_code as string,
      createdAt: new Date(r.created_at as string),
      welcomeEmailSentAt: r.welcome_email_sent_at ? new Date(r.welcome_email_sent_at as string) : null,
      welcomeEmailStatus: r.welcome_email_status as string | null,
      dataSource: r.data_source as string,
      isSynthetic: r.is_synthetic as boolean,
      referralCount: r.referral_count as number,
    }));
    return { rows, total: (total.rows[0] as { n: number }).n };
  }

  /** Users "Send all unsent" may email: organic, real, never sent, not held. */
  async listBulkWelcomeEligible(limit: number): Promise<WaitlistUser[]> {
    const rows = await this._db
      .select()
      .from(waitlistUsers)
      .where(BULK_WELCOME_ELIGIBLE)
      .orderBy(asc(waitlistUsers.createdAt))
      .limit(limit);
    return rows as WaitlistUser[];
  }

  /** Archive the row and its referrals, then delete, in one transaction. */
  async deleteUserWithArchive(id: string, deletedBy = "admin"): Promise<void> {
    await this._db.transaction(async (tx) => {
      await tx.execute(sql`
        INSERT INTO waitlist_deletions (user_id, email, user_row, referrals, deleted_by)
        SELECT u.id, u.email, to_jsonb(u),
               coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM referrals r
                          WHERE r.referrer_id = u.id OR r.referee_id = u.id), '[]'::jsonb),
               ${deletedBy}
          FROM waitlist_users u WHERE u.id = ${id}`);
      await tx.delete(waitlistUsers).where(eq(waitlistUsers.id, id));
    });
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
    } catch {
      return false;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const db = new DatabaseClient(drizzleDb);
