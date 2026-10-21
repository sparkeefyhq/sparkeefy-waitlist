/** Import/seed batch audit log: listing and rollback. */

import { withTransaction, type Db } from "./db.ts";

export type BatchKind = "historical_import" | "synthetic_seed";

export async function listBatches(db: Db) {
  const { rows } = await db.query(`
    SELECT b.id, b.kind, b.source, b.status, b.operator, b.user_count, b.referral_count,
           b.created_at, b.applied_at, b.rolled_back_at,
           (SELECT count(*)::int FROM waitlist_users u WHERE u.import_batch_id = b.id) AS live_users
      FROM import_batches b ORDER BY b.created_at DESC`);
  return rows;
}

/**
 * Removes exactly the rows a batch created. Organic rows are never touched,
 * except organic referrals that later attached to the batch's users (they
 * cascade with those users); those are counted first and need `force`.
 */
export async function rollbackBatch(db: Db, batchId: string, kind: BatchKind, opts: { force?: boolean } = {}) {
  return withTransaction(db, async (tx) => {
    const { rows } = await tx.query(`SELECT id, kind, status FROM import_batches WHERE id = $1 FOR UPDATE`, [batchId]);
    const batch = rows[0];
    if (!batch) throw new Error(`batch ${batchId} not found`);
    if (batch.kind !== kind) throw new Error(`batch ${batchId} is a ${batch.kind} batch; use the matching tool`);
    if (batch.status === "rolled_back") return { batchId, users: 0, referrals: 0, organicReferralsRemoved: 0, alreadyRolledBack: true };

    const dependent = await tx.query(
      `SELECT count(*)::int AS n FROM referrals r
        WHERE r.import_batch_id IS DISTINCT FROM $1
          AND (r.referrer_id IN (SELECT id FROM waitlist_users WHERE import_batch_id = $1)
            OR r.referee_id  IN (SELECT id FROM waitlist_users WHERE import_batch_id = $1))`,
      [batchId]
    );
    const organicReferralsRemoved = dependent.rows[0].n as number;
    if (organicReferralsRemoved > 0 && !opts.force) {
      throw new Error(
        `${organicReferralsRemoved} referral(s) created outside this batch involve its users and would be removed too. Re-run with --force if that is intended.`
      );
    }

    const refs = await tx.query(`DELETE FROM referrals WHERE import_batch_id = $1`, [batchId]);
    const users = await tx.query(`DELETE FROM waitlist_users WHERE import_batch_id = $1`, [batchId]);
    await tx.query(
      `UPDATE import_batches SET status = 'rolled_back', rolled_back_at = now() AT TIME ZONE 'UTC',
              report = report || jsonb_build_object('rollback', jsonb_build_object('users', $2::int, 'referrals', $3::int, 'organic_referrals_removed', $4::int))
        WHERE id = $1`,
      [batchId, users.rowCount, refs.rowCount, organicReferralsRemoved]
    );
    return { batchId, users: users.rowCount ?? 0, referrals: refs.rowCount ?? 0, organicReferralsRemoved, alreadyRolledBack: false };
  });
}
