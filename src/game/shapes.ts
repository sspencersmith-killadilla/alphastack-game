// Piece shapes for lengths 4 (tetrominoes), 5 (pentominoes), 6 (hexominoes).
// Each shape is a list of {x,y} cells in a local bounding box.
// Letters are mapped to cells in reading order (sorted by y, then x).

export type Cell = { x: number; y: number };
export type Shape = { id: string; color: string; cells: Cell[] };

// Color palette pulled from the AlphaStack logo
const COLORS = {
  red: "#e7203a",
  blue: "#2a6df4",
  green: "#3fae3f",
  yellow: "#f7c93b",
  purple: "#7a3fc7",
  orange: "#ee7a26",
  cyan: "#26c4d6",
  pink: "#e0408f",
};

// 4-cell: classic tetrominoes
const TETROMINOES: Shape[] = [
  { id: "I", color: COLORS.cyan, cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}] },
  { id: "O", color: COLORS.yellow, cells: [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}] },
  { id: "T", color: COLORS.purple, cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:1,y:1}] },
  { id: "L", color: COLORS.orange, cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:0,y:1}] },
  { id: "J", color: COLORS.blue, cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:2,y:1}] },
  { id: "S", color: COLORS.green, cells: [{x:1,y:0},{x:2,y:0},{x:0,y:1},{x:1,y:1}] },
  { id: "Z", color: COLORS.red, cells: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:2,y:1}] },
];

// 5-cell: a friendly pentomino subset
const PENTOMINOES: Shape[] = [
  { id: "P-L", color: COLORS.pink, cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:0,y:1}] },
  { id: "P-J", color: COLORS.purple, cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:3,y:1}] },
  { id: "P-T", color: COLORS.green, cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:1,y:1},{x:1,y:2}] },
  { id: "P-P", color: COLORS.orange, cells: [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1},{x:0,y:2}] },
  { id: "P-Z", color: COLORS.red, cells: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:1,y:2},{x:2,y:2}] },
  { id: "P-U", color: COLORS.blue, cells: [{x:0,y:0},{x:2,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1}] },
  { id: "P-W", color: COLORS.cyan, cells: [{x:0,y:0},{x:0,y:1},{x:1,y:1},{x:1,y:2},{x:2,y:2}] },
];

// 6-cell: simple hexominoes
const HEXOMINOES: Shape[] = [
  { id: "H-rect", color: COLORS.yellow, cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1}] },
  { id: "H-L", color: COLORS.blue, cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:4,y:0},{x:0,y:1}] },
  { id: "H-T", color: COLORS.green, cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:1,y:1},{x:1,y:2}] },
  { id: "H-S", color: COLORS.red, cells: [{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1}] },
  { id: "H-step", color: COLORS.purple, cells: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:2,y:1},{x:2,y:2},{x:3,y:2}] },
];

export function randomShape(length: 4 | 5 | 6, rng: () => number = Math.random): Shape {
  const pool = length === 4 ? TETROMINOES : length === 5 ? PENTOMINOES : HEXOMINOES;
  const s = pool[Math.floor(rng() * pool.length)];
  return { ...s, cells: s.cells.map((c) => ({ ...c })) };
}

// Rotate cells 90° clockwise around bounding box; preserve cell *identity*
// so each indexed cell (which carries a letter index) follows the rotation.
export function rotateCells(cells: Cell[]): Cell[] {
  const maxY = Math.max(...cells.map((c) => c.y));
  return cells.map((c) => ({ x: maxY - c.y, y: c.x }));
}

// Letter index mapping: cells sorted by (y, x) get letters 0..n-1.
export function letterOrder(cells: Cell[]): number[] {
  const indexed = cells.map((c, i) => ({ i, c }));
  indexed.sort((a, b) => a.c.y - b.c.y || a.c.x - b.c.x);
  // Returns: for each original index, which letter position it has.
  const out = new Array<number>(cells.length);
  indexed.forEach((entry, letterPos) => {
    out[entry.i] = letterPos;
  });
  return out;
}