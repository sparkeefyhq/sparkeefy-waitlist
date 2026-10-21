/**
 * Synthetic staging dataset planner (pure: no I/O, deterministic per seed).
 *
 * Works from TARGET totals and the counts already in the target database, never
 * from hard-coded deltas, so it is correct whether staging starts empty, holds a
 * baseline copy, or already holds an earlier synthetic batch.
 *
 * Referral convention (matches the app): one `referrals` row per
 * (referrer, referee) pair; the dashboard's "Total referrals" is count(*) of
 * that table. Synthetic referees are only ever new synthetic users, each
 * referred at most once, and always after their referrer signed up.
 */

import { createRng, uuidFrom, type Rng } from "./rng.ts";
import { ALL_POOLS, type NamePool } from "./names.ts";

export const SYNTHETIC_EMAIL_DOMAIN = "seed.sparkeefy.test";
export const REFERRAL_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/** Signups by IST hour of day: quiet at night, evening peak. */
const DIURNAL: ReadonlyArray<readonly [number, number]> = [
  [0, 0.35], [1, 0.2], [2, 0.1], [3, 0.05], [4, 0.05], [5, 0.1], [6, 0.3], [7, 0.6],
  [8, 0.8], [9, 1], [10, 1.1], [11, 1.2], [12, 1.2], [13, 1.1], [14, 1], [15, 1],
  [16, 1.1], [17, 1.2], [18, 1.4], [19, 1.6], [20, 1.8], [21, 1.9], [22, 1.5], [23, 0.8],
];

/** Shape of the referral degree distribution (brief, step 4): users per degree for 5,227 users / 2,238 referrals. */
export const BRIEF_DEGREE_TABLE: ReadonlyArray<readonly [number, number]> = [
  [0, 4312], [1, 31], [2, 550], [3, 300], [4, 20], [6, 7], [7, 4], [19, 3],
];

export type ExistingState = {
  total: number;
  referrals: number;
  last7: number;
  spike: number;
  emails: ReadonlySet<string>;
  referralCodesLower: ReadonlySet<string>;
};

export type Targets = {
  total: number;
  referrals: number;
  last7: number;
  /** Approximate total signups (existing + new) inside the spike window. */
  spikeTotal: number;
};

export type Windows = {
  /** First moment synthetic history may start (UTC). */
  launch: Date;
  spikeStart: Date;
  spikeEnd: Date;
};

export type SyntheticUser = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string | null;
  marketingOptIn: boolean;
  referralCode: string;
  createdAt: Date;
  region: string;
};

export type SyntheticReferral = { referrerId: string; refereeId: string; createdAt: Date };

export type SyntheticPlan = {
  counts: { newUsers: number; newReferrals: number; last7: number; spike: number; rest: number };
  degreeTable: Array<[number, number]>;
  users: SyntheticUser[];
  referrals: SyntheticReferral[];
};

/** Default spike: 19–20 Feb 2026 in IST (synthetic scenario data, not real campaign performance). */
export function defaultWindows(): Windows {
  return {
    launch: istMidnight("2026-02-16"),
    spikeStart: istMidnight("2026-02-19"),
    spikeEnd: new Date(istMidnight("2026-02-21").getTime() - 1),
  };
}

export function istMidnight(isoDate: string): Date {
  return new Date(Date.parse(`${isoDate}T00:00:00.000Z`) - IST_OFFSET_MS);
}

