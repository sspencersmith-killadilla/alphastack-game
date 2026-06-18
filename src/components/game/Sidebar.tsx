import type { ReactNode } from "react";
import { Award, Heart, Layers, Trophy, Zap } from "lucide-react";
import { useGame } from "@/game/store";

export function Sidebar() {
  const score = useGame((s) => s.score);
  const best = useGame((s) => s.best);
  const lines = useGame((s) => s.lines);
  const level = useGame((s) => s.level);
  const lives = useGame((s) => s.lives);
  const next = useGame((s) => s.next);

  return (
    <div className="space-y-3">
      <Stat icon={<Award className="h-4 w-4 text-emerald-400" />} label="Score" value={score} />
      <Stat icon={<Trophy className="h-4 w-4 text-amber-400" />} label="Best" value={best} />
      <Stat icon={<Zap className="h-4 w-4 text-violet-400" />} label="Lines" value={lines} />
      <Stat icon={<Layers className="h-4 w-4 text-sky-400" />} label="Level" value={level} />
      <Stat
        icon={<Heart className="h-4 w-4 text-rose-400" />}
        label="Lives"
        value={"♥".repeat(Math.max(0, lives)) || "—"}
      />
      {next && (
        <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
          <div className="mb-2 text-xs uppercase tracking-widest text-slate-400">Next</div>
          <MiniShape shape={next.shape} length={next.length} />
        </div>
      )}
    </div>
  );
}

export function CompactStats() {
  const score = useGame((s) => s.score);
  const best = useGame((s) => s.best);
  const level = useGame((s) => s.level);
  const lines = useGame((s) => s.lines);
  const lives = useGame((s) => s.lives);
  const next = useGame((s) => s.next);
  return (
    <div className="flex items-stretch gap-2 overflow-x-auto rounded-lg border border-white/10 bg-slate-900/60 p-2">
      <MiniStat label="Score" value={score} accent="text-emerald-300" />
      <MiniStat label="Best" value={best} accent="text-amber-300" />
      <MiniStat label="Lvl" value={level} accent="text-sky-300" />
      <MiniStat label="Lines" value={lines} accent="text-violet-300" />
      <MiniStat
        label="Lives"
        value={"♥".repeat(Math.max(0, lives)) || "—"}
        accent="text-rose-300"
      />
      {next && (
        <div className="ml-auto flex shrink-0 items-center gap-2 rounded-md bg-slate-950/40 px-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Next</span>
          <MiniShape shape={next.shape} length={next.length} cellSize={8} hideLabel />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="min-w-[44px] shrink-0 rounded-md bg-slate-950/40 px-2 py-1 text-center">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`text-sm font-bold leading-tight ${accent}`}>{value}</div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function MiniShape({
  shape,
  length,
  cellSize = 14,
  hideLabel = false,
}: {
  shape: { cells: { x: number; y: number }[]; color: string };
  length: number;
  cellSize?: number;
  hideLabel?: boolean;
}) {
  const w = Math.max(...shape.cells.map((c) => c.x)) + 1;
  const h = Math.max(...shape.cells.map((c) => c.y)) + 1;
  const set = new Set(shape.cells.map((c) => `${c.x},${c.y}`));
  return (
    <div className="space-y-1">
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${w}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${h}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: h }).flatMap((_, y) =>
          Array.from({ length: w }).map((__, x) => (
            <div
              key={`${x}-${y}`}
              className="rounded-[2px]"
              style={{ background: set.has(`${x},${y}`) ? shape.color : "transparent" }}
            />
          )),
        )}
      </div>
      {!hideLabel && (
        <div className="text-[10px] uppercase tracking-widest text-slate-500">{length}-letter</div>
      )}
    </div>
  );
}