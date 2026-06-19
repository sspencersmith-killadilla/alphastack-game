import { ArrowDown, ArrowDownToLine, ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { useGame } from "@/game/store";

export function Controls() {
  const phase = useGame((s) => s.phase);
  const move = useGame((s) => s.move);
  const rotate = useGame((s) => s.rotate);
  const soft = useGame((s) => s.softDrop);
  const hard = useGame((s) => s.hardDrop);
  const disabled = phase !== "placing";

  const btn =
    "flex h-14 w-14 sm:h-9 sm:w-9 items-center justify-center rounded-md border border-white/10 bg-slate-800 text-white transition-colors hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-800 touch-manipulation select-none";

  return (
    <div className="space-y-2">
      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {disabled ? "Solve word first" : "Place your piece"}
      </div>
      <div className="flex justify-center gap-3 sm:gap-2">
        <button className={btn} onClick={() => move(-1)} disabled={disabled} aria-label="left">
          <ArrowLeft className="h-6 w-6 sm:h-4 sm:w-4" />
        </button>
        <button className={btn} onClick={rotate} disabled={disabled} aria-label="rotate">
          <RotateCw className="h-6 w-6 sm:h-4 sm:w-4" />
        </button>
        <button className={btn} onClick={() => move(1)} disabled={disabled} aria-label="right">
          <ArrowRight className="h-6 w-6 sm:h-4 sm:w-4" />
        </button>
      </div>
      <div className="flex justify-center gap-3 sm:gap-2">
        <button className={btn} onClick={soft} disabled={disabled} aria-label="soft drop">
          <ArrowDown className="h-6 w-6 sm:h-4 sm:w-4" />
        </button>
        <button className={btn} onClick={hard} disabled={disabled} aria-label="hard drop">
          <ArrowDownToLine className="h-6 w-6 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  );
}