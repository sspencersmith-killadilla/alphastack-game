import { Delete } from "lucide-react";
import { useGame } from "@/game/store";

const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

export function Keyboard() {
  const kb = useGame((s) => s.keyboard);
  const type = useGame((s) => s.typeLetter);
  const back = useGame((s) => s.backspace);
  const submit = useGame((s) => s.submitGuess);
  const phase = useGame((s) => s.phase);
  const disabled = phase !== "guessing";

  return (
    <div className="space-y-1.5 select-none">
      {KEY_ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1">
          {row.map((k) => {
            const onClick = () => {
              if (disabled) return;
              if (k === "ENTER") submit();
              else if (k === "BACK") back();
              else type(k);
            };
            const state = kb[k];
            return (
              <button
                key={k}
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={`h-9 min-w-[26px] rounded-md px-1.5 text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 ${keyClasses(state)} ${k.length > 1 ? "px-2" : ""}`}
              >
                {k === "BACK" ? <Delete className="mx-auto h-4 w-4" /> : k}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function keyClasses(state?: string) {
  switch (state) {
    case "correct":
      return "bg-emerald-500 text-white hover:bg-emerald-400";
    case "present":
      return "bg-amber-500 text-white hover:bg-amber-400";
    case "absent":
      return "bg-slate-800 text-slate-500 hover:bg-slate-700";
    default:
      return "bg-slate-700 text-white hover:bg-slate-600";
  }
}