import { useEffect, useState } from 'react';
import useGameStore from '../store/gameStore';

export default function LevelUpOverlay({ data, onClose }) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState([]);
  const levelTitle = useGameStore(s => s.getLevelTitle(data.newLevel));

  useEffect(() => {
    // Generate burst particles
    setParticles(Array.from({ length: 24 }, (_, i) => ({
      id: i,
      angle: (i / 24) * 360,
      color: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#bf00ff' : '#ffd700',
      size: Math.random() * 6 + 4,
      dist: Math.random() * 120 + 80,
    })));
    setTimeout(() => setVisible(true), 50);
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 400); }, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={() => { setVisible(false); setTimeout(onClose, 400); }}
    >
      <div
        className="relative text-center transition-all duration-500"
        style={{
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(40px)',
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Burst particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              top: '50%',
              left: '50%',
              transform: visible
                ? `translate(-50%, -50%) rotate(${p.angle}deg) translateY(-${p.dist}px)`
                : `translate(-50%, -50%)`,
              transition: `transform 0.8s cubic-bezier(0.2, 0.8, 0.3, 1) ${p.id * 10}ms, opacity 0.8s ease`,
              opacity: visible ? 0.8 : 0,
            }}
          />
        ))}

        {/* Main Card */}
        <div
          className="relative glass-card rounded-3xl px-16 py-10 border"
          style={{
            border: '2px solid #ffd700',
            boxShadow: '0 0 60px rgba(255,215,0,0.4), 0 0 120px rgba(0,212,255,0.2)',
            minWidth: 320,
          }}
        >
          {/* Shimmer top bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl animate-gradient" style={{ background: 'linear-gradient(90deg, #00d4ff, #bf00ff, #ffd700, #00d4ff)', backgroundSize: '200% 100%' }} />

          <div className="text-6xl mb-4 animate-float" style={{ filter: 'drop-shadow(0 0 20px #ffd700)' }}>⬆️</div>

          <div className="orbitron text-sm tracking-[0.4em] text-yellow-400 mb-2">LEVEL UP!</div>

          <div className="orbitron text-7xl font-black mb-2" style={{ color: '#ffd700', textShadow: '0 0 30px rgba(255,215,0,0.8)' }}>
            {data.newLevel}
          </div>

          <div className="orbitron text-xl font-bold text-white mb-1">{levelTitle}</div>
          <div className="text-sm text-gray-400">
            {data.oldLevel} → <span className="text-yellow-400 font-bold">{data.newLevel}</span>
          </div>

          <div className="mt-5 text-xs text-gray-500 orbitron tracking-widest">TAP TO CONTINUE</div>
        </div>
      </div>
    </div>
  );
}
