import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import useMarketStatus from '../hooks/useMarketStatus';
import { patternsData } from '../data/patterns';

const SvgChartWidget = ({ pattern }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [chartMode, setChartMode]       = useState('candle'); 

  const data = useMemo(() => {
    let rawData = [];
    let price = 1000;
    const pseudoRnd = (seed) => Math.abs(Math.sin(seed * 12.9898)) % 1;
    let seedCounter = 1;

    for (let i = 0; i < 15; i++) {
        let open  = price + (pseudoRnd(seedCounter++) - 0.5) * 8;
        let close = open + (pseudoRnd(seedCounter++) * 15) * pattern.preTrendDir;
        let high  = Math.max(open, close) + pseudoRnd(seedCounter++) * 8;
        let low   = Math.min(open, close) - pseudoRnd(seedCounter++) * 8;
        rawData.push({ open, high, low, close, type: 'pre' });
        price = close;
    }
    pattern.animationCandles.forEach(c => {
        rawData.push({ open: price + c.o, close: price + c.c, high: price + c.h, low: price + c.l, type: 'pattern' });
        price = price + c.c;
    });
    const postTrendDir = pattern.preTrendDir === -1 ? 1 : -1;
    for (let i = 0; i < 12; i++) {
        let open  = price + (pseudoRnd(seedCounter++) - 0.5) * 8;
        let close = open + (pseudoRnd(seedCounter++) * 20) * postTrendDir;
        let high  = Math.max(open, close) + pseudoRnd(seedCounter++) * 10;
        let low   = Math.min(open, close) - pseudoRnd(seedCounter++) * 10;
        rawData.push({ open, high, low, close, type: 'post' });
        price = close;
    }
    return rawData;
  }, [pattern]);

  useEffect(() => {
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
    <div className="w-full h-full bg-bg rounded-[24px] border border-border relative p-4 flex flex-col items-center justify-center overflow-hidden shadow-inner gap-3">
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

      <div className="flex items-center gap-2 bg-surface-raised rounded-lg p-1 border border-border">
        <button
          onClick={() => setChartMode('candle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg type-label transition-all ${chartMode === 'candle' ? 'bg-surface-raised text-text-primary shadow-inner' : 'text-text-secondary hover:text-white'}`}
        >
          🕯️ Candle
        </button>
        <button
          onClick={() => setChartMode('line')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg type-label transition-all ${chartMode === 'line' ? 'bg-accent-gold-muted text-accent-gold' : 'text-text-secondary hover:text-white'}`}
        >
          📈 Line
        </button>
      </div>

      {isDrawing ? (
         <div className="absolute top-4 right-4 px-3 py-1.5 bg-surface-raised border border-border rounded-lg text-[10px] font-black tracking-widest text-text-primary z-20 backdrop-blur-md shadow-2 flex items-center gap-2 animate-pulse">
            <span className="material-symbols-outlined text-[14px]">draw</span> DRAWING...
         </div>
      ) : (
         <div className="absolute top-4 right-4 px-3 py-1.5 bg-accent-gold-muted border border-accent-gold/20 rounded-lg text-[10px] font-black tracking-widest text-accent-gold z-20 backdrop-blur-md shadow-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">insights</span> BREAKOUT CONFIRMED
         </div>
      )}
    </div>
  );
};


function Academy() {
  const marketStatus = useMarketStatus();
  const [selectedPattern, setSelectedPattern] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  const navigate = useNavigate();

  const filteredPatterns = patternsData.filter(pattern => {
    const matchesSearch = pattern.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || pattern.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const categories = ['All', 'Market Guide', 'Single Candle', 'Double Candle', 'Triple Candle', 'Chart Pattern'];


  return (
    <AppShell marketStatus={marketStatus}>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-24 relative">
          <div className="max-w-[1400px] mx-auto space-y-6 relative z-10">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
            <div>
              <Motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="type-h2 mb-1">
                Academy
              </Motion.h1>
              <Motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="type-caption-muted">
                Master technical analysis
              </Motion.p>
            </div>
            
            <div className="relative">
               <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" style={{fontSize:'18px'}}>search</span>
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search patterns..." 
                 className="w-full md:w-56 bg-surface border border-border rounded-lg pl-9 pr-4 py-2 type-body text-text-primary outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
               />
            </div>
          </header>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
             {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-1.5 rounded-full type-caption whitespace-nowrap transition-colors ${activeTab === cat ? 'bg-text-primary text-bg' : 'bg-surface-raised text-text-secondary border border-border hover:border-border-strong'}`}
                >
                  {cat}
                </button>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
             <AnimatePresence>
             {filteredPatterns.length === 0 ? (
                <div className="col-span-full text-center py-16 type-caption-muted">No patterns found matching your criteria.</div>
             ) : (
                 filteredPatterns.map((item) => (
                    <Motion.div initial={{opacity:0, scale: 0.97}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.97}} key={item.id} className="bg-surface border border-border rounded-lg overflow-hidden shadow-1 flex flex-col group hover:border-border-strong transition-all duration-200">
                       <div className="h-44 bg-surface-raised border-b border-border flex items-center justify-center p-6 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60"></div>
                          <div className="w-24 h-24 relative z-10 group-hover:scale-110 transition-transform duration-500">
                             {item.svg}
                          </div>
                       </div>
                       
                       <div className="p-4 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-3">
                             <div>
                                <h3 className="type-body font-semibold text-text-primary group-hover:text-accent transition-colors">{item.title}</h3>
                                <p className="type-caption-muted mt-0.5">{item.category}</p>
                             </div>
                             <span className={`type-caption font-bold uppercase px-2 py-0.5 rounded-md border ${item.bg} ${item.color} ${item.border} shrink-0`}>
                                {item.type}
                             </span>
                          </div>
                          <p className="type-caption text-text-tertiary leading-relaxed mb-4 flex-1 line-clamp-3">{item.desc}</p>
                          
                          <button onClick={() => setSelectedPattern(item)} className="w-full py-2.5 bg-surface-raised hover:bg-border border border-border rounded-lg type-label-body text-text-secondary hover:text-text-primary transition-colors">
                             Study Pattern
                          </button>
                       </div>
                    </Motion.div>
                 ))
             )}
             </AnimatePresence>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {selectedPattern && (
          <div className="fixed inset-0 bg-[#000000]/80 flex items-center justify-center z-50 p-4 backdrop-blur-xl">
            <Motion.div initial={{scale:0.95, opacity: 0}} animate={{scale:1, opacity: 1}} exit={{scale:0.95, opacity: 0}} transition={{ duration: 0.2 }}
              className="bg-surface-raised border border-border rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-3"
            >
              <div className="p-8 border-b border-border flex justify-between items-center relative">
                <div className={`absolute top-0 left-0 w-full h-1 ${selectedPattern.preTrendDir === 1 ? 'bg-gradient-to-r from-[#EF4444] to-[#D4A574]' : 'bg-gradient-to-r from-[#4ADE80] to-[#FFFFFF]'}`}></div>
                <div>
                  <h3 className="text-3xl font-light text-text-primary flex items-center gap-4 tracking-tight">
                    {selectedPattern.title} 
                    <span className="px-3 py-1 bg-accent-gold-muted text-accent-gold type-label rounded-full font-bold animate-pulse">
                      Live Example
                    </span>
                  </h3>
                  <p className="text-xs text-text-secondary font-mono mt-2 flex items-center gap-2">
                    Context: <span className="font-bold text-text-primary">{selectedPattern.exampleStock}</span> 
                    <span className="opacity-50">|</span> Historical Date: <span className="text-accent-gold">{selectedPattern.exampleDate}</span>
                  </p>
                </div>
                <button onClick={() => setSelectedPattern(null)} className="text-text-secondary hover:text-text-primary bg-bg p-3 rounded-full border border-border transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 custom-scrollbar">
                <div className="space-y-6">
                   
                   <div className="h-72 w-full">
                     <SvgChartWidget key={selectedPattern.id || selectedPattern.title} pattern={selectedPattern} />
                   </div>

                   <div className="p-6 bg-bg rounded-[24px] border border-border border-l-4 border-l-[#D4A574]">
                     <p className="type-body text-text-primary/60 leading-relaxed">
                       <span className="font-bold text-text-primary type-label block mb-2">AI Context Engine</span>
                       Reconstructing price action for <strong className="text-text-primary">{selectedPattern.exampleStock}</strong>. Notice how the price breaks out <strong className="text-text-primary">after</strong> the {selectedPattern.title} formation.
                     </p>
                   </div>
                </div>

              <div className="space-y-8">
                <div>
                    <h4 className="text-text-primary font-black text-xs uppercase mb-4 tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">psychology</span> Psychology
                    </h4>
                    <p className="text-text-primary/60 leading-relaxed text-sm bg-bg p-6 rounded-[24px] border border-border">{selectedPattern.desc}</p>
                </div>

                {selectedPattern.caseStudy && (
                  <div className="p-6 bg-accent-gold/5 border border-[#D4A574]/10 rounded-[24px] shadow-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-accent-gold-muted blur-3xl rounded-full"></div>
                      <h4 className="text-accent-gold font-bold mb-4 flex items-center gap-2 type-label relative z-10">
                        <span className="material-symbols-outlined text-[16px]">history_edu</span> Real Market Instance
                      </h4>
                      <div className="text-text-primary/80 text-sm space-y-3 relative z-10 font-mono">
                        {selectedPattern.caseStudy.split('\n').map((line, idx) => (
                          <p key={idx} className={`${line.includes('After:') ? 'text-[#4ADE80]' : line.includes('Before:') ? 'text-[#EF4444]' : 'text-text-primary'}`}>
                            {line}
                          </p>
                        ))}
                      </div>
                  </div>
                )}
                
                <div className="p-6 bg-bg rounded-[24px] border border-border shadow-2">
                    <h4 className="text-text-primary font-bold mb-5 flex items-center gap-2 type-label">
                      <span className="material-symbols-outlined text-[18px] text-accent-gold">query_stats</span> How to trade?
                    </h4>
                    <ul className="text-text-primary/60 text-sm space-y-4">
                      <li className="flex items-start gap-3"><span className="text-accent-gold mt-0.5 font-bold">■</span> Wait for the daily candle to fully close before entering.</li>
                      <li className="flex items-start gap-3"><span className="text-accent-gold mt-0.5 font-bold">■</span> Always look for trading volume confirmation on the breakout.</li>
                      <li className="flex items-start gap-3"><span className="text-accent-gold mt-0.5 font-bold">■</span> Set a strict stop-loss slightly below/above the wick to minimize risk.</li>
                    </ul>
                </div>
                <button onClick={() => navigate('/markets')} className="w-full py-5 bg-accent-gold hover:bg-accent-gold/80 text-[#0B0D10] font-black rounded-lg type-label transition-colors shadow-2 shadow-accent-gold/10 hover-glow">
                    Test in Live Simulator
                </button>
              </div>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppShell>
  );
}

export default Academy;
