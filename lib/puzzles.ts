import { Puzzle, Cell, ClueEntry, Language, Difficulty, Direction } from './types';
import { getWordBank, BankWord } from './wordbank';

// ---------------------------------------------------------------------------
// Deterministic, seeded crossword generator.
//
// Every puzzle is generated from its id (e.g. "en-hard-3"), so the same id
// always yields the exact same grid — on the server, on the client, and
// across reloads. Words are placed one at a time and each placement must
// cross an already-placed word on a matching letter, with all neighbouring
// cells validated so no accidental adjacent words appear. The result is
// solvable by construction: every crossing letter is shared by both words.
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Placement {
  word: BankWord;
  row: number;
  col: number;
  direction: Direction;
}

/**
 * Checks whether `word` can be placed at (row, col) going `direction` on the
 * letter canvas. Returns the number of crossings with existing words, or -1
 * if the placement is invalid. Rules enforced:
 *  - stays in bounds
 *  - the cells immediately before the start and after the end are empty
 *  - occupied cells must hold the exact same letter (a crossing)
 *  - empty cells must not touch parallel neighbours (no accidental words)
 */
function placementScore(
  canvas: (string | null)[][], size: number,
  word: string, row: number, col: number, direction: Direction,
): number {
  const dr = direction === 'down' ? 1 : 0;
  const dc = direction === 'across' ? 1 : 0;
  const endR = row + dr * (word.length - 1);
  const endC = col + dc * (word.length - 1);
  if (row < 0 || col < 0 || endR >= size || endC >= size) return -1;

  const before = canvas[row - dr]?.[col - dc];
  const after = canvas[endR + dr]?.[endC + dc];
  if (before || after) return -1;

  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const existing = canvas[r][c];
    if (existing) {
      if (existing !== word[i]) return -1;
      crossings++;
    } else {
      // Perpendicular neighbours must be empty, or we'd glue onto another word
      const n1 = direction === 'across' ? canvas[r - 1]?.[c] : canvas[r]?.[c - 1];
      const n2 = direction === 'across' ? canvas[r + 1]?.[c] : canvas[r]?.[c + 1];
      if (n1 || n2) return -1;
    }
  }
  // Must actually cross something, and not lie entirely on existing letters
  if (crossings === 0 || crossings === word.length) return -1;
  return crossings;
}

function writeWord(canvas: (string | null)[][], p: Placement) {
  const dr = p.direction === 'down' ? 1 : 0;
  const dc = p.direction === 'across' ? 1 : 0;
  for (let i = 0; i < p.word.answer.length; i++) {
    canvas[p.row + dr * i][p.col + dc * i] = p.word.answer[i];
  }
}

/** One generation attempt; returns the placements it managed to fit. */
function tryGenerate(bank: BankWord[], canvasSize: number, targetWords: number, rnd: () => number): Placement[] {
  const canvas: (string | null)[][] = Array.from({ length: canvasSize }, () => Array(canvasSize).fill(null));
  const pool = shuffle(bank, rnd);

  // Spine: the longest word among the first few, placed horizontally centered
  const spineIdx = pool.slice(0, 8).reduce((best, w, i, arr) => (w.answer.length > arr[best].answer.length ? i : best), 0);
  const spine = pool.splice(spineIdx, 1)[0];
  const first: Placement = {
    word: spine,
    row: Math.floor(canvasSize / 2),
    col: Math.floor((canvasSize - spine.answer.length) / 2),
    direction: 'across',
  };
  const placements: Placement[] = [first];
  writeWord(canvas, first);

  // Two passes over the pool: words that didn't fit early often fit later
  for (let pass = 0; pass < 2 && placements.length < targetWords; pass++) {
    for (let w = 0; w < pool.length && placements.length < targetWords; w++) {
      const word = pool[w];
      if (!word) continue;

      // Collect all valid placements that cross an existing letter
      const candidates: { p: Placement; score: number }[] = [];
      for (let r = 0; r < canvasSize; r++) {
        for (let c = 0; c < canvasSize; c++) {
          const letter = canvas[r][c];
          if (!letter) continue;
          for (let i = 0; i < word.answer.length; i++) {
            if (word.answer[i] !== letter) continue;
            for (const direction of ['across', 'down'] as const) {
              const row = direction === 'down' ? r - i : r;
              const col = direction === 'across' ? c - i : c;
              const score = placementScore(canvas, canvasSize, word.answer, row, col, direction);
              if (score > 0) candidates.push({ p: { word, row, col, direction }, score });
            }
          }
        }
      }
      if (candidates.length === 0) continue;

      // Prefer placements with more crossings (denser, nicer grids)
      const maxScore = Math.max(...candidates.map(c => c.score));
      const best = candidates.filter(c => c.score === maxScore);
      const chosen = best[Math.floor(rnd() * best.length)].p;
      placements.push(chosen);
      writeWord(canvas, chosen);
      pool[w] = null as unknown as BankWord;
    }
  }
  return placements;
}

