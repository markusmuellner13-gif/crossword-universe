'use client';

// localStorage is the primary persistence layer for the PWA.
// All reads and writes hit localStorage instantly.
// If Supabase is configured, we sync to the cloud too.

export interface ProgressData {
  totalPoints: number;
  level: number;
  completedPuzzles: string[];
  activePuzzleId: string | null;
  activePuzzleState: Record<string, string> | null;
}

const KEY = 'crossword_progress';

export function loadProgress(): ProgressData {
  if (typeof window === 'undefined') return defaultProgress();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    return { ...defaultProgress(), ...JSON.parse(raw) };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(data: Partial<ProgressData>) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadProgress();
    const merged: ProgressData = {
      ...current,
      ...data,
      completedPuzzles: [
        ...new Set([
          ...(current.completedPuzzles ?? []),
          ...(data.completedPuzzles ?? []),
        ]),
      ],
      totalPoints: data.totalPoints ?? current.totalPoints,
      level: data.level ?? current.level,
    };
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {}
}

function defaultProgress(): ProgressData {
  return { totalPoints: 0, level: 1, completedPuzzles: [], activePuzzleId: null, activePuzzleState: null };
}
