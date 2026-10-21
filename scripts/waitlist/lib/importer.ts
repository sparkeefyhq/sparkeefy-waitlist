/**
 * Verified historical import (production-safe).
 *
 * Restores genuine signups — typically rows exported from a database backup
 * taken before rows were deleted — without inventing anything:
 *   - original ids, timestamps, referral codes and magic-link tokens are kept
 *     when they are valid and free, so old referral links and login links work;
 *   - referrals come only from the source (a referrals export, or an explicit
 *     referred_by_email / referred_by_code column) and must be chronological;
 *   - welcome_email_sent_at is kept only if the source says so; otherwise the
 *     row is 'held_import' and excluded from "Send all";
 *   - rows without a real timestamp are rejected, never back-filled;
 *   - reserved .test / synthetic rows are rejected outright.
 * Idempotent: rows already present (same id, email or source_record_id) are skipped.
 */

import { randomBytes, randomUUID } from "crypto";
import { assertMigrated, insertColumns, utcExpr, withTransaction, type Db, type Tx } from "./db.ts";
import { REFERRAL_CODE_ALPHABET } from "./synthetic.ts";

export type ImportOptions = {
  source: string;
  evidence: string;
  operator: string;
  /** How to read timestamps that carry no offset (e.g. a Postgres export of UTC `timestamp`). */
  timestampTz?: "UTC" | "Asia/Kolkata";
  sourceSha256?: string;
  /** Test hook: throw after users are inserted, to prove all-or-nothing behaviour. */
  simulateFailureAfterUsers?: boolean;
};

export type ImportUser = {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  marketingOptIn: boolean;
  additionalRemarks: string | null;
  referralCode: string;
  referralCodeKept: boolean;
  magicLinkToken: string;
  magicLinkKept: boolean;
  createdAt: Date;
  welcomeEmailSentAt: Date | null;
  sourceRecordId: string;
  line: number;
};

export type ImportReferral = { referrerId: string; refereeId: string; createdAt: Date; origin: string };

export type ImportPlan = {
  users: ImportUser[];
  referrals: ImportReferral[];
  skipped: Array<{ line: number; email: string; reason: string }>;
  rejected: Array<{ line: number; email: string; reason: string }>;
  referralsSkipped: Array<{ line: number; reason: string }>;
  referralsRejected: Array<{ line: number; reason: string }>;
  warnings: string[];
  summary: Record<string, number>;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[a-f0-9]{64}$/;
const EARLIEST_PLAUSIBLE = Date.parse("2025-01-01T00:00:00Z");

export const normaliseEmail = (e: string) => e.trim().toLowerCase();

/** Gmail ignores dots and +tags; flag (never merge) such near-duplicates for a human. */
function gmailKey(email: string): string | null {
  const [local, domain] = email.split("@");
  if (!["gmail.com", "googlemail.com"].includes(domain)) return null;
  return local.split("+")[0].replace(/\./g, "") + "@gmail.com";
}

export function parseTimestamp(raw: string | undefined, tz: ImportOptions["timestampTz"]): Date | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/i.test(s);
  const iso = s.replace(" ", "T");
  if (hasOffset) {
    const t = Date.parse(iso.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
    return Number.isNaN(t) ? null : new Date(t);
  }
  if (!tz) return null; // never guess a timezone
  const t = Date.parse(iso + "Z");
  if (Number.isNaN(t)) return null;
  return new Date(tz === "Asia/Kolkata" ? t - 330 * 60 * 1000 : t);
}

function parseBool(raw: string | undefined): boolean | null {
  const s = (raw ?? "").trim().toLowerCase();
  if (["true", "t", "yes", "y", "1"].includes(s)) return true;
  if (["false", "f", "no", "n", "0", ""].includes(s)) return false;
  return null;
}

const blank = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : null);
const validCode = (c: string | null) => !!c && c.length === 8 && [...c].every((ch) => REFERRAL_CODE_ALPHABET.includes(ch));

