import { useEffect, useState } from "react";
import { useGame } from "@/game/store";

type CellState = "correct" | "present" | "absent" | "empty" | "filled";

export function GuessPanel() {
  const active = useGame((s) => s.active);
  const guesses = useGame((s) => s.guesses);
  const current = useGame((s) => s.currentGuess);
  const phase = useGame((s) => s.phase);
  const shake = useGame((s) => s.invalidShake);
  const lastReveal = useGame((s) => s.lastReveal);

  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (shake === 0) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 400);
    return () => clearTimeout(t);
  }, [shake]);

  if (!active) return null;
  const len = active.word.length;
  const maxRows = 6;

  const rows: { letters: string; states: CellState[] }[] = [];
  for (let r = 0; r < maxRows; r++) {
    if (r < guesses.length) {
      rows.push({ letters: guesses[r].letters, states: guesses[r].feedback as CellState[] });
    } else if (r === guesses.length && phase === "guessing") {
      const states: CellState[] = Array.from({ length: len }, (_, i) =>
        i < current.length ? "filled" : "empty",
      );
      rows.push({ letters: current.padEnd(len, " "), states });
    } else {
      rows.push({
        letters: " ".repeat(len),
        states: Array.from({ length: len }, () => "empty"),
      });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
        <span>{len}-letter word</span>
        <span>{guesses.length}/6 guesses</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((row, r) => {
          const isCurrentRow = r === guesses.length && phase === "guessing";
          return (
            <div
              key={r}
              className={`flex justify-center gap-1.5 ${isCurrentRow && shaking ? "animate-[wiggle_0.4s]" : ""}`}
            >
              {Array.from({ length: len }).map((_, i) => {
                const ch = row.letters[i] ?? " ";
                const st = row.states[i];
                return (
                  <div
                    key={i}
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md text-sm sm:text-base font-bold uppercase transition-colors ${tileClasses(st)}`}
                  >
                    {ch.trim()}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {lastReveal && phase === "guessing" && guesses.length === 0 && (
        <p className="text-center text-xs text-rose-300/80">
          Previous word was <span className="font-bold">{lastReveal}</span>
        </p>
      )}
      <style>{`
        @keyframes wiggle {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

function tileClasses(state: CellState): string {
  switch (state) {
    case "correct":
      return "bg-emerald-500 text-white border border-emerald-400";
    case "present":
      return "bg-amber-500 text-white border border-amber-400";
    case "absent":
      return "bg-slate-700 text-slate-200 border border-slate-600";
    case "filled":
      return "bg-slate-800 text-white border border-slate-500";
    default:
      return "bg-transparent text-slate-500 border border-slate-700";
  }
}