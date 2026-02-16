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
} from "drizzle-orm/pg-core";

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
  },
  (table) => [
    index("waitlist_users_email_idx").on(table.email),
    index("waitlist_users_referral_code_idx").on(table.referralCode),
    index("waitlist_users_magic_link_token_idx").on(table.magicLinkToken),
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
