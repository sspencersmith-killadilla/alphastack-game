import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// Multiplayer rooms — anonymous, keyed by client_token. All writes go through
// the service-role admin client; the public RLS surface is SELECT-only.

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no 0/O/1/I
const CODE_LEN = 6;
const MAX_PLAYERS = 6;

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function randomCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

const initialsSchema = z.string().regex(/^[A-Z]{3}$/, "Initials must be 3 letters A-Z");
const codeSchema = z.string().regex(/^[A-Z2-9]{6}$/, "Invalid room code");

export type RoomState = {
  id: string;
  code: string;
  status: "lobby" | "playing" | "finished";
  hostToken: string;
  seed: string | null;
  startedAt: string | null;
  roundSeconds: number;
  createdAt: string;
  players: Array<{
    clientToken: string;
    initials: string;
    isReady: boolean;
    joinedAt: string;
  }>;
  scores: Array<{
    clientToken: string;
    initials: string;
    score: number;
    lines: number;
    wordsSolved: number;
    level: number;
    toppedOut: boolean;
    updatedAt: string;
  }>;
};

async function loadRoom(code: string): Promise<RoomState | null> {
  const sb = adminClient();
  const { data: room } = await sb
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (!room) return null;
  const [{ data: players }, { data: scores }] = await Promise.all([
    sb.from("room_players").select("*").eq("room_id", room.id).order("joined_at"),
    sb.from("room_scores").select("*").eq("room_id", room.id),
  ]);
  return {
    id: room.id,
    code: room.code,
    status: room.status as RoomState["status"],
    hostToken: room.host_token,
    seed: room.seed,
    startedAt: room.started_at,
    roundSeconds: room.round_seconds,
    createdAt: room.created_at,
    players: (players ?? []).map((p) => ({
      clientToken: p.client_token,
      initials: p.initials,
      isReady: p.is_ready,
      joinedAt: p.joined_at,
    })),
    scores: (scores ?? []).map((s) => ({
      clientToken: s.client_token,
      initials: s.initials,
      score: s.score,
      lines: s.lines,
      wordsSolved: s.words_solved,
      level: s.level,
      toppedOut: s.topped_out,
      updatedAt: s.updated_at,
    })),
  };
}

// ----- createRoom -----
const createInput = z.object({
  initials: initialsSchema,
  clientToken: z.string().uuid(),
  roundSeconds: z.number().int().min(60).max(900).default(180),
});

export const createRoom = createServerFn({ method: "POST" })
  .validator((data: unknown) => createInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: true; code: string } | { ok: false; reason: string }> => {
    const sb = adminClient();
    // Retry on the (tiny) chance of a code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode();
      const { data: room, error } = await sb
        .from("rooms")
        .insert({
          code,
          host_token: data.clientToken,
          status: "lobby",
          round_seconds: data.roundSeconds,
        })
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505") continue;
        return { ok: false, reason: "Could not create room." };
      }
      await sb.from("room_players").insert({
        room_id: room.id,
        client_token: data.clientToken,
        initials: data.initials,
        is_ready: true,
      });
      return { ok: true, code };
    }
    return { ok: false, reason: "Could not generate a room code." };
  });

// ----- joinRoom -----
const joinInput = z.object({
  code: codeSchema,
  initials: initialsSchema,
  clientToken: z.string().uuid(),
});

export const joinRoom = createServerFn({ method: "POST" })
  .validator((data: unknown) => joinInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: true; room: RoomState } | { ok: false; reason: string }> => {
    const sb = adminClient();
    const { data: room } = await sb
      .from("rooms")
      .select("id, status")
      .eq("code", data.code)
      .maybeSingle();
    if (!room) return { ok: false, reason: "Room not found." };
    if (room.status === "finished") return { ok: false, reason: "This match is finished." };

    const { count } = await sb
      .from("room_players")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id);

    // Allow existing players to re-join (resume) even if the room is full or playing.
    const { data: existing } = await sb
      .from("room_players")
      .select("id")
      .eq("room_id", room.id)
      .eq("client_token", data.clientToken)
      .maybeSingle();

    if (!existing) {
      if (room.status === "playing") return { ok: false, reason: "Match already started." };
      if ((count ?? 0) >= MAX_PLAYERS) return { ok: false, reason: "Room is full." };
      const { error } = await sb.from("room_players").insert({
        room_id: room.id,
        client_token: data.clientToken,
        initials: data.initials,
        is_ready: false,
      });
      if (error) return { ok: false, reason: "Could not join room." };
    } else {
      await sb
        .from("room_players")
        .update({ initials: data.initials, last_seen_at: new Date().toISOString() })
        .eq("room_id", room.id)
        .eq("client_token", data.clientToken);
    }

    const state = await loadRoom(data.code);
    if (!state) return { ok: false, reason: "Room not found." };
    return { ok: true, room: state };
  });

// ----- getRoom -----
export const getRoom = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ code: codeSchema }).parse(data))
  .handler(async ({ data }): Promise<{ ok: true; room: RoomState } | { ok: false; reason: string }> => {
    const state = await loadRoom(data.code);
    if (!state) return { ok: false, reason: "Room not found." };
    return { ok: true, room: state };
  });

