import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pause, Settings as SettingsIcon } from "lucide-react";
import { Board } from "@/components/game/Board";
import { Controls } from "@/components/game/Controls";
import { GameOverModal } from "@/components/game/GameOverModal";
import { GuessPanel } from "@/components/game/GuessPanel";
import { HowToPlay } from "@/components/game/HowToPlay";
import { Keyboard } from "@/components/game/Keyboard";
import { CompactStats, Sidebar } from "@/components/game/Sidebar";
import { PauseModal } from "@/components/game/PauseModal";
import { SettingsModal } from "@/components/game/SettingsModal";
import { WordToast } from "@/components/game/WordToast";
import { useGame } from "@/game/store";
import { ALPHASTACK_LOGO_URL } from "@/lib/assets";
import { useSettings } from "@/lib/settings";
import { unlockAudio } from "@/lib/audio";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play AlphaStack" },
      { name: "description", content: "Guess the hidden word, then stack the shape. AlphaStack is Wordle meets Tetris." },
      { property: "og:title", content: "Play AlphaStack" },
      { property: "og:description", content: "Guess the hidden word, then stack the shape." },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
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
  const pause = useGame((s) => s.pause);
  const resume = useGame((s) => s.resume);
  const lastClearRows = useGame((s) => s.lastClearRows);
  const lastClearTick = useGame((s) => s.lastClearTick);

  const reducedMotion = useSettings((s) => s.reducedMotion);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (lastClearTick === 0 || lastClearRows < 3 || reducedMotion) return;
    setShake(true);
    const t = setTimeout(() => setShake(false), 350);
    return () => clearTimeout(t);
  }, [lastClearTick, lastClearRows, reducedMotion]);

  useEffect(() => {
    if (phase === "menu") start();
  }, [phase, start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (phase === "paused") resume();
        else pause();
        return;
      }
      if (e.key === "Escape" && settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      if (phase === "paused") return;
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
        else if (e.key === "Shift" || e.key === "Enter") {
          e.preventDefault();
          hard();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, submit, back, type, move, rotate, soft, hard, pause, resume, settingsOpen]);

  useEffect(() => {
    if (phase === "paused") return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [tick, phase]);

  // Unlock audio on first user gesture (pointer or key) anywhere on the page.
  useEffect(() => {
    const onGesture = () => unlockAudio();
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#0a1024] via-[#0b1330] to-[#0a1024] text-slate-100 ${shake ? "animate-[shake_0.35s]" : ""}`}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 md:px-4 md:py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={ALPHASTACK_LOGO_URL} alt="AlphaStack logo" className="h-9 w-9 rounded-md" />
          <span className="text-xl font-extrabold tracking-tight">
            Alpha<span className="text-emerald-400">Stack</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/leaderboard" className="rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 hover:bg-slate-800">
            Leaderboard
          </Link>
          <button onClick={pause} className="flex h-10 w-10 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800 md:h-9 md:w-9" aria-label="Pause">
            <Pause className="h-5 w-5 md:h-4 md:w-4" />
          </button>
          <button onClick={() => setSettingsOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800 md:h-9 md:w-9" aria-label="Settings">
            <SettingsIcon className="h-5 w-5 md:h-4 md:w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-4">
        <h1 className="sr-only">AlphaStack Free Play</h1>
        <div className="mb-3 md:hidden">
          <CompactStats />
        </div>
        {/* Mobile: phase-aware action zone right under board for thumb reach */}
        <div className="md:hidden space-y-3">
          <div className="flex justify-center">
            <Board />
          </div>
          {phase === "guessing" || phase === "paused" ? (
            <>
              <GuessPanel />
              <Keyboard />
            </>
          ) : (
            <Controls />
          )}
          <HowToPlay />
        </div>
        {/* Desktop layout unchanged */}
        <div className="hidden md:grid grid-cols-1 gap-4 md:grid-cols-[140px_minmax(0,1fr)_300px] md:gap-6">
          <aside className="block">
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
        </div>
      </main>

      <WordToast />
      <PauseModal onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <GameOverModal />
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-4px, 2px); }
          40% { transform: translate(4px, -2px); }
          60% { transform: translate(-3px, -1px); }
          80% { transform: translate(3px, 1px); }
        }
      `}</style>
    </div>
  );
}