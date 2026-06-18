import { useGame } from "@/game/store";

export function GameOverModal() {
  const phase = useGame((s) => s.phase);
  const score = useGame((s) => s.score);
  const best = useGame((s) => s.best);
  const lines = useGame((s) => s.lines);
  const wordsSolved = useGame((s) => s.wordsSolved);
  const restart = useGame((s) => s.startGame);
  const dismiss = useGame((s) => s.dismissGameOver);

  if (phase !== "gameover") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white">Game Over</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-left">
          <Stat label="Score" value={score} />
          <Stat label="Best" value={best} />
          <Stat label="Lines" value={lines} />
          <Stat label="Words" value={wordsSolved} />
        </div>
        <div className="mt-6 flex gap-2">
          <button
            className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-900 hover:bg-emerald-400"
            onClick={restart}
          >
            Play Again
          </button>
          <button
            className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-700"
            onClick={dismiss}
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}