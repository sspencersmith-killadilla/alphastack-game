import { useRef } from "react";
import { COLS, ROWS, hardDrop as engineHardDrop, pieceTiles } from "@/game/engine";
import { useGame } from "@/game/store";
import { useSettings } from "@/lib/settings";

export function Board() {
  const board = useGame((s) => s.board);
  const active = useGame((s) => s.active);
  const phase = useGame((s) => s.phase);
  const ghostOn = useSettings((s) => s.ghostPiece);
  const move = useGame((s) => s.move);
  const rotate = useGame((s) => s.rotate);
  const softDrop = useGame((s) => s.softDrop);
  const hardDrop = useGame((s) => s.hardDrop);

  const touchRef = useRef<{ x: number; y: number; t: number; lastStepX: number; moved: boolean } | null>(null);
  const STEP = 26; // px per horizontal step

  const onTouchStart = (e: React.TouchEvent) => {
    if (phase !== "placing") return;
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now(), lastStepX: t.clientX, moved: false };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const r = touchRef.current;
    if (!r || phase !== "placing") return;
    const t = e.touches[0];
    const dx = t.clientX - r.lastStepX;
    if (Math.abs(dx) >= STEP) {
      const steps = Math.trunc(dx / STEP);
      for (let i = 0; i < Math.abs(steps); i++) move(steps > 0 ? 1 : -1);
      r.lastStepX += steps * STEP;
      r.moved = true;
    }
    const dy = t.clientY - r.y;
    if (Math.abs(dy) > 12) r.moved = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const r = touchRef.current;
    touchRef.current = null;
    if (!r || phase !== "placing") return;
    const t = e.changedTouches[0];
    const dx = t.clientX - r.x;
    const dy = t.clientY - r.y;
    const dt = Date.now() - r.t;
    // Swipe down → hard drop (fast/long) or soft drop (gentle)
    if (dy > 60 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      if (dy > 120 || dt < 250) hardDrop();
      else softDrop();
      return;
    }
    // Tap (no significant movement) → rotate
    if (!r.moved && dt < 300 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      rotate();
    }
  };

  const overlay = active && phase !== "gameover" ? pieceTiles(active) : [];
  const overlayMap = new Map<string, { letter: string; color: string }>();
  for (const t of overlay) {
    if (t.y < 0 || t.y >= ROWS) continue;
    overlayMap.set(`${t.x},${t.y}`, { letter: t.letter.toUpperCase(), color: t.color });
  }

  // Ghost preview: only when the player can place (solved + placing) and the
  // setting is on. Computed from the active piece's drop target.
  const ghostMap = new Map<string, { color: string }>();
  if (ghostOn && active && active.solved && phase === "placing") {
    const dropped = engineHardDrop(board, active);
    for (const t of pieceTiles(dropped)) {
      if (t.y < 0 || t.y >= ROWS) continue;
      const key = `${t.x},${t.y}`;
      if (overlayMap.has(key)) continue;
      ghostMap.set(key, { color: t.color });
    }
  }

  return (
    <div
      className="grid gap-[2px] rounded-lg border border-white/10 bg-slate-950/60 p-2 shadow-2xl shadow-black/40 touch-none select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
        aspectRatio: `${COLS} / ${ROWS}`,
        width: "min(46vh, 100%)",
      }}
    >
      {Array.from({ length: ROWS }).flatMap((_, y) =>
        Array.from({ length: COLS }).map((__, x) => {
          const tile = board[y][x];
          const ov = overlayMap.get(`${x},${y}`);
          const showSolved = active?.solved && ov;
          if (ov) {
            return (
              <Cell
                key={`${x}-${y}`}
                color={ov.color}
                letter={showSolved ? ov.letter : null}
                ghost={!active?.solved}
              />
            );
          }
          const gh = ghostMap.get(`${x},${y}`);
          if (gh) {
            return (
              <div
                key={`${x}-${y}`}
                className="rounded-[3px]"
                style={{
                  background: "transparent",
                  boxShadow: `inset 0 0 0 2px ${gh.color}66`,
                }}
              />
            );
          }
          if (tile) {
            return (
              <Cell
                key={`${x}-${y}`}
                color={tile.color}
                letter={tile.letter}
                solved={tile.solved}
              />
            );
          }
          return (
            <div
              key={`${x}-${y}`}
              className="rounded-[3px] bg-slate-900/50 ring-1 ring-inset ring-white/[0.04]"
            />
          );
        }),
      )}
    </div>
  );
}

function Cell({
  color,
  letter,
  ghost,
  solved,
}: {
  color: string;
  letter: string | null;
  ghost?: boolean;
  solved?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-[3px] font-bold text-white"
      style={{
        background: ghost
          ? `${color}55`
          : `linear-gradient(160deg, ${color} 0%, ${shade(color, -25)} 100%)`,
        boxShadow: ghost
          ? `inset 0 0 0 1px ${color}aa`
          : `inset 0 1px 0 rgba(255,255,255,.25), inset 0 -2px 0 rgba(0,0,0,.25)`,
        fontSize: "min(2.2vh, 14px)",
        textShadow: "0 1px 1px rgba(0,0,0,.5)",
        opacity: solved === false ? 0.85 : 1,
      }}
    >
      {letter ?? ""}
    </div>
  );
}

function shade(hex: string, percent: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (percent / 100) * 255)));
  r = f(r);
  g = f(g);
  b = f(b);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}