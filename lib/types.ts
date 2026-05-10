export type Language = 'en' | 'de';
export type Difficulty = 'easy' | 'hard';
export type Direction = 'across' | 'down';

export interface ClueEntry {
  id: string;
  number: number;
  direction: Direction;
  clue: string;
  answer: string;
  row: number;
  col: number;
  length: number;
}

export interface Cell {
  row: number;
  col: number;
  letter: string;
  isBlack: boolean;
  number?: number;
  acrossId?: string;
  downId?: string;
}

export interface Puzzle {
  id: string;
  title: string;
  language: Language;
  difficulty: Difficulty;
  grid: Cell[][];
  clues: ClueEntry[];
  size: number;
}

export interface UserProgress {
  id?: string;
  sessionId: string;
  totalPoints: number;
  level: number;
  completedPuzzles: string[];
  activePuzzleId: string | null;
  activePuzzleState: Record<string, string> | null;
  updatedAt?: string;
}
