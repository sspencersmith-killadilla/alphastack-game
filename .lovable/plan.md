## Goal
Take AlphaStack from prototype to production-ready: online arcade-style leaderboard, server-validated scores, local persistence, analytics, audio, and polish.

## 1. Enable Lovable Cloud
Provisions database, server functions, and secrets. No user accounts — leaderboard entries are anonymous (3-letter initials, arcade-style).

## 2. Leaderboard (anonymous, arcade-style)

**Database**
- `scores` table: `id, initials (char 3), score, lines, level, words_solved, duration_seconds, game_seed, client_token, created_at`
- Public `SELECT` policy (top 100 all-time + top 50 daily)
- No public `INSERT` — writes go through a server function only

**Server functions**
- `submitScore({ initials, score, lines, level, words_solved, duration_seconds, seed, runHash })`
  - Zod validation: initials `^[A-Z]{3}$`, numeric bounds, max duration, etc.
  - Anti-cheat checks (see §3)
  - Insert via service role
- `getLeaderboard({ scope: 'all' | 'daily' })` — public read via publishable client

**UI**
- Game Over modal: if score qualifies (top 100 or top 50 daily), show 3-letter initials entry (auto-uppercase, arcade font, A/B/C arrow-cycle optional — keep it simple with text input + uppercase mask)
- New `/leaderboard` route with All-Time / Today tabs
- Compact "Top 5" panel on home page and sidebar during play
- Highlight the just-submitted row

## 3. Anti-cheat basics
Server-side `submitScore` rejects when:
- Initials don't match `^[A-Z]{3}$`
- `score`, `lines`, `level`, `words_solved` outside plausible bounds
- `score` inconsistent with `lines + words_solved` (recompute server-side using known scoring formula; reject if client score > computed + small tolerance)
- `duration_seconds` too short for the claimed lines (min seconds-per-line floor)
- `level` inconsistent with `lines` (level = floor(lines/10) + 1)
- Duplicate `client_token` (idempotency — one submit per game)
- Soft rate-limit: max N submits per IP per minute (best-effort; documented as not a hard limit)
- Profanity filter on initials (small blocklist: FUK, SHT, NIG, FAG, CUM, ASS, TIT, etc.)

Client sends a per-game `client_token` (uuid generated at game start) and `game_seed` for traceability. No client-side "trust me" fields are accepted.

## 4. Persistence (localStorage)
- `alphastack:best` — best score, lines, words (already partly there; harden)
- `alphastack:settings` — sfx volume, music on/off, ghost piece, reduced motion
- `alphastack:resume` — in-progress board, queue, score, lives so a refresh doesn't wipe a run (prompt "Resume game?" on load)
- `alphastack:lastInitials` — pre-fill the initials box

## 5. Analytics
Lightweight event log via a server function → `analytics_events` table (`event, props jsonb, session_id, created_at`). Events:
- `game_start`, `game_over` (with score/lines/words/duration)
- `word_solved` (length, time-to-solve)
- `score_submitted` (rank achieved)
- `leaderboard_viewed`

No PII. Session id is a random uuid in localStorage.

## 6. Audio
Web Audio API with tiny synthesized SFX (no asset downloads, keeps bundle small):
- piece lock, line clear (1/2/3/4-line variants), word solved, level up, game over, menu click
- Optional subtle background loop (off by default)
- Mute toggle + volume slider in settings, persisted

## 7. Polish
- Pause menu (P key) with Resume / Restart / Settings / Quit
- Settings panel: SFX volume, music toggle, ghost piece toggle, reduced motion, key remap (left/right/rotate/soft-drop/hard-drop/hold)
- Toast on word solved with the word + points
- Subtle screen shake on Tetris (4-line clear) — respects reduced motion
- New best score celebration animation
- Favicon, OG image, meta description, twitter card on `/`, `/play`, `/leaderboard`
- Mobile touch controls deferred (call out as next step)

## 8. Smoke test update
Extend `scripts/smoke_test.py` to:
- Visit `/leaderboard` and check it renders
- Trigger a game-over flow and verify initials prompt appears for qualifying scores (mock by inserting a low high-water mark in test DB) — optional

## Technical notes
- All score writes go through `createServerFn` with Zod + service-role insert (loaded inside the handler).
- Reads use the server publishable client with a narrow `TO anon` SELECT policy.
- Migrations include `GRANT SELECT ON public.scores TO anon, authenticated` and `GRANT ALL ON public.scores TO service_role`.
- RLS enabled; only SELECT policy for anon; no INSERT/UPDATE/DELETE policies (service role bypasses).
- Audio is synthesized (OscillatorNode) — zero asset cost, lazy-initialized on first user gesture to satisfy autoplay rules.

## Out of scope (flagged for later)
- Sign-in / per-user accounts
- Mobile touch controls
- Hard backend rate limiting (no standard primitive yet — soft limit only)
- Replay verification (would require recording inputs)
