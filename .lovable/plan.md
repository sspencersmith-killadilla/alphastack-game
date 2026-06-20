## Goal
Restrict both guess validation and puzzle answers to a Scrabble tournament dictionary.

## Background
Today `src/game/wordlist.txt` is an ENABLE-derived list (bundled via `?raw` in `src/game/words.ts`). ENABLE overlaps with Scrabble dictionaries but is not identical and includes words not valid in tournament play. Both `isRealWord` (guess check) and `randomAnswer` (puzzle pick) read from this same file.

## Question for you
Which Scrabble dictionary do you want?

1. **TWL06** (Tournament Word List) — used in North America (USA/Canada/Thailand). ~178k words.
2. **SOWPODS / Collins Scrabble Words** — used everywhere else; superset of TWL. ~280k words.
3. **Intersection of both** — safest "universally valid" Scrabble words.

Default recommendation: **TWL06**, since it's the stricter, more recognizable North American list and avoids obscure Collins-only entries (e.g. `QI`, `ZA` exist in both but Collins adds many rare forms).

## Plan (once you pick a list)

1. Replace `src/game/wordlist.txt` with the chosen Scrabble dictionary, filtered to 4/5/6-letter alphabetic entries (uppercase or lowercase; normalized to lowercase at load).
2. No code changes needed in `src/game/words.ts` — it already partitions by length and exposes `WORDS_4/5/6`, `isRealWord`, `randomAnswer`, `randomLength`, `rampLength`. Verify after swap that each bucket is non-empty.
3. Add a short header comment in `wordlist.txt` (or a sibling `LICENSE` note) attributing the source, since Scrabble dictionaries have licensing considerations (TWL/Collins are trademarked; the underlying word lists are facts but distribution etiquette varies).
4. Sanity check: load the new file in a quick script, assert counts for each length, spot-check a few known Scrabble-valid (`QI`, `ZA` are 2-letter so n/a here; check `AALII`, `QADI`, `ZAYIN`) and known invalid (`ZONKS` is valid; verify `OUIJA` excluded from TWL but allowed in Collins, etc.).
5. Rebuild — existing daily-difficulty ramp, scoring, and guess flow keep working unchanged because the API surface of `words.ts` is identical.

## Notes
- Daily puzzle determinism is preserved: the seeded RNG indexes into the new list the same way, but **past daily seeds will produce different words** than before the swap (unavoidable when the list changes). New best/leaderboard scores from today forward use the new list.
- File size: TWL ~1.9MB raw, ~700KB after filtering to 4–6 letters; bundled as a string via Vite `?raw` — fine for a game payload.
