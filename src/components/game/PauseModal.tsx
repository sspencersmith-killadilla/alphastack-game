import { useGame } from "@/game/store";

export function PauseModal({ onOpenSettings }: { onOpenSettings: () => void }) {
  const phase = useGame((s) => s.phase);
  const resume = useGame((s) => s.resume);
  const restart = useGame((s) => s.startGame);
  const mode = useGame((s) => s.mode);
  if (phase !== "paused") return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white">Paused</h2>
        <div className="mt-6 grid gap-2">
          <button onClick={resume} className="rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-900 hover:bg-emerald-400">
            Resume
          </button>
          <button onClick={onOpenSettings} className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-700">
            Settings
          </button>
          <button onClick={() => restart({ mode })} className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-700">
            Restart
          </button>
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-widest text-slate-500">Press P to resume</p>
      </div>
    </div>
  );
}