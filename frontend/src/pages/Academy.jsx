import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';
import { patternsData } from '../data/patterns';

const SvgChartWidget = ({ pattern }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [chartMode, setChartMode]       = useState('candle'); 

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

  const linePts = visibleData.map((d, i) => {
    const cw = 600 / totalCandles;
    const x  = i * cw + cw / 2;
    const y  = 256 - ((d.close - yMin) / yRange) * 256;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full bg-[#0B0D10] rounded-[24px] border border-[#E5E5E5]/5 relative p-4 flex flex-col items-center justify-center overflow-hidden shadow-inner gap-3">
      <svg width="100%" height="85%" viewBox="0 0 600 256" preserveAspectRatio="none" className="overflow-visible">
        {[...Array(5)].map((_, i) => (
            <line key={`grid-${i}`} x1="0" y1={i * 64} x2="600" y2={i * 64} stroke="rgba(229,229,229,0.03)" strokeWidth="1" />
        ))}

        {chartMode === 'candle' && visibleData.map((d, i) => {
          const cw = 600 / totalCandles;
          const x  = i * cw + cw / 2;
          const yH = 256 - ((d.high  - yMin) / yRange) * 256;
          const yL = 256 - ((d.low   - yMin) / yRange) * 256;
          const yO = 256 - ((d.open  - yMin) / yRange) * 256;
          const yC = 256 - ((d.close - yMin) / yRange) * 256;
          const isBullish   = d.close >= d.open;
          const color       = isBullish ? '#4ADE80' : '#EF4444';
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
            <polyline points={linePts} fill="none" stroke="#D4A574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {visibleData.map((d, i) => {
              if (d.type !== 'pattern') return null;
              const cw = 600 / totalCandles;
              const x  = i * cw + cw / 2;
              const y  = 256 - ((d.close - yMin) / yRange) * 256;
              return <circle key={i} cx={x} cy={y} r="5" fill="#D4A574" stroke="#0B0D10" strokeWidth="2" />;
            })}
          </>
        )}
      </svg>

      <div className="flex items-center gap-2 bg-[#16181D] rounded-xl p-1 border border-[#E5E5E5]/5">
        <button
          onClick={() => setChartMode('candle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${chartMode === 'candle' ? 'bg-[#E5E5E5]/10 text-[#E5E5E5] shadow-inner' : 'text-[#E5E5E5]/40 hover:text-white'}`}
        >
          🕯️ Candle
        </button>
        <button
          onClick={() => setChartMode('line')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${chartMode === 'line' ? 'bg-[#D4A574]/15 text-[#D4A574]' : 'text-[#E5E5E5]/40 hover:text-white'}`}
        >
          📈 Line
        </button>
      </div>

      {isDrawing ? (
         <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#E5E5E5]/10 border border-[#E5E5E5]/10 rounded-lg text-[10px] font-black tracking-widest text-[#E5E5E5] z-20 backdrop-blur-md shadow-lg flex items-center gap-2 animate-pulse">
            <span className="material-symbols-outlined text-[14px]">draw</span> DRAWING...
         </div>
      ) : (
         <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#D4A574]/10 border border-[#D4A574]/20 rounded-lg text-[10px] font-black tracking-widest text-[#D4A574] z-20 backdrop-blur-md shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">insights</span> BREAKOUT CONFIRMED
         </div>
      )}
    </div>
  );
};


function Academy() {
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null);
  
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

  const filteredPatterns = patternsData.filter(pattern => {
    const matchesSearch = pattern.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || pattern.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const categories = ['All', 'Market Guide', 'Single Candle', 'Double Candle', 'Triple Candle', 'Chart Pattern'];


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex h-screen bg-[#0B0D10] text-[#E5E5E5] font-sans overflow-hidden selection:bg-[#D4A574]/30">

      <Sidebar userName="Simulated Account" isMarketOpen={isMarketOpen} />
      <MobileBottomNav />

      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32 relative">
        <div className="max-w-[1600px] mx-auto space-y-12 relative z-10">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-[56px] font-light tracking-tight text-[#E5E5E5] leading-none mb-4">
                Trading <span className="font-bold">Academy</span>.
              </motion.h1>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5E5E5]/40">Master technical analysis</p>
              </motion.div>
            </div>
            
            <div className="relative">
               <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#E5E5E5]/30">search</span>
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search patterns..." 
                 className="w-full md:w-64 bg-[#16181D]/50 border border-[#E5E5E5]/5 rounded-full pl-12 pr-6 py-4 text-sm text-[#E5E5E5] outline-none focus:border-[#D4A574]/50 transition-colors shadow-inner"
               />
            </div>
          </header>

          <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
             {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === cat ? 'bg-[#D4A574] text-[#0B0D10] shadow-[0_0_20px_rgba(212,165,116,0.3)]' : 'bg-[#16181D]/50 text-[#E5E5E5]/40 hover:text-[#E5E5E5] border border-[#E5E5E5]/5 hover-glow'}`}
                >
                  {cat}
                </button>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
             <AnimatePresence>
             {filteredPatterns.length === 0 ? (
                <div className="col-span-full text-center py-20 text-[#E5E5E5]/40">No patterns found matching your criteria.</div>
             ) : (
                 filteredPatterns.map((item) => (
                    <motion.div initial={{opacity:0, scale: 0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} key={item.id} className="bg-[#16181D]/30 border border-[#E5E5E5]/5 rounded-[32px] overflow-hidden shadow-xl flex flex-col group hover:-translate-y-2 transition-transform duration-300">
                       <div className="h-56 bg-[#0B0D10] border-b border-[#E5E5E5]/5 flex items-center justify-center p-8 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#16181D] to-transparent opacity-50"></div>
                          <div className="w-28 h-28 relative z-10 group-hover:scale-110 transition-transform duration-500">
                             {item.svg}
                          </div>
                       </div>
                       
                       <div className="p-8 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-6">
                             <div>
                                <h3 className="font-bold text-xl text-[#E5E5E5] leading-tight group-hover:text-[#D4A574] transition-colors">{item.title}</h3>
                                <p className="text-[10px] text-[#E5E5E5]/40 mt-1 uppercase tracking-widest">{item.category}</p>
                             </div>
                             <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${item.bg} ${item.color} ${item.border} shrink-0`}>
                                {item.type}
                             </span>
                          </div>
                          <p className="text-[#E5E5E5]/60 text-sm leading-relaxed mb-8 flex-1 line-clamp-3">{item.desc}</p>
                          
                          <button onClick={() => setSelectedPattern(item)} className="w-full py-4 bg-[#16181D] border border-[#E5E5E5]/5 rounded-xl text-xs font-bold text-[#E5E5E5]/80 uppercase tracking-widest hover:bg-[#D4A574] hover:text-[#0B0D10] transition-colors hover-glow">
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

      <AnimatePresence>
        {selectedPattern && (
          <div className="fixed inset-0 bg-[#000000]/80 flex items-center justify-center z-50 p-4 backdrop-blur-xl">
            <motion.div initial={{scale:0.95, opacity: 0}} animate={{scale:1, opacity: 1}} exit={{scale:0.95, opacity: 0}} transition={{ duration: 0.2 }}
              className="bg-[#16181D] border border-[#E5E5E5]/5 rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-[#E5E5E5]/5 flex justify-between items-center relative">
                <div className={`absolute top-0 left-0 w-full h-1 ${selectedPattern.preTrendDir === 1 ? 'bg-gradient-to-r from-[#EF4444] to-[#D4A574]' : 'bg-gradient-to-r from-[#4ADE80] to-[#FFFFFF]'}`}></div>
                <div>
                  <h3 className="text-3xl font-light text-[#E5E5E5] flex items-center gap-4 tracking-tight">
                    {selectedPattern.title} 
                    <span className="px-3 py-1 bg-[#D4A574]/10 text-[#D4A574] text-[10px] uppercase tracking-widest rounded-full font-bold animate-pulse">
                      Live Example
                    </span>
                  </h3>
                  <p className="text-xs text-[#E5E5E5]/40 font-mono mt-2 flex items-center gap-2">
                    Context: <span className="font-bold text-[#E5E5E5]">{selectedPattern.exampleStock}</span> 
                    <span className="opacity-50">|</span> Historical Date: <span className="text-[#D4A574]">{selectedPattern.exampleDate}</span>
                  </p>
                </div>
                <button onClick={() => setSelectedPattern(null)} className="text-[#E5E5E5]/40 hover:text-[#E5E5E5] bg-[#0B0D10] p-3 rounded-full border border-[#E5E5E5]/5 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 custom-scrollbar">
                <div className="space-y-6">
                   
                   <div className="h-72 w-full">
                     <SvgChartWidget pattern={selectedPattern} />
                   </div>

                   <div className="p-6 bg-[#0B0D10] rounded-[24px] border border-[#E5E5E5]/5 border-l-4 border-l-[#D4A574]">
                     <p className="text-sm text-[#E5E5E5]/60 leading-relaxed">
                       <span className="font-bold text-[#E5E5E5] text-[10px] uppercase tracking-widest block mb-2">AI Context Engine</span>
                       Reconstructing price action for <strong className="text-[#E5E5E5]">{selectedPattern.exampleStock}</strong>. Notice how the price breaks out <strong className="text-[#E5E5E5]">after</strong> the {selectedPattern.title} formation.
                     </p>
                   </div>
                </div>

              <div className="space-y-8">
                <div>
                    <h4 className="text-[#E5E5E5] font-black text-xs uppercase mb-4 tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">psychology</span> Psychology
                    </h4>
                    <p className="text-[#E5E5E5]/60 leading-relaxed text-sm bg-[#0B0D10] p-6 rounded-[24px] border border-[#E5E5E5]/5">{selectedPattern.desc}</p>
                </div>

                {selectedPattern.caseStudy && (
                  <div className="p-6 bg-[#D4A574]/5 border border-[#D4A574]/10 rounded-[24px] shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4A574]/10 blur-3xl rounded-full"></div>
                      <h4 className="text-[#D4A574] font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest relative z-10">
                        <span className="material-symbols-outlined text-[16px]">history_edu</span> Real Market Instance
                      </h4>
                      <div className="text-[#E5E5E5]/80 text-sm space-y-3 relative z-10 font-mono">
                        {selectedPattern.caseStudy.split('\n').map((line, idx) => (
                          <p key={idx} className={`${line.includes('After:') ? 'text-[#4ADE80]' : line.includes('Before:') ? 'text-[#EF4444]' : 'text-[#E5E5E5]'}`}>
                            {line}
                          </p>
                        ))}
                      </div>
                  </div>
                )}
                
                <div className="p-6 bg-[#0B0D10] rounded-[24px] border border-[#E5E5E5]/5 shadow-lg">
                    <h4 className="text-[#E5E5E5] font-bold mb-5 flex items-center gap-2 text-xs uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[18px] text-[#D4A574]">query_stats</span> How to trade?
                    </h4>
                    <ul className="text-[#E5E5E5]/60 text-sm space-y-4">
                      <li className="flex items-start gap-3"><span className="text-[#D4A574] mt-0.5 font-bold">■</span> Wait for the daily candle to fully close before entering.</li>
                      <li className="flex items-start gap-3"><span className="text-[#D4A574] mt-0.5 font-bold">■</span> Always look for trading volume confirmation on the breakout.</li>
                      <li className="flex items-start gap-3"><span className="text-[#D4A574] mt-0.5 font-bold">■</span> Set a strict stop-loss slightly below/above the wick to minimize risk.</li>
                    </ul>
                </div>
                <button onClick={() => navigate('/markets')} className="w-full py-5 bg-[#D4A574] hover:bg-[#D4A574]/80 text-[#0B0D10] font-black rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg shadow-[#D4A574]/10 hover-glow">
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
