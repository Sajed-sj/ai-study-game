import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import { AVATARS } from '../data/avatars';

export default function ProfilePage() {
  const navigate = useNavigate();

  // ✅ FIXED ZUSTAND SELECTORS
  const player = useGameStore(state => state.player);
  const setAvatar = useGameStore(state => state.setAvatar);
  const getAllBadges = useGameStore(state => state.getAllBadges);

  const [activeTab, setActiveTab] = useState('stats');

  const avatar = AVATARS[player.avatarId] || AVATARS[0];

  // ✅ SAFE XP PROGRESS
  const currentXP = player.xp || 0;
  const currentLevelXP = (player.level - 1) * 100;
  const nextLevelXP = player.level * 100;

  const xpProgress = {
    current: currentXP - currentLevelXP,
    needed: nextLevelXP - currentLevelXP,
    percent: Math.max(
      0,
      Math.min(
        100,
        ((currentXP - currentLevelXP) /
          (nextLevelXP - currentLevelXP)) *
          100
      )
    ),
  };

  // ✅ SAFE LEVEL TITLE
  const getLevelTitle = level => {
    if (level >= 50) return 'LEGEND';
    if (level >= 35) return 'MASTER';
    if (level >= 25) return 'ELITE';
    if (level >= 15) return 'PRO';
    if (level >= 10) return 'ADVANCED';
    if (level >= 5) return 'SKILLED';

    return 'ROOKIE';
  };

  const levelTitle = getLevelTitle(player.level);

  const allBadges = getAllBadges();

  const accuracy =
    player.totalQuizzes > 0
      ? Math.round(
          (player.totalCorrect / (player.totalQuizzes * 10)) * 100
        )
      : 0;

  const STATS = [
    {
      label: 'Total XP',
      value: player.xp.toLocaleString(),
      icon: '⚡',
      color: '#ffd700',
    },
    {
      label: 'Level',
      value: player.level,
      icon: '📊',
      color: '#00d4ff',
    },
    {
      label: 'Quizzes Done',
      value: player.totalQuizzes,
      icon: '🎯',
      color: '#bf00ff',
    },
    {
      label: 'Correct Answers',
      value: player.totalCorrect,
      icon: '✅',
      color: '#00ff88',
    },
    {
      label: 'Accuracy',
      value: `${accuracy}%`,
      icon: '🎓',
      color: '#00d4ff',
    },
    {
      label: 'Daily Streak',
      value: `${player.streak.count} days`,
      icon: '🔥',
      color: '#ff8800',
    },
    {
      label: 'Badges',
      value: `${player.badges.length}/${allBadges.length}`,
      icon: '🏅',
      color: '#ffd700',
    },
  ];

  return (
    <div className="min-h-screen cyber-grid cyber-gradient text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-cyan-400"
        >
          ← HOME
        </button>

        <h1 className="orbitron text-cyan-400 font-bold">
          PLAYER PROFILE
        </h1>

        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold"
        >
          PLAY
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* PROFILE CARD */}
        <div className="glass-card rounded-3xl p-8 border border-cyan-500/20 mb-8">

          <div className="flex flex-col md:flex-row items-center gap-6">

            {/* AVATAR */}
            <div
              className="w-28 h-28 rounded-2xl flex items-center justify-center text-6xl"
              style={{
                background: avatar.gradient,
                boxShadow: `0 0 30px ${avatar.color}66`,
              }}
            >
              {avatar.emoji}
            </div>

            {/* INFO */}
            <div className="flex-1">

              <div className="text-sm text-gray-400 mb-1">
                {levelTitle}
              </div>

              <h2 className="text-3xl font-bold mb-2">
                {player.displayName}
              </h2>

              {/* XP BAR */}
              <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden mb-2">
                <div
                  className="h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${xpProgress.percent}%`,
                    background:
                      'linear-gradient(90deg, #00d4ff, #bf00ff)',
                  }}
                />
              </div>

              <div className="text-sm text-gray-400">
                {xpProgress.current} / {xpProgress.needed} XP
              </div>
            </div>

            {/* HEARTS */}
            <div className="flex gap-2">
              {Array.from({ length: player.maxHearts }).map((_, i) => (
                <span
                  key={i}
                  className={`text-3xl ${
                    i < player.hearts
                      ? ''
                      : 'opacity-20 grayscale'
                  }`}
                >
                  ❤️
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-3 mb-8">

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'stats'
                ? 'bg-cyan-500 text-black'
                : 'bg-gray-900 text-gray-400'
            }`}
          >
            📊 STATS
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'badges'
                ? 'bg-cyan-500 text-black'
                : 'bg-gray-900 text-gray-400'
            }`}
          >
            🏅 BADGES
          </button>

          <button
            onClick={() => setActiveTab('avatars')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'avatars'
                ? 'bg-cyan-500 text-black'
                : 'bg-gray-900 text-gray-400'
            }`}
          >
            👾 AVATARS
          </button>
        </div>

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {STATS.map((stat, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-5 text-center border"
                style={{
                  borderColor: `${stat.color}33`,
                }}
              >
                <div className="text-3xl mb-2">
                  {stat.icon}
                </div>

                <div
                  className="text-2xl font-black"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>

                <div className="text-sm text-gray-500 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BADGES TAB */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {allBadges.map(badge => {
              const unlocked = player.badges.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className="glass-card rounded-2xl p-5 border"
                  style={{
                    opacity: unlocked ? 1 : 0.3,
                    borderColor: unlocked
                      ? `${badge.color}66`
                      : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="text-4xl mb-3">
                    {badge.icon}
                  </div>

                  <div
                    className="font-bold mb-2"
                    style={{
                      color: unlocked
                        ? badge.color
                        : '#555',
                    }}
                  >
                    {badge.name}
                  </div>

                  <p className="text-sm text-gray-400">
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* AVATARS TAB */}
        {activeTab === 'avatars' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {AVATARS.map(av => {
              const unlocked =
                player.level >= av.unlockLevel;

              const selected =
                player.avatarId === av.id;

              return (
                <button
                  key={av.id}
                  onClick={() =>
                    unlocked && setAvatar(av.id)
                  }
                  disabled={!unlocked}
                  className="rounded-2xl p-5 transition-all border"
                  style={{
                    border: selected
                      ? `2px solid ${av.color}`
                      : '1px solid rgba(255,255,255,0.08)',

                    opacity: unlocked ? 1 : 0.3,

                    background: 'rgba(10,10,31,0.7)',
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl mx-auto mb-3"
                    style={{
                      background: av.gradient,
                    }}
                  >
                    {av.emoji}
                  </div>

                  <div
                    className="font-bold mb-1"
                    style={{ color: av.color }}
                  >
                    {av.name}
                  </div>

                  <div className="text-xs text-gray-500">
                    {unlocked
                      ? 'UNLOCKED'
                      : `LVL ${av.unlockLevel}`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}