// Deterministic daily-puzzle seed + PRNG.
// Every player who starts a daily on the same UTC date gets the same
// sequence of word lengths, answers, and shapes.

export function getDailySeed(date: Date = new Date()): string {
  // YYYY-MM-DD in UTC
  return date.toISOString().slice(0, 10);
}

// xmur3 string hash → 32-bit seed
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

// mulberry32 PRNG — small, fast, good enough for puzzle determinism
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDailyRng(seed: string): () => number {
  const hasher = xmur3(seed);
  return mulberry32(hasher());
}

// ms until next UTC midnight
export function msUntilNextDailyReset(now: Date = new Date()): number {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}