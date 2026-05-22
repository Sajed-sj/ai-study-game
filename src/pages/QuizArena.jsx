import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import { generateExplanation } from '../services/openai';
import { AVATARS } from '../data/avatars';

const ANSWER_TIME = 30; // seconds per question

export default function QuizArena() {
  const navigate = useNavigate();
  const {
    currentQuestions, currentQuestionIndex, quizMode, pdfName,
    player, combo, submitAnswer, nextQuestion, completeQuiz, resetQuiz,
  } = useGameStore();

  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null); // { isCorrect, xpGained, combo }
  const [explanation, setExplanation] = useState('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME);
  const [timerActive, setTimerActive] = useState(true);
  const [showShake, setShowShake] = useState(false);
  const [bossHealth, setBossHealth] = useState(100);
  const [playerPulse, setPlayerPulse] = useState(false);

  const question = currentQuestions[currentQuestionIndex];
  const totalQuestions = currentQuestions.length;
  const isBossMode = quizMode === 'boss';
  const isDailyMode = quizMode === 'daily';
  const avatar = AVATARS[player.avatarId] || AVATARS[0];
  const getXPProgress = useGameStore(s => s.getXPProgress);
  const xpProgress = getXPProgress();

  // Redirect if no quiz loaded
  useEffect(() => {
    if (!question) {
      navigate('/upload');
    }
  }, [question, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || selected !== null || !question) return;
    if (timeLeft <= 0) {
      handleAnswer(-1); // timeout = wrong
      return;
    }
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, timerActive, selected, question]);

  // Reset timer on new question
  useEffect(() => {
    setTimeLeft(ANSWER_TIME);
    setTimerActive(true);
    setSelected(null);
    setResult(null);
    setExplanation('');
    setShowShake(false);
  }, [currentQuestionIndex]);

  const handleAnswer = useCallback(async (idx) => {
    if (selected !== null) return;
    setTimerActive(false);
    setSelected(idx);

    const res = submitAnswer(idx);
    setResult(res);

    if (!res.isCorrect) {
      setShowShake(true);
      setTimeout(() => setShowShake(false), 600);
      setPlayerPulse(true);
      setTimeout(() => setPlayerPulse(false), 500);
      // Update boss health on wrong answers in boss mode
      if (!isBossMode) {
        // Player loses heart - already handled in store
      }
    } else {
      // Boss takes damage on correct answers
      if (isBossMode) {
        const dmg = Math.round(100 / totalQuestions);
        
      }
    }

    // Fetch AI explanation for wrong answers
    if (!res.isCorrect && question) {
      setLoadingExplanation(true);
      try {
        const exp = await generateExplanation(
          question.question,
          question.options[idx] || 'No answer (timeout)',
          question.options[question.correct],
          question.explanation
        );
        setExplanation(exp);
      } catch {
        setExplanation(question.explanation || 'Review this topic in your lesson material.');
      } finally {
        setLoadingExplanation(false);
      }
    } else if (res.isCorrect) {
      setExplanation(question.explanation || '');
    }
  }, [selected, submitAnswer, question, isBossMode, totalQuestions]);

  const handleNext = () => {
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= totalQuestions || player.hearts <= 0) {
      const summary = completeQuiz();
      navigate('/results', { state: summary });
    } else {
      nextQuestion();
    }
  };

  if (!question) return null;

  const timerPercent = (timeLeft / ANSWER_TIME) * 100;
  const timerColor = timeLeft > 15 ? '#00d4ff' : timeLeft > 8 ? '#ffd700' : '#ff006e';
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className={`min-h-screen cyber-grid cyber-gradient relative overflow-hidden ${showShake ? 'animate-shake' : ''}`}>
      {/* Boss mode animated bg */}
      {isBossMode && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent animate-pulse" />
        </div>
      )}

      {/* Top HUD */}
      <div className="relative z-10 border-b border-cyan-500/20" style={{ background: 'rgba(5,5,16,0.95)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Player info */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${playerPulse ? 'scale-75' : ''}`}
              style={{ background: avatar.gradient, boxShadow: `0 0 15px ${avatar.color}66` }}
            >
              {avatar.emoji}
            </div>
            <div>
              <div className="orbitron text-xs text-cyan-400">LVL {player.level}</div>
              {/* XP mini bar */}
              <div className="w-20 bg-gray-800 rounded-full h-1.5 overflow-hidden mt-1">
                <div className="progress-bar h-1.5 rounded-full transition-all duration-500" style={{ width: `${xpProgress.percent}%` }} />
              </div>
            </div>
          </div>

          {/* Combo & Mode */}
          <div className="flex items-center gap-4">
            {combo >= 3 && (
              <div className="orbitron text-xs font-bold px-3 py-1 rounded-full animate-pulse" style={{ background: 'rgba(255,215,0,0.2)', color: '#ffd700', border: '1px solid #ffd70066' }}>
                🔥 {combo}× COMBO
              </div>
            )}
            {isBossMode && <div className="orbitron text-xs font-bold text-red-400 animate-pulse">💀 BOSS MODE</div>}
            {isDailyMode && <div className="orbitron text-xs font-bold text-purple-400">🔥 DAILY ×2 XP</div>}
          </div>

          {/* Hearts */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: player.maxHearts }).map((_, i) => (
              <span key={i} className={`text-xl transition-all duration-500 ${i < player.hearts ? '' : 'opacity-20 grayscale'}`}>❤️</span>
            ))}
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="w-full bg-gray-900 h-1">
          <div
            className="h-1 transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              background: isBossMode ? 'linear-gradient(90deg, #ff006e, #ff4444)' : 'linear-gradient(90deg, #00d4ff, #bf00ff)',
              boxShadow: `0 0 8px ${isBossMode ? '#ff006e' : '#00d4ff'}`,
            }}
          />
        </div>
      </div>

      {/* Boss Health Bar */}
      {isBossMode && (
        <div className="relative z-10 max-w-4xl mx-auto px-4 mt-4">
          <div className="glass-card rounded-xl p-3 border border-red-500/40">
            <div className="flex justify-between items-center mb-1">
              <div className="orbitron text-xs text-red-400 font-bold">💀 FINAL BOSS</div>
              <div className="orbitron text-xs text-red-300">{bossHealth} HP</div>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${bossHealth}%`, background: 'linear-gradient(90deg, #ff006e, #ff4444)', boxShadow: '0 0 10px #ff006e' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Quiz Area */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Question counter & Timer */}
        <div className="flex items-center justify-between mb-4">
          <div className="orbitron text-xs text-gray-400 tracking-widest">
            QUESTION <span className="text-white font-bold">{currentQuestionIndex + 1}</span> / {totalQuestions}
            {question.topic && <span className="ml-3 text-cyan-500/70">· {question.topic}</span>}
          </div>
          {/* Timer */}
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - timerPercent / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', filter: `drop-shadow(0 0 4px ${timerColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center orbitron text-xs font-bold" style={{ color: timerColor }}>
                {timeLeft}
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div
          className="glass-card rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden"
          style={{ border: `1px solid ${isBossMode ? '#ff006e44' : '#00d4ff44'}` }}
        >
          {/* Difficulty badge */}
          <div className="absolute top-4 right-4 text-xs orbitron px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
            {question.difficulty?.toUpperCase() || 'MEDIUM'}
          </div>
          <h2 className="rajdhani text-xl md:text-2xl font-semibold text-white leading-relaxed pr-16">
            {question.question}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {question.options.map((opt, idx) => {
            let borderColor = 'rgba(255,255,255,0.1)';
            let bg = 'rgba(10,10,31,0.8)';
            let textColor = '#e0e0ff';
            let glow = 'none';

            if (selected !== null) {
              if (idx === question.correct) {
                borderColor = '#00ff88';
                bg = 'rgba(0,255,136,0.1)';
                textColor = '#00ff88';
                glow = '0 0 20px rgba(0,255,136,0.3)';
              } else if (idx === selected && !result?.isCorrect) {
                borderColor = '#ff006e';
                bg = 'rgba(255,0,110,0.1)';
                textColor = '#ff006e';
                glow = '0 0 20px rgba(255,0,110,0.3)';
              } else {
                textColor = '#555';
              }
            }

            return (
              <button
                key={idx}
                id={`answer-${idx}`}
                onClick={() => handleAnswer(idx)}
                disabled={selected !== null}
                className="relative p-4 rounded-xl text-left transition-all duration-300 group"
                style={{
                  border: `2px solid ${borderColor}`,
                  background: bg,
                  color: textColor,
                  boxShadow: glow,
                  transform: selected === null ? undefined : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="orbitron text-sm font-bold w-6 shrink-0" style={{ color: borderColor }}>
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span className="rajdhani text-base font-medium leading-snug">{opt}</span>
                </div>
                {/* Hover shimmer */}
                {selected === null && (
                  <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                {/* Correct/Wrong indicators */}
                {selected !== null && idx === question.correct && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">✅</div>
                )}
                {selected !== null && idx === selected && !result?.isCorrect && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">❌</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Section */}
        {selected !== null && (
          <div
            className="glass-card rounded-2xl p-5 mb-6 border"
            style={{ borderColor: result?.isCorrect ? '#00ff8844' : '#ff006e44' }}
          >
            {/* Result header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{result?.isCorrect ? '⚡' : '💔'}</span>
              <div>
                <div className={`orbitron font-bold text-sm ${result?.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {result?.isCorrect ? `CORRECT! +${result.xpGained} XP` : 'WRONG ANSWER'}
                </div>
                {result?.isCorrect && result.combo >= 3 && (
                  <div className="text-xs text-yellow-400 orbitron">🔥 {result.combo}× COMBO MULTIPLIER!</div>
                )}
              </div>
            </div>

            {/* Explanation */}
            {loadingExplanation ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span>AI is analyzing your answer...</span>
              </div>
            ) : explanation ? (
              <p className="text-gray-300 text-sm leading-relaxed">
                🤖 <span className="text-purple-300 font-medium">AI Insight:</span> {explanation}
              </p>
            ) : null}
          </div>
        )}

        {/* Next Button */}
        {selected !== null && (
          <button
            id="next-question-btn"
            onClick={handleNext}
            className="btn-cyber w-full py-4 rounded-2xl orbitron font-bold tracking-wider text-base relative overflow-hidden group"
            style={{
              background: player.hearts <= 0
                ? 'linear-gradient(135deg, #ff006e, #880033)'
                : currentQuestionIndex + 1 >= totalQuestions
                  ? 'linear-gradient(135deg, #ffd700, #ff8800)'
                  : 'linear-gradient(135deg, #00d4ff, #0066ff)',
              color: '#000',
              boxShadow: player.hearts <= 0 ? '0 0 30px rgba(255,0,110,0.4)' : '0 0 30px rgba(0,212,255,0.4)',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {player.hearts <= 0 ? (
                <><span>💀</span> GAME OVER — SEE RESULTS</>
              ) : currentQuestionIndex + 1 >= totalQuestions ? (
                <><span>🏆</span> COMPLETE QUIZ</>
              ) : (
                <><span>→</span> NEXT QUESTION</>
              )}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
          </button>
        )}
      </div>
    </div>
  );
}
