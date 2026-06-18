import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Board } from "@/components/game/Board";
import { Controls } from "@/components/game/Controls";
import { GameOverModal } from "@/components/game/GameOverModal";
import { GuessPanel } from "@/components/game/GuessPanel";
import { HowToPlay } from "@/components/game/HowToPlay";
import { Keyboard } from "@/components/game/Keyboard";
import { Sidebar } from "@/components/game/Sidebar";
import logoAsset from "@/assets/alphastack-logo.png.asset.json";
import { useGame } from "@/game/store";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play AlphaStack" },
      { name: "description", content: "Guess the hidden word, then stack the shape. AlphaStack is Wordle meets Tetris." },
      { property: "og:title", content: "Play AlphaStack" },
      { property: "og:description", content: "Guess the hidden word, then stack the shape." },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const phase = useGame((s) => s.phase);
  const start = useGame((s) => s.startGame);
  const submit = useGame((s) => s.submitGuess);
  const type = useGame((s) => s.typeLetter);
  const back = useGame((s) => s.backspace);
  const move = useGame((s) => s.move);
  const rotate = useGame((s) => s.rotate);
  const soft = useGame((s) => s.softDrop);
  const hard = useGame((s) => s.hardDrop);
  const tick = useGame((s) => s.tick);

  useEffect(() => {
    if (phase === "menu") start();
  }, [phase, start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "guessing") {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        } else if (e.key === "Backspace") {
          e.preventDefault();
          back();
        } else if (/^[a-zA-Z]$/.test(e.key)) {
          type(e.key);
        }
      } else if (phase === "placing") {
        if (e.key === "ArrowLeft") move(-1);
        else if (e.key === "ArrowRight") move(1);
        else if (e.key === "ArrowUp") rotate();
        else if (e.key === "ArrowDown") soft();
        else if (e.key === " ") {
          e.preventDefault();
          hard();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, submit, back, type, move, rotate, soft, hard]);

  useEffect(() => {
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1024] via-[#0b1330] to-[#0a1024] text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="AlphaStack" className="h-9 w-9 rounded-md" />
          <span className="text-xl font-extrabold tracking-tight">
            Alpha<span className="text-emerald-400">Stack</span>
          </span>
        </Link>
        <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-300">
          Beta
        </span>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-10 md:grid-cols-[140px_minmax(0,1fr)_300px]">
        <aside>
          <Sidebar />
        </aside>
        <section className="flex justify-center">
          <Board />
        </section>
        <aside className="space-y-4">
          <GuessPanel />
          <Keyboard />
          <Controls />
          <HowToPlay />
        </aside>
      </main>

      <GameOverModal />
    </div>
  );
}