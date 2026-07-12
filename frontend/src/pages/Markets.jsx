import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import SmartChart from '../components/SmartChart';
import { AppShell } from '../components/AppShell';
import TradeModal from '../components/TradeModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TOP_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL', 'LT', 'AXISBANK'];
const INDICES = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];

// 📈 PREMIUM AREA SPARKLINE COMPONENT
const Sparkline = ({ data, color, width = 100, height = 30 }) => {
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
  const [isMarketOpen, setIsMarketOpen] = useState(false); 
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const checkMarketStatus = () => {
      const istTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = istTime.getDay();
      const timeInMinutes = istTime.getHours() * 60 + istTime.getMinutes();
      setIsMarketOpen(day >= 1 && day <= 5 && timeInMinutes >= 555 && timeInMinutes < 930);
    };
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchUserData();
  }, [token, navigate]);

  const fetchUserData = async () => {
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
      } catch (_) {}
    } catch (error) { console.error(error); }
  };

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

  const stocksWithData = TOP_STOCKS.map(sym => {
    const data = marketPrices[sym] || {};
    return { symbol: sym, price: data.price || 0, change: data.change || 0, prevClose: data.prevClose || 0 };
  });

  const topMovers = [...stocksWithData].sort((a,b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6);

  return (
    <AppShell userName={userName} isMarketOpen={isMarketOpen} avatar={avatar}>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1600px] mx-auto space-y-12">
            
            {/* Massive Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-[56px] font-light tracking-tight text-[#E5E5E5] leading-none mb-4">
                  Market <span className="font-bold">Overview</span>.
                </motion.h1>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isMarketOpen ? 'bg-[#4ADE80] animate-pulse shadow-[0_0_10px_#4ADE80]' : 'bg-[#EF4444]'}`} />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5E5E5]/40">{isMarketOpen ? 'Live Market' : 'AI Synthetic Mode'}</p>
                </motion.div>
              </div>
            </header>

            {/* Asymmetric Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-10">
              
              {/* Massive Movers Section (Col Span 8) */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="xl:col-span-8 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#E5E5E5]/40">Top Market Movers</h3>
                </div>
                
                <div className="flex-1 bg-[#16181D]/30 rounded-[24px] p-2 flex flex-col gap-1">
                  {topMovers.map((stock) => {
                    const isUp = stock.change >= 0;
                    return (
                      <div key={stock.symbol} onClick={() => setSelectedAsset(stock.symbol)} className="flex items-center justify-between p-4 hover:bg-[#1F2229] rounded-[16px] transition-colors cursor-pointer group">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center font-bold text-lg ${isUp ? 'bg-[#4ADE80]/10 text-[#4ADE80]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                            {stock.symbol.substring(0, 1)}
                          </div>
                          <div>
                            <p className="text-lg font-bold text-[#E5E5E5] group-hover:text-[#D4A574] transition-colors tracking-tight">{stock.symbol}</p>
                            <p className="text-[10px] uppercase tracking-widest text-[#E5E5E5]/40 mt-1">NSE Equity</p>
                          </div>
                        </div>
                        
                        <div className="hidden md:block">
                           <Sparkline data={priceHistory[stock.symbol] || []} color={isUp ? '#4ADE80' : '#EF4444'} width={120} height={40} />
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-mono font-bold text-[#E5E5E5]">₹{stock.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                          <p className={`text-[12px] font-bold mt-1 ${isUp ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>{isUp ? '+' : ''}{stock.change.toFixed(2)}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Indices (Col Span 4) */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="xl:col-span-4 flex flex-col gap-6">
                
                <div className="bg-[#D4A574] rounded-[32px] p-8 shadow-[0_20px_40px_-15px_rgba(212,165,116,0.3)] text-[#0B0D10] relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-[#ffffff]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                   <h3 className="text-xs uppercase tracking-[0.2em] font-black text-[#0B0D10]/60 mb-6">Market Barometer</h3>
                   
                   <div className="space-y-6 relative z-10">
                     {INDICES.map(idx => {
                        const data = marketPrices[idx] || {};
                        const isUp = (data.change || 0) >= 0;
                        return (
                          <div key={idx} onClick={() => setSelectedAsset(idx)} className="cursor-pointer hover:-translate-y-[2px] transition-transform">
                             <p className="font-black text-lg mb-1">{idx}</p>
                             <div className="flex items-end justify-between">
                               <p className="font-mono font-bold text-2xl">₹{(data.price || 0).toLocaleString('en-IN')}</p>
                               <p className={`text-sm font-bold px-2 py-1 rounded bg-[#0B0D10]/10 ${isUp ? 'text-[#004d00]' : 'text-red-900'}`}>{isUp ? '+' : ''}{(data.change || 0).toFixed(2)}%</p>
                             </div>
                          </div>
                        )
                     })}
                   </div>
                </div>

                <div className="bg-[#16181D] rounded-[32px] p-8 flex-1">
                   <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#E5E5E5]/40 mb-6">Quick Trade</h3>
                   <p className="text-[#E5E5E5]/60 text-sm mb-6">Select any asset to open the Pro Terminal or use the button below to browse all equities.</p>
                   <button className="w-full bg-[#E5E5E5]/5 hover:bg-[#E5E5E5]/10 border border-[#E5E5E5]/10 text-[#E5E5E5] py-4 rounded-full font-bold uppercase tracking-widest text-xs transition-colors hover-glow">
                     Browse All Stocks
                   </button>
                </div>
              </motion.div>

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
