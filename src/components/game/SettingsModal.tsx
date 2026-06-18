import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useSettings } from "@/lib/settings";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSettings();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <Row label="Sound effects">
            <Toggle on={s.sfxOn} onChange={(on) => s.set({ sfxOn: on })} />
          </Row>
          <Row label={`Volume (${Math.round(s.volume * 100)}%)`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={s.volume}
              onChange={(e) => s.set({ volume: Number(e.target.value) })}
              className="w-32 accent-emerald-500"
              disabled={!s.sfxOn}
            />
          </Row>
          <Row label="Ghost piece">
            <Toggle on={s.ghostPiece} onChange={(on) => s.set({ ghostPiece: on })} />
          </Row>
          <Row label="Reduced motion">
            <Toggle on={s.reducedMotion} onChange={(on) => s.set({ reducedMotion: on })} />
          </Row>
        </div>
        <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-slate-500">
          P to pause · Esc to close
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-slate-700"}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}