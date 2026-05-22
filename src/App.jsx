import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthChange } from './services/firebase';
import useGameStore from './store/gameStore';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import QuizArena from './pages/QuizArena';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import LevelUpOverlay from './components/LevelUpOverlay';
import BadgeToast from './components/BadgeToast';
import './App.css';

export default function App() {
  const { setFirebaseUser, showLevelUp, levelUpData, clearLevelUp, newBadges, clearNewBadges } = useGameStore();

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      setFirebaseUser(user);
    });
    return unsub;
  }, [setFirebaseUser]);

  return (
    <BrowserRouter>
      <div className="scanline">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/quiz" element={<QuizArena />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Overlays */}
        {showLevelUp && levelUpData && (
          <LevelUpOverlay data={levelUpData} onClose={clearLevelUp} />
        )}
        {newBadges.length > 0 && (
          <BadgeToast badges={newBadges} onClose={clearNewBadges} />
        )}
      </div>
    </BrowserRouter>
  );
}
