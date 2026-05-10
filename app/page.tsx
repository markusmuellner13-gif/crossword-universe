'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import StarsBg from '@/components/StarsBg';
import ScoreDisplay from '@/components/ScoreDisplay';
import { getSessionId } from '@/lib/session';

const PUZZLES = [
  { id: 'en-easy-1', label: 'Simple English', emoji: '🇬🇧', diff: 'Easy', color: '#22c55e', desc: '7×7 grid · Everyday vocabulary' },
  { id: 'en-hard-1', label: 'Advanced English', emoji: '🇬🇧', diff: 'Hard', color: '#e94560', desc: '9×9 grid · Challenging words' },
  { id: 'de-easy-1', label: 'Einfaches Deutsch', emoji: '🇩🇪', diff: 'Einfach', color: '#22c55e', desc: '7×7 Raster · Alltägliche Wörter' },
  { id: 'de-hard-1', label: 'Fortgeschrittenes Deutsch', emoji: '🇩🇪', diff: 'Schwer', color: '#e94560', desc: '11×11 Raster · Anspruchsvolle Wörter' },
];

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ totalPoints: 0, level: 1, completedPuzzles: [] as string[] });
  const [filter, setFilter] = useState<'all' | 'en' | 'de'>('all');

  useEffect(() => {
    const sid = getSessionId();
    fetch(`/api/progress?sessionId=${sid}`)
      .then(r => r.json())
      .then(d => { if (d && !d.error) setProgress({ totalPoints: d.total_points ?? 0, level: d.level ?? 1, completedPuzzles: d.completed_puzzles ?? [] }); })
      .catch(() => {});
  }, []);

  const filtered = PUZZLES.filter(p => filter === 'all' || p.id.startsWith(filter));

  return (
    <>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      <div className="relative min-h-screen flex flex-col" style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.5s' }}>
        <StarsBg />
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #e94560, #f5a623)' }}>
                ✦
              </div>
              <div>
                <h1 className="text-xl font-black tracking-wide gradient-text">CrossWord Universe</h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>English & Deutsch</p>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center px-4 pb-10">
            {/* Score */}
            <div className="w-full max-w-2xl mb-8 fade-in-up">
              <ScoreDisplay points={progress.totalPoints} level={progress.level} completed={progress.completedPuzzles.length} />
            </div>

            {/* Hero */}
            <div className="text-center mb-10 fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="float-anim inline-block text-7xl mb-4">🧩</div>
              <h2 className="text-4xl font-black mb-3 gradient-text">Choose Your Challenge</h2>
              <p className="text-lg max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                Train your mind with crossword puzzles in English and German. Earn points, level up!
              </p>
            </div>

            {/* Language filter */}
            <div className="flex gap-3 mb-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
              {(['all', 'en', 'de'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200"
                  style={{
                    background: filter === f ? 'linear-gradient(135deg, #e94560, #f5a623)' : 'rgba(42,42,74,0.6)',
                    color: filter === f ? 'white' : 'var(--text-muted)',
                    border: filter === f ? 'none' : '1px solid var(--border)',
                    boxShadow: filter === f ? '0 4px 15px rgba(233,69,96,0.3)' : 'none',
                  }}>
                  {f === 'all' ? '🌍 All' : f === 'en' ? '🇬🇧 English' : '🇩🇪 Deutsch'}
                </button>
              ))}
            </div>

            {/* Puzzle cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
              {filtered.map((p, i) => {
                const done = progress.completedPuzzles.includes(p.id);
                return (
                  <button key={p.id} onClick={() => router.push(`/game/${p.id}`)}
                    className="card-glass rounded-2xl p-6 text-left group hover:scale-105 transition-all duration-300 fade-in-up"
                    style={{ animationDelay: `${0.1 * i + 0.3}s`, boxShadow: done ? '0 0 20px rgba(34,197,94,0.2)' : 'none' }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{p.emoji}</span>
                        <div>
                          <h3 className="font-bold text-base leading-tight">{p.label}</h3>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
                        </div>
                      </div>
                      {done && <span className="text-xl">✅</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}44` }}>
                        {p.diff}
                      </span>
                      <span className="text-sm font-semibold group-hover:translate-x-1 transition-transform"
                        style={{ color: '#e94560' }}>
                        Play →
                      </span>
                    </div>
                    {/* Points badge */}
                    <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Reward:</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>
                        {p.diff === 'Easy' || p.diff === 'Einfach' ? '50–100' : '150–300'} pts
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* How to play */}
            <div className="mt-10 w-full max-w-2xl card-glass rounded-2xl p-6 fade-in-up" style={{ animationDelay: '0.6s' }}>
              <h3 className="font-bold text-lg mb-4 gradient-text">How to Play</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: '👆', title: 'Select a Cell', desc: 'Click or tap any white cell to select it' },
                  { icon: '⌨️', title: 'Type Your Answer', desc: 'Use keyboard or on-screen input to fill in letters' },
                  { icon: '⭐', title: 'Earn Points', desc: 'Complete words and puzzles to earn points and level up' },
                ].map(h => (
                  <div key={h.title} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-3xl mb-2">{h.icon}</div>
                    <div className="font-semibold text-sm mb-1">{h.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{h.desc}</div>
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
