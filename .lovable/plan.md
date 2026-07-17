## Goal
Make the game screen fit within a single mobile viewport — no scrolling to reach the keyboard/controls.

## Current problem
`Board.tsx` sizes the board at `width: min(46vh, 100%)` with no max width tied to the remaining vertical space after header, stats strip, guess panel, and keyboard. On short phones the board + guess panel + keyboard together exceed 100vh, forcing a scroll.

## Changes (mobile-only; desktop untouched)

1. **`src/components/game/Board.tsx`**
   - Replace the fixed `width: min(46vh, 100%)` with a CSS-variable-driven size so the board scales to whatever vertical room is left: `height: min(var(--board-max-h, 46vh), 100%)`, width derived from aspect ratio.
   - On mobile, shrink the default cap (e.g. `38vh`) so the keyboard/guess panel fit under it.

2. **`src/routes/play.tsx` and `src/routes/daily.tsx`**
   - Wrap the mobile layout in a `h-[100dvh] flex flex-col` container so header + stats + board + panel + keyboard divide the available height instead of stacking past the fold.
   - Use `flex-1 min-h-0` on the board wrapper and set `--board-max-h` there so the board takes exactly the leftover space.
   - Tighten vertical gaps/padding on mobile (`space-y-2` instead of `space-y-3`, smaller header padding).
   - Move `HowToPlay` out of the always-visible stack on mobile (render only when paused or as a collapsible), so it doesn't push content off-screen.

3. **`src/components/game/Keyboard.tsx` and `GuessPanel.tsx`**
   - Reduce mobile key height slightly (e.g. `h-11` → `h-10`) and row gap, so the three keyboard rows + guess tiles fit comfortably in the bottom third.

4. **`src/components/game/Controls.tsx`**
   - Compact the D-pad on mobile so the placing-phase layout matches the tighter budget.

## Non-goals
- No changes to game logic, scoring, or desktop layout.
- No changes to multiplayer/room routes beyond what's needed if they share the same layout wrapper (they don't currently).

## Verification
- Load `/play` and `/daily` in mobile viewport (iPhone SE 375×667 and 390×844); confirm no vertical scroll during guessing and placing phases.
- Confirm board tiles remain square and legible; keyboard remains tappable.
- Desktop `/play` unchanged.
