import { create } from "zustand";
import {
  type Board,
  type LetterFeedback,
  type Piece,
  clearRows,
  collides,
  emptyBoard,
  hardDrop,
  lockPiece,
  scoreGuess,
  spawnPiece,
  tryMove,
  tryRotate,
} from "./engine";
import { randomShape, type Shape } from "./shapes";
import { isRealWord, rampLength, randomAnswer, randomLength } from "./words";
import { createDailyRng, getDailySeed } from "./daily";
import { sfx, unlockAudio } from "@/lib/audio";
import { newClientToken, track } from "@/lib/analytics-client";

export type Phase = "menu" | "guessing" | "placing" | "locking" | "paused" | "gameover";
export type Mode = "free" | "daily";

export type GuessRow = { letters: string; feedback: LetterFeedback[] };

type NextPreview = { shape: Shape; word: string; length: 4 | 5 | 6 };

type State = {
  phase: Phase;
  prevPhase: Phase | null;
  mode: Mode;
  dailyDate: string | null;
  board: Board;
  active: Piece | null;
  next: NextPreview | null;
  guesses: GuessRow[];
  currentGuess: string;
  keyboard: Record<string, LetterFeedback | undefined>;
  score: number;
  best: number;
  lines: number;
  level: number;
  lives: number;
  wordsSolved: number;
  invalidShake: number; // increments to trigger animation
  lastReveal: string | null;
  lastClearRows: number; // for screen-shake on big clears
  lastClearTick: number; // increments on each clear
  lastSolvedWord: string | null; // for toast
  lastSolvedTick: number;
  isNewBest: boolean;
  // run metadata
  clientToken: string;
  startedAt: number; // ms timestamp
};

type Actions = {
  startGame: (opts?: { mode?: Mode }) => void;
  typeLetter: (l: string) => void;
  backspace: () => void;
  submitGuess: () => void;
  move: (dx: number) => void;
  rotate: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  tick: () => void; // optional passive timer drop at high levels
  dismissGameOver: () => void;
  pause: () => void;
  resume: () => void;
};

const BEST_KEY = "alphastack:best";

function loadBest(): number {
  if (typeof window === "undefined") return 0;
  const v =
    window.localStorage.getItem(BEST_KEY) ??
    window.localStorage.getItem("alphastack.best"); // legacy key
  return v ? Number(v) || 0 : 0;
}
function saveBest(v: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BEST_KEY, String(v));
}

// Piece index within the current run. Used by daily mode to ramp difficulty
// (short/easy words first, longer/harder words later). Reset in startGame.
let pieceIndex = 0;
let rampMode: Mode = "free";

// Daily difficulty tier — matches the rampLength thresholds in words.ts.
// Returned as a multiplier applied to scoring when a clear happens in daily
// mode, so deeper-in-the-run clears (with longer/harder words) are worth more.
export function dailyDifficultyTier(index: number): 1 | 2 | 3 | 4 {
  if (index < 5) return 1;
  if (index < 12) return 2;
  if (index < 20) return 3;
  return 4;
}

function makeNext(rng: () => number = Math.random): NextPreview {
  const length =
    rampMode === "daily" ? rampLength(pieceIndex, rng) : randomLength(rng);
  pieceIndex++;
  const word = randomAnswer(length, rng);
  const shape = randomShape(length, rng);
  return { shape, word, length };
}

// Map mode → rng for the active run. Recomputed at startGame; daily reuses
// a single seeded PRNG so the *sequence* is deterministic across players.
let activeRng: () => number = Math.random;
export function currentRng(): () => number {
  return activeRng;
}

function blankKeyboard(): Record<string, LetterFeedback | undefined> {
  return {};
}

function mergeKeyboard(
  kb: Record<string, LetterFeedback | undefined>,
  guess: string,
  fb: LetterFeedback[],
): Record<string, LetterFeedback | undefined> {
  const out = { ...kb };
  const rank: Record<LetterFeedback, number> = { absent: 0, present: 1, correct: 2 };
  for (let i = 0; i < guess.length; i++) {
    const ch = guess[i].toUpperCase();
    const cur = out[ch];
    if (!cur || rank[fb[i]] > rank[cur]) out[ch] = fb[i];
  }
  return out;
}

