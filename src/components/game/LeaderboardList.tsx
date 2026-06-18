import type { LeaderboardRow } from "@/lib/leaderboard.functions";

export function LeaderboardList({
  rows,
  highlightId,
  compact = false,
}: {
  rows: LeaderboardRow[];
  highlightId?: string | null;
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-slate-900/40 p-4 text-center text-sm text-slate-400">
        No scores yet. Be the first!
      </p>
    );
  }
  return (
    <ol className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/40">
      {rows.map((row, i) => {
        const hi = row.id === highlightId;
        return (
          <li
            key={row.id}
            className={`grid grid-cols-[2rem_3rem_1fr_auto] items-center gap-2 px-3 py-2 font-mono text-sm ${
              i % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"
            } ${hi ? "ring-2 ring-emerald-400" : ""}`}
          >
            <span className="text-right text-slate-500">{i + 1}.</span>
            <span className="font-bold tracking-widest text-amber-300">{row.initials}</span>
            <span className="text-right text-lg font-extrabold text-white tabular-nums">
              {row.score.toLocaleString()}
            </span>
            {!compact && (
              <span className="text-right text-[10px] uppercase tracking-widest text-slate-500">
                L{row.level} · {row.lines}ln · {row.words_solved}w
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}