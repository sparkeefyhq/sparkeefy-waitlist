/**
 * Read-only integrity report: metrics plus every invariant as an explicit query.
 * Safe on production.
 *
 *   node scripts/waitlist/validate.ts
 *   node scripts/waitlist/validate.ts --expect-total 7143 --expect-referrals 3071 --expect-last7 10
 *
 * Exit code 1 if any check fails.
 */

import { join } from "path";
import { parseArgs } from "util";
import { config } from "dotenv";
import { assertMigrated, connect, describeTarget } from "./lib/db.ts";
import { expectEqual, metrics, printChecks, runChecks, type Check } from "./lib/invariants.ts";

config({ path: join(import.meta.dirname, "..", "..", ".env"), quiet: true });

const { values: a } = parseArgs({
  options: {
    "expect-total": { type: "string" },
    "expect-referrals": { type: "string" },
    "expect-last7": { type: "string" },
    "expect-real-total": { type: "string" },
  },
});
const num = (v: string | undefined) => (v === undefined ? undefined : Number(v));

async function main() {
  const db = connect();
  try {
    await assertMigrated(db);
    const m = await metrics(db);
    console.log(`Target: ${describeTarget()}   DB TimeZone: ${m.dbTimeZone}`);
    console.log(`\n                 signups  referrals  last-7-days`);
    console.log(`  all rows       ${String(m.all.users).padStart(7)}  ${String(m.all.referrals).padStart(9)}  ${String(m.all.last7).padStart(11)}`);
    console.log(`  real only      ${String(m.real.users).padStart(7)}  ${String(m.real.referrals).padStart(9)}  ${String(m.real.last7).padStart(11)}`);
    console.log(`  synthetic      ${String(m.synthetic.users).padStart(7)}  ${String(m.synthetic.referrals).padStart(9)}`);
    console.log(`  by source      ${JSON.stringify(m.bySource)}`);
    console.log(`  welcome emails ${m.real.welcomeSent} of ${m.real.users} real signups`);
    if (m.dbTimeZone !== "UTC" && m.dbTimeZone !== "Etc/UTC") {
      console.log(`\n  NOTE: DB TimeZone is ${m.dbTimeZone}; created_at defaults are written in that zone, not UTC.`);
    }

    const checks: Check[] = [
      expectEqual("total signups", m.all.users, num(a["expect-total"])),
      expectEqual("total referrals", m.all.referrals, num(a["expect-referrals"])),
      expectEqual("last-7-day signups", m.all.last7, num(a["expect-last7"])),
      expectEqual("real signups", m.real.users, num(a["expect-real-total"])),
    ].filter((c): c is Check => c !== null);
    checks.push(...(await runChecks(db)));

    console.log("\nInvariants");
    const ok = printChecks(checks);
    console.log(ok ? "\nAll checks passed." : "\nSome checks FAILED.");
    process.exitCode = ok ? 0 : 1;
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
