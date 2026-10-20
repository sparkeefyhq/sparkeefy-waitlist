/** Small deterministic PRNG (mulberry32) so a seed always yields the same dataset. */

export type Rng = {
  next(): number;
  int(minInclusive: number, maxInclusive: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: ReadonlyArray<readonly [T, number]>): T;
  chance(p: number): boolean;
  hex(bytes: number): string;
};

export function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed: number | string): Rng {
  let a = typeof seed === "string" ? seedFromString(seed) : seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    weighted: (items) => {
      const total = items.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [item, w] of items) {
        r -= w;
        if (r < 0) return item;
      }
      return items[items.length - 1][0];
    },
    chance: (p) => next() < p,
    hex: (bytes) => {
      let out = "";
      for (let i = 0; i < bytes; i++) out += Math.floor(next() * 256).toString(16).padStart(2, "0");
      return out;
    },
  };
  return rng;
}

/** RFC 4122 v4-shaped UUID from the PRNG (deterministic for a given seed). */
export function uuidFrom(rng: Rng): string {
  const h = rng.hex(16).split("");
  h[12] = "4";
  h[16] = "89ab"[parseInt(h[16], 16) & 3];
  const s = h.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}
