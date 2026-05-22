import { useEffect, useState } from 'react';

export default function BadgeToast({ badges, onClose }) {
  const [visible, setVisible] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  useEffect(() => {
    if (currentIdx >= badges.length) {
      setVisible(false);
      setTimeout(onClose, 400);
      return;
    }
    const t = setTimeout(() => {
      setCurrentIdx(i => i + 1);
    }, 2800);
    return () => clearTimeout(t);
  }, [currentIdx, badges.length, onClose]);

  const badge = badges[currentIdx];
  if (!badge) return null;

  return (
    <div className="fixed top-6 right-6 z-50">
      <div
        className="glass-card rounded-2xl px-5 py-4 flex items-center gap-4 transition-all duration-500 max-w-xs"
        style={{
          border: `1px solid ${badge.color}88`,
          boxShadow: `0 0 30px ${badge.color}44`,
          transform: visible ? 'translateX(0) scale(1)' : 'translateX(120%) scale(0.8)',
          opacity: visible ? 1 : 0,
          minWidth: 260,
        }}
      >
        {/* Badge icon with glow */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 animate-float"
          style={{ background: `${badge.color}22`, border: `1px solid ${badge.color}66`, filter: `drop-shadow(0 0 8px ${badge.color})` }}
        >
          {badge.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="orbitron text-xs tracking-widest text-gray-400 mb-0.5">🏅 BADGE UNLOCKED</div>
          <div className="orbitron text-sm font-bold mb-0.5" style={{ color: badge.color }}>{badge.name}</div>
          <div className="text-xs text-gray-500 truncate">{badge.description}</div>
        </div>

        {/* Progress dots if multiple badges */}
        {badges.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {badges.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ background: i === currentIdx ? badge.color : 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