export const useGame = create<State & Actions>((set, get) => ({
  phase: "menu",
  prevPhase: null,
  mode: "free",
  dailyDate: null,
  board: emptyBoard(),
  active: null,
  next: null,
  guesses: [],
  currentGuess: "",
  keyboard: blankKeyboard(),
  score: 0,
  best: loadBest(),
  lines: 0,
  level: 1,
  lives: 3,
  wordsSolved: 0,
  invalidShake: 0,
  lastReveal: null,
  lastClearRows: 0,
  lastClearTick: 0,
  lastSolvedWord: null,
  lastSolvedTick: 0,
  isNewBest: false,
  clientToken: "",
  startedAt: 0,

  startGame: (opts) => {
    const mode: Mode = opts?.mode ?? "free";
    const dailyDate = mode === "daily" ? getDailySeed() : null;
    activeRng = mode === "daily" ? createDailyRng(`alphastack:${dailyDate}`) : Math.random;
    rampMode = mode;
    pieceIndex = 0;
    const first = makeNext(activeRng);
    const second = makeNext(activeRng);
    const piece = spawnPiece(first.shape, first.word);
    unlockAudio();
    const token = newClientToken();
    track("game_start", { mode });
    set({
      phase: "guessing",
      prevPhase: null,
      mode,
      dailyDate,
      board: emptyBoard(),
      active: piece,
      next: second,
      guesses: [],
      currentGuess: "",
      keyboard: blankKeyboard(),
      score: 0,
      lines: 0,
      level: 1,
      lives: 3,
      wordsSolved: 0,
      lastReveal: null,
      lastClearRows: 0,
      lastSolvedWord: null,
      isNewBest: false,
      clientToken: token,
      startedAt: Date.now(),
    });
  },

  typeLetter: (l) => {
    const { phase, active, currentGuess } = get();
    if (phase !== "guessing" || !active) return;
    if (currentGuess.length >= active.word.length) return;
    if (!/^[a-zA-Z]$/.test(l)) return;
    sfx.type();
    set({ currentGuess: currentGuess + l.toLowerCase() });
  },

  backspace: () => {
    const { phase, currentGuess } = get();
    if (phase !== "guessing") return;
    set({ currentGuess: currentGuess.slice(0, -1) });
  },

  submitGuess: () => {
    const { phase, active, currentGuess, guesses, keyboard, board, invalidShake } = get();
    if (phase !== "guessing" || !active) return;
    if (currentGuess.length !== active.word.length) {
      sfx.invalid();
      set({ invalidShake: invalidShake + 1 });
      return;
    }
    if (!isRealWord(currentGuess)) {
      sfx.invalid();
      set({ invalidShake: invalidShake + 1 });
      return;
    }
    const fb = scoreGuess(currentGuess, active.word);
    const newGuesses = [...guesses, { letters: currentGuess, feedback: fb }];
    const newKb = mergeKeyboard(keyboard, currentGuess, fb);
    const allCorrect = fb.every((f) => f === "correct");
    if (allCorrect) {
      sfx.wordSolved();
      track("word_solved", { length: currentGuess.length, guesses: newGuesses.length });
      set({
        guesses: newGuesses,
        keyboard: newKb,
        currentGuess: "",
        active: { ...active, solved: true },
        phase: "placing",
        wordsSolved: get().wordsSolved + 1,
        lastSolvedWord: currentGuess.toUpperCase(),
        lastSolvedTick: get().lastSolvedTick + 1,
      });
      return;
    }
    // wrong: drop one row
    const moved = tryMove(board, active, 0, 1);
    if (!moved) {
      // can't drop further → lock immediately as unsolved (player ran out)
      set({ guesses: newGuesses, keyboard: newKb, currentGuess: "" });
      lockAndAdvance(get, set, active, false);
      return;
    }
    if (newGuesses.length >= 6) {
      // out of guesses → hard drop unsolved
      set({ guesses: newGuesses, keyboard: newKb, currentGuess: "", active: moved });
      const dropped = hardDrop(board, moved);
      lockAndAdvance(get, set, dropped, false);
      return;
    }
    set({ guesses: newGuesses, keyboard: newKb, currentGuess: "", active: moved });
  },

  move: (dx) => {
    const { phase, board, active } = get();
    if (phase !== "placing" || !active) return;
    const m = tryMove(board, active, dx, 0);
    if (m) set({ active: m });
  },

  rotate: () => {
    const { phase, board, active } = get();
    if (phase !== "placing" || !active) return;
    const m = tryRotate(board, active);
    if (m) set({ active: m });
  },

  softDrop: () => {
    const { phase, board, active } = get();
    if (phase !== "placing" || !active) return;
    const m = tryMove(board, active, 0, 1);
    if (m) set({ active: m });
    else lockAndAdvance(get, set, active, true);
  },

  hardDrop: () => {
    const { phase, board, active } = get();
    if (phase !== "placing" || !active) return;
    const dropped = hardDrop(board, active);
    lockAndAdvance(get, set, dropped, true);
  },

  tick: () => {
    const { phase, board, active, level } = get();
    if (phase !== "placing" || !active) return;
    // only at high levels passively
    if (level < 4) return;
    const m = tryMove(board, active, 0, 1);
    if (m) set({ active: m });
  },

  dismissGameOver: () => set({ phase: "menu" }),

  pause: () => {
    const { phase } = get();
    if (phase !== "guessing" && phase !== "placing") return;
    set({ prevPhase: phase, phase: "paused" });
  },
  resume: () => {
    const { phase, prevPhase } = get();
    if (phase !== "paused") return;
    set({ phase: prevPhase ?? "guessing", prevPhase: null });
  },
}));

