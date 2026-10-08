import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const TOP_STOCKS = [
  'RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY',
  'ITC','SBIN','BHARTIARTL','LT','AXISBANK'
];

const INDICES = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];

const ROUTES = [
  { path: '/dashboard', label: 'Dashboard', mark: '01' },
  { path: '/markets', label: 'Markets', mark: '02' },
  { path: '/portfolio', label: 'Portfolio', mark: '03' },
  { path: '/history', label: 'Ledger', mark: '04' },
  { path: '/study', label: 'Study', mark: '05' },
  { path: '/leaderboard', label: 'Rankings', mark: '06' },
  { path: '/desk', label: 'Market Desk', mark: '07' },
  { path: '/profile', label: 'Profile', mark: 'AC' },
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
      const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(timer);
    }
    return undefined;
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
      navigate(INDICES.includes(result.data) ? '/markets' : `/terminal/${encodeURIComponent(result.data)}`);
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
          style={{ background: 'rgba(7,6,5,0.82)' }}
          onClick={() => setIsOpen(false)}
        >
          <Motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Quick navigation"
            style={{ 
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center px-4 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="type-label mr-3" aria-hidden="true">FIND</span>
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
                aria-label="Search stocks, indices, or pages"
                className="flex-1 bg-transparent border-none outline-none type-h3 placeholder:text-text-tertiary"
              />
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-[10px] font-bold tracking-widest" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}>
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
                      <button
                        key={`${res.type}-${res.type === 'route' ? res.data.path : res.data}`}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => handleSelect(res)}
                        className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors w-full text-left"
                        style={{
                          background: isSelected ? 'var(--color-surface-overlay)' : 'transparent',
                          border: 0,
                          borderLeft: `2px solid ${isSelected ? 'var(--color-accent)' : 'transparent'}`,
                          color: 'inherit',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {res.type === 'route' ? (
                            <span className="command-mark">{res.data.mark}</span>
                          ) : (
                            <span className="command-mark">{res.data.substring(0, 2)}</span>
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
                            Open ↵
                          </span>
                        )}
                      </button>
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
