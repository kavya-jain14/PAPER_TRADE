import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ReplayControlBar
 * Floating media player controls for Bar Replay Mode.
 * Includes keyboard shortcuts support.
 */
export default function ReplayControlBar({ 
  active, 
  isPlaying, 
  togglePlay, 
  stepForward, 
  speedMultiplier, 
  setSpeed, 
  progress,
  onExit
}) {
  
  // Keyboard Shortcuts
  useEffect(() => {
    if (!active) return;
    
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input field (like order panel)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, togglePlay, stepForward]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-3 border flex flex-col overflow-hidden"
          style={{ 
            background: 'var(--color-surface-overlay)', 
            borderColor: 'var(--color-border-strong)',
            backdropFilter: 'blur(12px)',
            minWidth: '320px'
          }}
        >
          {/* Top Edge Progress Bar */}
          <div className="h-1 w-full bg-surface-raised">
            <div 
              className="h-full bg-accent transition-all duration-200 ease-linear" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 gap-6">
            
            {/* Speed Controls */}
            <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-md border border-border">
              {[1, 3, 10].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`type-caption px-2 py-1 rounded transition-colors ${speedMultiplier === s ? 'bg-surface text-accent shadow-1' : 'text-text-tertiary hover:text-text-primary'}`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Media Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-accent text-bg shadow-1 hover:brightness-110 transition-all"
                title="Play/Pause (Space)"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button 
                onClick={stepForward}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-surface border border-border transition-all"
                title="Step Forward (Right Arrow)"
              >
                <span className="material-symbols-outlined">skip_next</span>
              </button>
            </div>

            {/* Exit/Close */}
            <button 
              onClick={onExit}
              className="flex items-center gap-1 type-caption text-negative hover:brightness-125 transition-colors px-2 py-1 rounded hover:bg-negative/10"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>power_settings_new</span>
              Exit Replay
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
