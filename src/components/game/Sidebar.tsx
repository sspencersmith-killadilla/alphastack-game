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
}: {
  shape: { cells: { x: number; y: number }[]; color: string };
  length: number;
}) {
  const w = Math.max(...shape.cells.map((c) => c.x)) + 1;
  const h = Math.max(...shape.cells.map((c) => c.y)) + 1;
  const set = new Set(shape.cells.map((c) => `${c.x},${c.y}`));
  return (
    <div className="space-y-1">
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${w}, 14px)`,
          gridTemplateRows: `repeat(${h}, 14px)`,
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
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{length}-letter</div>
    </div>
  );
}