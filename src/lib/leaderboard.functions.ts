import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Server-side scoring formula MUST match client engine (engine.ts lockAndAdvance).
// tilePoints = solvedTilesCleared * 10 * levelAtClear
// rowBonus   = (rowsCleared > 0) ? solvedTilesCleared * rowsCleared * 5 : 0
// We can't reconstruct exact per-event level history server-side, but we can
// bound the *maximum* plausible score given final lines, level and words_solved.
// Upper bound: every solved tile cleared at the final level, and the maximum
// possible row bonus given a single tetris-like clear pattern.

const BLOCK = "Blocked: try a different name.";

// Tiny profanity list (uppercase). Keep short; this is anti-grief, not a wall.
const PROFANITY = new Set([
  "ASS","FUK","FUC","FCK","SHT","SHI","NIG","FAG","CUM","TIT","DIK","JEW",
  "GAY","SEX","KKK","NAZ","HOR","HOE","COC","PUS","BUT","ANL","SUC","PMS",
]);

const submitInput = z.object({
  initials: z.string().regex(/^[A-Z]{3}$/, "Initials must be 3 letters A-Z"),
  score: z.number().int().min(0).max(10_000_000),
  lines: z.number().int().min(0).max(100_000),
  level: z.number().int().min(1).max(99),
  wordsSolved: z.number().int().min(0).max(100_000),
  durationSeconds: z.number().int().min(1).max(60 * 60 * 24),
  clientToken: z.string().uuid(),
});

export type SubmitResult =
  | { ok: true; rank: number | null }
  | { ok: false; reason: string };

export const submitScore = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitInput.parse(data))
  .handler(async ({ data }): Promise<SubmitResult> => {
    const { initials, score, lines, level, wordsSolved, durationSeconds, clientToken } = data;

    if (PROFANITY.has(initials)) return { ok: false, reason: BLOCK };

    // Level must be consistent with lines (level = 1 + floor(lines/10))
    const expectedLevel = 1 + Math.floor(lines / 10);
    if (level !== expectedLevel) return { ok: false, reason: "Level/lines mismatch." };

    // Plausibility floor: each line typically needs at least ~1.5s of real play.
    if (lines > 0 && durationSeconds < Math.ceil(lines * 1.5)) {
      return { ok: false, reason: "Run too short for line count." };
    }
    // And each solved word needs at least ~2s.
    if (wordsSolved > 0 && durationSeconds < Math.ceil(wordsSolved * 2)) {
      return { ok: false, reason: "Run too short for words solved." };
    }

    // Score upper bound: assume every solved-word tile was cleared at final level,
    // and the largest possible row bonus (10 tiles * 4 rows). Generous on purpose.
    const maxTiles = wordsSolved * 6; // max piece length is 6
    const maxTilePoints = maxTiles * 10 * level;
    const maxRowBonus = maxTiles * 4 * 5;
    const maxScore = maxTilePoints + maxRowBonus;
    if (score > maxScore) return { ok: false, reason: "Score exceeds maximum." };

    // Idempotency + service role insert
    const { getSupabaseAdmin } = await import("@/lib/supabase-clients.server");
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existing } = await supabaseAdmin
      .from("scores")
      .select("id")
      .eq("client_token", clientToken)
      .maybeSingle();
    if (existing) return { ok: true, rank: null };

    const { error } = await supabaseAdmin.from("scores").insert({
      initials,
      score,
      lines,
      level,
      words_solved: wordsSolved,
      duration_seconds: durationSeconds,
      client_token: clientToken,
    });
    if (error) return { ok: false, reason: "Could not save score." };

    // Compute rank among all-time scores
    const { count } = await supabaseAdmin
      .from("scores")
      .select("*", { count: "exact", head: true })
      .gt("score", score);
    const rank = (count ?? 0) + 1;
    return { ok: true, rank };
  });

const scopeInput = z.object({
  scope: z.enum(["all", "daily"]).default("all"),
  limit: z.number().int().min(1).max(100).default(50),
});

export type LeaderboardRow = {
  id: string;
  initials: string;
  score: number;
  lines: number;
  level: number;
  words_solved: number;
  created_at: string;
};

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => scopeInput.parse(data))
  .handler(async ({ data }): Promise<LeaderboardRow[]> => {
    const { createServerPublicClient } = await import("@/lib/supabase-clients.server");
    const supabase = createServerPublicClient();
    let q = supabase
      .from("scores")
      .select("id, initials, score, lines, level, words_solved, created_at")
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.scope === "daily") {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      q = q.gte("created_at", since);
    }
    const { data: rows, error } = await q;
    if (error) return [];
    return (rows ?? []) as LeaderboardRow[];
  });

const qualifyInput = z.object({ score: z.number().int().min(0) });

// Returns true when the score would land in the all-time top 100.
export const qualifiesForLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => qualifyInput.parse(data))
  .handler(async ({ data }): Promise<{ qualifies: boolean; cutoff: number }> => {
    if (data.score <= 0) return { qualifies: false, cutoff: 0 };
    const { createServerPublicClient } = await import("@/lib/supabase-clients.server");
    const supabase = createServerPublicClient();
    const { data: rows } = await supabase
      .from("scores")
      .select("score")
      .order("score", { ascending: false })
      .limit(100);
    const list = (rows ?? []) as { score: number }[];
    if (list.length < 100) return { qualifies: true, cutoff: list[list.length - 1]?.score ?? 0 };
    const cutoff = list[list.length - 1].score;
    return { qualifies: data.score > cutoff, cutoff };
  });