import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const TOP_STOCKS = [
  'RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY',
  'ITC','SBIN','BHARTIARTL','LT','AXISBANK'
];

const INDICES = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];

const ROUTES = [
  { path: '/dashboard', label: 'Dashboard', icon: 'grid_view' },
  { path: '/markets',   label: 'Markets',   icon: 'monitoring' },
  { path: '/portfolio', label: 'Portfolio', icon: 'pie_chart' },
  { path: '/academy',   label: 'Academy',   icon: 'school' },
  { path: '/history',   label: 'History',   icon: 'history' },
  { path: '/profile',   label: 'Profile',   icon: 'person' },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          setQuery('');
          setSelectedIndex(0);
        }
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Focus element after the animation frames
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const searchResults = () => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return [
        { type: 'route', data: ROUTES[0] },
        { type: 'route', data: ROUTES[1] },
        { type: 'stock', data: 'RELIANCE' },
        { type: 'stock', data: 'NIFTY 50' },
      ];
    }

    const routeMatches = ROUTES.filter(r => r.label.toLowerCase().includes(q)).map(r => ({ type: 'route', data: r }));
    const stockMatches = [...TOP_STOCKS, ...INDICES].filter(s => s.toLowerCase().includes(q)).map(s => ({ type: 'stock', data: s }));
    
    return [...routeMatches, ...stockMatches];
  };

  const results = searchResults();



  const handleSelect = (result) => {
    setIsOpen(false);
    if (result.type === 'route') {
      navigate(result.data.path);
    } else {
      // Navigate to markets page where they can trade the specific stock
      navigate('/markets');
      // Adding a small delay to let the page load, then dispatch event to open trade modal
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-trade-modal', { detail: result.data }));
      }, 300);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setIsOpen(false)}
        >
          <Motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-2xl overflow-hidden rounded-lg"
            style={{ 
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-3)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center px-4 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="material-symbols-outlined mr-3" style={{ color: 'var(--color-text-tertiary)' }}>search</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search stocks, indices, or navigation..."
                className="flex-1 bg-transparent border-none outline-none type-h3 placeholder:text-text-tertiary"
              />
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded text-[10px] font-bold tracking-widest" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                  ESC
                </span>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
              {results.length === 0 ? (
                <div className="p-8 text-center type-body-secondary">
                  No results found for "<span style={{ color: 'var(--color-text-primary)' }}>{query}</span>"
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((res, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => handleSelect(res)}
                        className="flex items-center justify-between px-4 py-3 rounded-md cursor-pointer transition-colors"
                        style={{
                          background: isSelected ? 'var(--color-surface-overlay)' : 'transparent',
                          border: `1px solid ${isSelected ? 'var(--color-border-strong)' : 'transparent'}`
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {res.type === 'route' ? (
                            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 'var(--icon-sm)' }}>{res.data.icon}</span>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-md flex items-center justify-center font-bold" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}>
                              {res.data.substring(0, 1)}
                            </div>
                          )}
                          <div>
                            <p className="type-body" style={{ fontWeight: isSelected ? 500 : 400 }}>
                              {res.type === 'route' ? res.data.label : res.data}
                            </p>
                            <p className="type-caption-muted uppercase tracking-widest mt-0.5">
                              {res.type === 'route' ? 'Navigation' : 'Market Asset'}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="type-label flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                            Jump to <span className="material-symbols-outlined" style={{ fontSize: 'var(--icon-sm)' }}>subdirectory_arrow_left</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