export function computeDeltas(existing: ExistingState, targets: Targets) {
  const newUsers = targets.total - existing.total;
  const last7 = targets.last7 - existing.last7;
  const newReferrals = targets.referrals - existing.referrals;
  const spike = Math.max(0, targets.spikeTotal - existing.spike);
  const problems: string[] = [];
  if (newUsers < 0) problems.push(`target total ${targets.total} is below existing ${existing.total}`);
  if (last7 < 0) problems.push(`target last-7-days ${targets.last7} is below existing ${existing.last7}`);
  if (newReferrals < 0) problems.push(`target referrals ${targets.referrals} is below existing ${existing.referrals}`);
  if (last7 > newUsers) problems.push(`need ${last7} new last-7-day signups but only ${newUsers} new users`);
  if (spike > newUsers - Math.max(0, last7)) problems.push(`spike needs ${spike} new users but only ${newUsers - last7} are available after the last-7-days rows`);
  if (newReferrals > Math.max(0, newUsers - 1)) problems.push(`${newReferrals} referrals cannot fit among ${newUsers} new users (each new user is referred at most once)`);
  return { newUsers, last7, newReferrals, spike, rest: newUsers - last7 - spike, problems };
}

/**
 * Users per referral degree summing exactly to nUsers users and nRefs referrals.
 * Uses the brief's table verbatim when it fits, otherwise scales its shape.
 */
export function planReferralDegrees(nUsers: number, nRefs: number): Array<[number, number]> {
  const briefUsers = BRIEF_DEGREE_TABLE.reduce((s, [, c]) => s + c, 0);
  const briefRefs = BRIEF_DEGREE_TABLE.reduce((s, [d, c]) => s + d * c, 0);
  if (nUsers === briefUsers && nRefs === briefRefs) return BRIEF_DEGREE_TABLE.map(([d, c]) => [d, c]);
  if (nRefs === 0) return [[0, nUsers]];

  const scale = nRefs / briefRefs;
  const counts = new Map<number, number>();
  for (const [d, c] of BRIEF_DEGREE_TABLE) if (d > 0) counts.set(d, Math.round(c * scale));
  const refs = () => [...counts].reduce((s, [d, c]) => s + d * c, 0);
  const referrers = () => [...counts].reduce((s, [, c]) => s + c, 0);

  // Too many: step the largest degrees down one at a time.
  while (refs() > nRefs) {
    const d = Math.max(...[...counts].filter(([, c]) => c > 0).map(([k]) => k));
    counts.set(d, counts.get(d)! - 1);
    if (d - 1 > 0) counts.set(d - 1, (counts.get(d - 1) ?? 0) + 1);
  }
  // Too few: add single referrals (one more user referring one friend).
  while (refs() < nRefs) counts.set(1, (counts.get(1) ?? 0) + 1);
  if (referrers() > nUsers) throw new Error(`cannot spread ${nRefs} referrals over ${nUsers} users`);

  return [[0, nUsers - referrers()], ...[...counts].filter(([, c]) => c > 0).sort((a, b) => a[0] - b[0])];
}

export function planSynthetic(args: {
  seed: string;
  now: Date;
  existing: ExistingState;
  targets: Targets;
  windows?: Windows;
}): SyntheticPlan {
  const rng = createRng(args.seed);
  const windows = args.windows ?? defaultWindows();
  const d = computeDeltas(args.existing, args.targets);
  if (d.problems.length) throw new Error("Cannot reach targets:\n- " + d.problems.join("\n- "));

  const taken = new Set<number>();
  const times: Date[] = [
    ...sampleTimes(rng, d.last7, last7Window(args.now), () => 1, taken),
    ...sampleTimes(rng, d.spike, [windows.spikeStart, windows.spikeEnd], spikeDayWeight(windows), taken),
    ...sampleTimes(rng, d.rest, restWindow(args.now, windows), restDayWeight(windows), taken, windows),
  ].sort((a, b) => a.getTime() - b.getTime());

  const usedEmails = new Set(args.existing.emails);
  const usedCodes = new Set(args.existing.referralCodesLower);
  const users: SyntheticUser[] = times.map((createdAt) => {
    const person = makePerson(rng, usedEmails);
    return {
      id: uuidFrom(rng),
      ...person,
      marketingOptIn: rng.chance(0.62),
      referralCode: uniqueReferralCode(rng, usedCodes),
      createdAt,
    };
  });

  const degreeTable = planReferralDegrees(d.newUsers, d.newReferrals);
  const referrals = buildReferralGraph(rng, users, degreeTable);

  return {
    counts: { newUsers: d.newUsers, newReferrals: d.newReferrals, last7: d.last7, spike: d.spike, rest: d.rest },
    degreeTable,
    users,
    referrals,
  };
}

