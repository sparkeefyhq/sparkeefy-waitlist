/**
 * Every data-integrity invariant as an explicit SQL query (brief, step 8).
 * Used by validate.ts, by the seeder after it commits, and by the tests.
 */

import type { Db, Tx } from "./db.ts";

export const LAST_7_DAYS_SQL = `created_at >= (now() AT TIME ZONE 'UTC') - interval '7 days'`;

export type Metrics = {
  all: { users: number; referrals: number; last7: number };
  real: { users: number; referrals: number; last7: number; welcomeSent: number };
  synthetic: { users: number; referrals: number };
  bySource: Record<string, number>;
  dbTimeZone: string;
};

export async function metrics(db: Db | Tx): Promise<Metrics> {
  const { rows } = await db.query(`
    SELECT
      (SELECT count(*) FROM waitlist_users)::int                                             AS all_users,
      (SELECT count(*) FROM referrals)::int                                                  AS all_referrals,
      (SELECT count(*) FROM waitlist_users WHERE ${LAST_7_DAYS_SQL})::int                    AS all_last7,
      (SELECT count(*) FROM waitlist_users WHERE NOT is_synthetic)::int                      AS real_users,
      (SELECT count(*) FROM referrals WHERE data_source <> 'synthetic_seed')::int            AS real_referrals,
      (SELECT count(*) FROM waitlist_users WHERE NOT is_synthetic AND ${LAST_7_DAYS_SQL})::int AS real_last7,
      (SELECT count(*) FROM waitlist_users WHERE NOT is_synthetic AND welcome_email_sent_at IS NOT NULL)::int AS real_welcome,
      (SELECT count(*) FROM waitlist_users WHERE is_synthetic)::int                          AS syn_users,
      (SELECT count(*) FROM referrals WHERE data_source = 'synthetic_seed')::int             AS syn_referrals,
      (SELECT coalesce(jsonb_object_agg(data_source, n), '{}'::jsonb)
         FROM (SELECT data_source, count(*)::int n FROM waitlist_users GROUP BY 1) s)        AS by_source,
      current_setting('TimeZone')                                                            AS tz
  `);
  const r = rows[0];
  return {
    all: { users: r.all_users, referrals: r.all_referrals, last7: r.all_last7 },
    real: { users: r.real_users, referrals: r.real_referrals, last7: r.real_last7, welcomeSent: r.real_welcome },
    synthetic: { users: r.syn_users, referrals: r.syn_referrals },
    bySource: r.by_source,
    dbTimeZone: r.tz,
  };
}

export type Check = { name: string; value: number | string; expected: string; ok: boolean; severity: "error" | "info" };

