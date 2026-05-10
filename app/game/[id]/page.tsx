'use client';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPuzzle } from '@/lib/puzzles';
import { getSessionId } from '@/lib/session';
import { ClueEntry } from '@/lib/types';
import CrosswordGrid from '@/components/CrosswordGrid';
import StarsBg from '@/components/StarsBg';

const POINTS_PER_WORD_EASY = 10;
const POINTS_PER_WORD_HARD = 20;
const POINTS_PUZZLE_COMPLETE_EASY = 50;
const POINTS_PUZZLE_COMPLETE_HARD = 150;

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const puzzle = getPuzzle(id);
  const [userLetters, setUserLetters] = useState<Record<string, string>>({});
  const [revealedCells] = useState<Set<string>>(new Set());
  const [completedClues, setCompletedClues] = useState<Set<string>>(new Set());
  const [points, setPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [toast, setToast] = useState<{ msg: string; pts: number } | null>(null);
  const [activeClueId, setActiveClueId] = useState<string | null>(null);
  const [puzzleDone, setPuzzleDone] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!puzzle) return;
    const sid = getSessionId();
    fetch(`/api/progress?sessionId=${sid}`)
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

  const saveProgress = useCallback((letters: Record<string, string>, pts: number, completed: string[], lvl: number) => {
    const sid = getSessionId();
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
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
    setTimeout(() => setToast(null), 2500);
  };

  const handleLetterChange = useCallback((key: string, letter: string) => {
    setUserLetters(prev => {
      const next = { ...prev, [key]: letter };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveProgress(next, totalPoints, [], level), 1500);
      return next;
    });
  }, [saveProgress, totalPoints, level]);

  const handleWordComplete = useCallback((clue: ClueEntry) => {
    if (completedClues.has(clue.id)) return;
    setCompletedClues(prev => {
      const next = new Set(prev);
      next.add(clue.id);
      return next;
    });

    const wordPts = puzzle!.difficulty === 'easy' ? POINTS_PER_WORD_EASY : POINTS_PER_WORD_HARD;
    showToast(`✓ ${clue.answer}`, wordPts);
    setPoints(p => p + wordPts);

    setTotalPoints(prev => {
      const newTotal = prev + wordPts;
      const newLevel = Math.floor(newTotal / 100) + 1;
      setLevel(newLevel);

      // Check puzzle complete
      const newCompleted = new Set([...completedClues, clue.id]);
      if (newCompleted.size >= puzzle!.clues.length) {
        const bonus = puzzle!.difficulty === 'easy' ? POINTS_PUZZLE_COMPLETE_EASY : POINTS_PUZZLE_COMPLETE_HARD;
        setTimeout(() => {
          setPuzzleDone(true);
          setTotalPoints(t => {
            const finalTotal = t + bonus;
            const finalLevel = Math.floor(finalTotal / 100) + 1;
            setLevel(finalLevel);
            saveProgress({}, finalTotal, [id], finalLevel);
            return finalTotal;
          });
        }, 500);
      } else {
        saveProgress(userLetters, newTotal, [], newLevel);
      }
      return newTotal;
    });
  }, [completedClues, puzzle, id, saveProgress, userLetters]);

  if (!puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--text-muted)' }}>Puzzle not found</p>
          <button className="btn-primary" onClick={() => router.push('/')}>← Back</button>
        </div>
      </div>
    );
  }

  const diffLabel = puzzle.difficulty === 'easy' ? (puzzle.language === 'de' ? 'Einfach' : 'Easy') : (puzzle.language === 'de' ? 'Schwer' : 'Hard');
  const acrossClues = puzzle.clues.filter(c => c.direction === 'across');
  const downClues = puzzle.clues.filter(c => c.direction === 'down');

  return (
    <div className="relative min-h-screen flex flex-col">
      <StarsBg />
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 card-glass border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}>
            ← {puzzle.language === 'de' ? 'Zurück' : 'Back'}
          </button>
          <div className="text-center">
            <div className="font-black text-sm gradient-text">{puzzle.title}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{diffLabel} · {puzzle.size}×{puzzle.size}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-black text-sm" style={{ color: 'var(--gold)' }}>+{points} pts</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Lv.{level}</div>
            </div>
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', boxShadow: '0 8px 30px rgba(34,197,94,0.4)', animation: 'fadeInUp 0.3s ease-out' }}>
            {toast.msg} <span style={{ color: '#bbf7d0' }}>+{toast.pts} pts</span>
          </div>
        )}

        {/* Puzzle Complete Modal */}
        {puzzleDone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="card-glass rounded-3xl p-10 text-center max-w-sm mx-4" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              <div className="text-6xl mb-4 float-anim">🏆</div>
              <h2 className="text-3xl font-black gradient-text mb-2">{puzzle.language === 'de' ? 'Geschafft!' : 'Puzzle Complete!'}</h2>
              <p className="mb-2" style={{ color: 'var(--text-muted)' }}>{puzzle.language === 'de' ? 'Hervorragende Leistung!' : 'Outstanding work!'}</p>
              <div className="my-6 p-4 rounded-2xl" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
                <div className="text-4xl font-black" style={{ color: 'var(--gold)' }}>+{points + (puzzle.difficulty === 'easy' ? POINTS_PUZZLE_COMPLETE_EASY : POINTS_PUZZLE_COMPLETE_HARD)}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Total Points Earned</div>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1 text-sm" onClick={() => router.push('/')}>Home</button>
                <button className="btn-primary flex-1 text-sm" onClick={() => { setPuzzleDone(false); setUserLetters({}); setCompletedClues(new Set()); setPoints(0); }}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-6xl mx-auto w-full">
          {/* Grid */}
          <div className="flex flex-col items-center">
            <div className="card-glass rounded-2xl p-4">
              <CrosswordGrid
                puzzle={puzzle}
                userLetters={userLetters}
                onLetterChange={handleLetterChange}
                onWordComplete={handleWordComplete}
                revealedCells={revealedCells}
              />
            </div>
            {/* Progress */}
            <div className="mt-4 w-full card-glass rounded-xl p-3">
              <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                <span>{puzzle.language === 'de' ? 'Fortschritt' : 'Progress'}</span>
                <span>{completedClues.size}/{puzzle.clues.length} {puzzle.language === 'de' ? 'Wörter' : 'words'}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(completedClues.size / puzzle.clues.length) * 100}%`, background: 'linear-gradient(90deg, #e94560, #f5a623)' }} />
              </div>
            </div>
          </div>

          {/* Clues */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Across */}
            <div className="card-glass rounded-2xl p-4 flex-1">
              <h3 className="font-bold text-sm mb-3 gradient-text uppercase tracking-wider">
                {puzzle.language === 'de' ? 'Waagerecht' : 'Across'}
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {acrossClues.map(c => (
                  <div key={c.id} className="flex gap-2 text-sm p-2 rounded-lg transition-all"
                    style={{ background: completedClues.has(c.id) ? 'rgba(22,101,52,0.3)' : 'rgba(255,255,255,0.03)', border: completedClues.has(c.id) ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent' }}>
                    <span className="font-bold shrink-0 w-5" style={{ color: 'var(--accent)' }}>{c.number}</span>
                    <span style={{ color: completedClues.has(c.id) ? '#86efac' : 'var(--text-primary)' }}>{c.clue}</span>
                    {completedClues.has(c.id) && <span className="ml-auto shrink-0">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Down */}
            <div className="card-glass rounded-2xl p-4 flex-1">
              <h3 className="font-bold text-sm mb-3 gradient-text uppercase tracking-wider">
                {puzzle.language === 'de' ? 'Senkrecht' : 'Down'}
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {downClues.map(c => (
                  <div key={c.id} className="flex gap-2 text-sm p-2 rounded-lg transition-all"
                    style={{ background: completedClues.has(c.id) ? 'rgba(22,101,52,0.3)' : 'rgba(255,255,255,0.03)', border: completedClues.has(c.id) ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent' }}>
                    <span className="font-bold shrink-0 w-5" style={{ color: 'var(--accent)' }}>{c.number}</span>
                    <span style={{ color: completedClues.has(c.id) ? '#86efac' : 'var(--text-primary)' }}>{c.clue}</span>
                    {completedClues.has(c.id) && <span className="ml-auto shrink-0">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