// ---------------------------------------------------------------------------
// Time distribution
// ---------------------------------------------------------------------------

/** Last-7-days rows land 6 days → 1 hour ago so the metric stays exact for ~a day after seeding. */
function last7Window(now: Date): [Date, Date] {
  return [new Date(now.getTime() - 6 * DAY), new Date(now.getTime() - HOUR)];
}

/** History ends 8 days ago, leaving a one-day gap before the last-7-days window. */
function restWindow(now: Date, w: Windows): [Date, Date] {
  return [w.launch, new Date(now.getTime() - 8 * DAY)];
}

function spikeDayWeight(w: Windows) {
  const day2 = w.spikeStart.getTime() + DAY;
  return (t: number) => (t >= day2 ? 0.55 : 0.45);
}

/** Small pre-spike trickle, then a tail that decays back to a low baseline. */
function restDayWeight(w: Windows) {
  return (t: number) => {
    const weekend = [0, 6].includes(new Date(t + IST_OFFSET_MS).getUTCDay()) ? 1.15 : 1;
    if (t < w.spikeStart.getTime()) return 0.6 * weekend;
    const daysAfter = (t - w.spikeEnd.getTime()) / DAY;
    return (0.12 + 2.2 * Math.exp(-daysAfter / 6)) * weekend;
  };
}

