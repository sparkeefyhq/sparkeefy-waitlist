/**
 * Writes a synthetic plan into a STAGING database, inside one transaction.
 *
 * Three independent guards must all pass before anything is written:
 *   1. NODE_ENV / VERCEL_ENV is not "production";
 *   2. the database carries a `waitlist_environment` marker of 'staging' or
 *      'local' (created once, deliberately, with --init-environment);
 *   3. the operator typed the exact host/port/database being written to.
 * Plus the schema itself rejects synthetic rows with deliverable emails or a
 * "sent" welcome email, and real-row checksums are compared before/after.
 */

import { randomBytes } from "crypto";
import { assertMigrated, describeTarget, insertColumns, realDataChecksum, utcExpr, withTransaction, type Db, type Tx } from "./db.ts";
import { LAST_7_DAYS_SQL } from "./invariants.ts";
import { defaultWindows, planSynthetic, type ExistingState, type SyntheticPlan, type Targets, type Windows } from "./synthetic.ts";

export const ENV_MARKER_SQL = `
  CREATE TABLE IF NOT EXISTS waitlist_environment (
    name varchar(16) PRIMARY KEY CHECK (name IN ('staging', 'local')),
    marked_at timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    marked_by varchar(100)
  )`;

export function assertNotProductionProcess(env = process.env): void {
  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production") {
    throw new Error("Refusing: NODE_ENV/VERCEL_ENV is production. The synthetic seeder only runs against staging.");
  }
}

export function assertConfirmedTarget(confirm: string | undefined, url = process.env.DATABASE_URL): void {
  const target = describeTarget(url);
  if (confirm !== target) {
    throw new Error(`Refusing: pass --confirm-target ${target} to confirm this is the staging database you mean.`);
  }
}

export async function initEnvironment(db: Db, name: "staging" | "local", operator: string): Promise<void> {
  await db.query(ENV_MARKER_SQL);
  await db.query(`DELETE FROM waitlist_environment`);
  await db.query(`INSERT INTO waitlist_environment (name, marked_by) VALUES ($1, $2)`, [name, operator]);
}

export async function assertStagingMarker(db: Db | Tx): Promise<string> {
  const exists = await db.query(`SELECT to_regclass('public.waitlist_environment') IS NOT NULL AS ok`);
  if (!exists.rows[0].ok) throw new Error("Refusing: this database has no waitlist_environment marker (staging DBs are marked with --init-environment).");
  const { rows } = await db.query(`SELECT name FROM waitlist_environment`);
  if (rows.length !== 1 || !["staging", "local"].includes(rows[0].name)) {
    throw new Error("Refusing: waitlist_environment marker is missing or invalid.");
  }
  return rows[0].name;
}

export async function readExistingState(tx: Db | Tx, windows: Windows): Promise<ExistingState & { now: Date }> {
  const { rows } = await tx.query(
    `SELECT (SELECT count(*) FROM waitlist_users)::int AS total,
            (SELECT count(*) FROM referrals)::int AS referrals,
            (SELECT count(*) FROM waitlist_users WHERE ${LAST_7_DAYS_SQL})::int AS last7,
            (SELECT count(*) FROM waitlist_users
              WHERE created_at BETWEEN ($1::timestamptz AT TIME ZONE 'UTC') AND ($2::timestamptz AT TIME ZONE 'UTC'))::int AS spike,
            now() AS now`,
    [windows.spikeStart.toISOString(), windows.spikeEnd.toISOString()]
  );
  const emails = await tx.query(`SELECT lower(email) AS e, lower(referral_code) AS c FROM waitlist_users`);
  return {
    total: rows[0].total,
    referrals: rows[0].referrals,
    last7: rows[0].last7,
    spike: rows[0].spike,
    now: rows[0].now,
    emails: new Set(emails.rows.map((r) => r.e)),
    referralCodesLower: new Set(emails.rows.map((r) => r.c)),
  };
}

export type SeedResult = {
  dryRun: boolean;
  batchId?: string;
  before: { total: number; referrals: number; last7: number; spike: number };
  plan: SyntheticPlan;
  realRowsUnchanged: boolean;
};

