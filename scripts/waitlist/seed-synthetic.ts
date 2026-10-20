/**
 * Synthetic staging dataset (STAGING / LOCAL ONLY — refuses production).
 *
 *   # once per staging DB, deliberately:
 *   node scripts/waitlist/seed-synthetic.ts --init-environment staging --confirm-target <host:port/db>
 *
 *   # preview, then write:
 *   node scripts/waitlist/seed-synthetic.ts --confirm-target <host:port/db> --seed sparkeefy-2026 \
 *     --total 7143 --referrals 3071 --last7 10 --spike-total 4000 [--apply]
 *
 *   node scripts/waitlist/seed-synthetic.ts --confirm-target <host:port/db> --rollback <batch-id>
 *
 * Targets are FINAL totals; the tool counts what is already there and adds the
 * difference. Every row is is_synthetic, uses @seed.sparkeefy.test and is
 * marked suppressed_synthetic so it can never be emailed.
 */

import { join } from "path";
import { parseArgs } from "util";
import { config } from "dotenv";
import { connect, describeTarget, isLocalTarget } from "./lib/db.ts";
import { rollbackBatch } from "./lib/batches.ts";
import { metrics, printChecks, runChecks } from "./lib/invariants.ts";
import { assertConfirmedTarget, assertNotProductionProcess, initEnvironment, seedSynthetic } from "./lib/seed.ts";
import { defaultWindows } from "./lib/synthetic.ts";

config({ path: join(import.meta.dirname, "..", "..", ".env"), quiet: true });

const { values: a } = parseArgs({
  options: {
    "confirm-target": { type: "string" },
    "init-environment": { type: "string" },
    seed: { type: "string", default: "sparkeefy-staging" },
    total: { type: "string", default: "7143" },
    referrals: { type: "string", default: "3071" },
    last7: { type: "string", default: "10" },
    "spike-total": { type: "string", default: "4000" },
    apply: { type: "boolean", default: false },
    rollback: { type: "string" },
    force: { type: "boolean", default: false },
    operator: { type: "string", default: process.env.USER ?? "unknown" },
  },
});

async function main() {
  assertNotProductionProcess();
  assertConfirmedTarget(a["confirm-target"]);
  const db = connect();
  try {
    console.log(`Target: ${describeTarget()}${isLocalTarget() ? " (local)" : ""}`);

    if (a["init-environment"]) {
      if (!["staging", "local"].includes(a["init-environment"])) throw new Error("--init-environment must be staging or local");
      await initEnvironment(db, a["init-environment"] as "staging" | "local", a.operator!);
      console.log(`Marked this database as '${a["init-environment"]}'.`);
      return;
    }
    if (a.rollback) {
      const res = await rollbackBatch(db, a.rollback, "synthetic_seed", { force: a.force });
      console.log(`Rolled back synthetic batch ${res.batchId}: removed ${res.users} users, ${res.referrals} referrals.`);
      return;
    }

    const targets = {
      total: Number(a.total),
      referrals: Number(a.referrals),
      last7: Number(a.last7),
      spikeTotal: Number(a["spike-total"]),
    };
    const windows = defaultWindows();
    const t0 = Date.now();
    const res = await seedSynthetic(db, { seed: a.seed!, targets, windows, dryRun: !a.apply, operator: a.operator! });

    console.log(`\nStarting state:   ${res.before.total} signups, ${res.before.referrals} referrals, ${res.before.last7} in last 7 days, ${res.before.spike} in spike window`);
    console.log(`Targets:          ${targets.total} signups, ${targets.referrals} referrals, ${targets.last7} in last 7 days, ~${targets.spikeTotal} in 19–20 Feb (synthetic scenario data)`);
    console.log(`To add:           ${res.plan.counts.newUsers} users (${res.plan.counts.spike} spike, ${res.plan.counts.last7} last-7-days, ${res.plan.counts.rest} other), ${res.plan.counts.newReferrals} referrals`);
    console.log(`Referral degrees: ${res.plan.degreeTable.map(([d, c]) => `${c}×${d}`).join("  ")}`);
    const regions = new Map<string, number>();
    for (const u of res.plan.users) regions.set(u.region, (regions.get(u.region) ?? 0) + 1);
    console.log(`Name regions:     ${[...regions].sort((x, y) => y[1] - x[1]).map(([r, n]) => `${r} ${n}`).join(", ")}`);
    console.log(`Sample usernames: ${res.plan.users.filter((_, i) => i % Math.max(1, Math.floor(res.plan.users.length / 10)) === 0).slice(0, 10).map((u) => u.username).join(", ")}`);

    if (res.dryRun) {
      console.log("\nDry run only (nothing written). Add --apply to write.");
      return;
    }
    console.log(`\nApplied synthetic batch ${res.batchId} in ${((Date.now() - t0) / 1000).toFixed(1)}s. Real rows unchanged: ${res.realRowsUnchanged}`);
    const m = await metrics(db);
    console.log(`Now: ${m.all.users} signups, ${m.all.referrals} referrals, ${m.all.last7} in last 7 days (real: ${m.real.users} / ${m.real.referrals})`);
    console.log("\nInvariants");
    printChecks(await runChecks(db));
    console.log(`\nUndo with: node scripts/waitlist/seed-synthetic.ts --confirm-target ${describeTarget()} --rollback ${res.batchId}`);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
