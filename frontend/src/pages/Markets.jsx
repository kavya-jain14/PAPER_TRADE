import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import TradeModal from '../components/TradeModal';
import useMarketStatus from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TOP_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL', 'LT', 'AXISBANK'];
const INDICES = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];

const SECTOR_MAP = {
  'RELIANCE': 'Energy',
  'TCS': 'Tech',
  'INFY': 'Tech',
  'HDFCBANK': 'Banking',
  'ICICIBANK': 'Banking',
  'SBIN': 'Banking',
  'AXISBANK': 'Banking',
  'ITC': 'FMCG',
  'BHARTIARTL': 'Telecom',
  'LT': 'Infra'
};

const SECTORS = ['All', 'Banking', 'Tech', 'Energy', 'FMCG', 'Infra', 'Telecom'];

// 📈 PREMIUM AREA SPARKLINE COMPONENT
const Sparkline = ({ data, color, width = 80, height = 24 }) => {
  if (!data || data.length < 2) return <div style={{width, height}} className="animate-pulse bg-[#222222] rounded-md"></div>;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const pointsArray = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / range) * height}`);
  const linePath = pointsArray.join(' L ');
  const areaPath = `M ${linePath} L ${width},${height} L 0,${height} Z`;
  const gradientId = `sparkline-gradient-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={`M ${linePath}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

function Markets() {
  const [userName, setUserName] = useState('');
  const [balance, setBalance] = useState(0);
  const [avatar, setAvatar] = useState('');
  const [holdings, setHoldings] = useState([]); 
  const [marketPrices, setMarketPrices] = useState({});
  const [priceHistory, setPriceHistory] = useState({}); 
  const [selectedAsset, setSelectedAsset] = useState(null);

  
  // Phase 6 States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortBy, setSortBy] = useState('change');
  const [sortOrder, setSortOrder] = useState('desc');

  const [watchlist] = useState(() => {
    const saved = localStorage.getItem('paper_watchlist');
    return saved ? JSON.parse(saved) : ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK'];
  });

  const navigate = useNavigate();
  const isMarketOpen = useMarketStatus();
  const token = localStorage.getItem('token');

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/getuser`, {
        method: "GET", headers: { "Content-Type": "application/json", "auth-token": token }
      });
      const data = await response.json();
      if (response.ok) {
        setUserName(data.name ? data.name.split(' ')[0] : 'Trader');
        setAvatar(data.avatar || '');
        setBalance(data.virtualBalance !== undefined ? data.virtualBalance : data.balance || 0);
      }

      try {
        const portRes = await fetch(`${API_URL}/api/trade/portfolio`, {
          headers: { "Content-Type": "application/json", "auth-token": token }
        });
        if (portRes.ok) {
          const portData = await portRes.json();
          setHoldings(portData || []);
        }
      } catch { /* ignore */ }
    } catch (error) { console.error(error); }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchUserData();
  }, [token, navigate, fetchUserData]);



  useEffect(() => {
    let abortCtrl = new AbortController();

    const fetchLivePrices = async () => {
      abortCtrl.abort();
      abortCtrl = new AbortController();
      try {
        const response = await fetch(`${API_URL}/api/trade/live-prices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: [...TOP_STOCKS, ...INDICES] }),
          signal: abortCtrl.signal,
        });
        if (!response.ok) return; 
        const realPrices = await response.json();

        if (!realPrices || typeof realPrices !== 'object' || Array.isArray(realPrices)) return;

        setMarketPrices(prev => ({ ...prev, ...realPrices }));
        
        setPriceHistory(prev => {
          const updated = { ...prev };
          Object.keys(realPrices).forEach(sym => {
            const p = realPrices[sym]?.price;
            if (!p) return;
            const existing = updated[sym] || [];
            updated[sym] = [...existing.slice(-19), p]; 
          });
          return updated;
        });
      } catch (error) {
        if (error.name !== 'AbortError') console.error("Market fetch error");
      }
    };
    
    fetchLivePrices(); 
    const intervalId = setInterval(fetchLivePrices, 5000); 
    return () => { clearInterval(intervalId); abortCtrl.abort(); };
  }, []);

  useEffect(() => {
    const handleOpenModal = (e) => setSelectedAsset(e.detail);
    window.addEventListener('open-trade-modal', handleOpenModal);
    return () => window.removeEventListener('open-trade-modal', handleOpenModal);
  }, []);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const filteredStocks = TOP_STOCKS.filter(sym => {
    const matchesSearch = sym.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'All' || SECTOR_MAP[sym] === selectedSector;
    return matchesSearch && matchesSector;
  }).map(sym => {
    const data = marketPrices[sym] || {};
    return {
      symbol: sym,
      sector: SECTOR_MAP[sym],
      price: data.price || 0,
      change: data.change || 0
    };
  });

  filteredStocks.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'symbol') cmp = a.symbol.localeCompare(b.symbol);
    if (sortBy === 'sector') cmp = a.sector.localeCompare(b.sector);
    if (sortBy === 'price') cmp = a.price - b.price;
    if (sortBy === 'change') cmp = a.change - b.change;
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // Calculate Sector Heatmap Data
  const sectorPerformance = {};
  TOP_STOCKS.forEach(sym => {
    const s = SECTOR_MAP[sym];
    const change = marketPrices[sym]?.change || 0;
    if (!sectorPerformance[s]) sectorPerformance[s] = { total: 0, count: 0 };
    sectorPerformance[s].total += change;
    sectorPerformance[s].count += 1;
  });
  const sectorHeatmap = Object.keys(sectorPerformance).map(s => ({
    sector: s,
    avgChange: sectorPerformance[s].total / sectorPerformance[s].count
  })).sort((a, b) => b.avgChange - a.avgChange);

  return (
    <AppShell userName={userName} isMarketOpen={isMarketOpen} avatar={avatar}>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-24">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
              <div>
                <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="type-h2 mb-1">
                  Markets
                </motion.h1>
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-positive animate-pulse' : 'bg-negative'}`} />
                  <p className="type-caption uppercase tracking-widest">{isMarketOpen ? 'Live Market Data' : 'AI Synthetic Mode'}</p>
                </motion.div>
              </div>
            </header>

            {/* Top Indices Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {INDICES.map((idx, i) => {
                const data = marketPrices[idx] || {};
                const isUp = (data.change || 0) >= 0;
                return (
                  <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y:0}} transition={{delay: 0.2 + (i * 0.05)}} key={idx} onClick={() => setSelectedAsset(idx)} className="bg-surface border border-border rounded-lg p-4 shadow-1 cursor-pointer hover:border-border-strong transition-colors group flex items-center justify-between">
                    <div>
                      <p className="type-label text-text-secondary group-hover:text-text-primary transition-colors">{idx}</p>
                      <p className="type-data-lg mt-1 text-text-primary">₹{(data.price || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className={`px-2 py-0.5 rounded text-[11px] font-bold ${isUp ? 'bg-positive-muted type-positive' : 'bg-negative-muted type-negative'}`}>
                        {isUp ? '+' : ''}{(data.change || 0).toFixed(2)}%
                      </div>
                      <div className="mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                         <Sparkline data={priceHistory[idx] || []} color={isUp ? '#22C55E' : '#F43F5E'} width={60} height={20} />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Actions Bar (Search & Filters) */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface-raised border border-border rounded-lg p-2 shadow-1">
              <div className="relative w-full md:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-tertiary" style={{fontSize: '18px'}}>search</span>
                <input 
                  type="text" 
                  placeholder="Search symbol..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 type-body text-text-primary outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                />
              </div>
              
              <div className="flex gap-1 overflow-x-auto custom-scrollbar w-full md:w-auto px-1">
                {SECTORS.map(sector => (
                  <button 
                    key={sector} 
                    onClick={() => setSelectedSector(sector)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedSector === sector ? 'bg-text-primary text-bg' : 'bg-transparent text-text-secondary hover:bg-surface border border-transparent hover:border-border'}`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column (Dense Table) */}
              <div className="xl:col-span-8 flex flex-col">
                <div className="bg-surface border border-border rounded-lg shadow-1 overflow-hidden flex flex-col flex-1">
                  
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 p-3 border-b border-border bg-surface-raised/50 type-label text-text-secondary select-none">
                    <div className="col-span-3 flex items-center cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('symbol')}>
                      SYMBOL {sortBy === 'symbol' && <span className="material-symbols-outlined ml-1" style={{fontSize: '14px'}}>{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                    </div>
                    <div className="col-span-2 hidden md:flex items-center cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('sector')}>
                      SECTOR {sortBy === 'sector' && <span className="material-symbols-outlined ml-1" style={{fontSize: '14px'}}>{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                    </div>
                    <div className="col-span-3 text-right flex items-center justify-end cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('price')}>
                      PRICE {sortBy === 'price' && <span className="material-symbols-outlined ml-1" style={{fontSize: '14px'}}>{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('change')}>
                      CHANGE {sortBy === 'change' && <span className="material-symbols-outlined ml-1" style={{fontSize: '14px'}}>{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                    </div>
                    <div className="col-span-2 text-center hidden md:block">TREND</div>
                  </div>

                  {/* Table Body */}
                  <div className="flex-1 overflow-y-auto min-h-[400px]">
                    {filteredStocks.length === 0 ? (
                      <div className="p-8 text-center type-caption-muted">No equities match your criteria.</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {filteredStocks.map((stock) => {
                          const isUp = stock.change >= 0;
                          return (
                            <div key={stock.symbol} onClick={() => setSelectedAsset(stock.symbol)} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-surface-raised transition-colors cursor-pointer group">
                              <div className="col-span-5 md:col-span-3 flex items-center gap-3">
                                <div className="w-6 h-6 rounded-md bg-surface-overlay border border-border flex items-center justify-center type-label text-text-primary font-bold">
                                  {stock.symbol.charAt(0)}
                                </div>
                                <div>
                                  <p className="type-body font-medium text-text-primary group-hover:text-accent transition-colors">{stock.symbol}</p>
                                </div>
                              </div>
                              <div className="col-span-2 hidden md:block">
                                <span className="type-caption text-text-tertiary px-2 py-0.5 rounded bg-surface-overlay border border-border">{stock.sector}</span>
                              </div>
                              <div className="col-span-4 md:col-span-3 text-right">
                                <p className="type-data-md text-text-primary">₹{stock.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                              </div>
                              <div className="col-span-3 md:col-span-2 text-right">
                                <p className={`type-data-sm ${isUp ? 'type-positive' : 'type-negative'}`}>{isUp ? '+' : ''}{stock.change.toFixed(2)}%</p>
                              </div>
                              <div className="col-span-2 hidden md:flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity gap-2">
                                <Sparkline data={priceHistory[stock.symbol] || []} color={isUp ? '#22C55E' : '#F43F5E'} width={60} height={20} />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/terminal/${encodeURIComponent(stock.symbol)}`); }}
                                  className="ml-2 p-1 rounded hover:bg-surface-overlay text-text-tertiary hover:text-accent transition-colors"
                                  title="Open Pro Terminal"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 'var(--icon-sm)' }}>open_in_new</span>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (Insights) */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                
                {/* Sector Heatmap */}
                <div className="bg-surface border border-border rounded-lg p-5 shadow-1">
                  <h3 className="type-label mb-4">Sector Heatmap</h3>
                  <div className="space-y-4">
                    {sectorHeatmap.map(s => {
                      const isUp = s.avgChange >= 0;
                      // Normalize width between 10% and 100% based on absolute change magnitude (max roughly 3%)
                      const absChange = Math.abs(s.avgChange);
                      const barWidth = Math.min(Math.max(absChange * 30, 10), 100); 
                      
                      return (
                        <div key={s.sector}>
                          <div className="flex justify-between items-center mb-1">
                            <p className="type-caption text-text-secondary">{s.sector}</p>
                            <p className={`type-data-sm ${isUp ? 'type-positive' : 'type-negative'}`}>{isUp ? '+' : ''}{s.avgChange.toFixed(2)}%</p>
                          </div>
                          <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${isUp ? 'bg-positive' : 'bg-negative'}`} 
                              style={{ width: `${barWidth}%`, opacity: 0.8 + (absChange/10) }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Watchlist Quick View */}
                <div className="bg-surface border border-border rounded-lg p-5 shadow-1 flex flex-col flex-1">
                  <h3 className="type-label mb-4">Your Watchlist</h3>
                  <div className="divide-y divide-border -mx-5 px-5">
                    {watchlist.length === 0 ? (
                      <p className="type-caption-muted py-4 text-center">Watchlist empty.</p>
                    ) : (
                      watchlist.map(sym => {
                        const data = marketPrices[sym] || {};
                        const isUp = (data.change || 0) >= 0;
                        return (
                          <div key={sym} onClick={() => setSelectedAsset(sym)} className="flex items-center justify-between py-3 cursor-pointer group hover:bg-surface-raised transition-colors -mx-5 px-5">
                            <p className="type-body font-medium text-text-secondary group-hover:text-text-primary transition-colors">{sym}</p>
                            <div className="text-right">
                               <p className="type-data-sm text-text-primary">₹{(data.price || 0).toLocaleString('en-IN')}</p>
                               <p className={`type-caption ${isUp ? 'type-positive' : 'type-negative'}`}>{isUp ? '+' : ''}{(data.change || 0).toFixed(2)}%</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
         {selectedAsset && (
         <TradeModal 
            symbol={selectedAsset} 
            marketData={marketPrices[selectedAsset] || {}} 
            onClose={() => setSelectedAsset(null)} 
            balance={balance} token={token} onSuccess={fetchUserData}
            ownedQty={holdings.find(h => h.symbol === selectedAsset)?.quantity || 0}
         />
         )}
      </AnimatePresence>
    </AppShell>
  );
}

export default Markets;