export async function seedSynthetic(
  db: Db,
  opts: { seed: string; targets: Targets; windows?: Windows; dryRun: boolean; operator: string }
): Promise<SeedResult> {
  const windows = opts.windows ?? defaultWindows();
  await assertMigrated(db);
  await assertStagingMarker(db);

  const run = async (tx: Tx): Promise<SeedResult> => {
    // Freeze counts while planning so the deltas cannot drift under us.
    await tx.query(`LOCK TABLE waitlist_users, referrals IN SHARE ROW EXCLUSIVE MODE`);
    const existing = await readExistingState(tx, windows);
    const before = { total: existing.total, referrals: existing.referrals, last7: existing.last7, spike: existing.spike };
    const plan = planSynthetic({ seed: opts.seed, now: existing.now, existing, targets: opts.targets, windows });
    if (opts.dryRun) return { dryRun: true, before, plan, realRowsUnchanged: true };

    const checksumBefore = await realDataChecksum(tx);
    const batch = await tx.query(
      `INSERT INTO import_batches (kind, source, status, operator, params)
       VALUES ('synthetic_seed', $1, 'pending', $2, $3) RETURNING id`,
      [`synthetic seed "${opts.seed}" (synthetic scenario data)`, opts.operator, JSON.stringify({ seed: opts.seed, targets: opts.targets, windows, before })]
    );
    const batchId: string = batch.rows[0].id;
    const u = plan.users;

    const insertedUsers = await insertColumns(tx, "waitlist_users", [
      { name: "id", type: "uuid", values: u.map((x) => x.id) },
      { name: "email", type: "text", values: u.map((x) => x.email) },
      { name: "username", type: "text", values: u.map((x) => x.username) },
      { name: "first_name", type: "text", values: u.map((x) => x.firstName) },
      { name: "last_name", type: "text", values: u.map((x) => x.lastName) },
      { name: "marketing_opt_in", type: "boolean", values: u.map((x) => x.marketingOptIn) },
      { name: "referral_code", type: "text", values: u.map((x) => x.referralCode) },
      // Auth tokens stay cryptographically random even though the dataset is seeded.
      { name: "magic_link_token", type: "text", values: u.map(() => randomBytes(32).toString("hex")) },
      { name: "created_at", type: "timestamptz", values: u.map((x) => x.createdAt.toISOString()), expr: utcExpr },
      { name: "updated_at", type: "timestamptz", values: u.map((x) => x.createdAt.toISOString()), expr: utcExpr },
      { name: "data_source", type: "text", values: u.map(() => "synthetic_seed") },
      { name: "is_synthetic", type: "boolean", values: u.map(() => true) },
      { name: "import_batch_id", type: "uuid", values: u.map(() => batchId) },
      { name: "source_record_id", type: "text", values: u.map((x) => `synthetic:${opts.seed}:${x.id}`) },
      { name: "imported_at", type: "timestamptz", values: u.map(() => existing.now.toISOString()), expr: utcExpr },
      { name: "welcome_email_status", type: "text", values: u.map(() => "suppressed_synthetic") },
    ]);
    if (insertedUsers !== u.length) throw new Error(`inserted ${insertedUsers} of ${u.length} users`);

    const r = plan.referrals;
    const insertedRefs = await insertColumns(tx, "referrals", [
      { name: "referrer_id", type: "uuid", values: r.map((x) => x.referrerId) },
      { name: "referee_id", type: "uuid", values: r.map((x) => x.refereeId) },
      { name: "created_at", type: "timestamptz", values: r.map((x) => x.createdAt.toISOString()), expr: utcExpr },
      { name: "data_source", type: "text", values: r.map(() => "synthetic_seed") },
      { name: "import_batch_id", type: "uuid", values: r.map(() => batchId) },
    ]);
    if (insertedRefs !== r.length) throw new Error(`inserted ${insertedRefs} of ${r.length} referrals`);

    const checksumAfter = await realDataChecksum(tx);
    const realRowsUnchanged = checksumBefore.users === checksumAfter.users && checksumBefore.referrals === checksumAfter.referrals;
    if (!realRowsUnchanged) throw new Error("real (non-synthetic) rows changed during seeding; rolled back");

    await tx.query(
      `UPDATE import_batches SET status = 'applied', applied_at = now() AT TIME ZONE 'UTC',
              user_count = $2, referral_count = $3, report = $4 WHERE id = $1`,
      [batchId, insertedUsers, insertedRefs, JSON.stringify({ counts: plan.counts, degreeTable: plan.degreeTable, realChecksum: checksumAfter })]
    );
    return { dryRun: false, batchId, before, plan, realRowsUnchanged };
  };

  if (opts.dryRun) {
    // Plan under the same lock, then discard.
    const tx = await db.connect();
    try {
      await tx.query("BEGIN");
      return await run(tx);
    } finally {
      await tx.query("ROLLBACK").catch(() => {});
      tx.release();
    }
  }
  return withTransaction(db, run);
}
