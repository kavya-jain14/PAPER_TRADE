import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import SmartChart, { CandlestickModal } from '../components/SmartChart';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';

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

// 📊 UNIVERSAL PRO-TRADE MODAL — caramel theme
const UniversalTradeModal = ({ symbol, marketData, onClose, balance, token, refreshData, ownedQty = 0 }) => {
  const [qty, setQty]                 = useState('');
  const [activeTab, setActiveTab]     = useState('BUY');
  const [showCandlestick, setShowCandlestick] = useState(false);

  const currentPrice  = marketData?.price || 0;
  const changePercent = marketData?.change || 0;
  const dayHigh       = marketData?.high || currentPrice;
  const dayLow        = marketData?.low  || currentPrice;
  const isGreen       = changePercent >= 0;

  const numQty       = Number(qty) || 0;
  const estCost      = numQty * currentPrice;
  const balanceAfter = activeTab === 'BUY' ? balance - estCost : balance + estCost;

  const maxBuyQty = currentPrice > 0 ? Math.floor(balance / currentPrice) : 0;
  const handleMax = () => setQty(String(activeTab === 'BUY' ? maxBuyQty : ownedQty));

  const handleExecute = async (e) => {
    e.preventDefault();
    const numQty = Number(qty);
    if (!numQty || numQty <= 0 || !Number.isInteger(numQty)) return toast.error('Enter a valid whole number quantity.');
    const cost = numQty * currentPrice;
    if (activeTab === 'BUY' && cost > balance) return toast.error('Insufficient Funds!');
    if (activeTab === 'SELL' && numQty > ownedQty) return toast.error(`You only own ${ownedQty} units!`);
    
    const endpoint = activeTab === 'BUY' ? '/api/trade/buy' : '/api/trade/sell';
    const tid = toast.loading(`Routing ${activeTab} Order...`);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json", "auth-token": token },
        body: JSON.stringify({ symbol, quantity: numQty, currentPrice })
      });
      const d = await res.json();
      if (res.ok) { toast.success('Order Filled!', { id: tid }); refreshData(); onClose(); }
      else { toast.error(d.message || 'Order failed', { id: tid }); }
    } catch (err) { toast.error('Network Error', { id: tid }); }
  };

  return (
    <>
      {showCandlestick && (
        <CandlestickModal symbol={symbol} isGreen={isGreen} onClose={() => setShowCandlestick(false)} />
      )}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center backdrop-blur-md z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0A0A0A]/90 backdrop-blur-2xl rounded-3xl border border-[#222222] shadow-2xl w-full max-w-[900px] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          style={{ boxShadow: '0 0 60px rgba(255,255,255,0.08)' }}
        >
          {/* Left — chart panel */}
          <div className="bg-[#000000]/60 w-full md:w-[65%] p-6 border-b md:border-b-0 md:border-r border-[#222222] flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-black text-[#E5E5E5] tracking-tight">{symbol}</h3>
                <p className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-widest font-bold mt-1">{INDICES.includes(symbol) ? 'MARKET INDEX' : 'EQUITY • NSE'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono text-[#E5E5E5] font-bold">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                <p className={`text-xs font-bold mt-1 ${isGreen ? 'text-green-500' : 'text-red-500'}`}>{isGreen ? '▲' : '▼'} {isGreen ? '+' : ''}{changePercent}% (1D)</p>
              </div>
            </div>
            <div className="flex-1 min-h-[300px] w-full border border-[#222222] rounded-2xl overflow-hidden relative bg-[#000000] group">
              <SmartChart symbol={symbol} currentPrice={currentPrice} isGreen={isGreen} />
              <button
                onClick={() => setShowCandlestick(true)}
                title="Expand as Candlestick Chart"
                className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-[#141414]/90 border border-[#222222] hover:border-[#FFFFFF]/40 text-[#E5E5E5]/50 hover:text-[#E5E5E5] px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              >
                <span className="material-symbols-outlined text-[14px]">candlestick_chart</span>
                Candlestick
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-[#141414] p-4 rounded-2xl border border-[#222222] flex justify-between items-center">
                <span className="text-[10px] uppercase text-[#E5E5E5]/50 font-bold tracking-widest">Day Low</span>
                <span className="text-sm font-mono text-[#E5E5E5]/90">₹{dayLow.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="bg-[#141414] p-4 rounded-2xl border border-[#222222] flex justify-between items-center">
                <span className="text-[10px] uppercase text-[#E5E5E5]/50 font-bold tracking-widest">Day High</span>
                <span className="text-sm font-mono text-[#E5E5E5]/90">₹{dayHigh.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          {/* Right — trade panel */}
          <div className="w-full md:w-[35%] p-6 flex flex-col bg-transparent">
            <div className="flex justify-end mb-6">
              <button onClick={onClose} className="text-[#E5E5E5]/40 hover:text-[#E5E5E5] bg-[#141414] p-1.5 rounded-xl transition-colors border border-[#222222]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex bg-[#141414] p-1.5 rounded-2xl mb-8 border border-[#222222]">
              <button onClick={() => setActiveTab('BUY')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'BUY' ? 'bg-green-500 text-[#003a00] shadow-md' : 'text-[#E5E5E5]/50 hover:text-[#E5E5E5]'}`}>Buy</button>
              <button onClick={() => setActiveTab('SELL')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'SELL' ? 'bg-red-500 text-white shadow-md' : 'text-[#E5E5E5]/50 hover:text-[#E5E5E5]'}`}>Sell</button>
            </div>
            <form onSubmit={handleExecute} className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                {/* Available Units Chip */}
                <div className="flex justify-between items-center bg-[#000000] rounded-xl px-4 py-2.5 border border-[#222222]">
                  <span className="text-[10px] text-[#E5E5E5]/40 uppercase tracking-widest font-bold">{activeTab === 'BUY' ? 'Max Affordable' : 'Units Owned'}</span>
                  <span className={`text-sm font-black font-mono ${activeTab === 'BUY' ? 'text-green-400' : 'text-blue-400'}`}>{activeTab === 'BUY' ? maxBuyQty.toLocaleString() : ownedQty.toLocaleString()} units</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[#E5E5E5]/50 text-[10px] uppercase tracking-widest font-bold">Quantity (Units)</label>
                    <button type="button" onClick={handleMax} className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors ${activeTab === 'BUY' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'}`}>MAX</button>
                  </div>
                  <input
                    autoFocus
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className={`w-full bg-[#000000] border rounded-2xl p-4 text-[#E5E5E5] outline-none font-mono text-xl transition-colors ${activeTab === 'BUY' ? 'border-[#222222] focus:border-green-500' : 'border-[#222222] focus:border-red-500'}`}
                    placeholder="0" required min="1" step="1"
                  />
                </div>
                <div className="p-4 bg-[#141414] rounded-2xl border border-[#222222]">
                  <span className="block text-[10px] uppercase text-[#E5E5E5]/50 font-bold tracking-widest mb-1">Limit Price</span>
                  <span className="text-lg font-mono text-[#E5E5E5]/90">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                </div>
              </div>
              <div className="mt-8">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[10px] font-bold text-[#E5E5E5]/50 uppercase tracking-widest">Est. Margin</span>
                  <span className="text-xl font-black font-mono text-[#E5E5E5]">₹{(estCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits:2 })}</span>
                </div>
                {numQty > 0 && (
                  <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-[10px] font-bold text-[#E5E5E5]/30 uppercase tracking-widest">Balance After</span>
                    <span className={`text-sm font-black font-mono ${balanceAfter >= 0 ? 'text-green-400/80' : 'text-red-400'}`}>
                      ₹{Math.max(0, balanceAfter).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <button type="submit" className={`w-full py-4 font-black rounded-2xl uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] text-sm ${activeTab === 'BUY' ? 'bg-green-500 text-[#003a00]' : 'bg-red-500 text-white'}`}>
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen bg-[#0B0D10] text-[#E5E5E5] font-sans overflow-hidden selection:bg-[#D4A574]/30"
    >
      <Sidebar userName={userName} balance={balance} isMarketOpen={isMarketOpen} avatar={avatar} />
      <MobileBottomNav />

      <main className="flex-1 flex flex-col min-w-0 relative h-full">
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
      </main>

      <AnimatePresence>
         {selectedAsset && (
         <UniversalTradeModal 
            symbol={selectedAsset} 
            marketData={marketPrices[selectedAsset] || {}} 
            onClose={() => setSelectedAsset(null)} 
            balance={balance} token={token} refreshData={fetchUserData}
            ownedQty={holdings.find(h => h.symbol === selectedAsset)?.quantity || 0}
         />
         )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Markets;
