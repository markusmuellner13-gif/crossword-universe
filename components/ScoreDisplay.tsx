'use client';

interface Props {
  points: number;
  level: number;
  completed: number;
}

export default function ScoreDisplay({ points, level, completed }: Props) {
  const pointsForNextLevel = level * 100;
  const progressPct = Math.min((points % pointsForNextLevel) / pointsForNextLevel * 100, 100);

  return (
    <div className="card-glass rounded-2xl p-4 flex items-center gap-6">
      <div className="text-center">
        <div className="text-2xl font-black gradient-text">{points}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Points</div>
      </div>
      <div className="w-px h-10" style={{ background: 'var(--border)' }} />
      <div className="text-center">
        <div className="text-2xl font-black" style={{ color: 'var(--gold)' }}>Lv.{level}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Level</div>
      </div>
      <div className="w-px h-10" style={{ background: 'var(--border)' }} />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
          <span>XP</span>
          <span>{points % pointsForNextLevel}/{pointsForNextLevel}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #e94560, #f5a623)' }} />
        </div>
      </div>
      <div className="w-px h-10" style={{ background: 'var(--border)' }} />
      <div className="text-center">
        <div className="text-2xl font-black" style={{ color: 'var(--correct)' }}>{completed}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Done</div>
      </div>
    </div>
  );
}
