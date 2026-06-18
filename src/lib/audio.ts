// Synthesized SFX via Web Audio API. Zero-asset, lazy-initialized.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;
let volume = 0.5;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : volume;
      masterGain.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
}
export function setMuted(m: boolean) {
  muted = m;
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
}

type Tone = {
  freq: number;
  type?: OscillatorType;
  duration?: number;
  attack?: number;
  release?: number;
  gain?: number;
  slideTo?: number;
};

function tone({ freq, type = "square", duration = 0.12, attack = 0.005, release = 0.08, gain = 0.25, slideTo }: Tone, delay = 0) {
  const c = ensure();
  if (!c || !masterGain) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  const t0 = c.currentTime + delay;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration + release);
  osc.connect(g).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + release + 0.02);
}

export const sfx = {
  click: () => tone({ freq: 600, type: "square", duration: 0.04, gain: 0.15 }),
  type: () => tone({ freq: 420, type: "triangle", duration: 0.03, gain: 0.12 }),
  invalid: () => {
    tone({ freq: 220, type: "sawtooth", duration: 0.08, gain: 0.18 });
    tone({ freq: 180, type: "sawtooth", duration: 0.12, gain: 0.18 }, 0.06);
  },
  wordSolved: () => {
    tone({ freq: 523, type: "triangle", duration: 0.09, gain: 0.22 });
    tone({ freq: 659, type: "triangle", duration: 0.09, gain: 0.22 }, 0.08);
    tone({ freq: 784, type: "triangle", duration: 0.14, gain: 0.22 }, 0.16);
  },
  lock: () => tone({ freq: 160, type: "square", duration: 0.06, gain: 0.2 }),
  lineClear: (count: number) => {
    const base = 440 + count * 60;
    for (let i = 0; i < count; i++) {
      tone({ freq: base + i * 120, type: "square", duration: 0.08, gain: 0.22 }, i * 0.05);
    }
  },
  levelUp: () => {
    tone({ freq: 440, type: "triangle", duration: 0.1, gain: 0.22, slideTo: 880 });
    tone({ freq: 660, type: "triangle", duration: 0.14, gain: 0.22 }, 0.1);
  },
  gameOver: () => {
    tone({ freq: 440, type: "sawtooth", duration: 0.25, gain: 0.25, slideTo: 110 });
    tone({ freq: 220, type: "sawtooth", duration: 0.4, gain: 0.22, slideTo: 80 }, 0.2);
  },
  newBest: () => {
    tone({ freq: 523, type: "triangle", duration: 0.1, gain: 0.22 });
    tone({ freq: 659, type: "triangle", duration: 0.1, gain: 0.22 }, 0.1);
    tone({ freq: 784, type: "triangle", duration: 0.1, gain: 0.22 }, 0.2);
    tone({ freq: 1047, type: "triangle", duration: 0.22, gain: 0.24 }, 0.3);
  },
};

// Call once after first user gesture to unlock audio (mobile/Safari).
export function unlockAudio() {
  ensure();
}