function lockAndAdvance(
  get: () => State & Actions,
  set: (partial: Partial<State>) => void,
  piece: Piece,
  solved: boolean,
) {
  const s = get();
  const lockedPiece = { ...piece, solved };
  const reveal = solved ? null : piece.word.toUpperCase();
  const newBoard = lockPiece(s.board, lockedPiece);
  sfx.lock();
  const { board: cleared, cleared: rowsCleared, solvedTilesCleared } = clearRows(newBoard);
  if (rowsCleared > 0) sfx.lineClear(rowsCleared);

  // Daily difficulty multiplier: scales clear rewards with how deep into the
  // daily ramp the player is (1× early, up to 4× late). Free play is
  // unaffected so the all-time leaderboard formula stays identical.
  // pieceIndex was incremented twice at startGame (first + next preview), so
  // the piece that just locked corresponds to index (pieceIndex - 2).
  const dailyMult =
    s.mode === "daily" ? dailyDifficultyTier(Math.max(0, pieceIndex - 2)) : 1;
  const tilePoints = solvedTilesCleared * 10 * s.level * dailyMult;
  const rowBonus =
    rowsCleared > 0 ? solvedTilesCleared * rowsCleared * 5 * dailyMult : 0;
  const newScore = s.score + tilePoints + rowBonus;
  const newLines = s.lines + rowsCleared;
  const newLevel = 1 + Math.floor(newLines / 10);
  const newLives = solved ? s.lives : s.lives - 1;
  if (newLevel > s.level) sfx.levelUp();

  // spawn next
  const nextPreview = s.next!;
  const newPiece = spawnPiece(nextPreview.shape, nextPreview.word);
  const afterNext = makeNext(activeRng);

  // game over checks
  const stackTopped = collides(cleared, newPiece, 0, 0);
  const dead = newLives <= 0 || stackTopped;

  const isNewBest = newScore > s.best && newScore > 0;
  if (isNewBest) saveBest(newScore);

  if (dead) {
    sfx.gameOver();
    track("game_over", {
      score: newScore,
      lines: newLines,
      level: newLevel,
      wordsSolved: s.wordsSolved,
      duration: Math.round((Date.now() - s.startedAt) / 1000),
    });
  }

  set({
    board: cleared,
    score: newScore,
    best: Math.max(s.best, newScore),
    lines: newLines,
    level: newLevel,
    lives: newLives,
    lastReveal: reveal,
    lastClearRows: rowsCleared,
    lastClearTick: rowsCleared > 0 ? s.lastClearTick + 1 : s.lastClearTick,
    isNewBest,
    guesses: [],
    currentGuess: "",
    keyboard: blankKeyboard(),
    active: dead ? null : newPiece,
    next: dead ? null : afterNext,
    phase: dead ? "gameover" : "guessing",
  });
}