// ----- setReady -----
const readyInput = z.object({
  code: codeSchema,
  clientToken: z.string().uuid(),
  ready: z.boolean(),
});

export const setReady = createServerFn({ method: "POST" })
  .validator((data: unknown) => readyInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const sb = adminClient();
    const { data: room } = await sb.from("rooms").select("id").eq("code", data.code).maybeSingle();
    if (!room) return { ok: false };
    await sb
      .from("room_players")
      .update({ is_ready: data.ready, last_seen_at: new Date().toISOString() })
      .eq("room_id", room.id)
      .eq("client_token", data.clientToken);
    return { ok: true };
  });

// ----- startRoom -----
const startInput = z.object({
  code: codeSchema,
  clientToken: z.string().uuid(),
});

export const startRoom = createServerFn({ method: "POST" })
  .validator((data: unknown) => startInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: true; seed: string; startedAt: string } | { ok: false; reason: string }> => {
    const sb = adminClient();
    const { data: room } = await sb
      .from("rooms")
      .select("id, host_token, status")
      .eq("code", data.code)
      .maybeSingle();
    if (!room) return { ok: false, reason: "Room not found." };
    if (room.host_token !== data.clientToken) return { ok: false, reason: "Only the host can start." };
    if (room.status !== "lobby") return { ok: false, reason: "Match already started." };

    const { count } = await sb
      .from("room_players")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id);
    if ((count ?? 0) < 2) return { ok: false, reason: "Need at least 2 players." };

    const startedAt = new Date().toISOString();
    const seed = `room:${data.code}:${startedAt}`;
    const { error } = await sb
      .from("rooms")
      .update({ status: "playing", seed, started_at: startedAt })
      .eq("id", room.id);
    if (error) return { ok: false, reason: "Could not start match." };

    // Seed initial score rows for every player so the live leaderboard has
    // entries immediately.
    const { data: players } = await sb
      .from("room_players")
      .select("client_token, initials")
      .eq("room_id", room.id);
    if (players?.length) {
      await sb.from("room_scores").upsert(
        players.map((p) => ({
          room_id: room.id,
          client_token: p.client_token,
          initials: p.initials,
          score: 0,
          lines: 0,
          words_solved: 0,
          level: 1,
          topped_out: false,
        })),
        { onConflict: "room_id,client_token" },
      );
    }
    return { ok: true, seed, startedAt };
  });

// ----- updateScore -----
const scoreInput = z.object({
  code: codeSchema,
  clientToken: z.string().uuid(),
  initials: initialsSchema,
  score: z.number().int().min(0).max(10_000_000),
  lines: z.number().int().min(0).max(100_000),
  wordsSolved: z.number().int().min(0).max(100_000),
  level: z.number().int().min(1).max(99),
  toppedOut: z.boolean(),
});

export const updateScore = createServerFn({ method: "POST" })
  .validator((data: unknown) => scoreInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const sb = adminClient();
    const { data: room } = await sb.from("rooms").select("id, status").eq("code", data.code).maybeSingle();
    if (!room || room.status !== "playing") return { ok: false };
    await sb.from("room_scores").upsert(
      {
        room_id: room.id,
        client_token: data.clientToken,
        initials: data.initials,
        score: data.score,
        lines: data.lines,
        words_solved: data.wordsSolved,
        level: data.level,
        topped_out: data.toppedOut,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "room_id,client_token" },
    );
    return { ok: true };
  });

// ----- finishRoom -----
const finishInput = z.object({
  code: codeSchema,
  clientToken: z.string().uuid(),
});

export const finishRoom = createServerFn({ method: "POST" })
  .validator((data: unknown) => finishInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const sb = adminClient();
    const { data: room } = await sb
      .from("rooms")
      .select("id, host_token, status")
      .eq("code", data.code)
      .maybeSingle();
    if (!room) return { ok: false };
    if (room.host_token !== data.clientToken) return { ok: false };
    if (room.status !== "playing") return { ok: true };
    await sb.from("rooms").update({ status: "finished" }).eq("id", room.id);
    return { ok: true };
  });

// ----- rematchRoom (host only) -----
export const rematchRoom = createServerFn({ method: "POST" })
  .validator((data: unknown) => finishInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const sb = adminClient();
    const { data: room } = await sb
      .from("rooms")
      .select("id, host_token")
      .eq("code", data.code)
      .maybeSingle();
    if (!room || room.host_token !== data.clientToken) return { ok: false };
    await sb.from("room_scores").delete().eq("room_id", room.id);
    await sb.from("room_players").update({ is_ready: false }).eq("room_id", room.id);
    await sb
      .from("rooms")
      .update({ status: "lobby", seed: null, started_at: null })
      .eq("id", room.id);
    // Host stays ready.
    await sb
      .from("room_players")
      .update({ is_ready: true })
      .eq("room_id", room.id)
      .eq("client_token", data.clientToken);
    return { ok: true };
  });