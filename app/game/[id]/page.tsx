'use client';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPuzzle } from '@/lib/puzzles';
import { getSessionId } from '@/lib/session';
import { ClueEntry } from '@/lib/types';
import CrosswordGrid from '@/components/CrosswordGrid';
import StarsBg from '@/components/StarsBg';

const PTS_WORD = { easy: 10, hard: 20 };
const PTS_BONUS = { easy: 50, hard: 150 };

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const puzzle = getPuzzle(id);

  const [userLetters, setUserLetters] = useState<Record<string, string>>({});
  const [revealedCells] = useState<Set<string>>(new Set());
  const [completedClues, setCompletedClues] = useState<Set<string>>(new Set());
  const [sessionPts, setSessionPts] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [toast, setToast] = useState<{ msg: string; pts: number } | null>(null);
  const [puzzleDone, setPuzzleDone] = useState(false);
  const [activeClue, setActiveClue] = useState<ClueEntry | null>(null);
  const [clueTab, setClueTab] = useState<'across' | 'down'>('across');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(completedClues);
  completedRef.current = completedClues;

  useEffect(() => {
    if (!puzzle) return;
    fetch(`/api/progress?sessionId=${getSessionId()}`)
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) {
          setTotalPoints(d.total_points ?? 0);
          setLevel(d.level ?? 1);
          if (d.active_puzzle_id === id && d.active_puzzle_state) {
            setUserLetters(d.active_puzzle_state);
          }
        }
      }).catch(() => {});
  }, [id, puzzle]);

  const save = useCallback((letters: Record<string, string>, pts: number, completed: string[], lvl: number) => {
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: getSessionId(),
        total_points: pts,
        level: lvl,
        completed_puzzles: completed,
        active_puzzle_id: id,
        active_puzzle_state: letters,
      }),
    }).catch(() => {});
  }, [id]);

  const showToast = (msg: string, pts: number) => {
    setToast({ msg, pts });
    setTimeout(() => setToast(null), 2200);
  };

  const handleLetterChange = useCallback((key: string, letter: string) => {
    setUserLetters(prev => {
      const next = { ...prev, [key]: letter };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(next, totalPoints, [], level), 1500);
      return next;
    });
  }, [save, totalPoints, level]);

  const handleWordComplete = useCallback((clue: ClueEntry) => {
    if (completedRef.current.has(clue.id)) return;

    setCompletedClues(prev => {
      const next = new Set(prev);
      next.add(clue.id);

      const wordPts = PTS_WORD[puzzle!.difficulty];
      showToast(`✓ ${clue.answer}`, wordPts);
      setSessionPts(p => p + wordPts);

      setTotalPoints(prevTotal => {
        const newTotal = prevTotal + wordPts;
        const newLvl = Math.floor(newTotal / 100) + 1;
        setLevel(newLvl);

        if (next.size >= puzzle!.clues.length) {
          const bonus = PTS_BONUS[puzzle!.difficulty];
          setTimeout(() => {
            setPuzzleDone(true);
            setTotalPoints(t => {
              const final = t + bonus;
              setLevel(Math.floor(final / 100) + 1);
              save({}, final, [id], Math.floor(final / 100) + 1);
              return final;
            });
            setSessionPts(p => p + bonus);
          }, 600);
        } else {
          save(userLetters, newTotal, [], newLvl);
        }
        return newTotal;
      });

      return next;
    });
  }, [puzzle, id, save, userLetters]);

  if (!puzzle) return (
    <div className="min-h-screen flex items-center justify-center gap-4 flex-col">
      <p style={{ color: 'var(--text-muted)' }}>Puzzle not found</p>
      <button className="btn-primary" onClick={() => router.push('/')}>← Home</button>
    </div>
  );

  const isDE = puzzle.language === 'de';
  const acrossClues = puzzle.clues.filter(c => c.direction === 'across');
  const downClues   = puzzle.clues.filter(c => c.direction === 'down');
  const diffLabel   = puzzle.difficulty === 'easy' ? (isDE ? 'Einfach' : 'Easy') : (isDE ? 'Schwer' : 'Hard');
  const progress    = Math.round((completedClues.size / puzzle.clues.length) * 100);

  return (
    <div className="relative flex flex-col" style={{ minHeight: '100dvh', paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
      <StarsBg />

      <div className="relative z-10 flex flex-col" style={{ minHeight: '100dvh' }}>
        {/* ── Header ── */}
        <header className="shrink-0 flex items-center justify-between px-3 py-2 card-glass border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 font-semibold text-sm rounded-xl px-3 py-2 transition-colors active:opacity-60"
            style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}>
            ← {isDE ? 'Home' : 'Home'}
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

        {/* ── Progress bar (thin stripe under header) ── */}
        <div className="h-1 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#e94560,#f5a623)' }} />
        </div>

        {/* ── Active clue banner ── */}
        {activeClue && (
          <div className="shrink-0 px-3 py-2 slide-down" style={{ background: 'rgba(59,130,246,0.12)', borderBottom: '1px solid rgba(59,130,246,0.25)' }}>
            <span className="text-xs font-bold mr-2" style={{ color: '#60a5fa' }}>
              {activeClue.number} {activeClue.direction === 'across' ? (isDE ? '→' : '→') : '↓'}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{activeClue.clue}</span>
          </div>
        )}

        {/* ── Toast ── */}
        {toast && (
          <div className="fixed left-1/2 z-50 px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 pop-in"
            style={{
              top: 'calc(var(--safe-top) + 70px)',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              color: 'white',
              boxShadow: '0 8px 30px rgba(34,197,94,0.4)',
              whiteSpace: 'nowrap',
            }}>
            {toast.msg}
            <span style={{ color: '#bbf7d0' }}>+{toast.pts} pts</span>
          </div>
        )}

        {/* ── Puzzle Complete overlay ── */}
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
              <div className="py-5 mb-6 rounded-2xl" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
                <div className="text-5xl font-black" style={{ color: 'var(--gold)' }}>+{sessionPts}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Points Earned</div>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => router.push('/')}>
                  🏠 Home
                </button>
                <button className="btn-primary flex-1" onClick={() => {
                  setPuzzleDone(false); setUserLetters({}); setCompletedClues(new Set()); setSessionPts(0);
                }}>
                  🔁 Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main layout: stacked on mobile, side-by-side on large ── */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">

          {/* Grid panel */}
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
            {/* Word count */}
            <div className="text-xs w-full flex justify-between px-1" style={{ color: 'var(--text-muted)' }}>
              <span>{completedClues.size}/{puzzle.clues.length} {isDE ? 'Wörter' : 'words'}</span>
              <span>{progress}% {isDE ? 'fertig' : 'done'}</span>
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
                    background: clueTab === tab ? 'rgba(233,69,96,0.15)' : 'transparent',
                    borderBottom: clueTab === tab ? '2px solid #e94560' : '2px solid transparent',
                  }}>
                  {tab === 'across'
                    ? (isDE ? '→ Waagerecht' : '→ Across')
                    : (isDE ? '↓ Senkrecht'  : '↓ Down')}
                </button>
              ))}
            </div>

            {/* Clue list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {(clueTab === 'across' ? acrossClues : downClues).map(c => {
                const done = completedClues.has(c.id);
                const active = activeClue?.id === c.id;
                return (
                  <div key={c.id}
                    className="flex gap-2 items-start text-sm px-2.5 py-2 rounded-xl transition-all"
                    style={{
                      background: active ? 'rgba(59,130,246,0.18)' : done ? 'rgba(22,101,52,0.2)' : 'rgba(255,255,255,0.025)',
                      border: active ? '1px solid rgba(59,130,246,0.4)' : done ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                    }}>
                    <span className="font-black shrink-0 w-5 text-right" style={{ color: active ? '#60a5fa' : 'var(--accent)' }}>
                      {c.number}
                    </span>
                    <span className="flex-1 leading-snug" style={{ color: done ? '#86efac' : 'var(--text-primary)' }}>
                      {c.clue}
                    </span>
                    {done && <span className="shrink-0 text-base">✓</span>}
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
