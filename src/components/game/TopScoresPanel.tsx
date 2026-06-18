import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { getLeaderboard } from "@/lib/leaderboard.functions";

export function TopScoresPanel() {
  const { data: rows = [] } = useQuery({
    queryKey: ["leaderboard", "all", 5],
    queryFn: () => getLeaderboard({ data: { scope: "all", limit: 5 } }),
  });
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-left">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-300">
          <Trophy className="h-4 w-4" /> Top scores
        </div>
        <Link to="/leaderboard" className="text-xs text-emerald-300 hover:underline">
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Be the first on the board.</p>
      ) : (
        <ol className="space-y-1 font-mono text-sm">
          {rows.map((row, i) => (
            <li key={row.id} className="flex items-center justify-between">
              <span className="text-slate-500">{i + 1}.</span>
              <span className="flex-1 px-2 font-bold tracking-widest text-amber-300">{row.initials}</span>
              <span className="font-extrabold tabular-nums text-white">{row.score.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}