function sampleTimes(
  rng: Rng,
  n: number,
  [start, end]: [Date, Date],
  dayWeight: (dayStartMs: number) => number,
  taken: Set<number>,
  exclude?: Windows
): Date[] {
  if (n <= 0) return [];
  if (end.getTime() <= start.getTime()) throw new Error(`empty time window ${start.toISOString()} → ${end.toISOString()}`);

  // IST calendar days overlapping the window, weighted.
  const days: Array<readonly [number, number]> = [];
  const firstIstDay = Math.floor((start.getTime() + IST_OFFSET_MS) / DAY) * DAY - IST_OFFSET_MS;
  for (let t = firstIstDay; t <= end.getTime(); t += DAY) {
    const inSpike = exclude && t + DAY > exclude.spikeStart.getTime() && t <= exclude.spikeEnd.getTime();
    if (!inSpike) days.push([t, dayWeight(t)]);
  }
  if (!days.length) throw new Error("no eligible days in time window");

  const out: Date[] = [];
  let guard = 0;
  while (out.length < n) {
    if (++guard > n * 200) throw new Error("could not place timestamps in window");
    const dayStart = rng.weighted(days);
    const hour = rng.weighted(DIURNAL);
    const ms = dayStart + hour * HOUR + rng.int(0, HOUR - 1);
    if (ms < start.getTime() || ms > end.getTime() || taken.has(ms)) continue;
    taken.add(ms);
    out.push(new Date(ms));
  }
  return out;
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const ascii = (s: string) => s.normalize("NFKD").replace(/[^A-Za-z]/g, "").toLowerCase();

function makePerson(rng: Rng, usedEmails: Set<string>) {
  const pool: NamePool = rng.weighted(ALL_POOLS.map((p) => [p, p.weight] as const));
  const female = rng.chance(0.5);
  const firstName = rng.pick(female ? pool.female : pool.male);
  const surnamePool = female && pool.femaleSurnames && rng.chance(0.7) ? pool.femaleSurnames : pool.surnames;
  const surname = rng.pick(surnamePool);
  // Some people give only a first name, or just an initial.
  const lastName = rng.chance(0.04) ? null : rng.chance(0.03) ? surname[0] : surname;

  for (let attempt = 0; attempt < 50; attempt++) {
    const username = makeUsername(rng, ascii(firstName), ascii(lastName ?? surname), attempt);
    const email = `${username}@${SYNTHETIC_EMAIL_DOMAIN}`;
    if (!usedEmails.has(email) && /^[a-z0-9]([a-z0-9._]*[a-z0-9])?$/.test(username) && !username.includes("..")) {
      usedEmails.add(email);
      return { email, username, firstName, lastName, region: pool.region };
    }
  }
  throw new Error("could not generate a unique username");
}

function makeUsername(rng: Rng, f: string, l: string, attempt: number): string {
  const yy = String(rng.int(0, 99)).padStart(2, "0");
  const ddmm = `${String(rng.int(1, 28)).padStart(2, "0")}${String(rng.int(1, 12)).padStart(2, "0")}`;
  const year = String(rng.int(1995, 2007));
  const extra = attempt > 6 ? String(rng.int(1, 999)) : "";
  const patterns: Array<readonly [() => string, number]> = [
    [() => `${f}.${l}${yy}`, 18],
    [() => `${f}.${l}${ddmm}`, 8],
    [() => `${f}_${l}${yy}`, 10],
    [() => `${f}.${l}`, 6],
    [() => `${f}${l}`, 6],
    [() => `${f}${l[0]}${yy}`, 7],
    [() => `${f[0]}${l}${yy}`, 6],
    [() => `${f}.${l}${year}`, 8],
    [() => `${f}.${l}${l.slice(-1).repeat(rng.int(1, 3))}`, 3],
    [() => `${l}.${f}${yy}`, 4],
    [() => `${f}${l}${rng.int(100, 999)}`, 6],
    [() => `${f}_${yy}`, 3],
    [() => `its${f}${l[0]}`, 2],
    [() => `the.${f}.${l}`, 2],
    [() => `${f}.${l[0]}.${yy}`, 5],
  ];
  return rng.weighted(patterns)() + extra;
}

function uniqueReferralCode(rng: Rng, usedLower: Set<string>): string {
  for (;;) {
    let code = "";
    for (let i = 0; i < 8; i++) code += REFERRAL_CODE_ALPHABET[rng.int(0, REFERRAL_CODE_ALPHABET.length - 1)];
    // Lookups are case-insensitive, so uniqueness must be too.
    if (!usedLower.has(code.toLowerCase())) {
      usedLower.add(code.toLowerCase());
      return code;
    }
  }
}

// ---------------------------------------------------------------------------
// Referral graph
// ---------------------------------------------------------------------------

/**
 * Highest-degree referrers first. Each picks friends from the next few hundred
 * not-yet-referred signups after them, so referrals cluster in time like real
 * invite waves and every referral is strictly after its referrer's signup.
 */
function buildReferralGraph(rng: Rng, users: SyntheticUser[], table: Array<[number, number]>): SyntheticReferral[] {
  const n = users.length;
  const unreferred: number[] = users.map((_, i) => i); // sorted by time (users are sorted)
  const isReferrer = new Set<number>();
  const out: SyntheticReferral[] = [];
  const degrees = table.filter(([deg]) => deg > 0).flatMap(([deg, c]) => Array<number>(c).fill(deg)).sort((a, b) => b - a);

  for (const degree of degrees) {
    let placed = false;
    for (let attempt = 0; attempt < 400 && !placed; attempt++) {
      const r = rng.int(0, Math.max(0, Math.floor(n * 0.9) - 1));
      if (isReferrer.has(r)) continue;
      const startPos = upperBound(unreferred, r);
      const window = unreferred.slice(startPos, startPos + Math.max(degree * 12, 80));
      if (window.length < degree) continue;
      const chosen = new Set<number>();
      while (chosen.size < degree) chosen.add(window[rng.int(0, window.length - 1)]);
      for (const e of chosen) {
        unreferred.splice(unreferred.indexOf(e), 1);
        out.push({ referrerId: users[r].id, refereeId: users[e].id, createdAt: users[e].createdAt });
      }
      isReferrer.add(r);
      placed = true;
    }
    if (!placed) throw new Error(`could not place a referrer with ${degree} referrals`);
  }
  return out;
}

function upperBound(sorted: number[], value: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