function newReferralCode(usedLower: Set<string>): string {
  for (;;) {
    const bytes = randomBytes(8);
    const code = [...bytes].map((b) => REFERRAL_CODE_ALPHABET[b % REFERRAL_CODE_ALPHABET.length]).join("");
    if (!usedLower.has(code.toLowerCase())) return code;
  }
}

type DbState = {
  now: Date;
  byId: Map<string, { email: string; createdAt: Date }>;
  byEmail: Map<string, { id: string; createdAt: Date }>;
  byCode: Map<string, string>;
  tokens: Set<string>;
  sourceIds: Set<string>;
  pairs: Set<string>;
};

async function readDbState(db: Db | Tx): Promise<DbState> {
  const now = (await db.query(`SELECT now() AS now`)).rows[0].now as Date;
  const users = await db.query(
    `SELECT id, lower(email) AS email, lower(referral_code) AS code, magic_link_token AS token, source_record_id,
            (created_at AT TIME ZONE 'UTC') AS created_at FROM waitlist_users`
  );
  const pairs = await db.query(`SELECT referrer_id, referee_id FROM referrals`);
  const s: DbState = { now, byId: new Map(), byEmail: new Map(), byCode: new Map(), tokens: new Set(), sourceIds: new Set(), pairs: new Set() };
  for (const u of users.rows) {
    s.byId.set(u.id, { email: u.email, createdAt: u.created_at });
    s.byEmail.set(u.email, { id: u.id, createdAt: u.created_at });
    s.byCode.set(u.code, u.id);
    s.tokens.add(u.token);
    if (u.source_record_id) s.sourceIds.add(u.source_record_id);
  }
  for (const p of pairs.rows) s.pairs.add(`${p.referrer_id}>${p.referee_id}`);
  return s;
}

