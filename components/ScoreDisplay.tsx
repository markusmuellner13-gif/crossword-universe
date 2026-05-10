'use client';

export default function ScoreDisplay({ points, level, completed }: { points: number; level: number; completed: number }) {
  const levelPts = level * 100;
  const pct = Math.min(((points % levelPts) / levelPts) * 100, 100);

  return (
    <div className="card-glass rounded-2xl px-4 py-3 flex items-center gap-3">
      {/* Points */}
      <div className="text-center shrink-0">
        <div className="text-xl font-black gradient-text leading-none">{points}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Points</div>
      </div>

      <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />

      {/* Level */}
      <div className="text-center shrink-0">
        <div className="text-xl font-black leading-none" style={{ color: 'var(--gold)' }}>Lv.{level}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Level</div>
      </div>

      <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />

      {/* XP bar */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
          <span>XP</span>
          <span>{points % levelPts}/{levelPts}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#e94560,#f5a623)' }} />
        </div>
      </div>

      <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />

      {/* Completed */}
      <div className="text-center shrink-0">
        <div className="text-xl font-black leading-none" style={{ color: 'var(--correct)' }}>{completed}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Done</div>
      </div>
    </div>
  );
}
