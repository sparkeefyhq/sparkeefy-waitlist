/**
 * Restore genuine historical signups into the waitlist.
 *
 *   # 1. Preview (default; writes nothing):
 *   node scripts/waitlist/import.ts --users users.csv [--referrals referrals.csv] \
 *     --source "supabase backup 2026-03-01" --evidence "pre-deletion backup of the live waitlist" \
 *     --timestamp-tz UTC
 *
 *   # 2. Apply exactly what the preview showed (backs up first with pg_dump):
 *   node scripts/waitlist/import.ts ...same flags... --apply --expect-users 1234 --expect-referrals 456
 *
 *   node scripts/waitlist/import.ts --list
 *   node scripts/waitlist/import.ts --rollback <batch-id> [--force]
 *
 * users.csv columns (header names are case/format-insensitive):
 *   required: email, created_at
 *   optional: id, username, first_name, last_name, phone_number, marketing_opt_in,
 *             additional_remarks, referral_code, magic_link_token, welcome_email_sent_at,
 *             source_record_id, referred_by_email | referred_by_code
 * referrals.csv columns: referrer_id, referee_id, created_at  (ids from the same export)
 *
 * Loads .env from the repo root. Requires DATABASE_URL.
 */

import { execFileSync } from "child_process";
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { parseArgs } from "util";
import { config } from "dotenv";
import { parseCsv, toCsv } from "./lib/csv.ts";
import { connect, describeTarget } from "./lib/db.ts";
import { listBatches, rollbackBatch } from "./lib/batches.ts";
import { applyImport, planImport, type ImportOptions, type ImportPlan } from "./lib/importer.ts";

config({ path: join(import.meta.dirname, "..", "..", ".env"), quiet: true });

const { values: a } = parseArgs({
  options: {
    users: { type: "string" },
    referrals: { type: "string" },
    source: { type: "string" },
    evidence: { type: "string" },
    "timestamp-tz": { type: "string" },
    operator: { type: "string", default: process.env.USER ?? "unknown" },
    apply: { type: "boolean", default: false },
    "expect-users": { type: "string" },
    "expect-referrals": { type: "string" },
    "backup-dir": { type: "string", default: ".backups" },
    "skip-backup": { type: "string" },
    "report-dir": { type: "string", default: ".backups" },
    list: { type: "boolean", default: false },
    rollback: { type: "string" },
    force: { type: "boolean", default: false },
  },
});

function printPlan(plan: ImportPlan) {
  console.log("\nImport preview");
  for (const [k, v] of Object.entries(plan.summary)) console.log(`  ${k.padEnd(26)} ${v}`);
  const show = (title: string, items: Array<{ line: number; reason: string; email?: string }>) => {
    if (!items.length) return;
    const byReason = new Map<string, number>();
    for (const i of items) byReason.set(i.reason, (byReason.get(i.reason) ?? 0) + 1);
    console.log(`\n${title}`);
    for (const [r, n] of byReason) console.log(`  ${String(n).padStart(5)}  ${r}`);
  };
  show("Rejected users", plan.rejected);
  show("Skipped users", plan.skipped);
  show("Rejected referrals", plan.referralsRejected);
  show("Skipped referrals", plan.referralsSkipped);
  if (plan.warnings.length) {
    console.log(`\nWarnings (${plan.warnings.length}, first 10)`);
    plan.warnings.slice(0, 10).forEach((w) => console.log("  " + w));
  }
}

function backup(dir: string): string {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `waitlist-before-import-${new Date().toISOString().replace(/[:.]/g, "-")}.dump`);
  execFileSync(
    "pg_dump",
    ["--format=custom", "--no-owner", "-t", "waitlist_users", "-t", "referrals", "-t", "import_batches", "-t", "slack_access_surveys", "-t", "waitlist_deletions", "-f", file, process.env.DATABASE_URL!],
    { stdio: "inherit" }
  );
  return file;
}

async function main() {
  const db = connect();
  try {
    console.log(`Target: ${describeTarget()}`);
    if (a.list) {
      console.table(await listBatches(db));
      return;
    }
    if (a.rollback) {
      const res = await rollbackBatch(db, a.rollback, "historical_import", { force: a.force });
      console.log(res.alreadyRolledBack ? "Batch was already rolled back." : `Rolled back batch ${res.batchId}: removed ${res.users} users, ${res.referrals} referrals.`);
      return;
    }

    if (!a.users || !a.source || !a.evidence) {
      throw new Error("--users, --source and --evidence are required (evidence = where these signups and their opt-in come from)");
    }
    if (a["timestamp-tz"] && !["UTC", "Asia/Kolkata"].includes(a["timestamp-tz"])) throw new Error("--timestamp-tz must be UTC or Asia/Kolkata");

    const usersText = readFileSync(a.users, "utf8");
    const referralsText = a.referrals ? readFileSync(a.referrals, "utf8") : "";
    const opts: ImportOptions = {
      source: a.source,
      evidence: a.evidence,
      operator: a.operator!,
      timestampTz: a["timestamp-tz"] as ImportOptions["timestampTz"],
      sourceSha256: createHash("sha256").update(usersText).update(referralsText).digest("hex"),
    };
    const userRows = parseCsv(usersText);
    const referralRows = a.referrals ? parseCsv(referralsText) : [];

    const plan = await planImport(db, userRows, referralRows, opts);
    printPlan(plan);

    // Full per-row report for review (contains emails: kept in the git-ignored .backups/).
    mkdirSync(a["report-dir"]!, { recursive: true });
    const reportFile = join(a["report-dir"]!, `import-report-${Date.now()}.csv`);
    writeFileSync(
      reportFile,
      toCsv([
        ...plan.users.map((u) => ({ line: u.line, email: u.email, outcome: "insert", reason: u.referralCodeKept ? "" : "referral code regenerated" })),
        ...plan.skipped.map((s) => ({ line: s.line, email: s.email, outcome: "skip", reason: s.reason })),
        ...plan.rejected.map((s) => ({ line: s.line, email: s.email, outcome: "reject", reason: s.reason })),
      ])
    );
    console.log(`\nPer-row report: ${reportFile}`);

    if (!a.apply) {
      if (plan.users.length || plan.referrals.length) {
        console.log(`\nDry run only. To apply exactly this plan:\n  --apply --expect-users ${plan.users.length} --expect-referrals ${plan.referrals.length}`);
      } else {
        console.log("\nNothing to import: every row is already present.");
      }
      return;
    }

    if (a["expect-users"] === undefined || a["expect-referrals"] === undefined) {
      throw new Error("--apply needs --expect-users and --expect-referrals from the dry-run");
    }
    if (a["skip-backup"]) {
      console.log(`\nSkipping pg_dump; backup reference: ${a["skip-backup"]}`);
    } else {
      if (!existsSync(a["backup-dir"]!)) mkdirSync(a["backup-dir"]!, { recursive: true });
      console.log(`\nBacking up tables with pg_dump …`);
      console.log(`Backup: ${backup(a["backup-dir"]!)}`);
    }

    const res = await applyImport(db, userRows, referralRows, opts, {
      users: Number(a["expect-users"]),
      referrals: Number(a["expect-referrals"]),
    });
    console.log(`\nApplied batch ${res.batchId}: ${res.users} users, ${res.referrals} referrals.`);
    console.log(`Undo with: node scripts/waitlist/import.ts --rollback ${res.batchId}`);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
