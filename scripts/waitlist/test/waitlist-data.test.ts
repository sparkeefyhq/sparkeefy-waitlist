/**
 * Data-tool tests. Needs a throwaway Postgres; each run creates and drops its own database.
 *
 *   TEST_PG_URL=postgresql://user@localhost:5432/postgres npm run test:data
 */

import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";
import { connect, type Db } from "../lib/db.ts";
import { metrics, runChecks } from "../lib/invariants.ts";
import { applyImport, parseTimestamp, planImport, type ImportOptions } from "../lib/importer.ts";
import { rollbackBatch } from "../lib/batches.ts";
import { initEnvironment, seedSynthetic } from "../lib/seed.ts";
import { planReferralDegrees, planSynthetic, type ExistingState } from "../lib/synthetic.ts";

const ADMIN_URL = process.env.TEST_PG_URL ?? "postgresql://sparkeefy@localhost:55432/postgres";
const DB_NAME = `waitlist_test_${process.pid}`;
const dir = import.meta.dirname;
let db: Db;

const opts: ImportOptions = { source: "test backup", evidence: "unit test fixture", operator: "test", timestampTz: "UTC" };
const empty: ExistingState = { total: 0, referrals: 0, last7: 0, spike: 0, emails: new Set(), referralCodesLower: new Set() };

async function organic(email: string, createdAt: string, code: string) {
  const { rows } = await db.query(
    `INSERT INTO waitlist_users (email, referral_code, magic_link_token, created_at)
     VALUES ($1::text, $2::text, md5($1::text) || md5($2::text), $3::timestamptz AT TIME ZONE 'UTC') RETURNING id`,
    [email, code, createdAt]
  );
  return rows[0].id as string;
}

before(async () => {
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${DB_NAME}`);
  await admin.end();
  const url = new URL(ADMIN_URL);
  url.pathname = `/${DB_NAME}`;
  db = connect(url.toString());
  await db.query(readFileSync(join(dir, "base-schema.sql"), "utf8"));
  await db.query(readFileSync(join(dir, "..", "..", "..", "src/lib/db/sql/0001_data_integrity.sql"), "utf8"));
});

after(async () => {
  await db?.end();
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE)`);
  await admin.end();
});

describe("synthetic planner (pure)", () => {
  const now = new Date("2026-10-20T12:00:00Z");
  const targets = { total: 7143, referrals: 3071, last7: 10, spikeTotal: 4000 };
  const existing = { ...empty, total: 1916, referrals: 833, last7: 7, spike: 0 };

  test("uses the brief's exact degree table and totals", () => {
    const plan = planSynthetic({ seed: "s", now, existing, targets });
    assert.equal(plan.users.length, 5227);
    assert.equal(plan.referrals.length, 2238);
    assert.deepEqual(plan.degreeTable, [[0, 4312], [1, 31], [2, 550], [3, 300], [4, 20], [6, 7], [7, 4], [19, 3]]);
  });

  test("is deterministic per seed and differs across seeds", () => {
    const a = planSynthetic({ seed: "same", now, existing, targets });
    const b = planSynthetic({ seed: "same", now, existing, targets });
    const c = planSynthetic({ seed: "other", now, existing, targets });
    assert.deepEqual(a.users.map((u) => [u.email, u.createdAt.getTime()]), b.users.map((u) => [u.email, u.createdAt.getTime()]));
    assert.notEqual(a.users[0].email, c.users[0].email);
  });

  test("referral graph: no self, no double-referred, strictly chronological", () => {
    const plan = planSynthetic({ seed: "graph", now, existing, targets });
    const at = new Map(plan.users.map((u) => [u.id, u.createdAt.getTime()]));
    const referees = new Set<string>();
    for (const r of plan.referrals) {
      assert.notEqual(r.referrerId, r.refereeId);
      assert.ok(!referees.has(r.refereeId), "referee referred twice");
      referees.add(r.refereeId);
      assert.ok(at.get(r.referrerId)! < at.get(r.refereeId)!);
    }
  });

  test("degree planner hits arbitrary totals exactly", () => {
    for (const [users, refs] of [[100, 37], [5000, 1], [800, 799], [3, 0], [2500, 1300]]) {
      const table = planReferralDegrees(users, refs);
      assert.equal(table.reduce((s, [, c]) => s + c, 0), users);
      assert.equal(table.reduce((s, [d, c]) => s + d * c, 0), refs);
    }
  });

  test("refuses impossible targets instead of guessing", () => {
    assert.throws(() => planSynthetic({ seed: "x", now, existing: { ...existing, last7: 12 }, targets }), /last-7-days/);
    assert.throws(() => planSynthetic({ seed: "x", now, existing, targets: { ...targets, total: 1000 } }), /below existing/);
  });
});

