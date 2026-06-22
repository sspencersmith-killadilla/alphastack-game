import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopScoresPanel } from "@/components/game/TopScoresPanel";
import { ALPHASTACK_LOGO_URL } from "@/lib/assets";
import { formatCountdown, getDailySeed, msUntilNextDailyReset } from "@/game/daily";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlphaStack — Wordle meets Tetris" },
      { name: "description", content: "Guess the hidden word to unlock the falling shape, then stack it Tetris-style to clear rows." },
      { property: "og:title", content: "AlphaStack — Wordle meets Tetris" },
      { property: "og:description", content: "Guess the hidden word to unlock the falling shape, then stack it Tetris-style." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#0a1024] via-[#0b1330] to-[#0a1024] px-6 py-12 text-center text-slate-100">
      <img src={ALPHASTACK_LOGO_URL} alt="AlphaStack logo" className="h-32 w-32 rounded-2xl shadow-2xl shadow-black/50" />
      <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
        Alpha<span className="text-emerald-400">Stack</span>
      </h1>
      <p className="mt-3 max-w-md text-balance text-slate-400">
        A word puzzle stacked on a falling-block game. Solve the hidden word to take control of the piece, then clear rows.
      </p>
      <ModeCards />
      <Link
        to="/leaderboard"
        className="mt-4 rounded-lg border border-amber-400/40 bg-amber-500/10 px-5 py-2 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
      >
        View Leaderboard
      </Link>
      <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 text-sm text-slate-400 sm:grid-cols-3">
        <Tip emoji="🟩" text="Guess the word- get the hints." />
        <Tip emoji="🧩" text="Solve it, then steer the piece into place." />
        <Tip emoji="🏆" text="Only solved tiles score when rows clear." />
      </div>
      <div className="mt-10 w-full max-w-sm">
        <TopScoresPanel />
      </div>
    </div>
  );
}

function ModeCards() {
  const [ms, setMs] = useState(() => msUntilNextDailyReset());
  const [playedToday, setPlayedToday] = useState(false);
  useEffect(() => {
    setPlayedToday(window.localStorage.getItem(`alphastack:daily:${getDailySeed()}`) === "done");
    const id = window.setInterval(() => setMs(msUntilNextDailyReset()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
      <Link
        to="/daily"
        className="group flex flex-col items-start rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-5 text-left transition-colors hover:bg-emerald-500/20"
      >
        <div className="flex w-full items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-300">Daily Puzzle</h2>
          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-200">
            {getDailySeed()}
          </span>
        </div>
        <div className="mt-2 text-2xl font-extrabold text-white">
          {playedToday ? "See today's leaderboard" : "Play today's puzzle"}
        </div>
        <p className="mt-1 text-xs text-slate-300">
          Same words and shapes for everyone. One attempt per day.
        </p>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-emerald-300/80">
          Next puzzle in {formatCountdown(ms)}
        </div>
      </Link>
      <Link
        to="/play"
        className="group flex flex-col items-start rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-left transition-colors hover:bg-slate-900"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Free Play</h2>
        <div className="mt-2 text-2xl font-extrabold text-white">Endless mode</div>
        <p className="mt-1 text-xs text-slate-400">
          Random words, random shapes, unlimited runs. Chase the all-time leaderboard.
        </p>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-slate-500">
          Play as much as you want
        </div>
      </Link>
      <Link
        to="/rooms"
        className="group flex flex-col items-start rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/10 p-5 text-left transition-colors hover:bg-fuchsia-500/20 sm:col-span-2"
      >
        <div className="flex w-full items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">Multiplayer</h2>
          <span className="rounded-md bg-fuchsia-500/20 px-2 py-0.5 font-mono text-[10px] text-fuchsia-200">2–6 players</span>
        </div>
        <div className="mt-2 text-2xl font-extrabold text-white">Play with friends</div>
        <p className="mt-1 text-xs text-slate-300">
          Create a private room, share the code, race the same puzzle sequence in real time.
        </p>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-fuchsia-300/80">
          Live leaderboard while you play
        </div>
      </Link>
    </div>
  );
}

function Tip({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1">{text}</div>
    </div>
  );
}
