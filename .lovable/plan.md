# AlphaStack — Plan

A single-page game crossing Wordle (guess a hidden word) with Tetris (place the resulting shape on a 10×20 board).

## Gameplay loop

1. Round starts: game picks a hidden word (4–6 letters) and assigns it a classic Tetris-style shape sized to the letter count (I/O/T/L/J/S/Z for 4; pentomino-style for 5; hexomino-style for 6). Each cell of the shape maps to one letter of the word in reading order.
2. Piece spawns at the top of the 10×20 playfield. Player **cannot** move/rotate it yet.
3. Player gets up to **6 Wordle-style guesses** in a side panel (only real dictionary words of the matching length accepted; invalid words are rejected with a shake, not counted).
4. Each **wrong** guess drops the piece down one row (Wordle colour feedback: green/yellow/grey on the guess grid + keyboard).
5. **Correct guess** → piece is "solved": it stops auto-falling, tiles display the letters, player can move ←/→, rotate, soft-drop ↓, hard-drop Space to place it anywhere reachable.
6. **6 wrong guesses** → piece becomes "unsolved": hard-drops straight down as plain coloured blocks (no letters).
7. Piece locks. Full rows clear. **Points only count for cleared tiles that came from solved words.** Unsolved tiles still clear but score 0.
8. Next word + piece spawns. Repeat.

## Scoring & progression

- Points per cleared *solved* tile: 10 × level multiplier.
- Row-clear bonus: solved-tile-count × (rows cleared) × 5.
- Level up every 10 line clears; speed only matters for the pre-solve auto-drop cadence (faster forced drops give less time to guess at higher levels — visual "tick" between guesses tightens, but the drop is still tied to wrong guesses; level adds a passive timer drop on top at higher levels).
- **Lives:** start with 3. Lose 1 life if a piece is placed unsolved. Game over when stack reaches top OR lives hit 0.

## Screens

- **Title screen:** AlphaStack logo, Play, How to Play, Best score.
- **Game screen:** layout matches the reference image — left rail (Score / Best / Lines / Level / Next), centre 10×20 board, right rail (current guess row, guess history, on-screen QWERTY with colour state, movement controls, How to Play card).
- **Game Over modal:** final score, lines, words solved, Play Again.

## Technical details

- **Stack:** TanStack Start (existing), React 19, Tailwind v4, shadcn. No backend needed — pure client game. Best score in `localStorage`.
- **Routes:**
  - `src/routes/index.tsx` — title / menu.
  - `src/routes/play.tsx` — game screen.
- **State:** single `useGameStore` (Zustand) holding board (number[][] with tile metadata: colour, letter|null, solved bool), activePiece, nextPiece, guesses, currentGuess, keyboardState, score/best/lines/level/lives, phase (`guessing` | `placing` | `locking` | `gameover`).
- **Word list:** bundle a curated answer list (~500 words per length, 4/5/6) plus a larger allowed-guess list for validation. Stored as three `.ts` files under `src/game/words/`.
- **Shapes:** `src/game/shapes.ts` exports tetromino set (4), pentomino set (5), hexomino subset (6) as coordinate arrays with rotation states. Letters are mapped to cells in a stable reading order so rotations keep letter identity.
- **Engine:** `src/game/engine.ts` — pure functions for `rotate`, `move`, `collide`, `lockPiece`, `clearRows` (returns cleared row indices + solved-tile counts for scoring).
- **Input:** keyboard listeners on the play route — letters/Enter/Backspace for guessing; ←/→/↑(rotate)/↓(soft)/Space(hard) only enabled when `phase === 'placing'`. On-screen buttons mirror this.
- **Styling:** dark navy background (#0b1220-ish), neon accent palette pulled from the logo (red/blue/green/yellow/purple/orange) used per-piece. Title uses a chunky display font (e.g. Space Grotesk) for the AlphaStack wordmark; UI body in Inter. Tile cells use rounded squares with subtle inner shadow.
- **Animations:** piece drop = CSS transform tween; row-clear = flash + collapse; invalid-word = shake on the guess row.

## Files to create

```text
src/game/words/four.ts
src/game/words/five.ts
src/game/words/six.ts
src/game/words/dictionary.ts        // combined allowed-guess set
src/game/shapes.ts
src/game/engine.ts
src/game/store.ts                   // zustand
src/components/game/Board.tsx
src/components/game/GuessPanel.tsx
src/components/game/Keyboard.tsx
src/components/game/Sidebar.tsx     // Score/Best/Lines/Level/Lives/Next
src/components/game/Controls.tsx    // movement buttons
src/components/game/HowToPlay.tsx
src/components/game/GameOverModal.tsx
src/routes/play.tsx
src/assets/logo.png.asset.json      // uploaded logo via lovable-assets
```

Update `src/routes/index.tsx` into the title screen and replace placeholder.

## Out of scope (v1)

- Online leaderboards, accounts, sound effects (can add later).
- Daily-puzzle mode.
- Mobile touch gestures beyond the on-screen buttons (buttons work; swipe later).