describe("historical import", () => {
  let referrerId: string;

  test("parses timestamps without guessing a timezone", () => {
    assert.equal(parseTimestamp("2026-02-19 10:00:00", undefined), null);
    assert.equal(parseTimestamp("2026-02-19 10:00:00", "UTC")!.toISOString(), "2026-02-19T10:00:00.000Z");
    assert.equal(parseTimestamp("2026-02-19 15:30:00", "Asia/Kolkata")!.toISOString(), "2026-02-19T10:00:00.000Z");
    assert.equal(parseTimestamp("2026-02-19T10:00:00+05:30", undefined)!.toISOString(), "2026-02-19T04:30:00.000Z");
  });

  const deletedId = "11111111-1111-4111-8111-111111111111";
  const token = "a".repeat(64);
  const users = () => [
    { id: deletedId, email: " Restored.User@Example.com ", created_at: "2026-02-19 11:00:00", referral_code: "Rk7pQ2xY", magic_link_token: token, welcome_email_sent_at: "2026-02-19 11:00:05", marketing_opt_in: "true" },
    { id: "", email: "no.date@example.com", created_at: "", referral_code: "", magic_link_token: "", welcome_email_sent_at: "", marketing_opt_in: "" },
    { id: "", email: "fake@seed.sparkeefy.test", created_at: "2026-02-19 11:00:00", referral_code: "", magic_link_token: "", welcome_email_sent_at: "", marketing_opt_in: "" },
    { id: "", email: "restored.user@example.com", created_at: "2026-02-20 09:00:00", referral_code: "", magic_link_token: "", welcome_email_sent_at: "", marketing_opt_in: "" },
    { id: "", email: "second@example.com", created_at: "2026-02-20 09:00:00", referral_code: "", magic_link_token: "", welcome_email_sent_at: "", marketing_opt_in: "no" },
  ];

  test("dry run plans only verifiable rows and keeps original identifiers", async () => {
    referrerId = await organic("referrer@example.com", "2026-02-18T08:00:00Z", "Ab3dEf5h");
    const refs = [
      { referrer_id: referrerId, referee_id: deletedId, created_at: "2026-02-19 11:00:00" },
      { referrer_id: deletedId, referee_id: referrerId, created_at: "2026-02-10 00:00:00" }, // before the referrer existed
    ];
    const plan = await planImport(db, users(), refs, opts);
    assert.equal(plan.users.length, 2);
    const restored = plan.users.find((u) => u.id === deletedId)!;
    assert.equal(restored.email, "restored.user@example.com");
    assert.ok(restored.referralCodeKept && restored.magicLinkKept);
    assert.equal(plan.rejected.length, 2); // missing date, synthetic
    assert.equal(plan.skipped.length, 1); // later duplicate of the same email
    assert.equal(plan.referrals.length, 1);
    assert.match(plan.referralsRejected[0].reason, /before the referrer signed up/);
    const synthetic = plan.rejected.find((r) => r.email.endsWith(".test"))!;
    assert.match(synthetic.reason, /synthetic/);
  });

  test("a failure mid-import writes nothing and leaves an audit row", async () => {
    const refs = [{ referrer_id: referrerId, referee_id: deletedId, created_at: "2026-02-19 11:00:00" }];
    const before = await metrics(db);
    await assert.rejects(applyImport(db, users(), refs, { ...opts, simulateFailureAfterUsers: true }, { users: 2, referrals: 1 }), /simulated failure/);
    const after = await metrics(db);
    assert.deepEqual(after.all, before.all);
    const { rows } = await db.query(`SELECT status FROM import_batches WHERE kind = 'historical_import'`);
    assert.deepEqual(rows.map((r) => r.status), ["failed"]);
  });

  test("refuses to apply when the plan differs from the approved dry run", async () => {
    await assert.rejects(applyImport(db, users(), [], opts, { users: 99, referrals: 0 }), /plan changed/);
  });

  let batchId: string;
  test("applies, preserves timestamps/codes/tokens, and holds unsent welcome emails", async () => {
    const refs = [{ referrer_id: referrerId, referee_id: deletedId, created_at: "2026-02-19 11:00:00" }];
    const res = await applyImport(db, users(), refs, opts, { users: 2, referrals: 1 });
    batchId = res.batchId;
    const { rows } = await db.query(
      `SELECT email, referral_code, magic_link_token, (created_at AT TIME ZONE 'UTC') AS created_at, welcome_email_status, data_source
         FROM waitlist_users WHERE import_batch_id = $1 ORDER BY email`,
      [batchId]
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0].email, "restored.user@example.com");
    assert.equal(rows[0].referral_code, "Rk7pQ2xY");
    assert.equal(rows[0].magic_link_token, token);
    assert.equal(rows[0].created_at.toISOString(), "2026-02-19T11:00:00.000Z");
    assert.equal(rows[0].welcome_email_status, null); // the source says it was sent
    assert.equal(rows[1].welcome_email_status, "held_import");
    const failing = (await runChecks(db)).filter((c) => !c.ok);
    assert.deepEqual(failing, []);
  });

  test("re-running the same import is a no-op (idempotent)", async () => {
    const plan = await planImport(db, users(), [{ referrer_id: referrerId, referee_id: deletedId, created_at: "2026-02-19 11:00:00" }], opts);
    assert.equal(plan.users.length, 0);
    assert.equal(plan.referrals.length, 0);
  });

  test("rollback removes exactly the batch and protects later organic referrals", async () => {
    const newcomer = await organic("newcomer@example.com", "2026-10-01T00:00:00Z", "Zz9yXw8v");
    await db.query(`INSERT INTO referrals (referrer_id, referee_id) VALUES ($1, $2)`, [deletedId, newcomer]);
    await assert.rejects(rollbackBatch(db, batchId, "historical_import"), /--force/);
    await assert.rejects(rollbackBatch(db, batchId, "synthetic_seed"), /matching tool/);
    const res = await rollbackBatch(db, batchId, "historical_import", { force: true });
    assert.equal(res.users, 2);
    const m = await metrics(db);
    assert.equal(m.real.users, 2); // the two organic users remain untouched
  });
});

