
# Daily Puzzle Mode

A second way to play AlphaStack. Every player who starts a daily puzzle on a given UTC date gets the exact same sequence of words and tetromino shapes, plays until game over (one attempt only), and is ranked on a daily leaderboard against everyone who faced the identical challenge. Free Play stays as it is today.

## User experience

- **Home page** gets two clear entry points: **Daily Puzzle** and **Free Play**.
- **Daily Puzzle card** on home shows:
  - Today's date (UTC) and a live countdown to the next reset.
  - One of three states for the current visitor: *Not played yet*, *In progress*, or *Completed — score X, rank Y*.
  - A "Share result" button after completion (spoiler-free: score, rank, date — no words).
- **Daily run**: identical rules to Free Play (survive until game over), but:
  - Words and shapes are deterministic from the UTC date — every player sees the same first word, second word, etc.
  - Only one attempt per UTC day. After game over, the start button is replaced by "Come back at <countdown>".
  - A small "DAILY · YYYY-MM-DD" badge sits in the play header so the player knows which mode they're in.
- **Leaderboard page** gains a tab switcher: **Daily** (today's puzzle only) / **All-time** (existing). Daily tab shows the date and countdown at the top.
- **Free Play** is unchanged and always available, with its own leaderboard exactly as today.

## Rules and edge cases

- **Reset**: 00:00 UTC. A run started before midnight that crosses midnight still counts for the day it was *started*.
- **One attempt** is enforced two ways:
  1. Client-side: localStorage flag `alphastack:daily:<YYYY-MM-DD>` blocks the start button and the route.
  2. Server-side: the daily score table has a unique constraint on (puzzle_date, client_token), so a second submission for the same day from the same browser is rejected. This is anti-casual, not anti-cheat (clearing storage gets a new token) — acceptable for a friendly daily.
- **Abandoned runs**: if the player closes the tab mid-run, that counts as their attempt (no score submitted = no leaderboard entry, but they can't restart today). A confirm dialog warns before navigating away from an in-progress daily.
- **Free Play is untouched**: separate store state, separate leaderboard scope, separate score table — no risk of cross-contamination.

## Technical details

### Deterministic puzzle generation
- New `src/game/daily.ts` exports `getDailySeed(date: Date): string` returning `YYYY-MM-DD` in UTC, and `createDailyRng(seed: string)` returning a seeded PRNG (mulberry32 over a hash of the seed string — tiny, no deps).
- Refactor `src/game/words.ts` `randomLength`/`randomAnswer` and `src/game/shapes.ts` `randomShape` to accept an optional `rng: () => number` argument. Default stays `Math.random` so Free Play behaviour is identical.
- The game store gets a `mode: "free" | "daily"` flag and, when daily, threads the seeded RNG through every call that picks the next word/shape. Same engine, same scoring, same lives — only the source of randomness changes.

### Routes & UI
- New route `src/routes/daily.tsx` — mirrors `/play` but starts the store in daily mode and renders the daily header/badge. Shares the existing `Board`, `GuessPanel`, `Keyboard`, etc.
- Update `src/routes/index.tsx` to show the two-mode landing.
- Update `src/routes/leaderboard.tsx` with a Daily / All-time tab. Default tab = Daily.
- `src/routes/play.tsx` stays as Free Play.

### Backend (Lovable Cloud)
- New table `daily_scores` (migration): `id`, `puzzle_date date`, `initials`, `score`, `lines`, `level`, `words_solved`, `duration_seconds`, `client_token`, `created_at`. Unique index on `(puzzle_date, client_token)`. RLS: public SELECT for today and prior days; inserts go through a server function only (no anon insert).
- New server functions in `src/lib/daily-leaderboard.functions.ts`:
  - `submitDailyScore` — validates with the same plausibility checks as `submitScore`, sets `puzzle_date` from server-side `new Date().toISOString().slice(0,10)` (NOT trusting the client), inserts, returns rank-for-today.
  - `getDailyLeaderboard({ date?, limit })` — defaults to today UTC, returns top N for that date.
  - `getDailyStatus({ clientToken })` — returns whether this token already submitted today and, if so, their score+rank. Drives the home-page state and the "already played" gate.
- The existing all-time `submitScore` / `getLeaderboard` are untouched.

### Layout
```text
src/
├── game/
│   ├── daily.ts            (new — seed + PRNG)
│   ├── words.ts            (accept optional rng)
│   ├── shapes.ts           (accept optional rng)
│   └── store.ts            (add mode flag, thread rng)
├── lib/
│   └── daily-leaderboard.functions.ts   (new)
├── routes/
│   ├── index.tsx           (two-mode landing)
│   ├── daily.tsx           (new)
│   ├── play.tsx            (unchanged behaviour)
│   └── leaderboard.tsx     (add tabs)
└── components/game/
    └── DailyHeader.tsx     (new — date + countdown badge)
```

### Migration sketch
- Create `public.daily_scores` with the columns above + GRANTs (`SELECT` to anon, `ALL` to service_role; no client INSERT).
- Enable RLS, add `SELECT` policy `true`.
- Unique index on `(puzzle_date, client_token)`.
- Index on `(puzzle_date, score DESC)` for fast leaderboard reads.

## What this plan does *not* change

- Free Play scoring, engine, word list, shapes, or leaderboard.
- Auth model (still anonymous, initials-based).
- Any existing route, component, or score row.

Ready to build on approval.