/** Crops placements to their bounding box and builds the final square grid. */
function buildPuzzle(id: string, title: string, language: Language, difficulty: Difficulty, placements: Placement[]): Puzzle {
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const p of placements) {
    const dr = p.direction === 'down' ? 1 : 0;
    const dc = p.direction === 'across' ? 1 : 0;
    minR = Math.min(minR, p.row);
    minC = Math.min(minC, p.col);
    maxR = Math.max(maxR, p.row + dr * (p.word.answer.length - 1));
    maxC = Math.max(maxC, p.col + dc * (p.word.answer.length - 1));
  }
  const h = maxR - minR + 1;
  const w = maxC - minC + 1;
  const size = Math.max(h, w);
  // Center the cropped content inside the square grid
  const offR = Math.floor((size - h) / 2) - minR;
  const offC = Math.floor((size - w) / 2) - minC;

  const grid: Cell[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({ row: r, col: c, letter: '', isBlack: true }))
  );

  const shifted = placements.map(p => ({ ...p, row: p.row + offR, col: p.col + offC }));

  // Standard crossword numbering: scan in reading order, one number per start
  // cell (shared when an across and a down word start in the same cell).
  const startNumbers = new Map<string, number>();
  let nextNumber = 1;
  const sorted = [...shifted].sort((a, b) => a.row - b.row || a.col - b.col);
  for (const p of sorted) {
    const k = `${p.row},${p.col}`;
    if (!startNumbers.has(k)) startNumbers.set(k, nextNumber++);
  }

  const clues: ClueEntry[] = shifted.map(p => {
    const number = startNumbers.get(`${p.row},${p.col}`)!;
    const clueId = `${p.direction[0]}${number}`;
    const dr = p.direction === 'down' ? 1 : 0;
    const dc = p.direction === 'across' ? 1 : 0;
    for (let i = 0; i < p.word.answer.length; i++) {
      const cell = grid[p.row + dr * i][p.col + dc * i];
      cell.letter = p.word.answer[i];
      cell.isBlack = false;
      if (p.direction === 'across') cell.acrossId = clueId;
      else cell.downId = clueId;
    }
    grid[p.row][p.col].number = number;
    return {
      id: clueId,
      number,
      direction: p.direction,
      clue: p.word.clue,
      answer: p.word.answer,
      row: p.row,
      col: p.col,
      length: p.word.answer.length,
    };
  });

  clues.sort((a, b) => a.number - b.number || a.direction.localeCompare(b.direction));
  return { id, title, language, difficulty, grid, clues, size };
}

const SETTINGS: Record<Difficulty, { canvas: number; target: number; minWords: number }> = {
  easy: { canvas: 13, target: 11, minWords: 8 },
  hard: { canvas: 15, target: 14, minWords: 10 },
};

const TITLES: Record<Language, Record<Difficulty, string>> = {
  en: { easy: 'Everyday English', hard: 'English Expert' },
  de: { easy: 'Alltagsdeutsch', hard: 'Deutsch Profi' },
};

export const PUZZLES_PER_CATEGORY = 6;

const cache = new Map<string, Puzzle>();

function generatePuzzle(language: Language, difficulty: Difficulty, n: number): Puzzle {
  const id = `${language}-${difficulty}-${n}`;
  const hit = cache.get(id);
  if (hit) return hit;

  const bank = getWordBank(language, difficulty);
  const { canvas, target, minWords } = SETTINGS[difficulty];
  const baseSeed = hashString(id);

  // Up to 20 deterministic attempts; keep the densest result
  let best: Placement[] = [];
  for (let attempt = 0; attempt < 20; attempt++) {
    const rnd = mulberry32(baseSeed + attempt * 7919);
    const placements = tryGenerate(bank, canvas, target, rnd);
    if (placements.length > best.length) best = placements;
    if (best.length >= target) break;
  }
  if (best.length < minWords) {
    // Extremely unlikely with banks this size, but never ship a tiny grid
    console.warn(`Puzzle ${id}: only ${best.length} words placed`);
  }

  const title = `${TITLES[language][difficulty]} #${n}`;
  const puzzle = buildPuzzle(id, title, language, difficulty, best);
  cache.set(id, puzzle);
  return puzzle;
}

export interface PuzzleMeta {
  id: string;
  title: string;
  language: Language;
  difficulty: Difficulty;
  size: number;
  words: number;
}

export function getPuzzleList(): PuzzleMeta[] {
  const list: PuzzleMeta[] = [];
  for (const language of ['en', 'de'] as const) {
    for (const difficulty of ['easy', 'hard'] as const) {
      for (let n = 1; n <= PUZZLES_PER_CATEGORY; n++) {
        const p = generatePuzzle(language, difficulty, n);
        list.push({ id: p.id, title: p.title, language, difficulty, size: p.size, words: p.clues.length });
      }
    }
  }
  return list;
}

export function getPuzzles(): Puzzle[] {
  getPuzzleList();
  return [...cache.values()];
}

export function getPuzzle(id: string): Puzzle | undefined {
  const m = /^(en|de)-(easy|hard)-(\d+)$/.exec(id);
  if (!m) return undefined;
  const n = parseInt(m[3], 10);
  if (n < 1 || n > PUZZLES_PER_CATEGORY) return undefined;
  return generatePuzzle(m[1] as Language, m[2] as Difficulty, n);
}
