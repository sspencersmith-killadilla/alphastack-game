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
import { isRealWord, randomAnswer, randomLength } from "./words";

export type Phase = "menu" | "guessing" | "placing" | "locking" | "gameover";

export type GuessRow = { letters: string; feedback: LetterFeedback[] };

type NextPreview = { shape: Shape; word: string; length: 4 | 5 | 6 };

type State = {
  phase: Phase;
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
};

type Actions = {
  startGame: () => void;
  typeLetter: (l: string) => void;
  backspace: () => void;
  submitGuess: () => void;
  move: (dx: number) => void;
  rotate: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  tick: () => void; // optional passive timer drop at high levels
  dismissGameOver: () => void;
};

const BEST_KEY = "alphastack.best";

function loadBest(): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(BEST_KEY);
  return v ? Number(v) || 0 : 0;
}
function saveBest(v: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BEST_KEY, String(v));
}

function makeNext(): NextPreview {
  const length = randomLength();
  const word = randomAnswer(length);
  const shape = randomShape(length);
  return { shape, word, length };
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

  startGame: () => {
    const first = makeNext();
    const second = makeNext();
    const piece = spawnPiece(first.shape, first.word);
    set({
      phase: "guessing",
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
    });
  },

  typeLetter: (l) => {
    const { phase, active, currentGuess } = get();
    if (phase !== "guessing" || !active) return;
    if (currentGuess.length >= active.word.length) return;
    if (!/^[a-zA-Z]$/.test(l)) return;
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
      set({ invalidShake: invalidShake + 1 });
      return;
    }
    if (!isRealWord(currentGuess)) {
      set({ invalidShake: invalidShake + 1 });
      return;
    }
    const fb = scoreGuess(currentGuess, active.word);
    const newGuesses = [...guesses, { letters: currentGuess, feedback: fb }];
    const newKb = mergeKeyboard(keyboard, currentGuess, fb);
    const allCorrect = fb.every((f) => f === "correct");
    if (allCorrect) {
      set({
        guesses: newGuesses,
        keyboard: newKb,
        currentGuess: "",
        active: { ...active, solved: true },
        phase: "placing",
        wordsSolved: get().wordsSolved + 1,
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
  const { board: cleared, cleared: rowsCleared, solvedTilesCleared } = clearRows(newBoard);

  const tilePoints = solvedTilesCleared * 10 * s.level;
  const rowBonus = rowsCleared > 0 ? solvedTilesCleared * rowsCleared * 5 : 0;
  const newScore = s.score + tilePoints + rowBonus;
  const newLines = s.lines + rowsCleared;
  const newLevel = 1 + Math.floor(newLines / 10);
  const newLives = solved ? s.lives : s.lives - 1;

  // spawn next
  const nextPreview = s.next!;
  const newPiece = spawnPiece(nextPreview.shape, nextPreview.word);
  const afterNext = (() => {
    const length = randomLength();
    return { shape: randomShape(length), word: randomAnswer(length), length };
  })();

  // game over checks
  const stackTopped = collides(cleared, newPiece, 0, 0);
  const dead = newLives <= 0 || stackTopped;

  if (newScore > s.best) {
    saveBest(newScore);
  }

  set({
    board: cleared,
    score: newScore,
    best: Math.max(s.best, newScore),
    lines: newLines,
    level: newLevel,
    lives: newLives,
    lastReveal: reveal,
    guesses: [],
    currentGuess: "",
    active: dead ? null : newPiece,
    next: dead ? null : afterNext,
    phase: dead ? "gameover" : "guessing",
  });
}