import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
        setIsOpen(prev => !prev);
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
      setQuery('');
      setSelectedIndex(0);
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

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-2xl bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden font-inter"
            onClick={e => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center px-4 py-4 border-b border-white/10">
              <span className="material-symbols-outlined text-white/40 text-[24px] mr-3">search</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search stocks, indices, or navigation... (e.g. 'RELIANCE')"
                className="flex-1 bg-transparent border-none text-white text-lg outline-none placeholder-white/30"
              />
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 font-bold tracking-widest">ESC</span>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
              {results.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  No results found for "<span className="text-white">{query}</span>"
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
                        className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                          isSelected ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {res.type === 'route' ? (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-white/40'}`}>
                              <span className="material-symbols-outlined text-[18px]">{res.data.icon}</span>
                            </div>
                          ) : (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-blue-500/30 text-blue-300' : 'bg-[#1c1c1c] border border-white/5 text-white/80'}`}>
                              {res.data.substring(0, 1)}
                            </div>
                          )}
                          <div>
                            <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white/80'}`}>
                              {res.type === 'route' ? res.data.label : res.data}
                            </p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                              {res.type === 'route' ? 'Navigation' : 'Market Asset'}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest flex items-center gap-1">
                            Jump to <span className="material-symbols-outlined text-[14px]">subdirectory_arrow_left</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
