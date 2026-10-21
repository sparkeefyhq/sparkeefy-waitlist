/**
 * Load the 21 Oct backup file into backup_list (shown on /admin as "Backup list").
 * backup_list is separate from waitlist_users: never counted as signups or
 * referrals, never emailed. Apply src/lib/db/sql/0002_backup_list.sql first.
 *
 *   node scripts/waitlist/import-backup-list.ts --file backup.csv --timestamp-tz Asia/Kolkata   # preview
 *   node scripts/waitlist/import-backup-list.ts ...same... --apply                             # write
 *
 * CSV columns: email, signed_up_at (YYYY-MM-DD HH:MM:SS, optional), referral_count (optional).
 * Re-running is safe: emails already in backup_list are skipped.
 */

import { readFileSync } from "fs";
import { basename, join } from "path";
import { parseArgs } from "util";
import { config } from "dotenv";
import { parseCsv } from "./lib/csv.ts";
import { connect, describeTarget, withTransaction } from "./lib/db.ts";

config({ path: join(import.meta.dirname, "..", "..", ".env"), quiet: true });

const { values: a } = parseArgs({
  options: {
    file: { type: "string" },
    "timestamp-tz": { type: "string" },
    source: { type: "string" },
    apply: { type: "boolean", default: false },
  },
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
  if (!a.file) throw new Error("--file is required");
  const tz = a["timestamp-tz"];
  if (tz !== "UTC" && tz !== "Asia/Kolkata") throw new Error("--timestamp-tz must be UTC or Asia/Kolkata (the zone the file's dates are in)");
  const source = a.source ?? `${basename(a.file)} (backup, 21 Oct 2026)`;

  const seen = new Set<string>();
  const rows: Array<{ email: string; signedUpAt: string | null; referrals: number }> = [];
  let invalid = 0;
  for (const r of parseCsv(readFileSync(a.file, "utf8"))) {
    const email = (r.email ?? "").trim().toLowerCase();
    const at = (r.signed_up_at ?? "").trim();
    const referrals = Number(r.referral_count ?? 0);
    if (!EMAIL.test(email) || seen.has(email) || !Number.isInteger(referrals) || referrals < 0 || (at && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(at))) {
      invalid += 1;
      continue;
    }
    seen.add(email);
    rows.push({ email, signedUpAt: at || null, referrals });
  }

  const db = connect();
  try {
    console.log(`Target: ${describeTarget()}`);
    const existing = await db.query<{ email: string }>("SELECT email FROM backup_list WHERE email = ANY($1)", [rows.map((r) => r.email)]);
    const have = new Set(existing.rows.map((r) => r.email));
    const toInsert = rows.filter((r) => !have.has(r.email));
    console.log(`File rows valid: ${rows.length}, invalid/duplicate: ${invalid}, already in backup_list: ${have.size}, to add: ${toInsert.length}`);
    console.log(`Referrals in rows to add: ${toInsert.reduce((n, r) => n + r.referrals, 0)}`);
    if (!a.apply) {
      console.log("\nDry run only. Re-run with --apply to write.");
      return;
    }
    await withTransaction(db, async (tx) => {
      for (let i = 0; i < toInsert.length; i += 500) {
        const chunk = toInsert.slice(i, i + 500);
        await tx.query(
          `INSERT INTO backup_list (email, backup_signed_up_at, backup_referral_count, source)
           SELECT e, (t::timestamp AT TIME ZONE $4) AT TIME ZONE 'UTC', n, $5
             FROM unnest($1::text[], $2::text[], $3::int[]) AS x(e, t, n)
           ON CONFLICT (email) DO NOTHING`,
          [chunk.map((r) => r.email), chunk.map((r) => r.signedUpAt), chunk.map((r) => r.referrals), tz, source]
        );
      }
    });
    const total = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM backup_list");
    console.log(`\nApplied. backup_list now has ${total.rows[0].n} rows. Undo: src/lib/db/sql/0002_backup_list.down.sql`);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
