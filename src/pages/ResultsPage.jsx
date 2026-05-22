import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import useGameStore from '../store/gameStore';
import { AVATARS } from '../data/avatars';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { player, currentQuestions, userAnswers, quizMode, pdfName, xpGainedThisQuiz, resetQuiz, getAllBadges } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [animIn, setAnimIn] = useState(false);
  const avatar = AVATARS[player.avatarId] || AVATARS[0];

  // Derive from state or recalculate
  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const totalQuestions = currentQuestions.length || userAnswers.length || 1;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const xpGained = xpGainedThisQuiz || 0;
  const passed = correctCount >= Math.ceil(totalQuestions * 0.5);
  const isPerfect = correctCount === totalQuestions;
  const isBoss = quizMode === 'boss';
  const isDaily = quizMode === 'daily';
  const isGameOver = player.hearts <= 0;

  useEffect(() => {
    setAnimIn(true);
    if (isPerfect || (isBoss && passed)) {
      setTimeout(() => setShowConfetti(true), 300);
      setTimeout(() => setShowConfetti(false), 6000);
    }
    const resize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [isPerfect, isBoss, passed]);

  const resultConfig = (() => {
    if (isGameOver) return {
      title: 'GAME OVER', subtitle: 'You ran out of lives...', icon: '💀',
      color: '#ff006e', bg: 'from-red-900/30 to-transparent', grade: 'F',
    };
    if (isPerfect) return {
      title: 'PERFECT SCORE!', subtitle: 'Absolute neural domination!', icon: '⭐',
      color: '#ffd700', bg: 'from-yellow-500/20 to-transparent', grade: 'S',
    };
    if (isBoss && passed) return {
      title: 'BOSS DEFEATED!', subtitle: 'You conquered the Final Boss!', icon: '🏆',
      color: '#ff006e', bg: 'from-red-800/20 to-transparent', grade: 'S+',
    };
    if (score >= 80) return {
      title: 'VICTORY!', subtitle: 'Excellent performance, warrior!', icon: '🎉',
      color: '#00ff88', bg: 'from-green-900/20 to-transparent', grade: 'A',
    };
    if (score >= 60) return {
      title: 'MISSION COMPLETE', subtitle: 'Solid effort. Keep grinding.', icon: '✅',
      color: '#00d4ff', bg: 'from-cyan-900/20 to-transparent', grade: 'B',
    };
    return {
      title: 'DEFEATED', subtitle: 'You need more training, rookie.', icon: '❌',
      color: '#bf00ff', bg: 'from-purple-900/20 to-transparent', grade: 'C',
    };
  })();

  const allBadges = getAllBadges();
  const newlyUnlocked = player.badges.slice(-3); // show last few earned

  return (
    <div className="min-h-screen cyber-grid cyber-gradient relative overflow-hidden">
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} colors={['#00d4ff', '#bf00ff', '#ffd700', '#00ff88', '#ff006e']} />}

      {/* Animated bg glow */}
      <div className={`fixed inset-0 pointer-events-none bg-gradient-to-b ${resultConfig.bg} opacity-60`} />

      <div className={`relative z-10 max-w-3xl mx-auto px-4 py-10 transition-all duration-700 ${animIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

        {/* Result Header */}
        <div className="text-center mb-10">
          <div
            className="text-7xl md:text-8xl mb-4 inline-block animate-float"
            style={{ filter: `drop-shadow(0 0 20px ${resultConfig.color})` }}
          >
            {resultConfig.icon}
          </div>
          <h1 className="orbitron text-4xl md:text-5xl font-black mb-2" style={{ color: resultConfig.color, textShadow: `0 0 30px ${resultConfig.color}88` }}>
            {resultConfig.title}
          </h1>
          <p className="rajdhani text-lg text-gray-400">{resultConfig.subtitle}</p>
          {pdfName && <p className="text-xs text-gray-600 mt-2 orbitron">{pdfName}</p>}
        </div>

        {/* Score Circle + Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Score Circle */}
          <div className="glass-card rounded-2xl p-8 text-center border" style={{ borderColor: `${resultConfig.color}44` }}>
            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <circle
                  cx="80" cy="80" r="65"
                  fill="none"
                  stroke={resultConfig.color}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 65}`}
                  strokeDashoffset={`${2 * Math.PI * 65 * (1 - score / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1.5s ease', filter: `drop-shadow(0 0 8px ${resultConfig.color})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="orbitron text-4xl font-black text-white">{score}%</span>
                <span className="orbitron text-sm font-bold" style={{ color: resultConfig.color }}>GRADE {resultConfig.grade}</span>
              </div>
            </div>
            <div className="orbitron text-sm text-gray-400">
              {correctCount} / {totalQuestions} correct
            </div>
          </div>

          {/* Stats */}
          <div className="glass-card rounded-2xl p-6 border border-purple-500/20">
            <div className="orbitron text-xs text-purple-400 tracking-widest mb-4">BATTLE STATISTICS</div>
            <div className="space-y-4">
              <StatRow icon="⚡" label="XP EARNED" value={`+${xpGained}`} color="#ffd700" />
              <StatRow icon="📊" label="LEVEL" value={`${player.level}`} color="#00d4ff" />
              <StatRow icon="🔥" label="STREAK" value={`${player.streak.count} DAYS`} color="#ff8800" />
              {isDaily && <StatRow icon="🎯" label="BONUS MODE" value="2× XP ACTIVE" color="#bf00ff" />}
              {isBoss && <StatRow icon="💀" label="BOSS MODE" value="2.5× XP" color="#ff006e" />}
              <StatRow icon="❤️" label="HEARTS LEFT" value={`${player.hearts}/${player.maxHearts}`} color="#ff006e" />
            </div>
          </div>
        </div>

        {/* Answer Breakdown */}
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/20 mb-6">
          <div className="orbitron text-xs text-cyan-400 tracking-widest mb-4">◈ QUESTION BREAKDOWN</div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {currentQuestions.map((q, i) => {
              const ans = userAnswers[i];
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-lg shrink-0">{ans?.isCorrect ? '✅' : '❌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 leading-snug truncate">{q.question}</p>
                    {!ans?.isCorrect && (
                      <p className="text-xs text-green-400 mt-0.5">✓ {q.options[q.correct]}</p>
                    )}
                  </div>
                  <div className="shrink-0 orbitron text-xs text-yellow-400">+{ans?.xpGained || 0}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges Unlocked */}
        {newlyUnlocked.length > 0 && (
          <div className="glass-card rounded-2xl p-5 border border-yellow-500/30 mb-6">
            <div className="orbitron text-xs text-yellow-400 tracking-widest mb-3">🏅 BADGES UNLOCKED</div>
            <div className="flex flex-wrap gap-3">
              {newlyUnlocked.map(bid => {
                const badge = getAllBadges().find(b => b.id === bid);
                if (!badge) return null;
                return (
                  <div key={bid} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${badge.color}22`, border: `1px solid ${badge.color}66` }}>
                    <span className="text-xl">{badge.icon}</span>
                    <div>
                      <div className="orbitron text-xs font-bold" style={{ color: badge.color }}>{badge.name}</div>
                      <div className="text-xs text-gray-500">{badge.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="play-again-btn"
            onClick={() => { resetQuiz(); navigate('/upload'); }}
            className="btn-cyber flex-1 py-4 rounded-xl orbitron text-sm font-bold relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', color: '#000', boxShadow: '0 0 25px rgba(0,212,255,0.3)' }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">⚔️ PLAY AGAIN</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
          </button>
          <button
            id="profile-btn"
            onClick={() => navigate('/profile')}
            className="btn-cyber flex-1 py-4 rounded-xl orbitron text-sm font-bold border"
            style={{ background: 'rgba(191,0,255,0.1)', border: '1px solid #bf00ff', color: '#bf00ff' }}
          >
            👤 MY PROFILE
          </button>
          <button
            id="home-btn"
            onClick={() => { resetQuiz(); navigate('/'); }}
            className="btn-cyber flex-1 py-4 rounded-xl orbitron text-sm font-bold border border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200 transition-all"
          >
            🏠 HOME
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <span>{icon}</span>
        <span className="orbitron text-xs">{label}</span>
      </div>
      <span className="orbitron text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
