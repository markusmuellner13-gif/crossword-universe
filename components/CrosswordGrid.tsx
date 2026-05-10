'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Cell, ClueEntry, Puzzle } from '@/lib/types';

interface Props {
  puzzle: Puzzle;
  userLetters: Record<string, string>;
  onLetterChange: (key: string, letter: string) => void;
  onWordComplete: (clue: ClueEntry) => void;
  revealedCells: Set<string>;
  onActiveClueChange?: (clue: ClueEntry | null) => void;
}

function key(r: number, c: number) { return `${r},${c}`; }

export default function CrosswordGrid({
  puzzle, userLetters, onLetterChange, onWordComplete, revealedCells, onActiveClueChange,
}: Props) {
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [dir, setDir] = useState<'across' | 'down'>('across');
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const getClue = useCallback((r: number, c: number, d: 'across' | 'down'): ClueEntry | null => {
    const cell = puzzle.grid[r]?.[c];
    if (!cell) return null;
    const id = d === 'across' ? cell.acrossId : cell.downId;
    return puzzle.clues.find(cl => cl.id === id) ?? null;
  }, [puzzle]);

  useEffect(() => {
    if (!sel) { onActiveClueChange?.(null); return; }
    onActiveClueChange?.(getClue(sel.r, sel.c, dir));
  }, [sel, dir, getClue, onActiveClueChange]);

  const focus = useCallback((r: number, c: number, d: 'across' | 'down') => {
    const g = puzzle.grid;
    if (r < 0 || r >= puzzle.size || c < 0 || c >= puzzle.size) return;
    if (g[r][c].isBlack) return;
    setSel({ r, c });
    setDir(d);
    setTimeout(() => refs.current[key(r, c)]?.focus(), 0);
  }, [puzzle]);

  const handleCellClick = (cell: Cell) => {
    if (cell.isBlack) return;
    if (sel?.r === cell.row && sel?.c === cell.col) {
      // Toggle direction — but only if there's a clue in the other direction
      const other: 'across' | 'down' = dir === 'across' ? 'down' : 'across';
      const hasOther = other === 'across' ? !!cell.acrossId : !!cell.downId;
      if (hasOther) setDir(other);
    } else {
      setSel({ r: cell.row, c: cell.col });
      // prefer direction that has a clue
      if (!puzzle.grid[cell.row][cell.col].acrossId) setDir('down');
      else if (!puzzle.grid[cell.row][cell.col].downId) setDir('across');
    }
    setTimeout(() => refs.current[key(cell.row, cell.col)]?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, cell: Cell) => {
    const { row: r, col: c } = cell;
    if (e.key === 'Backspace') {
      e.preventDefault();
      const k = key(r, c);
      if (userLetters[k]) { onLetterChange(k, ''); }
      else { dir === 'across' ? focus(r, c - 1, 'across') : focus(r - 1, c, 'down'); }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const idx = puzzle.clues.findIndex(cl => cl.id === getClue(r, c, dir)?.id);
      const next = puzzle.clues[(idx + 1) % puzzle.clues.length];
      if (next) focus(next.row, next.col, next.direction);
      return;
    }
    const arrows: Record<string, () => void> = {
      ArrowRight: () => focus(r, c + 1, 'across'),
      ArrowLeft:  () => focus(r, c - 1, 'across'),
      ArrowDown:  () => focus(r + 1, c, 'down'),
      ArrowUp:    () => focus(r - 1, c, 'down'),
    };
    if (arrows[e.key]) { e.preventDefault(); arrows[e.key](); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, cell: Cell) => {
    const raw = e.target.value;
    const val = raw.replace(/[^a-zA-ZäöüÄÖÜß]/g, '').slice(-1).toUpperCase();
    const k = key(cell.row, cell.col);
    onLetterChange(k, val);

    if (val) {
      // Check word completion
      const clue = getClue(cell.row, cell.col, dir);
      if (clue) {
        const complete = Array.from({ length: clue.length }, (_, i) => {
          const rr = clue.direction === 'across' ? clue.row : clue.row + i;
          const cc = clue.direction === 'across' ? clue.col + i : clue.col;
          const lk = key(rr, cc);
          const l = (rr === cell.row && cc === cell.col) ? val : (userLetters[lk] ?? '');
          return l.toUpperCase() === puzzle.grid[rr][cc].letter.toUpperCase();
        }).every(Boolean);
        if (complete) onWordComplete(clue);
      }
      dir === 'across' ? focus(cell.row, cell.col + 1, 'across') : focus(cell.row + 1, cell.col, 'down');
    }
  };

  // Responsive cell size: fill available width, cap at 52px
  const maxGridWidth = typeof window !== 'undefined'
    ? Math.min(window.innerWidth - 48, 480)
    : 480;
  const cellSize = Math.max(28, Math.floor((maxGridWidth - puzzle.size * 2) / puzzle.size));
  const capCellSize = Math.min(cellSize, 52);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${puzzle.size}, ${capCellSize}px)`, gap: '2px', touchAction: 'none' }}>
      {puzzle.grid.flat().map(cell => {
        const k = key(cell.row, cell.col);
        const userL = userLetters[k] ?? '';
        const isCorrect = userL && userL.toUpperCase() === cell.letter.toUpperCase();
        const isWrong   = userL && !isCorrect;
        const isRevealed = revealedCells.has(k);
        const isSel = sel?.r === cell.row && sel?.c === cell.col;
        const inWord = (() => {
          if (!sel) return false;
          const clue = getClue(sel.r, sel.c, dir);
          if (!clue) return false;
          return (dir === 'across' ? cell.acrossId : cell.downId) === clue.id;
        })();

        if (cell.isBlack) {
          return <div key={k} style={{ width: capCellSize, height: capCellSize, background: '#06060f', borderRadius: 3 }} />;
        }

        let bg     = 'rgba(22,33,62,0.95)';
        let border = '1px solid rgba(42,42,74,0.5)';
        let color  = 'var(--text-primary)';

        if (isSel)         { bg = '#2563eb'; border = '2px solid #60a5fa'; color = 'white'; }
        else if (inWord)   { bg = 'rgba(30,58,95,0.98)'; border = '1px solid rgba(59,130,246,0.35)'; }
        if (isCorrect && !isSel) { bg = 'rgba(20,83,45,0.8)'; border = '1px solid rgba(34,197,94,0.4)'; color = '#86efac'; }
        if (isWrong   && !isSel) { bg = 'rgba(127,29,29,0.7)'; border = '1px solid rgba(239,68,68,0.4)'; color = '#fca5a5'; }
        if (isRevealed && !isSel){ bg = 'rgba(92,50,0,0.8)'; border = '1px solid rgba(245,166,35,0.4)'; color = '#fcd34d'; }

        const numSize = Math.max(7, capCellSize * 0.22);
        const letterSize = Math.max(14, capCellSize * 0.42);

        return (
          <div key={k}
            onClick={() => handleCellClick(cell)}
            style={{
              width: capCellSize, height: capCellSize, position: 'relative',
              background: bg, border, borderRadius: 3,
              transition: 'background 0.12s, border 0.12s',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {cell.number && (
              <span style={{
                position: 'absolute', top: 1, left: 2,
                fontSize: numSize, lineHeight: 1,
                color: isSel ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)',
                fontWeight: 700, pointerEvents: 'none',
              }}>
                {cell.number}
              </span>
            )}
            <input
              ref={el => { refs.current[k] = el; }}
              className="cell-input"
              style={{ color, fontSize: letterSize, paddingTop: cell.number ? numSize + 2 : 0 }}
              value={userL}
              onChange={e => handleInput(e, cell)}
              onKeyDown={e => handleKeyDown(e, cell)}
              onFocus={() => setSel({ r: cell.row, c: cell.col })}
              maxLength={2}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
            />
          </div>
        );
      })}
    </div>
  );
}
