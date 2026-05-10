import { Puzzle, Cell, ClueEntry } from './types';

function buildGrid(size: number, blackCells: [number, number][], words: { answer: string; row: number; col: number; direction: 'across' | 'down'; number: number; clue: string; id: string }[]): { grid: Cell[][]; clues: ClueEntry[] } {
  const grid: Cell[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({
      row: r, col: c, letter: '', isBlack: false,
    }))
  );

  for (const [r, c] of blackCells) {
    grid[r][c].isBlack = true;
  }

  const clues: ClueEntry[] = [];

  for (const w of words) {
    const clue: ClueEntry = { id: w.id, number: w.number, direction: w.direction, clue: w.clue, answer: w.answer, row: w.row, col: w.col, length: w.answer.length };
    clues.push(clue);
    grid[w.row][w.col].number = w.number;
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.direction === 'across' ? w.row : w.row + i;
      const c = w.direction === 'across' ? w.col + i : w.col;
      grid[r][c].letter = w.answer[i];
      if (w.direction === 'across') grid[r][c].acrossId = w.id;
      else grid[r][c].downId = w.id;
    }
  }

  return { grid, clues };
}

const enEasy = (): Puzzle => {
  const words = [
    { id: 'a1', number: 1, direction: 'across' as const, clue: 'Opposite of night', answer: 'DAY', row: 0, col: 0 },
    { id: 'a2', number: 4, direction: 'across' as const, clue: 'Feline pet', answer: 'CAT', row: 0, col: 4 },
    { id: 'a3', number: 5, direction: 'across' as const, clue: 'Color of the sky', answer: 'BLUE', row: 2, col: 0 },
    { id: 'a4', number: 6, direction: 'across' as const, clue: 'Opposite of hot', answer: 'COLD', row: 4, col: 0 },
    { id: 'a5', number: 7, direction: 'across' as const, clue: 'Round sport object', answer: 'BALL', row: 6, col: 2 },
    { id: 'd1', number: 1, direction: 'down' as const, clue: 'A canine animal', answer: 'DOG', row: 0, col: 0 },
    { id: 'd2', number: 2, direction: 'down' as const, clue: 'What plants need', answer: 'AIR', row: 0, col: 1 },
    { id: 'd3', number: 3, direction: 'down' as const, clue: 'Illumination source', answer: 'LIGHT', row: 0, col: 2 },
    { id: 'd4', number: 4, direction: 'down' as const, clue: 'A feline sound', answer: 'CRY', row: 0, col: 4 },
  ];
  const blacks: [number, number][] = [[0,3],[1,3],[3,3],[3,4],[3,5],[3,6],[5,0],[5,1],[6,0],[6,1],[1,5],[1,6],[2,5],[2,6]];
  const { grid, clues } = buildGrid(7, blacks, words);
  return { id: 'en-easy-1', title: 'Simple English', language: 'en', difficulty: 'easy', grid, clues, size: 7 };
};

const enHard = (): Puzzle => {
  const words = [
    { id: 'a1', number: 1, direction: 'across' as const, clue: 'Capital of France', answer: 'PARIS', row: 0, col: 0 },
    { id: 'a2', number: 6, direction: 'across' as const, clue: 'Astronomical body orbiting a planet', answer: 'MOON', row: 0, col: 6 },
    { id: 'a3', number: 7, direction: 'across' as const, clue: 'Type of tree with needles', answer: 'PINE', row: 2, col: 0 },
    { id: 'a4', number: 8, direction: 'across' as const, clue: 'Ocean with largest area', answer: 'PACIFIC', row: 4, col: 0 },
    { id: 'a5', number: 9, direction: 'across' as const, clue: 'Written composition', answer: 'ESSAY', row: 6, col: 0 },
    { id: 'a6', number: 10, direction: 'across' as const, clue: 'Tool for drawing circles', answer: 'COMPASS', row: 8, col: 0 },
    { id: 'd1', number: 1, direction: 'down' as const, clue: 'Bright light in the sky', answer: 'PULSAR', row: 0, col: 0 },
    { id: 'd2', number: 2, direction: 'down' as const, clue: 'Strong iron alloy', answer: 'ALLOY', row: 0, col: 1 },
    { id: 'd3', number: 3, direction: 'down' as const, clue: 'Narrative story', answer: 'RIME', row: 0, col: 2 },
    { id: 'd4', number: 4, direction: 'down' as const, clue: 'Precious red stone', answer: 'INEPT', row: 0, col: 3 },
    { id: 'd5', number: 5, direction: 'down' as const, clue: 'Sound reflection', answer: 'SPACE', row: 0, col: 4 },
  ];
  const blacks: [number, number][] = [[0,5],[1,0],[1,5],[1,6],[1,7],[1,8],[2,5],[2,6],[2,7],[2,8],[3,0],[3,5],[3,6],[3,7],[3,8],[5,5],[5,6],[5,7],[5,8],[6,5],[6,6],[6,7],[6,8],[7,0],[7,5],[7,6],[7,7],[7,8]];
  const { grid, clues } = buildGrid(9, blacks, words);
  return { id: 'en-hard-1', title: 'Advanced English', language: 'en', difficulty: 'hard', grid, clues, size: 9 };
};

