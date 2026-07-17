import React, { useState, useEffect } from 'react';
import { getActiveRollOrCreate, getAllRolls, getPhotosForRoll, Roll, Photo, saveRoll } from './utils/db';
import { FILM_STYLES } from './utils/filter';
import { sounds } from './components/SoundEffects';
import RollSelector from './components/RollSelector';
import CameraView from './components/CameraView';
import DarkroomView from './components/DarkroomView';
import AlbumView from './components/AlbumView';
import HistoryView from './components/HistoryView';
import { Camera, Film, BookOpen, AlertCircle, HelpCircle, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Screen = 'selector' | 'camera' | 'darkroom' | 'album' | 'history';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('selector');
  const [activeRoll, setActiveRoll] = useState<Roll | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [hasHistory, setHasHistory] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Initialize and load current active roll state
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      setInitializing(true);
      
      // Check for developed rolls history
      const allRolls = await getAllRolls();
      const developedCount = allRolls.filter(r => r.status === 'developed').length;
      setHasHistory(developedCount > 0);

      // Check active roll (shooting or full)
      const active = allRolls.find(r => r.status !== 'developed');
      
      if (active) {
        setActiveRoll(active);
        const rollPhotos = await getPhotosForRoll(active.id);
        setPhotos(rollPhotos);
        
        // Route according to status
        if (active.status === 'shooting') {
          setCurrentScreen('camera');
        } else if (active.status === 'full' || active.status === 'developing') {
          setCurrentScreen('darkroom');
        }
      } else {
        // No active shooting roll, show selection screen
        setCurrentScreen('selector');
      }
    } catch (e) {
      console.error('Failed to init app database:', e);
    } finally {
      setInitializing(setInitializing as any); // brief state trick
      setInitializing(false);
    }
  };

  const handleRollSelected = async (roll: Roll) => {
    setActiveRoll(roll);
    setPhotos([]);
    setCurrentScreen('camera');
  };

  const handlePhotoAdded = async (photosCount: number) => {
    if (activeRoll) {
      const updatedPhotos = await getPhotosForRoll(activeRoll.id);
      setPhotos(updatedPhotos);
      
      setActiveRoll({
        ...activeRoll,
        currentCount: photosCount,
        status: photosCount >= activeRoll.totalCount ? 'full' : 'shooting'
      });
    }
  };

  const handleRollCompleted = () => {
    sounds.playBeep();
    setCurrentScreen('darkroom');
  };

  const handleDevelopmentComplete = async () => {
    if (activeRoll) {
      const updatedPhotos = await getPhotosForRoll(activeRoll.id);
      setPhotos(updatedPhotos);
      
      setActiveRoll({
        ...activeRoll,
        status: 'developed',
        developedAt: Date.now()
      });
      
      // Update historical existence check
      setHasHistory(true);
      setCurrentScreen('album');
    }
  };

  const handleViewHistoricalRoll = async (roll: Roll) => {
    const rollPhotos = await getPhotosForRoll(roll.id);
    setActiveRoll(roll);
    setPhotos(rollPhotos);
    setCurrentScreen('album');
  };

  const handleRestartNewRoll = async () => {
    sounds.playBeep();
    setActiveRoll(null);
    setPhotos([]);
    setCurrentScreen('selector');
    // Re-check archives list
    const allRolls = await getAllRolls();
    setHasHistory(allRolls.filter(r => r.status === 'developed').length > 0);
  };

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'selector':
        return (
          <RollSelector
            onRollSelected={handleRollSelected}
            onViewHistory={() => setCurrentScreen('history')}
            hasHistory={hasHistory}
          />
        );
      case 'camera':
        return activeRoll ? (
          <CameraView
            roll={activeRoll}
            onPhotoAdded={handlePhotoAdded}
            onRollCompleted={handleRollCompleted}
          />
        ) : null;
      case 'darkroom':
        return activeRoll ? (
          <DarkroomView
            roll={activeRoll}
            onDeveloped={handleDevelopmentComplete}
          />
        ) : null;
      case 'album':
        return activeRoll ? (
          <AlbumView
            roll={activeRoll}
            photos={photos}
            onBack={handleRestartNewRoll}
            onRestart={handleRestartNewRoll}
          />
        ) : null;
      case 'history':
        return (
          <HistoryView
            onSelectRoll={handleViewHistoricalRoll}
            onBack={handleRestartNewRoll}
          />
        );
      default:
        return null;
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-10 h-10 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-widest uppercase">Initializing Silver Halide Matrix...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950 font-sans">
      
      {/* Top minimalistic glass navigation */}
      <header className="w-full border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={handleRestartNewRoll}
            className="flex items-center gap-2 text-zinc-100 hover:text-amber-500 transition cursor-pointer bg-transparent border-none"
          >
            <Film className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="font-mono font-black text-sm tracking-widest uppercase">
              Retro Film Cam
            </span>
          </button>

          {/* Nav pills */}
          <div className="flex items-center gap-1.5">
            {currentScreen !== 'selector' && currentScreen !== 'history' && (
              <span className="text-[10px] font-mono text-zinc-500 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-850 truncate max-w-[120px] md:max-w-none">
                📍 {activeRoll?.name}
              </span>
            )}
            
            {hasHistory && currentScreen !== 'history' && currentScreen !== 'darkroom' && (
              <button
                onClick={() => {
                  sounds.playBeep();
                  setCurrentScreen('history');
                }}
                className="inline-flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 text-xs font-medium py-1.5 px-3.5 rounded-xl transition cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">冲洗档案</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main body content section */}
      <main className="flex-1 flex flex-col justify-center py-6 md:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full"
          >
            {renderActiveScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer credits */}
      <footer className="w-full border-t border-zinc-900 py-6 text-center text-[11px] font-mono text-zinc-600">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span>© 2026 ANALOG CAMERA SIMULATOR • RETRO DEV LAB</span>
          <span className="text-[10px] text-zinc-700 flex items-center gap-1">
            <span>REAL-TIME EMULSION EXPOSURE PATTERN DEPLOYED</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
