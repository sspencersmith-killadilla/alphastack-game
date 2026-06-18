import { useEffect, useState } from "react";
import { formatCountdown, getDailySeed, msUntilNextDailyReset } from "@/game/daily";

export function DailyHeader() {
  const [ms, setMs] = useState(() => msUntilNextDailyReset());
  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilNextDailyReset()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
      <span>Daily · {getDailySeed()}</span>
      <span className="text-emerald-200/70">Resets in {formatCountdown(ms)}</span>
    </div>
  );
}