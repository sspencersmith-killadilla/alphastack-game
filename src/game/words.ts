// Bundled ENABLE-derived English wordlist (4/5/6-letter, alphabetic).
// Shared by both isRealWord (guess validation) and randomAnswer (puzzle pick).
import RAW from "./wordlist.txt?raw";

const ALL = RAW.split(/\s+/).filter((w) => w.length >= 4 && w.length <= 6);

export const WORDS_4 = ALL.filter((w) => w.length === 4);
export const WORDS_5 = ALL.filter((w) => w.length === 5);
export const WORDS_6 = ALL.filter((w) => w.length === 6);

const SET_4 = new Set(WORDS_4);
const SET_5 = new Set(WORDS_5);
const SET_6 = new Set(WORDS_6);

export function isRealWord(word: string): boolean {
  const w = word.toLowerCase();
  if (w.length === 4) return SET_4.has(w);
  if (w.length === 5) return SET_5.has(w);
  if (w.length === 6) return SET_6.has(w);
  return false;
}

export function randomAnswer(length: 4 | 5 | 6, rng: () => number = Math.random): string {
  const list = length === 4 ? WORDS_4 : length === 5 ? WORDS_5 : WORDS_6;
  return list[Math.floor(rng() * list.length)];
}

export function randomLength(rng: () => number = Math.random): 4 | 5 | 6 {
  const r = rng();
  if (r < 0.45) return 4;
  if (r < 0.85) return 5;
  return 6;
}