export async function planImport(
  db: Db | Tx,
  userRows: Array<Record<string, string>>,
  referralRows: Array<Record<string, string>>,
  opts: ImportOptions
): Promise<ImportPlan> {
  await assertMigrated(db);
  const st = await readDbState(db);
  const plan: ImportPlan = { users: [], referrals: [], skipped: [], rejected: [], referralsSkipped: [], referralsRejected: [], warnings: [], summary: {} };
  const usedCodes = new Set(st.byCode.keys());
  const usedTokens = new Set(st.tokens);
  /** Source id → id it will have in the DB (new row, or an existing row with the same email). */
  const idMap = new Map<string, string>();
  const createdAtOf = new Map<string, Date>();
  for (const [id, u] of st.byId) createdAtOf.set(id, u.createdAt);

  // ---- users: validate, then keep the earliest row per email --------------
  type Candidate = { rec: Record<string, string>; line: number; email: string; createdAt: Date };
  const candidates: Candidate[] = [];
  userRows.forEach((rec, i) => {
    const line = i + 2;
    const email = normaliseEmail(rec.email ?? "");
    const reject = (reason: string) => plan.rejected.push({ line, email, reason });
    if (!email) return reject("missing email");
    if (!EMAIL_RE.test(email)) return reject("invalid email syntax");
    if (email.endsWith(".test") || rec.is_synthetic?.toLowerCase() === "true" || rec.data_source === "synthetic_seed") {
      return reject("synthetic/test row — never imported into a real waitlist");
    }
    const createdAt = parseTimestamp(rec.created_at, opts.timestampTz);
    if (!createdAt) {
      return reject(rec.created_at ? "created_at has no timezone (pass --timestamp-tz) or is unparseable" : "missing created_at (dates are never reconstructed)");
    }
    if (createdAt.getTime() > st.now.getTime() + 60_000) return reject("created_at is in the future");
    if (rec.id && !UUID_RE.test(rec.id)) return reject("id is not a UUID");
    if (parseBool(rec.marketing_opt_in) === null) return reject(`unrecognised marketing_opt_in "${rec.marketing_opt_in}"`);
    if (createdAt.getTime() < EARLIEST_PLAUSIBLE) plan.warnings.push(`line ${line}: created_at ${createdAt.toISOString()} predates the waitlist`);
    candidates.push({ rec, line, email, createdAt });
  });

  const earliest = new Map<string, Candidate>();
  for (const c of candidates) {
    const prev = earliest.get(c.email);
    if (!prev || c.createdAt < prev.createdAt) {
      if (prev) plan.skipped.push({ line: prev.line, email: prev.email, reason: "duplicate email in file (kept earliest)" });
      earliest.set(c.email, c);
    } else {
      plan.skipped.push({ line: c.line, email: c.email, reason: "duplicate email in file (kept earliest)" });
    }
  }

  const gmailSeen = new Map<string, string>();
  for (const e of st.byEmail.keys()) {
    const k = gmailKey(e);
    if (k) gmailSeen.set(k, e);
  }

  for (const c of [...earliest.values()].sort((a, b) => a.line - b.line)) {
    const { rec, line, email, createdAt } = c;
    const srcId = blank(rec.id)?.toLowerCase();
    const sourceRecordId = blank(rec.source_record_id) ?? (srcId ? `waitlist:${srcId}` : `email:${email}`);

    const existingByEmail = st.byEmail.get(email);
    if (srcId && st.byId.has(srcId)) {
      idMap.set(srcId, srcId);
      plan.skipped.push({ line, email, reason: "already present (same id)" });
      continue;
    }
    if (existingByEmail) {
      if (srcId) idMap.set(srcId, existingByEmail.id);
      plan.skipped.push({ line, email, reason: srcId ? "email already present under a newer id (re-signed up); referrals re-pointed to it" : "email already present" });
      continue;
    }
    if (st.sourceIds.has(sourceRecordId)) {
      plan.skipped.push({ line, email, reason: "already imported (same source_record_id)" });
      continue;
    }

    const gk = gmailKey(email);
    if (gk && gmailSeen.has(gk) && gmailSeen.get(gk) !== email) {
      plan.warnings.push(`line ${line}: ${email} looks like the same Gmail inbox as ${gmailSeen.get(gk)} (kept; review manually)`);
    } else if (gk) gmailSeen.set(gk, email);

    const origCode = blank(rec.referral_code);
    const codeKept = validCode(origCode) && !usedCodes.has(origCode!.toLowerCase());
    const referralCode = codeKept ? origCode! : newReferralCode(usedCodes);
    usedCodes.add(referralCode.toLowerCase());

    const origToken = blank(rec.magic_link_token)?.toLowerCase() ?? null;
    const tokenKept = !!origToken && TOKEN_RE.test(origToken) && !usedTokens.has(origToken);
    const magicLinkToken = tokenKept ? origToken! : randomBytes(32).toString("hex");
    usedTokens.add(magicLinkToken);

    const id = srcId ?? randomUUID();
    idMap.set(id, id);
    createdAtOf.set(id, createdAt);
    plan.users.push({
      id,
      email,
      username: blank(rec.username),
      firstName: blank(rec.first_name),
      lastName: blank(rec.last_name),
      phoneNumber: blank(rec.phone_number),
      marketingOptIn: parseBool(rec.marketing_opt_in) ?? false,
      additionalRemarks: blank(rec.additional_remarks),
      referralCode,
      referralCodeKept: codeKept,
      magicLinkToken,
      magicLinkKept: tokenKept,
      createdAt,
      welcomeEmailSentAt: parseTimestamp(rec.welcome_email_sent_at, opts.timestampTz),
      sourceRecordId,
      line,
    });
  }

  // ---- referrals -----------------------------------------------------------
  const newIds = new Set(plan.users.map((u) => u.id));
  const plannedPairs = new Set<string>();
  const codeOwner = new Map<string, string>(st.byCode);
  for (const u of plan.users) codeOwner.set(u.referralCode.toLowerCase(), u.id);
  const resolve = (raw: string | undefined) => {
    const k = raw?.trim().toLowerCase();
    return k ? idMap.get(k) ?? (st.byId.has(k) ? k : undefined) : undefined;
  };
  const addReferral = (line: number, referrerId: string | undefined, refereeId: string | undefined, createdAt: Date | null, origin: string) => {
    const reject = (reason: string) => plan.referralsRejected.push({ line, reason: `${origin}: ${reason}` });
    if (!referrerId || !refereeId) return reject("referrer or referee not found in the database or this import");
    if (referrerId === refereeId) return reject("self-referral");
    if (!createdAt) return reject("missing/unparseable created_at");
    if (createdAt.getTime() > st.now.getTime() + 60_000) return reject("created_at is in the future");
    const key = `${referrerId}>${refereeId}`;
    if (st.pairs.has(key) || plannedPairs.has(key)) {
      plan.referralsSkipped.push({ line, reason: `${origin}: already present` });
      return;
    }
    const referrerAt = createdAtOf.get(referrerId);
    if (referrerAt && createdAt.getTime() < referrerAt.getTime() - 1000) return reject("recorded before the referrer signed up");
    if (!newIds.has(referrerId) && !newIds.has(refereeId)) plan.warnings.push(`line ${line}: referral between two existing users restored`);
    plannedPairs.add(key);
    plan.referrals.push({ referrerId, refereeId, createdAt, origin });
  };

  referralRows.forEach((rec, i) => {
    addReferral(i + 2, resolve(rec.referrer_id), resolve(rec.referee_id), parseTimestamp(rec.created_at, opts.timestampTz), "referrals file");
  });
  for (const u of plan.users) {
    const rec = userRows[u.line - 2];
    const byEmail = blank(rec.referred_by_email);
    const byCode = blank(rec.referred_by_code);
    if (!byEmail && !byCode) continue;
    const referrer = byEmail
      ? plan.users.find((x) => x.email === normaliseEmail(byEmail))?.id ?? st.byEmail.get(normaliseEmail(byEmail))?.id
      : codeOwner.get(byCode!.toLowerCase());
    addReferral(u.line, referrer, u.id, u.createdAt, "referred_by column");
  }

  plan.summary = {
    rowsRead: userRows.length,
    usersToInsert: plan.users.length,
    usersSkipped: plan.skipped.length,
    usersRejected: plan.rejected.length,
    referralCodesKept: plan.users.filter((u) => u.referralCodeKept).length,
    referralCodesRegenerated: plan.users.filter((u) => !u.referralCodeKept).length,
    magicLinksKept: plan.users.filter((u) => u.magicLinkKept).length,
    welcomeEmailAlreadySent: plan.users.filter((u) => u.welcomeEmailSentAt).length,
    welcomeEmailHeld: plan.users.filter((u) => !u.welcomeEmailSentAt).length,
    referralRowsRead: referralRows.length,
    referralsToInsert: plan.referrals.length,
    referralsSkipped: plan.referralsSkipped.length,
    referralsRejected: plan.referralsRejected.length,
    warnings: plan.warnings.length,
  };
  return plan;
}