/** Each query returns a single number; `expect` describes the passing value. */
const CHECKS: Array<{ name: string; sql: string; expectZero?: boolean; severity?: "error" | "info"; note?: string }> = [
  { name: "unique emails (case-insensitive) = total", sql: `SELECT (count(*) - count(DISTINCT lower(trim(email))))::int FROM waitlist_users`, expectZero: true },
  { name: "unique referral codes (case-insensitive) = total", sql: `SELECT (count(*) - count(DISTINCT lower(referral_code)))::int FROM waitlist_users`, expectZero: true },
  { name: "invalid email syntax", sql: `SELECT count(*)::int FROM waitlist_users WHERE email !~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'`, expectZero: true },
  { name: "self-referrals", sql: `SELECT count(*)::int FROM referrals WHERE referrer_id = referee_id`, expectZero: true },
  { name: "referrals pointing at missing users", sql: `SELECT count(*)::int FROM referrals r LEFT JOIN waitlist_users a ON a.id = r.referrer_id LEFT JOIN waitlist_users b ON b.id = r.referee_id WHERE a.id IS NULL OR b.id IS NULL`, expectZero: true },
  { name: "duplicate (referrer, referee) pairs", sql: `SELECT count(*)::int FROM (SELECT 1 FROM referrals GROUP BY referrer_id, referee_id HAVING count(*) > 1) d`, expectZero: true },
  { name: "referral recorded before its referrer signed up", sql: `SELECT count(*)::int FROM referrals r JOIN waitlist_users a ON a.id = r.referrer_id WHERE r.created_at < a.created_at - interval '1 second'`, expectZero: true },
  { name: "synthetic referees referred more than once", sql: `SELECT count(*)::int FROM (SELECT referee_id FROM referrals WHERE data_source = 'synthetic_seed' GROUP BY 1 HAVING count(*) > 1) d`, expectZero: true },
  { name: "synthetic referral before referee signup or after-the-fact", sql: `SELECT count(*)::int FROM referrals r JOIN waitlist_users a ON a.id = r.referrer_id JOIN waitlist_users b ON b.id = r.referee_id WHERE r.data_source = 'synthetic_seed' AND NOT (a.created_at < b.created_at AND r.created_at = b.created_at)`, expectZero: true },
  { name: "referrals mixing synthetic and real users", sql: `SELECT count(*)::int FROM referrals r JOIN waitlist_users a ON a.id = r.referrer_id JOIN waitlist_users b ON b.id = r.referee_id WHERE a.is_synthetic <> b.is_synthetic OR (r.data_source = 'synthetic_seed') <> a.is_synthetic`, expectZero: true },
  { name: "synthetic rows marked as emailed", sql: `SELECT count(*)::int FROM waitlist_users WHERE is_synthetic AND (welcome_email_sent_at IS NOT NULL OR welcome_email_status IS DISTINCT FROM 'suppressed_synthetic')`, expectZero: true },
  { name: "synthetic rows with a deliverable email domain", sql: `SELECT count(*)::int FROM waitlist_users WHERE is_synthetic AND email NOT LIKE '%.test'`, expectZero: true },
  { name: "real rows with a reserved .test email", sql: `SELECT count(*)::int FROM waitlist_users WHERE NOT is_synthetic AND email LIKE '%.test'`, expectZero: true },
  { name: "signups in the future", sql: `SELECT count(*)::int FROM waitlist_users WHERE created_at > (now() AT TIME ZONE 'UTC') + interval '1 minute'`, expectZero: true },
  { name: "rows in a rolled-back or failed batch", sql: `SELECT count(*)::int FROM waitlist_users u JOIN import_batches b ON b.id = u.import_batch_id WHERE b.status <> 'applied'`, expectZero: true },
  {
    name: "real referees credited by more than one referrer",
    sql: `SELECT count(*)::int FROM (SELECT referee_id FROM referrals WHERE data_source <> 'synthetic_seed' GROUP BY 1 HAVING count(*) > 1) d`,
    severity: "info",
    note: "allowed by the app: an existing user who re-submits with a new code credits that referrer too",
  },
  {
    name: "real referrals where the referee signed up before the referrer",
    sql: `SELECT count(*)::int FROM referrals r JOIN waitlist_users a ON a.id = r.referrer_id JOIN waitlist_users b ON b.id = r.referee_id WHERE r.data_source <> 'synthetic_seed' AND b.created_at < a.created_at`,
    severity: "info",
    note: "existing users re-submitting with a newer user's code",
  },
];

export async function runChecks(db: Db | Tx): Promise<Check[]> {
  const out: Check[] = [];
  for (const c of CHECKS) {
    const { rows } = await db.query(c.sql);
    const value = Number(Object.values(rows[0])[0]);
    const severity = c.severity ?? "error";
    out.push({
      name: c.name,
      value,
      expected: c.expectZero ? "0" : c.note ?? "report",
      ok: c.expectZero ? value === 0 : true,
      severity,
    });
  }
  return out;
}

export function expectEqual(name: string, value: number, expected: number | undefined): Check | null {
  if (expected === undefined) return null;
  return { name, value, expected: String(expected), ok: value === expected, severity: "error" };
}

export function printChecks(checks: Check[]): boolean {
  const width = Math.max(...checks.map((c) => c.name.length));
  for (const c of checks) {
    const mark = c.severity === "info" ? "INFO" : c.ok ? "PASS" : "FAIL";
    console.log(`  ${mark.padEnd(4)}  ${c.name.padEnd(width)}  ${String(c.value).padStart(6)}   (expected ${c.expected})`);
  }
  return checks.every((c) => c.ok);
}
