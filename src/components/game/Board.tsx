import { COLS, ROWS, pieceTiles } from "@/game/engine";
import { useGame } from "@/game/store";

export function Board() {
  const board = useGame((s) => s.board);
  const active = useGame((s) => s.active);
  const phase = useGame((s) => s.phase);

  const overlay = active && phase !== "gameover" ? pieceTiles(active) : [];
  const overlayMap = new Map<string, { letter: string; color: string }>();
  for (const t of overlay) {
    if (t.y < 0 || t.y >= ROWS) continue;
    overlayMap.set(`${t.x},${t.y}`, { letter: t.letter.toUpperCase(), color: t.color });
  }

  return (
    <div
      className="grid gap-[2px] rounded-lg border border-white/10 bg-slate-950/60 p-2 shadow-2xl shadow-black/40"
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