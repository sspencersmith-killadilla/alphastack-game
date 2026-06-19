# Spacebar pause + mobile experience improvements

## 1. Spacebar = Pause (swap with P)

In `src/routes/play.tsx` key handler:
- Make `" "` (Space) toggle pause/resume (preventDefault so the page doesn't scroll).
- Remove `P` as the pause key.
- Move hard drop off Space → use `Shift` (or `Enter` during placing) so placing still has a fast-drop key.
- Update `PauseModal` hint text from "Press P to resume" to "Press Space to resume".
- Update `HowToPlay` hint text if it mentions P/Space.

## 2. Mobile experience improvements

The current mobile layout stacks Board → GuessPanel → Keyboard → Controls in one tall column. On a phone you have to scroll to type and again to place the piece. Proposed changes (mobile-only, desktop layout unchanged):

a. **Reorder for thumb reach.** On mobile, render: CompactStats → Board → (context-aware action zone) → HowToPlay. The action zone shows the on-screen Keyboard during the `guessing` phase and the Controls D-pad during the `placing` phase, so the relevant input is always directly under the board with no scrolling.

b. **Bigger, touch-friendly Controls.** Increase D-pad buttons from `h-9 w-9` to `h-14 w-14` on mobile, widen tap targets, and lay them out as a proper left/rotate/right row plus soft/hard drop row sized for thumbs. Desktop keeps the compact size.

c. **Swipe gestures on the Board (placing phase only).** Add touch handlers:
   - swipe left/right → move piece
   - tap → rotate
   - swipe down → soft drop
   - swipe down hard / long swipe → hard drop
   This lets players place pieces without looking away from the board.

d. **Sticky header + safe-area padding.** Add `pb-[env(safe-area-inset-bottom)]` to the main container and keep the header compact on small screens so iOS notch / home indicator don't cover controls.

e. **Prevent pinch-zoom / double-tap zoom during play.** Add `touch-action: manipulation` to the board and control buttons, and ensure the root meta viewport has `maximum-scale=1, user-scalable=no` while on `/play` (via the route head).

f. **Mobile pause button.** The current header pause icon is tiny. Enlarge tap target to 40×40 on mobile and add an `aria-label`.

g. **Keyboard sizing.** The on-screen `Keyboard` keys are `h-9 min-w-[26px]`. Bump to `h-11 min-w-[30px]` on mobile widths for accurate tapping; keep current size on `sm:` and up.

## Technical details

Files to change:
- `src/routes/play.tsx` — key handler (Space = pause, Shift = hard drop), mobile layout reorder driven by `phase`, viewport meta in route head, safe-area padding.
- `src/components/game/PauseModal.tsx` — hint text.
- `src/components/game/HowToPlay.tsx` — update key hints.
- `src/components/game/Controls.tsx` — larger touch targets on mobile (`h-14 w-14 sm:h-9 sm:w-9`), `touch-action: manipulation`.
- `src/components/game/Keyboard.tsx` — larger keys on mobile.
- `src/components/game/Board.tsx` — touch/swipe handlers wired to `move`, `rotate`, `softDrop`, `hardDrop` (only when `phase === "placing"`).

No game-logic or scoring changes. No backend changes.

## Open questions

- For hard drop on desktop after Space is reassigned: use **Shift** or **Enter**? I'll default to **Shift** unless you'd prefer Enter.
- Swipe gestures on the board: OK to add, or do you want to keep the on-screen D-pad as the only placing input on mobile?
