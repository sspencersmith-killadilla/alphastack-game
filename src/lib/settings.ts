import { create } from "zustand";
import { setMuted, setVolume } from "./audio";

const KEY = "alphastack:settings";

export type Settings = {
  sfxOn: boolean;
  volume: number;
  ghostPiece: boolean;
  reducedMotion: boolean;
};

const DEFAULTS: Settings = {
  sfxOn: true,
  volume: 0.5,
  ghostPiece: true,
  reducedMotion: false,
};

function load(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function save(s: Settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export const useSettings = create<Settings & {
  set: (patch: Partial<Settings>) => void;
}>((set, get) => {
  const initial = load();
  // Apply to audio on init
  if (typeof window !== "undefined") {
    setMuted(!initial.sfxOn);
    setVolume(initial.volume);
  }
  return {
    ...initial,
    set: (patch) => {
      const next = { ...get(), ...patch };
      const persisted: Settings = {
        sfxOn: next.sfxOn,
        volume: next.volume,
        ghostPiece: next.ghostPiece,
        reducedMotion: next.reducedMotion,
      };
      setMuted(!persisted.sfxOn);
      setVolume(persisted.volume);
      save(persisted);
      set(persisted);
    },
  };
});