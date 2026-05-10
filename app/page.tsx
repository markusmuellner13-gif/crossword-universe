'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import StarsBg from '@/components/StarsBg';
import ScoreDisplay from '@/components/ScoreDisplay';
import { getSessionId } from '@/lib/session';

const PUZZLES = [
  { id: 'en-easy-1', label: 'Simple English', flag: '🇬🇧', diff: 'Easy',     diffDe: 'Easy',     color: '#22c55e', desc: '7×7 · Everyday words',        pts: '50–100' },
  { id: 'en-hard-1', label: 'Advanced English', flag: '🇬🇧', diff: 'Hard',   diffDe: 'Hard',    color: '#e94560', desc: '9×9 · Challenging vocab',      pts: '150–300' },
  { id: 'de-easy-1', label: 'Einfaches Deutsch', flag: '🇩🇪', diff: 'Einfach', diffDe: 'Einfach', color: '#22c55e', desc: '7×7 · Alltägliche Wörter',    pts: '50–100' },
  { id: 'de-hard-1', label: 'Fortgeschrittenes Deutsch', flag: '🇩🇪', diff: 'Schwer', diffDe: 'Schwer', color: '#e94560', desc: '11×11 · Anspruchsvoll', pts: '150–300' },
];

type Filter = 'all' | 'en' | 'de';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [visible, setVisible]   = useState(false);
  const [progress, setProgress] = useState({ totalPoints: 0, level: 1, completedPuzzles: [] as string[] });
  const [filter, setFilter]     = useState<Filter>('all');

  useEffect(() => {
    const sid = getSessionId();
    fetch(`/api/progress?sessionId=${sid}`)
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) {
          setProgress({
            totalPoints: d.total_points ?? 0,
            level: d.level ?? 1,
            completedPuzzles: d.completed_puzzles ?? [],
          });
        }
      })
      .catch(() => {});
  }, []);

  const filtered = PUZZLES.filter(p => filter === 'all' || p.id.startsWith(filter));

  return (
    <>
      {loading && <LoadingScreen onDone={() => { setLoading(false); setTimeout(() => setVisible(true), 50); }} />}

      <div className="relative flex flex-col" style={{
        minHeight: '100dvh',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        paddingTop: 'var(--safe-top)',
        paddingBottom: 'var(--safe-bottom)',
      }}>
        <StarsBg />

        <div className="relative z-10 flex flex-col" style={{ minHeight: '100dvh' }}>
          {/* ── Header ── */}
          <header className="flex items-center justify-between px-4 py-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: 'linear-gradient(135deg, #e94560, #f5a623)' }}>
                ✦
              </div>
              <div>
                <h1 className="text-base font-black tracking-wide leading-none gradient-text">CrossWord Universe</h1>
                <p className="text-xs mt-0.5 leading-none" style={{ color: 'var(--text-muted)' }}>English &amp; Deutsch</p>
              </div>
            </div>
            {/* Total points pill */}
            <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)' }}>
              <span className="text-sm">⭐</span>
              <span className="text-sm font-black" style={{ color: 'var(--gold)' }}>{progress.totalPoints}</span>
            </div>
          </header>

          <main className="flex-1 flex flex-col px-4 pb-6 gap-5 overflow-y-auto">
            {/* Score bar */}
            <div className="fade-in-up">
              <ScoreDisplay
                points={progress.totalPoints}
                level={progress.level}
                completed={progress.completedPuzzles.length}
              />
            </div>

            {/* Hero */}
            <div className="text-center fade-in-up" style={{ animationDelay: '0.08s' }}>
              <div className="float-anim inline-block text-5xl sm:text-6xl mb-3">🧩</div>
              <h2 className="text-2xl sm:text-3xl font-black gradient-text mb-1.5">Choose Your Challenge</h2>
              <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
                Train your brain with crossword puzzles. Earn points &amp; level up!
              </p>
            </div>

            {/* Language filter */}
            <div className="flex gap-2 justify-center fade-in-up" style={{ animationDelay: '0.15s' }}>
              {(['all','en','de'] as Filter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 min-h-[40px]"
                  style={{
                    background: filter === f ? 'linear-gradient(135deg,#e94560,#f5a623)' : 'rgba(42,42,74,0.7)',
                    color: filter === f ? 'white' : 'var(--text-muted)',
                    border: filter === f ? 'none' : '1px solid var(--border)',
                    boxShadow: filter === f ? '0 4px 14px rgba(233,69,96,0.3)' : 'none',
                  }}>
                  {f === 'all' ? '🌍 All' : f === 'en' ? '🇬🇧 EN' : '🇩🇪 DE'}
                </button>
              ))}
            </div>

            {/* Puzzle grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((p, i) => {
                const done = progress.completedPuzzles.includes(p.id);
                return (
                  <button key={p.id}
                    onClick={() => router.push(`/game/${p.id}`)}
                    className="card-glass rounded-2xl p-4 text-left fade-in-up active:scale-95 transition-transform duration-150"
                    style={{
                      animationDelay: `${0.08 * i + 0.2}s`,
                      boxShadow: done ? '0 0 18px rgba(34,197,94,0.18)' : 'none',
                    }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{p.flag}</span>
                        <div>
                          <div className="font-bold text-sm leading-tight">{p.label}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.desc}</div>
                        </div>
                      </div>
                      {done && <span className="text-lg">✅</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }}>
                        {p.diff}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Reward:</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>{p.pts} pts</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>→</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* How to play */}
            <div className="card-glass rounded-2xl p-4 fade-in-up" style={{ animationDelay: '0.45s' }}>
              <h3 className="font-bold text-sm mb-3 gradient-text uppercase tracking-wider">How to Play</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: '👆', t: 'Select', d: 'Tap a white cell' },
                  { icon: '⌨️', t: 'Type', d: 'Enter your answer' },
                  { icon: '⭐', t: 'Score', d: 'Earn points & level up' },
                ].map(h => (
                  <div key={h.t} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-2xl mb-1">{h.icon}</div>
                    <div className="font-semibold text-xs mb-0.5">{h.t}</div>
                    <div className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{h.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
