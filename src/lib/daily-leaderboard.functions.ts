import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// Same anti-cheat envelope as all-time submit, but written into daily_scores
// and stamped with the SERVER's UTC date (never trust the client).

const BLOCK = "Blocked: try a different name.";

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

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const submitDailyScore = createServerFn({ method: "POST" })
  .validator((data: unknown) => submitInput.parse(data))
  .handler(async ({ data }): Promise<SubmitResult> => {
    const { initials, score, lines, level, wordsSolved, durationSeconds, clientToken } = data;

    if (PROFANITY.has(initials)) return { ok: false, reason: BLOCK };

    const expectedLevel = 1 + Math.floor(lines / 10);
    if (level !== expectedLevel) return { ok: false, reason: "Level/lines mismatch." };
    if (lines > 0 && durationSeconds < Math.ceil(lines * 1.5)) {
      return { ok: false, reason: "Run too short for line count." };
    }
    if (wordsSolved > 0 && durationSeconds < Math.ceil(wordsSolved * 2)) {
      return { ok: false, reason: "Run too short for words solved." };
    }
    const maxTiles = wordsSolved * 6;
    const maxTilePoints = maxTiles * 10 * level;
    const maxRowBonus = maxTiles * 4 * 5;
    if (score > maxTilePoints + maxRowBonus) {
      return { ok: false, reason: "Score exceeds maximum." };
    }

    const puzzleDate = todayUtc();
    const supabaseAdmin = adminClient();

    const { data: existing } = await supabaseAdmin
      .from("daily_scores")
      .select("id")
      .eq("puzzle_date", puzzleDate)
      .eq("client_token", clientToken)
      .maybeSingle();
    if (existing) return { ok: false, reason: "Already submitted today." };

    const { error } = await supabaseAdmin.from("daily_scores").insert({
      puzzle_date: puzzleDate,
      initials,
      score,
      lines,
      level,
      words_solved: wordsSolved,
      duration_seconds: durationSeconds,
      client_token: clientToken,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, reason: "Already submitted today." };
      return { ok: false, reason: "Could not save score." };
    }

    const { count } = await supabaseAdmin
      .from("daily_scores")
      .select("*", { count: "exact", head: true })
      .eq("puzzle_date", puzzleDate)
      .gt("score", score);
    return { ok: true, rank: (count ?? 0) + 1 };
  });

const listInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type DailyLeaderboardRow = {
  id: string;
  initials: string;
  score: number;
  lines: number;
  level: number;
  words_solved: number;
  created_at: string;
};

export const getDailyLeaderboard = createServerFn({ method: "GET" })
  .validator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data }): Promise<{ date: string; rows: DailyLeaderboardRow[] }> => {
    const date = data.date ?? todayUtc();
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("daily_scores")
      .select("id, initials, score, lines, level, words_solved, created_at")
      .eq("puzzle_date", date)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(data.limit);
    if (error) return { date, rows: [] };
    return { date, rows: (rows ?? []) as DailyLeaderboardRow[] };
  });

const statusInput = z.object({ clientToken: z.string().uuid() });

export const getDailyStatus = createServerFn({ method: "GET" })
  .validator((data: unknown) => statusInput.parse(data))
  .handler(async ({ data }): Promise<{ date: string; played: boolean; score: number | null; rank: number | null }> => {
    const date = todayUtc();
    const supabase = publicClient();
    const { data: row } = await supabase
      .from("daily_scores")
      .select("score")
      .eq("puzzle_date", date)
      .eq("client_token", data.clientToken)
      .maybeSingle();
    if (!row) return { date, played: false, score: null, rank: null };
    const { count } = await supabase
      .from("daily_scores")
      .select("*", { count: "exact", head: true })
      .eq("puzzle_date", date)
      .gt("score", row.score);
    return { date, played: true, score: row.score, rank: (count ?? 0) + 1 };
  });