'use client';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPuzzle } from '@/lib/puzzles';
import { loadProgress, saveProgress } from '@/lib/storage';
import { ClueEntry } from '@/lib/types';
import CrosswordGrid from '@/components/CrosswordGrid';
import StarsBg from '@/components/StarsBg';

const PTS_WORD  = { easy: 10, hard: 20 }  as const;
const PTS_BONUS = { easy: 50, hard: 150 } as const;

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();
  const puzzle   = getPuzzle(id);

  const [userLetters, setUserLetters]   = useState<Record<string, string>>({});
  const [revealedCells]                 = useState<Set<string>>(new Set());
  const [completedClues, setCompleted]  = useState<Set<string>>(new Set());
  const [sessionPts, setSessionPts]     = useState(0);
  const [totalPoints, setTotalPoints]   = useState(0);
  const [level, setLevel]               = useState(1);
  const [toast, setToast]               = useState<{ msg: string; pts: number } | null>(null);
  const [puzzleDone, setPuzzleDone]     = useState(false);
  const [activeClue, setActiveClue]     = useState<ClueEntry | null>(null);
  const [clueTab, setClueTab]           = useState<'across' | 'down'>('across');
  const debounceSave                    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef                    = useRef(completedClues);
  completedRef.current                  = completedClues;

  // Load saved state on mount
  useEffect(() => {
    if (!puzzle) return;
    const data = loadProgress();
    setTotalPoints(data.totalPoints);
    setLevel(data.level);
    if (data.activePuzzleId === id && data.activePuzzleState) {
      setUserLetters(data.activePuzzleState);
    }
  }, [id, puzzle]);

  const persist = useCallback((
    letters: Record<string, string>,
    pts: number,
    lvl: number,
    done: string[],
    clearActive = false,
  ) => {
    saveProgress({
      totalPoints: pts,
      level: lvl,
      completedPuzzles: done,
      activePuzzleId: clearActive ? null : id,
      activePuzzleState: clearActive ? null : letters,
    });
  }, [id]);

  const showToast = (msg: string, pts: number) => {
    setToast({ msg, pts });
    setTimeout(() => setToast(null), 2200);
  };

  const handleLetterChange = useCallback((key: string, letter: string) => {
    setUserLetters(prev => {
      const next = { ...prev, [key]: letter };
      // Debounce save by 800 ms so we don't thrash on every keystroke
      if (debounceSave.current) clearTimeout(debounceSave.current);
      debounceSave.current = setTimeout(() => {
        const d = loadProgress();
        persist(next, d.totalPoints, d.level, [], false);
      }, 800);
      return next;
    });
  }, [persist]);

  const handleWordComplete = useCallback((clue: ClueEntry) => {
    if (completedRef.current.has(clue.id)) return;

    setCompleted(prev => {
      const next = new Set(prev);
      next.add(clue.id);

      const wordPts = PTS_WORD[puzzle!.difficulty];
      showToast(`✓ ${clue.answer}`, wordPts);
      setSessionPts(p => p + wordPts);

      setTotalPoints(prevTotal => {
        const newTotal = prevTotal + wordPts;
        const newLvl   = Math.floor(newTotal / 100) + 1;
        setLevel(newLvl);

        if (next.size >= puzzle!.clues.length) {
          const bonus = PTS_BONUS[puzzle!.difficulty];
          setTimeout(() => {
            setPuzzleDone(true);
            const finalTotal = newTotal + bonus;
            const finalLvl   = Math.floor(finalTotal / 100) + 1;
            setTotalPoints(finalTotal);
            setLevel(finalLvl);
            setSessionPts(p => p + bonus);
            persist({}, finalTotal, finalLvl, [id], true);
          }, 600);
        } else {
          const d = loadProgress();
          persist(userLetters, newTotal, newLvl, d.completedPuzzles, false);
        }
        return newTotal;
      });

      return next;
    });
  }, [puzzle, id, persist, userLetters]);

  if (!puzzle) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p style={{ color: 'var(--text-muted)' }}>Puzzle not found</p>
      <button className="btn-primary" onClick={() => router.push('/')}>← Home</button>
    </div>
  );

  const isDE          = puzzle.language === 'de';
  const acrossClues   = puzzle.clues.filter(c => c.direction === 'across');
  const downClues     = puzzle.clues.filter(c => c.direction === 'down');
  const diffLabel     = puzzle.difficulty === 'easy' ? (isDE ? 'Einfach' : 'Easy') : (isDE ? 'Schwer' : 'Hard');
  const progressPct   = Math.round((completedClues.size / puzzle.clues.length) * 100);

  return (
    <div className="relative flex flex-col" style={{ minHeight: '100dvh', paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
      <StarsBg />

      <div className="relative z-10 flex flex-col" style={{ minHeight: '100dvh' }}>
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between px-3 py-2 card-glass border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 font-semibold text-sm rounded-xl px-3 py-2"
            style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', transition: 'opacity 0.15s' }}
            onPointerDown={e => (e.currentTarget.style.opacity = '0.5')}
            onPointerUp={e => (e.currentTarget.style.opacity = '1')}
            onPointerLeave={e => (e.currentTarget.style.opacity = '1')}>
            ← Home
          </button>
          <div className="text-center">
            <div className="font-black text-sm leading-tight gradient-text">{puzzle.title}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{diffLabel} · {puzzle.size}×{puzzle.size}</div>
          </div>
          <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)' }}>
            <span className="text-sm">⭐</span>
            <span className="text-sm font-black" style={{ color: 'var(--gold)' }}>+{sessionPts}</span>
          </div>
        </header>

        {/* Progress stripe */}
        <div className="h-1 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#e94560,#f5a623)' }} />
        </div>

        {/* Active clue banner */}
        {activeClue && (
          <div className="shrink-0 px-3 py-2 slide-down flex items-start gap-2"
            style={{ background: 'rgba(59,130,246,0.1)', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>
            <span className="text-xs font-black shrink-0 mt-0.5" style={{ color: '#60a5fa' }}>
              {activeClue.number}{activeClue.direction === 'across' ? '→' : '↓'}
            </span>
            <span className="text-sm leading-snug">{activeClue.clue}</span>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed left-1/2 z-50 px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 pop-in"
            style={{
              top: 'calc(var(--safe-top) + 72px)', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white',
              boxShadow: '0 8px 30px rgba(34,197,94,0.4)', whiteSpace: 'nowrap',
            }}>
            {toast.msg} <span style={{ color: '#bbf7d0' }}>+{toast.pts} pts</span>
          </div>
        )}

        {/* Complete modal */}
        {puzzleDone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
            <div className="card-glass rounded-3xl p-8 text-center w-full max-w-sm pop-in">
              <div className="text-6xl mb-4 float-anim">🏆</div>
              <h2 className="text-3xl font-black gradient-text mb-1">
                {isDE ? 'Geschafft!' : 'Puzzle Complete!'}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                {isDE ? 'Hervorragende Leistung!' : 'Outstanding work!'}
              </p>
              <div className="py-5 mb-6 rounded-2xl"
                style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
                <div className="text-5xl font-black" style={{ color: 'var(--gold)' }}>+{sessionPts}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Points Earned · Lv.{level}</div>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => router.push('/')}>🏠 Home</button>
                <button className="btn-primary flex-1" onClick={() => {
                  setPuzzleDone(false); setUserLetters({}); setCompleted(new Set()); setSessionPts(0);
                }}>🔁 Retry</button>
              </div>
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">
          {/* Grid */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="card-glass rounded-2xl p-3 w-full flex justify-center">
              <CrosswordGrid
                puzzle={puzzle}
                userLetters={userLetters}
                onLetterChange={handleLetterChange}
                onWordComplete={handleWordComplete}
                revealedCells={revealedCells}
                onActiveClueChange={setActiveClue}
              />
            </div>
            <div className="text-xs w-full flex justify-between px-1" style={{ color: 'var(--text-muted)' }}>
              <span>{completedClues.size}/{puzzle.clues.length} {isDE ? 'Wörter' : 'words'}</span>
              <span>{progressPct}% {isDE ? 'fertig' : 'done'} · 💾 saved</span>
            </div>
          </div>

          {/* Clues panel */}
          <div className="flex-1 flex flex-col min-h-0 card-glass rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              {(['across','down'] as const).map(tab => (
                <button key={tab} onClick={() => setClueTab(tab)}
                  className="flex-1 py-2.5 text-sm font-bold transition-colors"
                  style={{
                    color: clueTab === tab ? 'white' : 'var(--text-muted)',
                    background: clueTab === tab ? 'rgba(233,69,96,0.12)' : 'transparent',
                    borderBottom: clueTab === tab ? '2px solid #e94560' : '2px solid transparent',
                  }}>
                  {tab === 'across' ? (isDE ? '→ Waagerecht' : '→ Across') : (isDE ? '↓ Senkrecht' : '↓ Down')}
                </button>
              ))}
            </div>

            {/* Clue list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {(clueTab === 'across' ? acrossClues : downClues).map(c => {
                const done   = completedClues.has(c.id);
                const active = activeClue?.id === c.id;
                return (
                  <div key={c.id} className="flex gap-2 items-start text-sm px-2.5 py-2 rounded-xl transition-all"
                    style={{
                      background: active ? 'rgba(59,130,246,0.18)' : done ? 'rgba(22,101,52,0.2)' : 'rgba(255,255,255,0.025)',
                      border: active ? '1px solid rgba(59,130,246,0.4)' : done ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                    }}>
                    <span className="font-black shrink-0 w-5 text-right"
                      style={{ color: active ? '#60a5fa' : 'var(--accent)' }}>
                      {c.number}
                    </span>
                    <span className="flex-1 leading-snug" style={{ color: done ? '#86efac' : 'var(--text-primary)' }}>
                      {c.clue}
                    </span>
                    {done && <span className="shrink-0">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
