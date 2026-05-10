'use client';
import { useMemo } from 'react';

export default function StarsBg() {
  const stars = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.6 + 0.2,
    })), []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          top: `${s.top}%`, left: `${s.left}%`,
          width: s.size, height: s.size,
          '--d': `${s.duration}s`, '--o': s.opacity,
          animationDelay: `${s.delay}s`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}
