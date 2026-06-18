## Goal

Replace the small hand-curated word lists in `src/game/words.ts` with a large bundled English dictionary so words like `fling`, `flung`, `darn`, etc. are all accepted. Per your choice, the same broad list powers both accepted guesses **and** the hidden puzzle words.

## Source list

Use the **ENABLE** wordlist (the standard ~172k-word North-American Scrabble dictionary, public domain). After filtering to alphabetic-only words of length 4, 5, and 6 we get roughly:

- 4-letter: ~4,000 words
- 5-letter: ~8,900 words
- 6-letter: ~15,000 words

Total ~28k words, ~180 KB plain text. Gzipped over the wire this is ~70 KB — fine for a game bundle.

## Changes

### 1. Add the wordlist data file
`src/game/wordlist.txt` — committed plain text, one word per line, lowercase, only 4/5/6-letter alphabetic entries. Generated once from ENABLE and checked in (no runtime download).

### 2. Rewrite `src/game/words.ts`
- Import the text file with Vite's `?raw` suffix:
  `import RAW from "./wordlist.txt?raw";`
- Parse once at module load into three `Set<string>` (length 4/5/6) plus three `string[]` for random picks.
- Keep the exported API identical so nothing else changes:
  - `isRealWord(word)` — same signature
  - `randomAnswer(length, rng?)` — same signature
  - `randomLength(rng?)` — unchanged
  - `WORDS_4 / WORDS_5 / WORDS_6` — still exported (now ~thousands long)

### 3. Heads-up about side effects
Because the *answer* pool is now the full Scrabble list, some puzzles will be obscure words (e.g. `zax`, `qoph`-style). You asked for the single broad list — flagging this so it's not a surprise. If it becomes annoying we can later split into "common answers + broad accepted guesses" by adding a second small curated answer list, without touching `isRealWord`.

### 4. No other code touches
`store.ts`, `engine.ts`, daily seed RNG, leaderboard, etc. are unaffected — they only call the existing `words.ts` API.

## Files touched

- **Add**: `src/game/wordlist.txt`
- **Edit**: `src/game/words.ts`
