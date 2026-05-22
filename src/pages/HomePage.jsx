import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import { AVATARS } from '../data/avatars';
import { signInWithGoogle, signOutUser } from '../services/firebase';

export default function HomePage() {
  const navigate = useNavigate();
  const { player, isLoggedIn, setFirebaseUser, getAllBadges } = useGameStore();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [particles, setParticles] = useState([]);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const avatar = AVATARS[player.avatarId] || AVATARS[0];
  const allBadges = getAllBadges();
  const xpProgress = {
  percent: player.xp % 100,
  current: player.xp % 100,
  needed: 100
};
  const levelTitle = useGameStore(state => state.levelTitle);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      color: Math.random() > 0.5 ? '#00d4ff' : '#bf00ff',
      alpha: Math.random() * 0.6 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) setFirebaseUser(user);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen cyber-grid cyber-gradient relative overflow-hidden">
      <canvas ref={canvasRef} className="particles" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4ff, #bf00ff)' }}>
            <span className="text-xl">🧠</span>
          </div>
          <span className="orbitron text-xl font-black neon-text-blue tracking-widest">AI STUDY GAME</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 hover:scale-105">
            <span className="text-xl">{avatar.emoji}</span>
            <span className="text-sm rajdhani font-semibold text-cyan-300">{player.displayName}</span>
          </button>
          {!isLoggedIn ? (
            <button onClick={handleGoogleSignIn} className="btn-cyber px-4 py-2 rounded-lg text-sm" style={{ background: 'linear-gradient(135deg, #00d4ff33, #bf00ff33)', border: '1px solid #00d4ff', color: '#00d4ff' }}>
              SIGN IN
            </button>
          ) : (
            <button onClick={() => { signOutUser(); setFirebaseUser(null); }} className="px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500/50 transition-all">
              LOGOUT
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-16 pb-10 px-4 text-center">
        {/* Glowing title */}
        <div className="mb-2 text-xs orbitron tracking-[0.4em] text-cyan-400 opacity-70">NEURAL LEARNING PROTOCOL v2.0</div>
        <h1 className="orbitron text-5xl md:text-7xl font-black mb-4 leading-tight">
          <span className="holographic">AI STUDY</span>
          <br />
          <span className="text-white" style={{ textShadow: '0 0 40px rgba(191,0,255,0.5)' }}>GAME</span>
        </h1>
        <p className="rajdhani text-lg md:text-xl text-gray-300 max-w-xl mb-10 leading-relaxed">
          Upload your PDF lessons. Let AI forge your quiz arena.<br />
          Battle questions. Level up. Conquer the Final Boss.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button
            id="start-quiz-btn"
            onClick={() => navigate('/upload')}
            className="btn-cyber px-8 py-4 rounded-xl text-base font-bold relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', color: '#000', boxShadow: '0 0 30px rgba(0,212,255,0.4)' }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <span>⚔️</span> START QUIZ ARENA
            </span>
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
          </button>
          <button
            id="daily-challenge-btn"
            onClick={() => navigate('/upload?mode=daily')}
            className="btn-cyber px-8 py-4 rounded-xl text-base font-bold border"
            style={{ background: 'rgba(191,0,255,0.1)', border: '1px solid #bf00ff', color: '#bf00ff', boxShadow: '0 0 20px rgba(191,0,255,0.2)' }}
          >
            <span className="flex items-center gap-2">🔥 DAILY CHALLENGE</span>
          </button>
          <button
            id="boss-mode-btn"
            onClick={() => navigate('/upload?mode=boss')}
            className="btn-cyber px-8 py-4 rounded-xl text-base font-bold border"
            style={{ background: 'rgba(255,0,110,0.1)', border: '1px solid #ff006e', color: '#ff006e', boxShadow: '0 0 20px rgba(255,0,110,0.2)' }}
          >
            <span className="flex items-center gap-2">💀 FINAL BOSS</span>
          </button>
        </div>

        {/* Player Stats Card */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Avatar & Level */}
          <div className="glass-card rounded-2xl p-6 neon-border-blue text-center relative overflow-hidden group cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-3 animate-float"
              style={{ background: avatar.gradient, boxShadow: `0 0 30px ${avatar.color}66` }}
            >
              {avatar.emoji}
            </div>
            <div className="orbitron text-sm font-bold text-cyan-300 mb-1">{avatar.name}</div>
            <div className="text-xs text-gray-400 mb-3">{levelTitle}</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="orbitron text-2xl font-black text-white">LVL {player.level}</span>
            </div>
            {/* XP Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="progress-bar h-2 rounded-full transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{xpProgress.current} / {xpProgress.needed} XP</div>
          </div>

          {/* Stats */}
          <div className="glass-card rounded-2xl p-6 border border-purple-500/30">
            <div className="orbitron text-xs text-purple-400 tracking-widest mb-4">COMBAT STATS</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total XP</span>
                <span className="orbitron text-cyan-300 font-bold">{player.xp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Quizzes</span>
                <span className="orbitron text-purple-300 font-bold">{player.totalQuizzes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Correct</span>
                <span className="orbitron text-green-300 font-bold">{player.totalCorrect}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Accuracy</span>
                <span className="orbitron text-yellow-300 font-bold">
                  {player.totalQuizzes > 0 ? Math.round((player.totalCorrect / (player.totalQuizzes * 10)) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Streak 🔥</span>
                <span className="orbitron text-orange-400 font-bold">{player.streak.count} days</span>
              </div>
            </div>
          </div>

          {/* Hearts & Badges */}
          <div className="glass-card rounded-2xl p-6 border border-pink-500/30">
            <div className="orbitron text-xs text-pink-400 tracking-widest mb-4">VITALS & BADGES</div>
            {/* Hearts */}
            <div className="flex gap-2 justify-center mb-4">
              {Array.from({ length: player.maxHearts }).map((_, i) => (
                <span key={i} className={`text-3xl transition-all duration-300 ${i < player.hearts ? 'animate-pulse-neon' : 'opacity-20 grayscale'}`}>
                  ❤️
                </span>
              ))}
            </div>
            <div className="text-center text-xs text-gray-400 mb-4">{player.hearts}/{player.maxHearts} Hearts</div>
            {/* Recent Badges */}
            <div className="orbitron text-xs text-gray-500 mb-2">BADGES ({player.badges.length}/{allBadges.length})</div>
            <div className="flex flex-wrap gap-1 justify-center">
              {allBadges.slice(0, 8).map(badge => (
                <span
                  key={badge.id}
                  title={badge.name}
                  className={`text-xl transition-all duration-300 ${player.badges.includes(badge.id) ? 'badge-glow' : 'opacity-20 grayscale'}`}
                  style={{ color: badge.color }}
                >
                  {badge.icon}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Game Modes */}
        <div className="w-full max-w-4xl">
          <div className="orbitron text-sm text-gray-400 tracking-widest mb-4 text-left">◈ SELECT GAME MODE</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'normal-mode',
                title: 'STUDY MODE',
                icon: '📚',
                desc: 'Upload any PDF and generate a custom 10-question quiz. Perfect for studying.',
                color: '#00d4ff',
                mode: '/upload',
                tag: 'STANDARD',
              },
              {
                id: 'daily-mode',
                title: 'DAILY CHALLENGE',
                icon: '🔥',
                desc: 'Special daily quiz with bonus XP multipliers. New challenge every day!',
                color: '#bf00ff',
                mode: '/upload?mode=daily',
                tag: '2× XP',
              },
              {
                id: 'boss-mode',
                title: 'FINAL BOSS',
                icon: '💀',
                desc: 'Extreme difficulty. 15 brutal questions. Only legends survive.',
                color: '#ff006e',
                mode: '/upload?mode=boss',
                tag: 'EXTREME',
              },
            ].map(m => (
              <button
                key={m.id}
                id={m.id}
                onClick={() => navigate(m.mode)}
                className="glass-card rounded-2xl p-5 text-left hover:scale-105 transition-all duration-300 group relative overflow-hidden border border-transparent hover:border-current"
                style={{ '--tw-border-opacity': 1, borderColor: `${m.color}44`, color: m.color }}
              >
                <div className="absolute top-3 right-3 text-xs orbitron font-bold px-2 py-0.5 rounded-full" style={{ background: `${m.color}22`, color: m.color }}>
                  {m.tag}
                </div>
                <span className="text-3xl mb-3 block">{m.icon}</span>
                <div className="orbitron text-sm font-bold mb-2">{m.title}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{m.desc}</p>
                <div className="mt-4 text-xs orbitron flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  ENTER ARENA <span>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-xs text-gray-600 orbitron tracking-widest">
          AI STUDY GAME © 2026 · NEURAL LEARNING PROTOCOL
        </div>
      </div>
    </div>
  );
}
