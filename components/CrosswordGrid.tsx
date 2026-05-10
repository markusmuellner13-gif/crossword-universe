'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Cell, ClueEntry, Puzzle } from '@/lib/types';

interface Props {
  puzzle: Puzzle;
  userLetters: Record<string, string>;
  onLetterChange: (key: string, letter: string) => void;
  onWordComplete: (clue: ClueEntry) => void;
  revealedCells: Set<string>;
}

function cellKey(r: number, c: number) { return `${r},${c}`; }

export default function CrosswordGrid({ puzzle, userLetters, onLetterChange, onWordComplete, revealedCells }: Props) {
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getActiveClue = useCallback((): ClueEntry | null => {
    if (!selectedCell) return null;
    const cell = puzzle.grid[selectedCell.r][selectedCell.c];
    const id = direction === 'across' ? cell.acrossId : cell.downId;
    return puzzle.clues.find(c => c.id === id) ?? null;
  }, [selectedCell, direction, puzzle]);

  const getCellState = (cell: Cell) => {
    if (cell.isBlack) return 'black';
    const key = cellKey(cell.row, cell.col);
    const userL = userLetters[key] ?? '';
    const correct = userL.toUpperCase() === cell.letter.toUpperCase();
    if (revealedCells.has(key)) return 'revealed';
    if (userL && correct) return 'correct';
    if (userL && !correct) return 'wrong';
    return 'empty';
  };

  const isInActiveWord = (cell: Cell) => {
    if (!selectedCell) return false;
    const activeClue = getActiveClue();
    if (!activeClue) return false;
    const id = direction === 'across' ? cell.acrossId : cell.downId;
    return id === activeClue.id;
  };

  const isSelected = (cell: Cell) => selectedCell?.r === cell.row && selectedCell?.c === cell.col;

  const moveFocus = useCallback((r: number, c: number, dir: 'across' | 'down') => {
    const grid = puzzle.grid;
    if (r < 0 || r >= puzzle.size || c < 0 || c >= puzzle.size) return;
    if (grid[r][c].isBlack) return;
    setSelectedCell({ r, c });
    setDirection(dir);
    setTimeout(() => inputRefs.current[cellKey(r, c)]?.focus(), 0);
  }, [puzzle]);

  const handleCellClick = (cell: Cell) => {
    if (cell.isBlack) return;
    if (isSelected(cell)) {
      setDirection(d => d === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ r: cell.row, c: cell.col });
    }
    setTimeout(() => inputRefs.current[cellKey(cell.row, cell.col)]?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, cell: Cell) => {
    const { r, c } = { r: cell.row, c: cell.col };
    if (e.key === 'Backspace') {
      const key = cellKey(r, c);
      if (userLetters[key]) {
        onLetterChange(key, '');
      } else {
        if (direction === 'across') moveFocus(r, c - 1, 'across');
        else moveFocus(r - 1, c, 'down');
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowRight') { moveFocus(r, c + 1, 'across'); e.preventDefault(); return; }
    if (e.key === 'ArrowLeft') { moveFocus(r, c - 1, 'across'); e.preventDefault(); return; }
    if (e.key === 'ArrowDown') { moveFocus(r + 1, c, 'down'); e.preventDefault(); return; }
    if (e.key === 'ArrowUp') { moveFocus(r - 1, c, 'up' as 'down'); e.preventDefault(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const idx = puzzle.clues.findIndex(cl => cl.id === getActiveClue()?.id);
      const next = puzzle.clues[(idx + 1) % puzzle.clues.length];
      if (next) moveFocus(next.row, next.col, next.direction);
      return;
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, cell: Cell) => {
    const val = e.target.value.replace(/[^a-zA-ZäöüÄÖÜß]/g, '').slice(-1).toUpperCase();
    const key = cellKey(cell.row, cell.col);
    onLetterChange(key, val);

    if (val) {
      // Check if word is complete
      const clue = getActiveClue();
      if (clue) {
        const isComplete = Array.from({ length: clue.length }, (_, i) => {
          const rr = clue.direction === 'across' ? clue.row : clue.row + i;
          const cc = clue.direction === 'across' ? clue.col + i : clue.col;
          const k = cellKey(rr, cc);
          const letter = rr === cell.row && cc === cell.col ? val : (userLetters[k] ?? '');
          return letter.toUpperCase() === puzzle.grid[rr][cc].letter.toUpperCase();
        }).every(Boolean);
        if (isComplete) onWordComplete(clue);
      }

      // Move to next cell
      if (direction === 'across') moveFocus(cell.row, cell.col + 1, 'across');
      else moveFocus(cell.row + 1, cell.col, 'down');
    }
  };

  const cellSize = Math.min(480 / puzzle.size, 52);

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${puzzle.size}, ${cellSize}px)`, gap: '2px' }}>
        {puzzle.grid.flat().map((cell) => {
          const state = getCellState(cell);
          const inWord = isInActiveWord(cell);
          const selected = isSelected(cell);

          if (state === 'black') {
            return <div key={cellKey(cell.row, cell.col)} style={{ width: cellSize, height: cellSize, background: '#080812', borderRadius: 4 }} />;
          }

          let bg = 'rgba(22,33,62,0.9)';
          let border = '1px solid rgba(42,42,74,0.5)';
          let color = 'var(--text-primary)';

          if (selected) { bg = '#3b82f6'; border = '2px solid #60a5fa'; }
          else if (inWord) { bg = 'rgba(30,58,95,0.95)'; border = '1px solid rgba(59,130,246,0.4)'; }
          if (state === 'correct' && !selected) { bg = 'rgba(22,101,52,0.7)'; border = '1px solid #22c55e'; color = '#86efac'; }
          if (state === 'wrong' && !selected) { bg = 'rgba(127,29,29,0.7)'; border = '1px solid #ef4444'; color = '#fca5a5'; }
          if (state === 'revealed' && !selected) { bg = 'rgba(100,60,0,0.7)'; border = '1px solid #f5a623'; color = '#fcd34d'; }

          return (
            <div key={cellKey(cell.row, cell.col)}
              style={{ width: cellSize, height: cellSize, position: 'relative', background: bg, border, borderRadius: 4, transition: 'all 0.15s', cursor: 'pointer' }}
              onClick={() => handleCellClick(cell)}>
              {cell.number && (
                <span style={{ position: 'absolute', top: 1, left: 2, fontSize: Math.max(8, cellSize * 0.22), color: selected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', fontWeight: 700, lineHeight: 1, pointerEvents: 'none' }}>
                  {cell.number}
                </span>
              )}
              <input
                ref={el => { inputRefs.current[cellKey(cell.row, cell.col)] = el; }}
                className="cell-input"
                style={{ color, paddingTop: cell.number ? Math.max(8, cellSize * 0.3) : 0 }}
                value={userLetters[cellKey(cell.row, cell.col)] ?? ''}
                onChange={e => handleInput(e, cell)}
                onKeyDown={e => handleKeyDown(e, cell)}
                onFocus={() => { setSelectedCell({ r: cell.row, c: cell.col }); }}
                maxLength={2}
                readOnly={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
