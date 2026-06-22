## Goal

Add live multiplayer rooms where 2–6 players race the same word/shape sequence in real time. Anyone can create a room, share a 6-character code, and watch a live leaderboard update as players solve words and clear lines.

## User flow

1. From the home page, a new "Play with friends" card opens `/rooms`.
2. `/rooms` has two actions: **Create room** (generates code, takes you to lobby) and **Join room** (enter code).
3. `/rooms/$code` lobby: shows code, copy-link button, list of joined players (initials + ready state), round length (default 3 min), and a **Start** button (host only, enabled when ≥2 players are ready).
4. When the host starts, all clients seed the same deterministic RNG from the room code + start timestamp, and the existing game runs in "match" mode. A compact live leaderboard sits beside the board showing each player's score, lines, and current word index in real time.
5. When the timer ends (or a player tops out), results screen shows final standings, with a "Rematch" button that reuses the same room.

## Backend (Lovable Cloud)

Three new tables, all anonymous-friendly (keyed by `client_token` already used for the existing leaderboard, no auth):

- `rooms` — `code` (6-char unique), `host_token`, `status` ('lobby'|'playing'|'finished'), `seed`, `started_at`, `round_seconds`, `created_at`.
- `room_players` — `room_id`, `client_token`, `initials`, `is_ready`, `joined_at`, `last_seen_at`. Unique on (room_id, client_token).
- `room_scores` — live snapshot per player: `room_id`, `client_token`, `score`, `lines`, `words_solved`, `level`, `topped_out`, `updated_at`.

RLS: public SELECT on all three (rooms are throwaway and codes are unguessable enough for a casual party game). Writes go through server functions that verify `client_token` matches the row being mutated; host-only actions (start, kick) verify `host_token`.

Enable Realtime on `room_players` and `room_scores` so every client gets `postgres_changes` events. Rooms auto-expire: a cron-cleanup is out of scope — instead, the lobby UI filters out rooms older than 2 hours and a daily Postgres function trims old rows.

## Server functions (`src/lib/rooms.functions.ts`)

- `createRoom({ initials })` → inserts room + first player, returns `{ code, clientToken }`.
- `joinRoom({ code, initials, clientToken })` → upserts into `room_players`, returns room + player list.
- `setReady({ code, clientToken, ready })`.
- `startRoom({ code, clientToken, roundSeconds })` → host-only; sets status='playing', writes `seed` = code + timestamp, `started_at = now()`.
- `updateScore({ code, clientToken, score, lines, wordsSolved, level, toppedOut })` → throttled client-side to ~1/sec.
- `finishRoom({ code, clientToken })` → host-only; status='finished'.

## Frontend changes

- New routes: `src/routes/rooms.tsx` (create/join landing) and `src/routes/rooms.$code.tsx` (lobby + match + results, phase-driven).
- New components: `RoomLobby`, `RoomLiveLeaderboard`, `RoomResults`.
- `src/game/store.ts` gains a `match` mode alongside `free`/`daily`. Match mode:
  - Seeds `activeRng` from the room's `seed` (same `createDailyRng` helper, different key).
  - On every `lockAndAdvance`, calls `updateScore` (throttled).
  - On `gameover`, marks `toppedOut: true` and waits for round timer.
- A shared Realtime subscription hook (`useRoomChannel`) lives in the route component, subscribes once in `useEffect`, cleans up on unmount.
- Home page (`src/routes/index.tsx`) gets a third `ModeCard` linking to `/rooms`.

## Determinism

The existing engine is already deterministic given the RNG. Match mode reuses `createDailyRng` with key `room:${code}:${started_at}` so every client generates the same words and shapes in the same order. Player input only affects their own board; the live leaderboard reflects what each player has done with the shared sequence.

## Out of scope (can be follow-ups)

- "Attack mode" garbage rows sent to opponents.
- Spectator mode / replay.
- Persistent friend lists or match history (would need accounts).
- Reconnect after browser close mid-match (we'll keep the player slot for 30s via `last_seen_at` and that's it).

## Technical notes

- Room codes: 6 chars from a 32-char alphabet (no ambiguous 0/O/1/I). ~1B combinations, collision-checked on insert with retry.
- Throttling score updates client-side avoids a write storm; Realtime + RLS keeps everything client-driven, no edge functions needed.
- All score writes use `requireSupabaseAuth`-free server functions that validate `client_token` matches the row — same anonymous trust model as the existing `scores` table, which is acceptable for a casual leaderboard.
- Existing all-time leaderboard is untouched; match scores do NOT feed `scores` or `daily_scores`.
