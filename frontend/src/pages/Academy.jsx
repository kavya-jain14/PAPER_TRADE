import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';

// 🚀 IMPORTING THE MASTER DATA BRAIN
import { patternsData } from '../data/patterns';
// 🚀 O(1) CUSTOM PURE REACT SVG CHART ENGINE (NO HARDCODED LOGIC!)
const SvgChartWidget = ({ pattern }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [chartMode, setChartMode]       = useState('candle'); // 'candle' | 'line'

  const data = useMemo(() => {
    let rawData = [];
    let price = 1000;
    for (let i = 0; i < 15; i++) {
        let open  = price + (Math.random() - 0.5) * 8;
        let close = open + (Math.random() * 15) * pattern.preTrendDir;
        let high  = Math.max(open, close) + Math.random() * 8;
        let low   = Math.min(open, close) - Math.random() * 8;
        rawData.push({ open, high, low, close, type: 'pre' });
        price = close;
    }
    pattern.animationCandles.forEach(c => {
        rawData.push({ open: price + c.o, close: price + c.c, high: price + c.h, low: price + c.l, type: 'pattern' });
        price = price + c.c;
    });
    const postTrendDir = pattern.preTrendDir === -1 ? 1 : -1;
    for (let i = 0; i < 12; i++) {
        let open  = price + (Math.random() - 0.5) * 8;
        let close = open + (Math.random() * 20) * postTrendDir;
        let high  = Math.max(open, close) + Math.random() * 10;
        let low   = Math.min(open, close) - Math.random() * 10;
        rawData.push({ open, high, low, close, type: 'post' });
        price = close;
    }
    return rawData;
  }, [pattern]);

  useEffect(() => {
    setVisibleCount(0);
    const interval = setInterval(() => {
      setVisibleCount(prev => {
        if (prev < data.length) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [data]);

  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));
  const padding  = (maxPrice - minPrice) * 0.3;
  const yMin = minPrice - padding;
  const yMax = maxPrice + padding;
  const yRange = yMax - yMin || 1;
  const totalCandles = data.length;
  const isDrawing    = visibleCount < totalCandles;
  const visibleData  = data.slice(0, visibleCount);

  // Line mode: smooth polyline through close prices
  const linePts = visibleData.map((d, i) => {
    const cw = 600 / totalCandles;
    const x  = i * cw + cw / 2;
    const y  = 256 - ((d.close - yMin) / yRange) * 256;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full bg-[#0e0e0e] rounded-2xl border border-white/5 relative p-4 flex flex-col items-center justify-center overflow-hidden shadow-inner gap-3">
      <svg width="100%" height="85%" viewBox="0 0 600 256" preserveAspectRatio="none" className="overflow-visible">
        {[...Array(5)].map((_, i) => (
            <line key={`grid-${i}`} x1="0" y1={i * 64} x2="600" y2={i * 64} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}

        {chartMode === 'candle' && visibleData.map((d, i) => {
          const cw = 600 / totalCandles;
          const x  = i * cw + cw / 2;
          const yH = 256 - ((d.high  - yMin) / yRange) * 256;
          const yL = 256 - ((d.low   - yMin) / yRange) * 256;
          const yO = 256 - ((d.open  - yMin) / yRange) * 256;
          const yC = 256 - ((d.close - yMin) / yRange) * 256;
          const isBullish   = d.close >= d.open;
          const color       = isBullish ? '#3de530' : '#ff3b30';
          const isPattern   = d.type === 'pattern';
          return (
            <g key={i} style={{ filter: isPattern ? `drop-shadow(0 0 6px ${color})` : 'none' }}>
              <line x1={x} y1={yH} x2={x} y2={yL} stroke={color} strokeWidth="1.5" opacity={isPattern ? 1 : 0.6} />
              <rect x={x - cw * 0.3} y={Math.min(yO, yC)} width={cw * 0.6} height={Math.max(Math.abs(yO - yC), 1.5)} fill={color} rx="1" opacity={isPattern ? 1 : 0.6} />
            </g>
          );
        })}

        {chartMode === 'line' && visibleData.length > 1 && (
          <>
            <polyline points={linePts} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Highlight pattern candles with dots */}
            {visibleData.map((d, i) => {
              if (d.type !== 'pattern') return null;
              const cw = 600 / totalCandles;
              const x  = i * cw + cw / 2;
              const y  = 256 - ((d.close - yMin) / yRange) * 256;
              return <circle key={i} cx={x} cy={y} r="5" fill="#eab308" stroke="#0e0e0e" strokeWidth="1.5" />;
            })}
          </>
        )}
      </svg>

      {/* Chart Mode Toggle */}
      <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
        <button
          onClick={() => setChartMode('candle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${chartMode === 'candle' ? 'bg-[#3de530]/15 text-[#3de530] border border-[#3de530]/30' : 'text-white/40 hover:text-white'}`}
        >
          🕯️ Candle
        </button>
        <button
          onClick={() => setChartMode('line')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${chartMode === 'line' ? 'bg-blue-500/15 text-blue-400 border border-blue-400/30' : 'text-white/40 hover:text-white'}`}
        >
          📈 Line
        </button>
      </div>

      {isDrawing ? (
         <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#3de530]/10 border border-[#3de530]/20 rounded-lg text-[10px] font-black tracking-widest text-[#3de530] z-20 backdrop-blur-md shadow-lg flex items-center gap-2 animate-pulse">
            <span className="material-symbols-outlined text-[14px]">draw</span> DRAWING...
         </div>
      ) : (
         <div className="absolute top-4 right-4 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black tracking-widest text-blue-400 z-20 backdrop-blur-md shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">insights</span> BREAKOUT CONFIRMED
         </div>
      )}
    </div>
  );
};


// 🎯 MAIN ACADEMY COMPONENT
function Academy() {
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null);
  
  // 🚀 SEARCH AND FILTER STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const timeInMinutes = now.getHours() * 60 + now.getMinutes();
      setIsMarketOpen(now.getDay() >= 1 && now.getDay() <= 5 && timeInMinutes >= 555 && timeInMinutes < 930);
    };
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 DYNAMIC FILTER ENGINE
  const filteredPatterns = patternsData.filter(pattern => {
    const matchesSearch = pattern.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || pattern.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const categories = ['All', 'Market Guide', 'Single Candle', 'Double Candle', 'Triple Candle', 'Chart Pattern'];


  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="flex h-screen bg-[#0a0a0a] text-white/90 font-inter overflow-hidden selection:bg-green-500/30">

      <Sidebar userName="Simulated Account" isMarketOpen={isMarketOpen} />
      <MobileBottomNav />

      {/* 🔴 MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 pb-24 md:pb-0 relative custom-scrollbar">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.02] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 relative z-10">
          
          {/* 📱 Mobile top bar */}
          <div className="md:hidden flex items-center justify-between pt-2 mb-2">
            <h1 className="text-lg font-black tracking-tight"><span className="text-[#3de530]">PAPER</span> TRADE</h1>
          </div>

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-4 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">Trading Academy</h2>
              <p className="text-[#bbcbb2] text-sm">Master technical analysis with 1D swing trade examples.</p>
            </div>
            
            {/* 🚀 SEARCH BAR */}
            <div className="relative">
               <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30">search</span>
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search patterns..." 
                 className="w-full md:w-64 bg-[#131313] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-[#3de530]/50 transition-colors"
               />
            </div>
          </header>

          {/* 🚀 CATEGORY TABS */}
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
             {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === cat ? 'bg-[#3de530] text-[#003a00] shadow-[0_0_10px_rgba(61,229,48,0.2)]' : 'bg-[#131313] text-[#bbcbb2] hover:text-white border border-white/5'}`}
                >
                  {cat}
                </button>
             ))}
          </div>

          {/* PATTERN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             <AnimatePresence>
             {filteredPatterns.length === 0 ? (
                <div className="col-span-full text-center py-20 text-white/40">No patterns found matching your criteria.</div>
             ) : (
                 filteredPatterns.map((item) => (
                    <motion.div initial={{opacity:0, scale: 0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} key={item.id} className="bg-[#131313] border border-white/5 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                       <div className="h-48 bg-[#0e0e0e] border-b border-white/5 flex items-center justify-center p-8 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#131313] to-transparent opacity-50"></div>
                          <div className="w-24 h-24 relative z-10 hover:scale-110 transition-transform duration-500">
                             {item.svg}
                          </div>
                       </div>
                       
                       <div className="p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <h3 className="font-bold text-lg text-white leading-tight">{item.title}</h3>
                                <p className="text-[10px] text-white/40 mt-1">{item.category}</p>
                             </div>
                             <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${item.bg} ${item.color} ${item.border} shrink-0`}>
                                {item.type}
                             </span>
                          </div>
                          <p className="text-[#bbcbb2] text-sm leading-relaxed mb-6 flex-1 line-clamp-3">{item.desc}</p>
                          
                          <button onClick={() => setSelectedPattern(item)} className="w-full py-3 bg-[#1c1b1b] border border-white/5 rounded-lg text-xs font-bold text-white uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                             Study Pattern
                          </button>
                       </div>
                    </motion.div>
                 ))
             )}
             </AnimatePresence>
          </div>

        </div>
      </main>

      {/* 🟢 THE STUDY MODAL (WITH ANIMATION & OUTCOME CHART) */}
      <AnimatePresence>
        {selectedPattern && (
          <div className="fixed inset-0 bg-[#0e0e0e]/95 flex items-center justify-center z-50 p-4 backdrop-blur-xl">
            <motion.div initial={{scale:0.95, opacity: 0}} animate={{scale:1, opacity: 1}} exit={{scale:0.95, opacity: 0}} transition={{ duration: 0.2 }}
              className="bg-[#131313] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 bg-[#1c1b1b]/50 border-b border-white/5 flex justify-between items-center relative">
                <div className={`absolute top-0 left-0 w-full h-1 ${selectedPattern.preTrendDir === 1 ? 'bg-gradient-to-r from-[#ff3b30] to-[#ffcc00]' : 'bg-gradient-to-r from-blue-500 to-[#3de530]'}`}></div>
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    {selectedPattern.title} 
                    <span className="px-2 py-0.5 bg-[#3de530]/20 text-[#3de530] text-[10px] uppercase tracking-widest rounded border border-[#3de530]/30 animate-pulse">
                      Live Example
                    </span>
                  </h3>
                  <p className="text-xs text-[#bbcbb2] font-mono mt-1 flex items-center gap-1.5">
                    Context: <span className="font-bold text-white">{selectedPattern.exampleStock}</span> 
                    <span className="opacity-50">|</span> Historical Date: <span className="text-blue-400">{selectedPattern.exampleDate}</span>
                  </p>
                </div>
                <button onClick={() => setSelectedPattern(null)} className="text-[#bbcbb2] hover:text-white bg-[#0e0e0e] p-2 rounded-lg border border-white/10 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 custom-scrollbar">
                <div className="space-y-4">
                   
                   <div className="h-64 w-full">
                     {/* 🚀 DYNAMIC SVG ENGINE! NOW TAKES THE WHOLE OBJECT */}
                     <SvgChartWidget pattern={selectedPattern} />
                   </div>

                   <div className="p-4 bg-[#1c1b1b] rounded-xl border border-white/5 border-l-4 border-l-blue-500">
                     <p className="text-xs text-[#bbcbb2] leading-relaxed">
                       <span className="font-bold text-white">AI Context Engine:</span> Reconstructing price action for <strong className="text-white">{selectedPattern.exampleStock}</strong>. Notice how the price breaks out <strong className="text-white">after</strong> the {selectedPattern.title} formation.
                     </p>
                   </div>
                </div>

                {/* In your Academy.jsx Study Modal Layout */}
              <div className="space-y-6">
                <div>
                    <h4 className="text-[#3de530] font-black text-xs uppercase mb-3 tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">psychology</span> Psychology
                    </h4>
                    <p className="text-[#bbcbb2] leading-relaxed text-sm bg-[#1c1b1b] p-4 rounded-xl border border-white/5">{selectedPattern.desc}</p>
                </div>

                {/* 🚀 NEW: REAL MARKET INSTANCE BLOCK */}
                {selectedPattern.caseStudy && (
                  <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
                      <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest relative z-10">
                        <span className="material-symbols-outlined text-[16px]">history_edu</span> Real Market Instance
                      </h4>
                      <div className="text-white text-sm space-y-2 relative z-10 font-mono">
                        {/* Split by newline \n to render perfectly formatted lines */}
                        {selectedPattern.caseStudy.split('\n').map((line, idx) => (
                          <p key={idx} className={`${line.includes('After:') ? 'text-[#3de530]' : line.includes('Before:') ? 'text-[#ff3b30]' : 'text-white'}`}>
                            {line}
                          </p>
                        ))}
                      </div>
                  </div>
                )}
                
                <div className="p-5 bg-gradient-to-br from-[#1c1b1b] to-[#131313] rounded-xl border border-white/5 shadow-lg">
                    <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-blue-500">query_stats</span> How to trade?
                    </h4>
                    <ul className="text-[#bbcbb2] text-sm space-y-3">
                      <li className="flex items-start gap-2"><span className="text-[#3de530] mt-0.5">■</span> Wait for the daily candle to fully close before entering.</li>
                      <li className="flex items-start gap-2"><span className="text-[#3de530] mt-0.5">■</span> Always look for trading volume confirmation on the breakout.</li>
                      <li className="flex items-start gap-2"><span className="text-[#3de530] mt-0.5">■</span> Set a strict stop-loss slightly below/above the wick to minimize risk.</li>
                    </ul>
                </div>
                <button onClick={() => navigate('/markets')} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.98]">
                    Test in Live Simulator
                </button>
              </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

export default Academy;