const deEasy = (): Puzzle => {
  const words = [
    { id: 'a1', number: 1, direction: 'across' as const, clue: 'Gegenteil von Nacht', answer: 'TAG', row: 0, col: 0 },
    { id: 'a2', number: 4, direction: 'across' as const, clue: 'Haustier, das miaut', answer: 'KATZE', row: 2, col: 0 },
    { id: 'a3', number: 5, direction: 'across' as const, clue: 'Farbe des Himmels', answer: 'BLAU', row: 4, col: 0 },
    { id: 'a4', number: 6, direction: 'across' as const, clue: 'Gegenteil von warm', answer: 'KALT', row: 6, col: 0 },
    { id: 'd1', number: 1, direction: 'down' as const, clue: 'Ein Tier, das bellt', answer: 'TISCH', row: 0, col: 0 },
    { id: 'd2', number: 2, direction: 'down' as const, clue: 'Was Pflanzen brauchen', answer: 'ACHT', row: 0, col: 1 },
    { id: 'd3', number: 3, direction: 'down' as const, clue: 'Lichtquelle', answer: 'GELD', row: 0, col: 2 },
  ];
  const blacks: [number, number][] = [[0,3],[0,4],[0,5],[0,6],[1,3],[1,4],[1,5],[1,6],[3,4],[3,5],[3,6],[5,4],[5,5],[5,6],[6,4],[6,5],[6,6]];
  const { grid, clues } = buildGrid(7, blacks, words);
  return { id: 'de-easy-1', title: 'Einfaches Deutsch', language: 'de', difficulty: 'easy', grid, clues, size: 7 };
};

const deHard = (): Puzzle => {
  const words = [
    { id: 'a1', number: 1, direction: 'across' as const, clue: 'Hauptstadt von Deutschland', answer: 'BERLIN', row: 0, col: 0 },
    { id: 'a2', number: 5, direction: 'across' as const, clue: 'Planetensatellit', answer: 'MOND', row: 0, col: 7 },
    { id: 'a3', number: 6, direction: 'across' as const, clue: 'Nadelbaum', answer: 'FICHTE', row: 2, col: 0 },
    { id: 'a4', number: 7, direction: 'across' as const, clue: 'Schriftliche Abhandlung', answer: 'AUFSATZ', row: 4, col: 0 },
    { id: 'a5', number: 8, direction: 'across' as const, clue: 'Werkzeug zum Zeichnen von Kreisen', answer: 'ZIRKEL', row: 6, col: 0 },
    { id: 'd1', number: 1, direction: 'down' as const, clue: 'Stabiles Metall', answer: 'BUCHE', row: 0, col: 0 },
    { id: 'd2', number: 2, direction: 'down' as const, clue: 'Erzaehlung', answer: 'ERNTE', row: 0, col: 1 },
    { id: 'd3', number: 3, direction: 'down' as const, clue: 'Kostbarer roter Stein', answer: 'RUBIN', row: 0, col: 2 },
    { id: 'd4', number: 4, direction: 'down' as const, clue: 'Schallreflexion', answer: 'LINSE', row: 0, col: 3 },
  ];
  const blacks: [number, number][] = [[0,6],[1,0],[1,6],[1,7],[1,8],[1,9],[1,10],[2,6],[2,7],[2,8],[2,9],[2,10],[3,0],[3,6],[3,7],[3,8],[3,9],[3,10],[5,6],[5,7],[5,8],[5,9],[5,10],[6,6],[6,7],[6,8],[6,9],[6,10]];
  const { grid, clues } = buildGrid(11, blacks, words);
  return { id: 'de-hard-1', title: 'Fortgeschrittenes Deutsch', language: 'de', difficulty: 'hard', grid, clues, size: 11 };
};

export function getPuzzles() {
  return [enEasy(), enHard(), deEasy(), deHard()];
}

export function getPuzzle(id: string): Puzzle | undefined {
  return getPuzzles().find(p => p.id === id);
}
