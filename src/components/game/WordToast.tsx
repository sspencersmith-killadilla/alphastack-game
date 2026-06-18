import { useEffect, useState } from "react";
import { useGame } from "@/game/store";

export function WordToast() {
  const tick = useGame((s) => s.lastSolvedTick);
  const word = useGame((s) => s.lastSolvedWord);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (tick === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(t);
  }, [tick]);
  if (!visible || !word) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-20 z-30 -translate-x-1/2">
      <div className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-bold uppercase tracking-widest text-emerald-200 shadow-lg backdrop-blur">
        ✓ {word}
      </div>
    </div>
  );
}