export type ApplyResult = { batchId: string; users: number; referrals: number; plan: ImportPlan };

/**
 * Re-plans under a table lock and applies everything in ONE transaction.
 * `expect` must match the dry-run the operator approved, or nothing is written.
 */
export async function applyImport(
  db: Db,
  userRows: Array<Record<string, string>>,
  referralRows: Array<Record<string, string>>,
  opts: ImportOptions,
  expect: { users: number; referrals: number }
): Promise<ApplyResult> {
  try {
    return await withTransaction(db, async (tx) => {
      await tx.query(`LOCK TABLE waitlist_users, referrals IN SHARE ROW EXCLUSIVE MODE`);
      const plan = await planImport(tx, userRows, referralRows, opts);
      if (plan.users.length !== expect.users || plan.referrals.length !== expect.referrals) {
        throw new Error(
          `plan changed since the dry-run: now ${plan.users.length} users / ${plan.referrals.length} referrals, expected ${expect.users} / ${expect.referrals}. Re-run the dry-run.`
        );
      }
      if (!plan.users.length && !plan.referrals.length) throw new Error("nothing to import (already applied?)");

      const batchId: string = (
        await tx.query(
          `INSERT INTO import_batches (kind, source, source_sha256, evidence, status, operator, params)
           VALUES ('historical_import', $1, $2, $3, 'pending', $4, $5) RETURNING id`,
          [opts.source, opts.sourceSha256 ?? null, opts.evidence, opts.operator, JSON.stringify({ timestampTz: opts.timestampTz ?? null })]
        )
      ).rows[0].id;

      const u = plan.users;
      const iso = (d: Date | null) => (d ? d.toISOString() : null);
      const users = await insertColumns(
        tx,
        "waitlist_users",
        [
          { name: "id", type: "uuid", values: u.map((x) => x.id) },
          { name: "email", type: "text", values: u.map((x) => x.email) },
          { name: "username", type: "text", values: u.map((x) => x.username) },
          { name: "first_name", type: "text", values: u.map((x) => x.firstName) },
          { name: "last_name", type: "text", values: u.map((x) => x.lastName) },
          { name: "phone_number", type: "text", values: u.map((x) => x.phoneNumber) },
          { name: "marketing_opt_in", type: "boolean", values: u.map((x) => x.marketingOptIn) },
          { name: "additional_remarks", type: "text", values: u.map((x) => x.additionalRemarks) },
          { name: "referral_code", type: "text", values: u.map((x) => x.referralCode) },
          { name: "magic_link_token", type: "text", values: u.map((x) => x.magicLinkToken) },
          { name: "created_at", type: "timestamptz", values: u.map((x) => iso(x.createdAt)), expr: utcExpr },
          { name: "updated_at", type: "timestamptz", values: u.map((x) => iso(x.createdAt)), expr: utcExpr },
          { name: "welcome_email_sent_at", type: "timestamptz", values: u.map((x) => iso(x.welcomeEmailSentAt)), expr: utcExpr },
          { name: "welcome_email_status", type: "text", values: u.map((x) => (x.welcomeEmailSentAt ? null : "held_import")) },
          { name: "data_source", type: "text", values: u.map(() => "historical_import") },
          { name: "import_batch_id", type: "uuid", values: u.map(() => batchId) },
          { name: "source_record_id", type: "text", values: u.map((x) => x.sourceRecordId) },
          { name: "imported_at", type: "timestamptz", values: u.map(() => new Date().toISOString()), expr: utcExpr },
        ],
        { chunk: 500 }
      );
      if (users !== u.length) throw new Error(`inserted ${users} of ${u.length} users`);
      if (opts.simulateFailureAfterUsers) throw new Error("simulated failure after inserting users");

      const r = plan.referrals;
      const referrals = await insertColumns(tx, "referrals", [
        { name: "referrer_id", type: "uuid", values: r.map((x) => x.referrerId) },
        { name: "referee_id", type: "uuid", values: r.map((x) => x.refereeId) },
        { name: "created_at", type: "timestamptz", values: r.map((x) => x.createdAt.toISOString()), expr: utcExpr },
        { name: "data_source", type: "text", values: r.map(() => "historical_import") },
        { name: "import_batch_id", type: "uuid", values: r.map(() => batchId) },
      ]);
      if (referrals !== r.length) throw new Error(`inserted ${referrals} of ${r.length} referrals`);

      await tx.query(
        `UPDATE import_batches SET status = 'applied', applied_at = now() AT TIME ZONE 'UTC',
                user_count = $2, referral_count = $3, report = $4 WHERE id = $1`,
        [batchId, users, referrals, JSON.stringify({ summary: plan.summary, rejected: plan.rejected, referralsRejected: plan.referralsRejected, warnings: plan.warnings })]
      );
      return { batchId, users, referrals, plan };
    });
  } catch (err) {
    // Nothing was written; keep an audit row of the failed attempt.
    await db
      .query(
        `INSERT INTO import_batches (kind, source, source_sha256, evidence, status, operator, report)
         VALUES ('historical_import', $1, $2, $3, 'failed', $4, $5)`,
        [opts.source, opts.sourceSha256 ?? null, opts.evidence, opts.operator, JSON.stringify({ error: err instanceof Error ? err.message : String(err) })]
      )
      .catch(() => {});
    throw err;
  }
}
