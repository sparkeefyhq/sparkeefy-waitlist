/**
 * Shared Postgres helpers for the waitlist data tools.
 *
 * All timestamps in waitlist tables are `timestamp without time zone` holding
 * UTC. node-postgres serialises JS Dates in the *process* timezone, which would
 * silently shift rows written from an IST laptop, so these tools pin TZ=UTC and
 * pass timestamps as ISO strings cast with `AT TIME ZONE 'UTC'`.
 */

process.env.TZ = "UTC";

import pg from "pg";

export type Db = pg.Pool;
export type Tx = pg.PoolClient;

export function connect(url = process.env.DATABASE_URL): Db {
  if (!url) throw new Error("DATABASE_URL is not set");
  return new pg.Pool({ connectionString: url, max: 4 });
}

export async function withTransaction<T>(db: Db, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const tx = await db.connect();
  try {
    await tx.query("BEGIN");
    const out = await fn(tx);
    await tx.query("COMMIT");
    return out;
  } catch (err) {
    await tx.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    tx.release();
  }
}

/** Host/database of a connection string, for logs and confirmations. Never the password. */
export function describeTarget(url = process.env.DATABASE_URL ?? ""): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? ":" + u.port : ""}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

export function isLocalTarget(url = process.env.DATABASE_URL ?? ""): boolean {
  try {
    return ["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Fails fast with a clear message if migration 0001 has not been applied. */
export async function assertMigrated(db: Db | Tx): Promise<void> {
  const { rows } = await db.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_name = 'waitlist_users' AND column_name = 'data_source'`
  );
  if (!rows.length) {
    throw new Error(
      "Migration 0001 is not applied. Run: psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f src/lib/db/sql/0001_data_integrity.sql"
    );
  }
}

/**
 * Order-independent fingerprint of every non-synthetic signup and referral.
 * Taken before and after seeding to prove real rows were not touched.
 */
export async function realDataChecksum(db: Db | Tx): Promise<{ users: string; referrals: string; userCount: number }> {
  const { rows } = await db.query(`
    SELECT
      (SELECT coalesce(md5(string_agg(md5(u::text), '' ORDER BY u.id)), '') FROM waitlist_users u WHERE NOT u.is_synthetic) AS users,
      (SELECT coalesce(md5(string_agg(md5(r::text), '' ORDER BY r.id)), '') FROM referrals r WHERE r.data_source <> 'synthetic_seed') AS referrals,
      (SELECT count(*)::int FROM waitlist_users WHERE NOT is_synthetic) AS user_count
  `);
  return { users: rows[0].users, referrals: rows[0].referrals, userCount: rows[0].user_count };
}

/** Insert rows column-wise with unnest(); one round trip per chunk. */
export async function insertColumns(
  tx: Tx,
  table: string,
  columns: Array<{ name: string; type: string; values: unknown[]; expr?: (p: string) => string }>,
  opts: { onConflictDoNothing?: boolean; chunk?: number } = {}
): Promise<number> {
  const n = columns[0]?.values.length ?? 0;
  const size = opts.chunk ?? 1000;
  let inserted = 0;
  for (let start = 0; start < n; start += size) {
    const params = columns.map((c) => c.values.slice(start, start + size));
    const names = columns.map((c) => c.name).join(", ");
    const selects = columns.map((c, i) => (c.expr ? c.expr(`c${i}`) : `c${i}`)).join(", ");
    const unnest = columns.map((c, i) => `$${i + 1}::${c.type}[]`).join(", ");
    const aliases = columns.map((_, i) => `c${i}`).join(", ");
    const res = await tx.query(
      `INSERT INTO ${table} (${names})
       SELECT ${selects} FROM unnest(${unnest}) AS t(${aliases})
       ${opts.onConflictDoNothing ? "ON CONFLICT DO NOTHING" : ""}`,
      params
    );
    inserted += res.rowCount ?? 0;
  }
  return inserted;
}

/** `timestamptz` ISO string → stored UTC `timestamp`. */
export const utcExpr = (p: string) => `(${p} AT TIME ZONE 'UTC')`;
