import React, { useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

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
        <Motion.div
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 18, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 border flex flex-col overflow-hidden"
          style={{ 
            background: 'var(--color-surface-overlay)', 
            borderColor: 'var(--color-border-strong)',
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
            <div className="flex items-center border-b border-border" role="group" aria-label="Replay speed">
              {[1, 3, 10].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`type-caption px-2 py-1 border-b-2 transition-colors ${speedMultiplier === s ? 'border-accent text-accent' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Media Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={togglePlay}
                className="h-9 px-3 flex items-center justify-center bg-accent text-bg type-caption hover:brightness-110 transition-colors"
                title="Play/Pause (Space)"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button 
                onClick={stepForward}
                className="h-9 px-3 flex items-center justify-center text-text-secondary hover:text-text-primary border border-border transition-colors type-caption"
                title="Step Forward (Right Arrow)"
              >
                Step
              </button>
            </div>

            {/* Exit/Close */}
            <button 
              onClick={onExit}
              className="type-caption text-negative hover:brightness-125 transition-colors px-2 py-1"
            >
              Exit Replay
            </button>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
