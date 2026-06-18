import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { LeaderboardList } from "@/components/game/LeaderboardList";
import { getLeaderboard } from "@/lib/leaderboard.functions";
import { track } from "@/lib/analytics-client";
import { ALPHASTACK_LOGO_URL } from "@/lib/assets";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "AlphaStack Leaderboard — Top Scores" },
      { name: "description", content: "The highest AlphaStack scores from players around the world." },
      { property: "og:title", content: "AlphaStack Leaderboard" },
      { property: "og:description", content: "Top AlphaStack scores from players around the world." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [scope, setScope] = useState<"all" | "daily">("all");

  useEffect(() => {
    track("leaderboard_viewed", { scope });
  }, [scope]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["leaderboard", scope],
    queryFn: () => getLeaderboard({ data: { scope, limit: 50 } }),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1024] via-[#0b1330] to-[#0a1024] text-slate-100">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={ALPHASTACK_LOGO_URL} alt="AlphaStack" className="h-9 w-9 rounded-md" />
          <span className="text-xl font-extrabold tracking-tight">
            Alpha<span className="text-emerald-400">Stack</span>
          </span>
        </Link>
        <Link
          to="/play"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-emerald-400"
        >
          Play
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Leaderboard</h1>
        <div className="mt-4 inline-flex rounded-lg border border-white/10 bg-slate-900/60 p-1">
          <TabBtn active={scope === "all"} onClick={() => setScope("all")}>All-Time</TabBtn>
          <TabBtn active={scope === "daily"} onClick={() => setScope("daily")}>Today</TabBtn>
        </div>
        <div className="mt-4">
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <LeaderboardList rows={rows} />
          )}
        </div>
      </main>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-sm font-bold transition-colors ${
        active ? "bg-emerald-500 text-slate-900" : "text-slate-300 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}