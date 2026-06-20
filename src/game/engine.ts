import { type Cell, type Shape, letterOrder, rotateCells } from "./shapes";

export const COLS = 10;
export const ROWS = 20;

export type Tile = {
  color: string;
  letter: string | null; // null when piece was placed unsolved
  solved: boolean;
};

export type Board = (Tile | null)[][]; // [y][x], y=0 is top

export type Piece = {
  shape: Shape;
  cells: Cell[]; // current (possibly rotated) local cells
  x: number; // board x of local origin
  y: number; // board y of local origin
  word: string; // hidden word, length == cells.length
  solved: boolean;
};

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Tile | null>(COLS).fill(null));
}

export function pieceWidth(cells: Cell[]): number {
  return Math.max(...cells.map((c) => c.x)) + 1;
}

export function spawnPiece(shape: Shape, word: string): Piece {
  const cells = shape.cells.map((c) => ({ ...c }));
  const w = pieceWidth(cells);
  const x = Math.floor((COLS - w) / 2);
  return { shape, cells, x, y: 0, word, solved: false };
}

export function pieceTiles(p: Piece): { x: number; y: number; letter: string; color: string }[] {
  const order = letterOrder(p.cells);
  return p.cells.map((c, i) => ({
    x: p.x + c.x,
    y: p.y + c.y,
    letter: p.word[order[i]],
    color: p.shape.color,
  }));
}

export function collides(board: Board, p: Piece, dx = 0, dy = 0, cells = p.cells): boolean {
  for (const c of cells) {
    const nx = p.x + c.x + dx;
    const ny = p.y + c.y + dy;
    if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
    if (ny < 0) continue; // above board ok
    if (board[ny][nx]) return true;
  }
  return false;
}

export function tryMove(board: Board, p: Piece, dx: number, dy: number): Piece | null {
  if (collides(board, p, dx, dy)) return null;
  return { ...p, x: p.x + dx, y: p.y + dy };
}

export function tryRotate(board: Board, p: Piece): Piece | null {
  const rotated = rotateCells(p.cells);
  // Try basic wall kicks
  for (const dx of [0, -1, 1, -2, 2]) {
    if (!collides(board, { ...p, cells: rotated }, dx, 0)) {
      return { ...p, cells: rotated, x: p.x + dx };
    }
  }
  return null;
}

export function hardDrop(board: Board, p: Piece): Piece {
  let cur = p;
  while (true) {
    const next = tryMove(board, cur, 0, 1);
    if (!next) return cur;
    cur = next;
  }
}

export function lockPiece(board: Board, p: Piece): Board {
  const next = board.map((row) => row.slice());
  const order = letterOrder(p.cells);
  p.cells.forEach((c, i) => {
    const x = p.x + c.x;
    const y = p.y + c.y;
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return;
    next[y][x] = {
      color: p.shape.color,
      letter: p.solved ? p.word[order[i]].toUpperCase() : null,
      solved: p.solved,
    };
  });
  return next;
}

// Scrabble tile values — rarer letters score higher.
const SCRABBLE_VALUES: Record<string, number> = {
  A: 1, E: 1, I: 1, L: 1, N: 1, O: 1, R: 1, S: 1, T: 1, U: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10,
};

export function letterValue(letter: string | null | undefined): number {
  if (!letter) return 0;
  return SCRABBLE_VALUES[letter.toUpperCase()] ?? 1;
}

export function wordValue(word: string): number {
  let sum = 0;
  for (const ch of word) sum += letterValue(ch);
  return sum;
}

export function clearRows(board: Board): {
  board: Board;
  cleared: number;
  solvedTilesCleared: number;
  solvedLetterPoints: number;
} {
  const keep: (Tile | null)[][] = [];
  let cleared = 0;
  let solvedTilesCleared = 0;
  let solvedLetterPoints = 0;
  for (let y = 0; y < ROWS; y++) {
    const row = board[y];
    if (row.every((t) => t !== null)) {
      cleared++;
      for (const t of row) {
        if (t && t.solved) {
          solvedTilesCleared++;
          solvedLetterPoints += letterValue(t.letter);
        }
      }
    } else {
      keep.push(row);
    }
  }
  while (keep.length < ROWS) keep.unshift(Array<Tile | null>(COLS).fill(null));
  return { board: keep, cleared, solvedTilesCleared, solvedLetterPoints };
}

export type LetterFeedback = "correct" | "present" | "absent";

export function scoreGuess(guess: string, answer: string): LetterFeedback[] {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  const result: LetterFeedback[] = Array(g.length).fill("absent");
  const aChars: (string | null)[] = a.split("");
  // first pass: greens
  for (let i = 0; i < g.length; i++) {
    if (g[i] === aChars[i]) {
      result[i] = "correct";
      aChars[i] = null;
    }
  }
  // second: yellows
  for (let i = 0; i < g.length; i++) {
    if (result[i] === "correct") continue;
    const idx = aChars.indexOf(g[i]);
    if (idx !== -1) {
      result[i] = "present";
      aChars[idx] = null;
    }
  }
  return result;
}