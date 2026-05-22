// src/store/gameStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const LEVELS_XP = Array.from({ length: 50 }, (_, i) => (i + 1) * 100);

const getLevel = (xp) => {
  let level = 1;
  let remaining = xp;
  for (let i = 0; i < LEVELS_XP.length; i++) {
    if (remaining >= LEVELS_XP[i]) {
      remaining -= LEVELS_XP[i];
      level = i + 2;
    } else break;
  }
  return level;
};

const getXPForCurrentLevel = (xp) => {
  let remaining = xp;
  for (let i = 0; i < LEVELS_XP.length; i++) {
    if (remaining >= LEVELS_XP[i]) {
      remaining -= LEVELS_XP[i];
    } else return remaining;
  }
  return remaining;
};

const getXPNeededForNextLevel = (level) => LEVELS_XP[level - 1] || 100;

const ALL_BADGES = [
  { id: 'first_quiz', name: 'First Blood', description: 'Complete your first quiz', icon: '🩸', color: '#ff006e' },
  { id: 'perfect_score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '⭐', color: '#ffd700' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Finish a quiz in record time', icon: '⚡', color: '#00d4ff' },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat the final boss', icon: '💀', color: '#bf00ff' },
  { id: 'daily_warrior', name: 'Daily Warrior', description: 'Complete 7-day streak', icon: '🔥', color: '#ff6600' },
  { id: 'scholar', name: 'Scholar', description: 'Reach Level 10', icon: '📚', color: '#00ff88' },
  { id: 'mastermind', name: 'Master Mind', description: 'Reach Level 25', icon: '🧠', color: '#bf00ff' },
  { id: 'combo_king', name: 'Combo King', description: 'Get a 10-answer combo streak', icon: '👑', color: '#ffd700' },
  { id: 'resilient', name: 'Resilient', description: 'Complete a quiz with 1 heart left', icon: '❤️', color: '#ff006e' },
  { id: 'knowledge_seeker', name: 'Knowledge Seeker', description: 'Complete 10 quizzes', icon: '🔍', color: '#00d4ff' },
  { id: 'upload_master', name: 'Upload Master', description: 'Upload 5 PDFs', icon: '📤', color: '#00ff88' },
  { id: 'nightowl', name: 'Night Owl', description: 'Play after midnight', icon: '🦉', color: '#6b21a8' },
];

const useGameStore = create(
  persist(
    (set, get) => ({
      // Player state
      player: {
        uid: 'demo-user',
        displayName: 'Cyber Player',
        email: '',
        avatarId: 0,
        xp: 0,
        level: 1,
        badges: [],
        streak: { lastDate: null, count: 0 },
        totalQuizzes: 0,
        totalCorrect: 0,
      },

      // Quiz state
      currentQuestions: [],
      currentQuestionIndex: 0,
      userAnswers: [],
      quizStartTime: null,
      quizMode: 'normal', // 'normal' | 'daily' | 'boss'
      pdfName: '',
      combo: 0,
      xpGainedThisQuiz: 0,

      // UI state
      showLevelUp: false,
      levelUpData: null,
      newBadges: [],
      isLoggedIn: false,
      firebaseUser: null,

      // Setters
      setFirebaseUser: (user) => set({ 
        firebaseUser: user, 
        isLoggedIn: !!user,
        player: user ? { ...get().player, uid: user.uid, displayName: user.displayName || get().player.displayName, email: user.email } : get().player
      }),

      updatePlayerFromFirebase: (data) => set({ player: { ...get().player, ...data } }),

      setAvatar: (avatarId) => set(state => ({ player: { ...state.player, avatarId } })),

      // Quiz actions
      startQuiz: (questions, mode = 'normal', pdfName = '') => set(state => ({
  currentQuestions: questions,
  currentQuestionIndex: 0,
  userAnswers: [],
  quizStartTime: Date.now(),
  quizMode: mode,
  pdfName,
  combo: 0,
  xpGainedThisQuiz: 0,
  player: {
    ...state.player,
    hearts: 5,      // ✅ reset لـ 5 في كل اختبار جديد
    maxHearts: 5,   // ✅
  }
})),

      submitAnswer: (answerIndex) => {
        const state = get();
        const question = state.currentQuestions[state.currentQuestionIndex];
        const isCorrect = answerIndex === question.correct;
        const isDailyBonus = state.quizMode === 'daily';
        const isBossMode = state.quizMode === 'boss';

        let xpGained = 0;
        let newCombo = state.combo;
        let newHearts = state.player.hearts;

        if (isCorrect) {
          newCombo += 1;
          const baseXP = isBossMode ? 25 : isDailyBonus ? 20 : 10;
          const comboMultiplier = newCombo >= 10 ? 3 : newCombo >= 5 ? 2 : newCombo >= 3 ? 1.5 : 1;
          xpGained = Math.round(baseXP * comboMultiplier);
        } else {
          newCombo = 0;
          newHearts = Math.max(0, state.player.hearts - 1);
        }

        const newXP = state.player.xp + xpGained;
        const oldLevel = state.player.level;
        const newLevel = getLevel(newXP);
        const didLevelUp = newLevel > oldLevel;

        const newAnswers = [...state.userAnswers, {
          questionId: question.id,
          answerIndex,
          isCorrect,
          xpGained,
          combo: newCombo,
        }];

        set(s => ({
          userAnswers: newAnswers,
          combo: newCombo,
          xpGainedThisQuiz: s.xpGainedThisQuiz + xpGained,
          player: {
            ...s.player,
            xp: newXP,
            level: newLevel,
            hearts: newHearts,
          },
          showLevelUp: didLevelUp,
          levelUpData: didLevelUp ? { oldLevel, newLevel } : s.levelUpData,
        }));

        // Check for combo badge
        if (newCombo >= 10) {
          get().unlockBadge('combo_king');
        }

        return { isCorrect, xpGained, combo: newCombo, didLevelUp, newLevel };
      },

      nextQuestion: () => set(state => ({
        currentQuestionIndex: state.currentQuestionIndex + 1,
        showLevelUp: false,
      })),

      clearLevelUp: () => set({ showLevelUp: false }),

      // Badge system
      unlockBadge: (badgeId) => {
        const state = get();
        if (state.player.badges.includes(badgeId)) return;
        const badge = ALL_BADGES.find(b => b.id === badgeId);
        if (!badge) return;
        set(s => ({
          player: { ...s.player, badges: [...s.player.badges, badgeId] },
          newBadges: [...s.newBadges, badge],
        }));
      },

      clearNewBadges: () => set({ newBadges: [] }),

      checkAndUnlockBadges: () => {
        const state = get();
        const { level, totalQuizzes, badges, hearts } = state.player;
        if (totalQuizzes === 0 && state.userAnswers.length > 0) get().unlockBadge('first_quiz');
        if (level >= 10 && !badges.includes('scholar')) get().unlockBadge('scholar');
        if (level >= 25 && !badges.includes('mastermind')) get().unlockBadge('mastermind');
        if (hearts === 1 && !badges.includes('resilient')) get().unlockBadge('resilient');
      },

      // Streak system
      updateStreak: () => {
        const today = new Date().toDateString();
        const state = get();
        const { lastDate, count } = state.player.streak;
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        let newCount = count;
        if (lastDate === today) return;
        if (lastDate === yesterday) {
          newCount = count + 1;
        } else {
          newCount = 1;
        }

        set(s => ({
          player: {
            ...s.player,
            streak: { lastDate: today, count: newCount },
          }
        }));

        if (newCount >= 7) get().unlockBadge('daily_warrior');
      },

      // Restore hearts (daily bonus)
      restoreHeart: () => set(s => ({
        player: {
          ...s.player,
          hearts: Math.min(s.player.hearts + 1, s.player.maxHearts),
        }
      })),

      completeQuiz: () => {
        const state = get();
        const correctCount = state.userAnswers.filter(a => a.isCorrect).length;
        const totalQuestions = state.currentQuestions.length;
        const isPerfect = correctCount === totalQuestions;
        const isBoss = state.quizMode === 'boss';

        set(s => ({
          player: {
            ...s.player,
            totalQuizzes: s.player.totalQuizzes + 1,
            totalCorrect: s.player.totalCorrect + correctCount,
          }
        }));

        if (isPerfect) get().unlockBadge('perfect_score');
        if (isBoss) get().unlockBadge('boss_slayer');
        if (get().player.totalQuizzes >= 9) get().unlockBadge('knowledge_seeker');
        get().unlockBadge('first_quiz');
        get().updateStreak();
        get().checkAndUnlockBadges();

        // Night owl badge
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 5) get().unlockBadge('nightowl');

        return {
          correctCount,
          totalQuestions,
          score: Math.round((correctCount / totalQuestions) * 100),
          xpGained: state.xpGainedThisQuiz,
          isPerfect,
          passed: correctCount >= Math.ceil(totalQuestions * 0.5),
        };
      },

      // Reset quiz
      resetQuiz: () => set({
        currentQuestions: [],
        currentQuestionIndex: 0,
        userAnswers: [],
        quizStartTime: null,
        combo: 0,
        xpGainedThisQuiz: 0,
      }),

      // Helpers
      getXPProgress: () => {
        const { xp, level } = get().player;
        const currentLevelXP = getXPForCurrentLevel(xp);
        const neededXP = getXPNeededForNextLevel(level);
        return { current: currentLevelXP, needed: neededXP, percent: Math.round((currentLevelXP / neededXP) * 100) };
      },

      getAllBadges: () => ALL_BADGES,

      getLevelTitle: (level) => {
        if (level < 5) return 'Rookie';
        if (level < 10) return 'Student';
        if (level < 15) return 'Scholar';
        if (level < 20) return 'Expert';
        if (level < 25) return 'Master';
        if (level < 35) return 'Elite';
        if (level < 45) return 'Legend';
        return 'Cyber God';
      },
    }),
    {
      name: 'ai-study-game-store',
      partialize: (state) => ({ player: state.player }),
    }
  )
);

export default useGameStore;
