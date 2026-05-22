import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import useGameStore from '../store/gameStore';
import { extractTextFromPDF } from '../services/pdfParser';
import { generateQuizFromText } from '../services/openai';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'ROOKIE', icon: '🌱', color: '#00ff88', desc: 'Simple recall questions' },
  { value: 'medium', label: 'WARRIOR', icon: '⚔️', color: '#00d4ff', desc: 'Balanced challenge' },
  { value: 'hard', label: 'ELITE', icon: '🔥', color: '#bf00ff', desc: 'Deep analysis required' },
  { value: 'boss', label: 'BOSS', icon: '💀', color: '#ff006e', desc: 'Extreme difficulty' },
];

const QUESTION_OPTIONS = [5, 10, 15, 20];

export default function UploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryMode = searchParams.get('mode') || 'normal';
  const { startQuiz, player } = useGameStore();

  const [file, setFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [difficulty, setDifficulty] = useState(queryMode === 'boss' ? 'boss' : queryMode === 'daily' ? 'hard' : 'medium');
  const [numQuestions, setNumQuestions] = useState(queryMode === 'boss' ? 15 : 10);
  const [parseProgress, setParseProgress] = useState(0);
  const [phase, setPhase] = useState('upload'); // upload | parsing | generating | ready
  const [error, setError] = useState('');

  const onDrop = useCallback(async (accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setError('');
    setPhase('parsing');
    setParseProgress(0);
    try {
      const result = await extractTextFromPDF(f, setParseProgress);
      setPdfData(result);
      setPhase('ready');
    } catch (e) {
      setError(e.message);
      setPhase('upload');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: phase !== 'upload' && phase !== 'ready',
  });

  const handleGenerate = async () => {
    if (!pdfData) return;
    setPhase('generating');
    setError('');
    try {
      const questions = await generateQuizFromText(pdfData.text, numQuestions, difficulty);
      const mode = queryMode === 'boss' ? 'boss' : queryMode === 'daily' ? 'daily' : 'normal';
      startQuiz(questions, mode, file.name);
      navigate('/quiz');
    } catch (e) {
      setError('Failed to generate questions. Please try again.');
      setPhase('ready');
    }
  };

  const modeConfig = {
    normal: { label: 'STUDY MODE', color: '#00d4ff', icon: '📚' },
    daily: { label: 'DAILY CHALLENGE', color: '#bf00ff', icon: '🔥' },
    boss: { label: 'FINAL BOSS MODE', color: '#ff006e', icon: '💀' },
  }[queryMode] || { label: 'STUDY MODE', color: '#00d4ff', icon: '📚' };

  return (
    <div className="min-h-screen cyber-grid cyber-gradient relative overflow-hidden">
      {/* Animated corner decorations */}
      <div className="fixed top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-500/30 pointer-events-none" />
      <div className="fixed top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-cyan-500/30 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-purple-500/30 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-purple-500/30 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-cyan-500/20">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span className="text-sm rajdhani">BACK TO BASE</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{modeConfig.icon}</span>
          <span className="orbitron text-sm font-bold" style={{ color: modeConfig.color }}>{modeConfig.label}</span>
        </div>
        {/* ✅ حذفنا القلوب من هنا */}
        <div className="w-24" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="orbitron text-xs tracking-widest text-gray-500 mb-2">PHASE 01 · KNOWLEDGE UPLOAD</div>
          <h1 className="orbitron text-3xl md:text-4xl font-black text-white mb-3">
            UPLOAD YOUR <span className="neon-text-blue">LESSON</span>
          </h1>
          <p className="rajdhani text-gray-400">Upload a PDF and our AI will forge battle-ready quiz questions</p>
        </div>

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          id="pdf-dropzone"
          className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 mb-6 ${
            isDragActive ? 'border-cyan-400 bg-cyan-500/10 scale-102' : 
            phase === 'ready' ? 'border-green-500/60 bg-green-500/5' :
            'border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/5'
          }`}
          style={{ background: isDragActive ? 'rgba(0,212,255,0.08)' : 'rgba(10,10,31,0.6)' }}
        >
          <input {...getInputProps()} />

          {phase === 'upload' && (
            <>
              <div className="text-5xl mb-4 animate-float">📄</div>
              <div className="orbitron text-lg font-bold text-white mb-2">
                {isDragActive ? 'DROP IT!' : 'DROP YOUR PDF HERE'}
              </div>
              <p className="text-gray-400 text-sm">or click to browse · PDF files only</p>
            </>
          )}

          {phase === 'parsing' && (
            <div className="space-y-4">
              <div className="text-4xl animate-spin">⚙️</div>
              <div className="orbitron text-sm text-cyan-400">PARSING NEURAL DATA...</div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden max-w-xs mx-auto">
                <div className="progress-bar h-3 rounded-full transition-all duration-300" style={{ width: `${parseProgress}%` }} />
              </div>
              <div className="text-xs text-gray-500">{parseProgress}% complete</div>
            </div>
          )}

          {phase === 'generating' && (
            <div className="space-y-4">
              <div className="text-4xl">🤖</div>
              <div className="orbitron text-sm text-purple-400 cursor-blink">AI IS FORGING YOUR QUIZ</div>
              <div className="flex justify-center gap-1">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          )}

          {phase === 'ready' && pdfData && (
            <div className="space-y-2">
              <div className="text-4xl">✅</div>
              <div className="orbitron text-sm text-green-400">{file?.name}</div>
              <div className="flex justify-center gap-6 text-xs text-gray-500">
                <span>📄 {pdfData.pages} pages</span>
                <span>📝 {pdfData.wordCount.toLocaleString()} words</span>
              </div>
              <div className="text-xs text-gray-400">Click or drag to change file</div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 text-sm text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Settings */}
        {(phase === 'ready' || phase === 'generating') && (
          <div className="space-y-6 mb-8">
            {/* Difficulty */}
            <div className="glass-card rounded-2xl p-5 border border-cyan-500/20">
              <div className="orbitron text-xs text-gray-400 tracking-widest mb-4">◈ DIFFICULTY LEVEL</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DIFFICULTY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    id={`diff-${opt.value}`}
                    onClick={() => setDifficulty(opt.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all duration-300 ${difficulty === opt.value ? 'scale-105' : 'opacity-60 hover:opacity-80'}`}
                    style={{
                      borderColor: difficulty === opt.value ? opt.color : 'rgba(255,255,255,0.1)',
                      background: difficulty === opt.value ? `${opt.color}22` : 'rgba(10,10,31,0.8)',
                      boxShadow: difficulty === opt.value ? `0 0 15px ${opt.color}44` : 'none',
                    }}
                  >
                    <div className="text-xl mb-1">{opt.icon}</div>
                    <div className="orbitron text-xs font-bold" style={{ color: difficulty === opt.value ? opt.color : '#888' }}>{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-1 hidden md:block">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of questions */}
            <div className="glass-card rounded-2xl p-5 border border-purple-500/20">
              <div className="orbitron text-xs text-gray-400 tracking-widest mb-4">◈ NUMBER OF QUESTIONS</div>
              <div className="flex gap-3">
                {QUESTION_OPTIONS.map(n => (
                  <button
                    key={n}
                    id={`q-${n}`}
                    onClick={() => setNumQuestions(n)}
                    className={`flex-1 py-3 rounded-xl border-2 orbitron text-sm font-bold transition-all duration-300 ${numQuestions === n ? 'scale-105' : 'opacity-50 hover:opacity-70'}`}
                    style={{
                      borderColor: numQuestions === n ? '#00d4ff' : 'rgba(255,255,255,0.1)',
                      background: numQuestions === n ? 'rgba(0,212,255,0.15)' : 'rgba(10,10,31,0.8)',
                      color: numQuestions === n ? '#00d4ff' : '#888',
                      boxShadow: numQuestions === n ? '0 0 15px rgba(0,212,255,0.3)' : 'none',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        {phase === 'ready' && (
          <button
            id="generate-quiz-btn"
            onClick={handleGenerate}
            className="btn-cyber w-full py-5 rounded-2xl orbitron text-lg font-black tracking-wider relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #bf00ff)',
              color: '#000',
              boxShadow: '0 0 40px rgba(0,212,255,0.4), 0 0 80px rgba(191,0,255,0.2)',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <span>🧠</span> GENERATE QUIZ & ENTER ARENA
            </span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
          </button>
        )}

        {/* ✅ Demo button يستخدم demo questions مباشرة بدون AI */}
        {phase === 'upload' && (
          <div className="text-center mt-6">
            <button
              id="demo-btn"
              onClick={async () => {
                setPhase('generating');
                const { generateQuizFromText } = await import('../services/openai');
                // نبعث نص فارغ باش يرجع demo questions من generateDemoQuestions
                const questions = await generateQuizFromText('', numQuestions, difficulty);
                const mode = queryMode === 'boss' ? 'boss' : queryMode === 'daily' ? 'daily' : 'normal';
                startQuiz(questions, mode, 'Demo Quiz');
                navigate('/quiz');
              }}
              className="text-sm text-gray-500 hover:text-cyan-400 underline underline-offset-4 transition-colors"
            >
              No PDF? Try with demo questions →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
