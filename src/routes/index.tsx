import { createFileRoute, Link } from "@tanstack/react-router";
import { TopScoresPanel } from "@/components/game/TopScoresPanel";
import { ALPHASTACK_LOGO_URL } from "@/lib/assets";

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
      <div className="mt-8 flex gap-3">
        <Link
          to="/play"
          className="rounded-lg bg-emerald-500 px-6 py-3 text-lg font-bold text-slate-900 transition-colors hover:bg-emerald-400"
        >
          Play
        </Link>
        <Link
          to="/leaderboard"
          className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-6 py-3 text-lg font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
        >
          Leaderboard
        </Link>
      </div>
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

function Tip({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1">{text}</div>
    </div>
  );
}