describe("synthetic seeding", () => {
  test("refuses a database without a staging marker", async () => {
    await assert.rejects(
      seedSynthetic(db, { seed: "t", targets: { total: 10, referrals: 2, last7: 1, spikeTotal: 0 }, dryRun: false, operator: "test" }),
      /waitlist_environment/
    );
  });

  test("adds only the delta, never touches real rows, and rolls back cleanly", async () => {
    await initEnvironment(db, "local", "test");
    const before = await metrics(db);
    const targets = { total: before.all.users + 300, referrals: before.all.referrals + 120, last7: before.all.last7 + 3, spikeTotal: 150 };
    const res = await seedSynthetic(db, { seed: "t", targets, dryRun: false, operator: "test" });
    assert.ok(res.realRowsUnchanged);
    const mid = await metrics(db);
    assert.equal(mid.all.users, targets.total);
    assert.equal(mid.all.referrals, targets.referrals);
    assert.equal(mid.all.last7, targets.last7);
    assert.deepEqual(mid.real, before.real);
    assert.deepEqual((await runChecks(db)).filter((c) => !c.ok), []);

    await rollbackBatch(db, res.batchId!, "synthetic_seed");
    const after = await metrics(db);
    assert.deepEqual(after.all, before.all);
  });

  test("the schema itself refuses an emailed or deliverable synthetic row", async () => {
    await assert.rejects(
      db.query(`INSERT INTO import_batches (id, kind, source) VALUES ('22222222-2222-4222-8222-222222222222', 'synthetic_seed', 't');
                INSERT INTO waitlist_users (email, referral_code, magic_link_token, data_source, is_synthetic, import_batch_id, welcome_email_status)
                VALUES ('real.person@gmail.com', 'Qq2wE3rT', repeat('b', 64), 'synthetic_seed', true, '22222222-2222-4222-8222-222222222222', 'suppressed_synthetic')`),
      /synthetic_email_chk/
    );
  });
});
