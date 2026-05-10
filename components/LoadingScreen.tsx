'use client';
import { useEffect, useState } from 'react';

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => { setFadeOut(true); setTimeout(onDone, 500); }, 300);
          return 100;
        }
        return p + Math.random() * 8 + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onDone]);

  const letters = ['C','R','O','S','S','W','O','R','D'];

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #16213e 50%, #0f3460 100%)' }}>

      {/* Grid animation */}
      <div className="relative mb-10">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="w-14 h-14 rounded-lg flex items-center justify-center font-black text-xl"
              style={{
                background: i % 3 === 1 || Math.floor(i / 3) === 1
                  ? 'linear-gradient(135deg, #e94560, #f5a623)'
                  : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(233,69,96,0.3)',
                animation: `fadeInUp 0.4s ease-out ${i * 0.06}s both`,
                color: i % 3 === 1 || Math.floor(i / 3) === 1 ? 'white' : 'rgba(233,69,96,0.5)',
              }}>
              {letters[i]}
            </div>
          ))}
        </div>

        {/* Spinning ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-52 h-52 rounded-full spin-slow" style={{ border: '2px solid transparent', borderTopColor: '#e94560', borderRightColor: '#f5a623' }} />
        </div>
      </div>

      <h1 className="text-4xl font-black gradient-text mb-2 tracking-wide">CrossWord Universe</h1>
      <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>English & Deutsch</p>

      {/* Progress bar */}
      <div className="w-72 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${Math.min(progress, 100)}%`,
            background: 'linear-gradient(90deg, #e94560, #f5a623)',
            boxShadow: '0 0 12px rgba(233,69,96,0.6)',
          }} />
      </div>
      <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        {Math.round(Math.min(progress, 100))}%
      </p>
    </div>
  );
}
