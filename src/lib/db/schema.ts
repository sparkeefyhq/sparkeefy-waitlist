/**
 * Drizzle schema for waitlist database.
 * Matches the previous Prisma schema: waitlist_users, referrals, slack_access_surveys.
 */

import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  integer,
  jsonb,
  text,
  char,
} from "drizzle-orm/pg-core";

// ============================================================================
// IMPORT BATCHES (audit log for historical imports and synthetic seeds)
// ============================================================================
// Schema changes for these tables ship as SQL in src/lib/db/sql/ (checks,
// partial indexes); do not `db:push` against production.

export const importBatches = pgTable("import_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: varchar("kind", { length: 32 }).notNull(),
  source: varchar("source", { length: 255 }).notNull(),
  sourceSha256: char("source_sha256", { length: 64 }),
  evidence: text("evidence"),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  operator: varchar("operator", { length: 100 }),
  params: jsonb("params").notNull().default({}),
  report: jsonb("report").notNull().default({}),
  userCount: integer("user_count").notNull().default(0),
  referralCount: integer("referral_count").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  appliedAt: timestamp("applied_at", { mode: "date" }),
  rolledBackAt: timestamp("rolled_back_at", { mode: "date" }),
});

// ============================================================================
// WAITLIST USERS
// ============================================================================

export const waitlistUsers = pgTable(
  "waitlist_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    username: varchar("username", { length: 100 }),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    additionalRemarks: varchar("additional_remarks"),
    referralCode: varchar("referral_code", { length: 8 }).notNull().unique(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    magicLinkToken: varchar("magic_link_token", { length: 64 }).notNull().unique(),
    welcomeEmailSentAt: timestamp("welcome_email_sent_at", { mode: "date" }),
    // Provenance: organic | historical_import | synthetic_seed
    dataSource: varchar("data_source", { length: 32 }).notNull().default("organic"),
    isSynthetic: boolean("is_synthetic").notNull().default(false),
    importBatchId: uuid("import_batch_id").references(() => importBatches.id),
    sourceRecordId: varchar("source_record_id", { length: 255 }),
    importedAt: timestamp("imported_at", { mode: "date" }),
    // null = normal; 'held_import' = restored, not auto-sent; 'suppressed_synthetic' = never send
    welcomeEmailStatus: varchar("welcome_email_status", { length: 32 }),
    // When the "invite friends" referral email was sent (migration 0002).
    referralPushSentAt: timestamp("referral_push_sent_at", { mode: "date" }),
  },
  (table) => [
    index("waitlist_users_email_idx").on(table.email),
    index("waitlist_users_referral_code_idx").on(table.referralCode),
    index("waitlist_users_magic_link_token_idx").on(table.magicLinkToken),
    index("waitlist_users_created_at_idx").on(table.createdAt.desc()),
  ]
);

// ============================================================================
// REFERRALS
// ============================================================================

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referrerId: uuid("referrer_id")
      .notNull()
      .references(() => waitlistUsers.id, { onDelete: "cascade" }),
    refereeId: uuid("referee_id")
      .notNull()
      .references(() => waitlistUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    dataSource: varchar("data_source", { length: 32 }).notNull().default("organic"),
    importBatchId: uuid("import_batch_id").references(() => importBatches.id),
  },
  (table) => [
    uniqueIndex("unique_referral").on(table.referrerId, table.refereeId),
    index("referrals_referrer_id_idx").on(table.referrerId),
    index("referrals_referee_id_idx").on(table.refereeId),
  ]
);

// ============================================================================
// SLACK ACCESS SURVEYS
// ============================================================================

export const slackAccessSurveys = pgTable("slack_access_surveys", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => waitlistUsers.id, { onDelete: "cascade" }),
  q1Answer: varchar("q1_answer", { length: 255 }).notNull(),
  q2Answer: varchar("q2_answer"),
  submittedAt: timestamp("submitted_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ============================================================================
// DELETED SIGNUPS ARCHIVE (admin deletes are recoverable)
// ============================================================================

export const waitlistDeletions = pgTable("waitlist_deletions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  userRow: jsonb("user_row").notNull(),
  referrals: jsonb("referrals").notNull().default([]),
  deletedBy: varchar("deleted_by", { length: 100 }).notNull().default("admin"),
  deletedAt: timestamp("deleted_at", { mode: "date" }).notNull().defaultNow(),
  restoredAt: timestamp("restored_at", { mode: "date" }),
});
