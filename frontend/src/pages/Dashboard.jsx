import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import SmartChart, { CandlestickModal } from '../components/SmartChart';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TOP_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL', 'LT', 'AXISBANK'];
const INDICES    = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];
const ALL_SYMBOLS = [...TOP_STOCKS, ...INDICES];

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
  const balanceAfter = activeTab === 'BUY'
    ? balance - estCost
    : balance + estCost;

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
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center backdrop-blur-md z-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#121212]/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl w-full max-w-[900px] overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
          <div className="bg-black/40 w-full md:w-[65%] p-6 border-b md:border-b-0 md:border-r border-white/5 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">{symbol}</h3>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mt-1">{INDICES.includes(symbol) ? 'MARKET INDEX' : 'EQUITY • NSE'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono text-white font-bold">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                <p className={`text-xs font-bold mt-1 ${isGreen ? 'text-green-500' : 'text-red-500'}`}>{isGreen ? '▲' : '▼'} {isGreen ? '+' : ''}{changePercent}% (1D)</p>
              </div>
            </div>
            <div className="flex-1 min-h-[300px] w-full border border-white/5 rounded-2xl overflow-hidden relative bg-[#0e0e0e] group">
              <SmartChart symbol={symbol} currentPrice={currentPrice} isGreen={isGreen} />
              {/* Expand to Candlestick Button */}
              <button
                onClick={() => setShowCandlestick(true)}
                title="Expand as Candlestick Chart"
                className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-[#1a1a1a]/90 border border-white/10 hover:border-white/30 text-white/50 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              >
                <span className="material-symbols-outlined text-[14px]">candlestick_chart</span>
                Candlestick
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-[#171717] p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <span className="text-[10px] uppercase text-white/50 font-bold tracking-widest">Day Low</span>
                <span className="text-sm font-mono text-white/90">₹{dayLow.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="bg-[#171717] p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <span className="text-[10px] uppercase text-white/50 font-bold tracking-widest">Day High</span>
                <span className="text-sm font-mono text-white/90">₹{dayHigh.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-[35%] p-6 flex flex-col bg-transparent">
            <div className="flex justify-end mb-6">
              <button onClick={onClose} className="text-white/40 hover:text-white bg-[#1c1b1b] p-1.5 rounded-xl transition-colors"><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            <div className="flex bg-[#1c1b1b] p-1.5 rounded-2xl mb-8 border border-white/5">
              <button onClick={() => setActiveTab('BUY')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'BUY' ? 'bg-green-500 text-[#003a00] shadow-md' : 'text-white/50 hover:text-white'}`}>Buy</button>
              <button onClick={() => setActiveTab('SELL')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'SELL' ? 'bg-red-500 text-white shadow-md' : 'text-white/50 hover:text-white'}`}>Sell</button>
            </div>
            <form onSubmit={handleExecute} className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center bg-[#0d0d0d] rounded-xl px-4 py-2.5 border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{activeTab === 'BUY' ? 'Max Affordable' : 'Units Owned'}</span>
                  <span className={`text-sm font-black font-mono ${activeTab === 'BUY' ? 'text-green-400' : 'text-blue-400'}`}>{activeTab === 'BUY' ? maxBuyQty.toLocaleString() : ownedQty.toLocaleString()} units</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Quantity (Units)</label>
                    <button type="button" onClick={handleMax} className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors ${activeTab === 'BUY' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'}`}>MAX</button>
                  </div>
                  <input autoFocus type="number" value={qty} onChange={(e) => setQty(e.target.value)} className={`w-full bg-[#0a0a0a] border rounded-2xl p-4 text-white outline-none font-mono text-xl transition-colors ${activeTab === 'BUY' ? 'border-white/10 focus:border-green-500' : 'border-white/10 focus:border-red-500'}`} placeholder="0" required min="1" step="1" />
                </div>
                <div className="p-4 bg-[#171717] rounded-2xl border border-white/5">
                  <span className="block text-[10px] uppercase text-white/50 font-bold tracking-widest mb-1">Limit Price</span>
                  <span className="text-lg font-mono text-white/90">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                </div>
              </div>
              <div className="mt-8">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Est. Margin</span>
                  <span className="text-xl font-black font-mono text-white">₹{(estCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits:2 })}</span>
                </div>
                {numQty > 0 && (
                  <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Balance After</span>
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


function Dashboard() {
  const [userName, setUserName] = useState('');
  const [balance, setBalance] = useState(0);
  const [avatar, setAvatar] = useState('');
  const [holdings, setHoldings] = useState([]);
  const [marketPrices, setMarketPrices] = useState({}); 
  const [newStock, setNewStock] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeMoverTab, setActiveMoverTab] = useState('gainers');
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('paper_watchlist');
    return saved ? JSON.parse(saved) : ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK'];
  });

  useEffect(() => { localStorage.setItem('paper_watchlist', JSON.stringify(watchlist)); }, [watchlist]);

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
        const firstName = data.name ? data.name.split(' ')[0] : 'Trader';
        setUserName(firstName);
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
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: [...TOP_STOCKS, ...INDICES] }),
          signal: abortCtrl.signal,
        });
        if (!response.ok) return;
        const realPrices = await response.json();
        if (!realPrices || typeof realPrices !== 'object' || Array.isArray(realPrices)) return;
        setMarketPrices(prev => ({ ...prev, ...realPrices }));
      } catch (error) {
        if (error.name !== 'AbortError') console.error("Market error");
      }
    };
    
    fetchLivePrices(); 
    const intervalId = setInterval(fetchLivePrices, 10000);
    return () => { clearInterval(intervalId); abortCtrl.abort(); };
  }, []);

  useEffect(() => {
    const handleOpenModal = (e) => setSelectedAsset(e.detail);
    window.addEventListener('open-trade-modal', handleOpenModal);
    return () => window.removeEventListener('open-trade-modal', handleOpenModal);
  }, []);

  const addToWatchlist = (e) => {
    e.preventDefault();
    const sym = newStock.trim().toUpperCase();
    if (sym && ALL_SYMBOLS.includes(sym) && !watchlist.includes(sym)) {
      setWatchlist([...watchlist, sym]);
      setNewStock('');
      toast.success(`${sym} added to Watchlist`);
    } else if (!sym) {
      toast.error('Enter a symbol');
    } else if (!ALL_SYMBOLS.includes(sym)) {
      toast.error('Symbol not found.');
    } else {
      toast.error('Already in watchlist');
    }
  };

  const stocksWithChange = TOP_STOCKS.map(sym => {
    const liveData = marketPrices[sym] || {};
    const price = liveData.price || 0;
    const change = liveData.change || 0;
    return { symbol: sym, price, change, prevClose: liveData.prevClose || price };
  }).sort((a,b) => b.change - a.change);

  const gainers = stocksWithChange.filter(s => s.change >= 0).slice(0, 4);

  const istTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const currentHour = istTime.getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  
  // Ticker items
  const tickerItems = [...INDICES, ...TOP_STOCKS.slice(0, 5)];
  
  // Nifty 50 Chart data
  const mainChartAsset = 'NIFTY 50';
  const mainChartData = marketPrices[mainChartAsset] || {};
  const mainChartIsGreen = (mainChartData.change || 0) >= 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex h-screen bg-[#0B0D10] text-[#E5E5E5] font-sans overflow-hidden selection:bg-[#D4A574]/30">

      <Sidebar userName={userName} balance={balance} isMarketOpen={isMarketOpen} avatar={avatar} />
      <MobileBottomNav />

      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Animated Market Ticker */}
        <div className="w-full bg-[#D4A574] text-[#0B0D10] overflow-hidden whitespace-nowrap py-1.5 shrink-0 flex items-center shadow-[0_0_20px_rgba(212,165,116,0.15)] z-20">
          <div className="flex gap-12 animate-ticker shrink-0 w-max font-mono text-[10px] font-black uppercase tracking-widest px-4">
            {tickerItems.map((sym, i) => {
              const liveData = marketPrices[sym] || {};
              const price = liveData.price || 0;
              const change = liveData.change || 0;
              return (
                <span key={`${sym}-${i}`} className="flex items-center gap-2">
                  <span className="opacity-70">{sym}</span>
                  <span>{price > 0 ? price.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '---'}</span>
                  <span className={change >= 0 ? 'text-[#0B0D10] font-black' : 'text-red-900 font-black'}>{change >= 0 ? '▲' : '▼'}{Math.abs(change).toFixed(2)}%</span>
                </span>
              )
            })}
             {/* Duplicate for infinite seamless scroll */}
             {tickerItems.map((sym, i) => {
              const liveData = marketPrices[sym] || {};
              const price = liveData.price || 0;
              const change = liveData.change || 0;
              return (
                <span key={`dup-${sym}-${i}`} className="flex items-center gap-2">
                  <span className="opacity-70">{sym}</span>
                  <span>{price > 0 ? price.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '---'}</span>
                  <span className={change >= 0 ? 'text-[#0B0D10] font-black' : 'text-red-900 font-black'}>{change >= 0 ? '▲' : '▼'}{Math.abs(change).toFixed(2)}%</span>
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1600px] mx-auto space-y-12">
            
            {/* Header: Typography focused */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-[56px] font-light tracking-tight text-[#E5E5E5] leading-none mb-4">
                  {greeting}, <span className="font-bold">{userName}</span>.
                </motion.h1>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col md:flex-row gap-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#E5E5E5]/40 font-bold mb-1">Available Margin</p>
                    <p className="text-3xl font-mono font-bold text-[#E5E5E5]">
                      ₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                  <div className="hidden md:block w-px h-12 bg-[#2C2E33]" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#E5E5E5]/40 font-bold mb-1">Market Status</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${isMarketOpen ? 'bg-[#4ADE80] animate-pulse shadow-[0_0_10px_#4ADE80]' : 'bg-[#EF4444]'}`} />
                      <p className="text-sm font-bold text-[#E5E5E5]/90">{isMarketOpen ? 'Live Market' : 'AI Synthetic Mode'}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </header>

            {/* Main Asymmetric Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-10">
              
              {/* Massive Live Chart (Col Span 8) */}
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="xl:col-span-8 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-baseline gap-4">
                    <h2 className="text-2xl font-black tracking-tighter text-[#E5E5E5]">{mainChartAsset}</h2>
                    <span className="text-sm font-mono text-[#E5E5E5]/60">₹{mainChartData.price > 0 ? mainChartData.price.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '...'}</span>
                    <span className={`text-sm font-black ${mainChartIsGreen ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>{mainChartIsGreen ? '+' : ''}{mainChartData.change || 0}%</span>
                  </div>
                  <button onClick={() => setSelectedAsset(mainChartAsset)} className="text-xs font-bold text-[#D4A574] hover:text-[#E5E5E5] uppercase tracking-widest transition-colors hover-glow px-3 py-1.5 rounded bg-[#D4A574]/10 border border-[#D4A574]/20">
                    Trade Now
                  </button>
                </div>
                
                {/* Chart Container - No Borders, Floating Depth */}
                <div className="h-[450px] w-full relative bg-gradient-to-b from-[#16181D] to-[#0B0D10] rounded-[24px] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
                  <div className="absolute inset-0 pointer-events-none border border-[#2C2E33]/30 rounded-[24px] z-10" />
                  <SmartChart symbol={mainChartAsset} currentPrice={mainChartData.price} isGreen={mainChartIsGreen} />
                </div>
              </motion.div>

              {/* Watchlist (Col Span 4) */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="xl:col-span-4 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#E5E5E5]/40">Watchlist</h3>
                  <button className="text-[#E5E5E5]/40 hover:text-[#D4A574] transition-colors"><span className="material-symbols-outlined text-[18px]">add</span></button>
                </div>
                
                <div className="flex-1 bg-[#16181D]/30 rounded-[24px] p-2 flex flex-col gap-1">
                  {watchlist.slice(0, 5).map((sym, idx) => {
                    const data = marketPrices[sym] || {};
                    const isUp = (data.change || 0) >= 0;
                    return (
                      <div key={sym} onClick={() => setSelectedAsset(sym)} className="flex items-center justify-between p-4 hover:bg-[#1F2229] rounded-[16px] transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-sm ${isUp ? 'bg-[#4ADE80]/10 text-[#4ADE80]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                            {sym.substring(0, 1)}
                          </div>
                          <div>
                            <p className="font-bold text-[#E5E5E5] group-hover:text-[#D4A574] transition-colors">{sym}</p>
                            <p className="text-[10px] uppercase tracking-widest text-[#E5E5E5]/40 mt-0.5">NSE</p>
                          </div>
                        </div>
                        
                        <div className="hidden sm:block w-20 h-8 opacity-40 group-hover:opacity-100 transition-opacity">
                          <SmartChart symbol={sym} currentPrice={data.price} isGreen={isUp} mini={true} />
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-bold text-[#E5E5E5]">₹{(data.price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                          <p className={`text-[11px] font-bold mt-0.5 ${isUp ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>{isUp ? '+' : ''}{(data.change || 0).toFixed(2)}%</p>
                        </div>
                      </div>
                    )
                  })}
                  {watchlist.length > 5 && (
                     <div className="p-3 text-center text-[#E5E5E5]/30 text-[10px] uppercase font-bold tracking-widest cursor-pointer hover:text-[#E5E5E5]">View all {watchlist.length}</div>
                  )}
                </div>
              </motion.div>

              {/* Lower Section Asymmetry: Portfolio (5) and Market Insight (7) */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="xl:col-span-5 bg-[#16181D] rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <span className="material-symbols-outlined text-[100px]">pie_chart</span>
                 </div>
                 <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#E5E5E5]/40 mb-6">Positions Overview</h3>
                 {holdings.length === 0 ? (
                    <div className="py-10 text-[#E5E5E5]/30 text-sm font-medium">No open positions.</div>
                 ) : (
                    <div className="space-y-4">
                      {holdings.slice(0,3).map((h, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-[#2C2E33]/50 pb-4 last:border-0">
                           <div>
                             <p className="font-bold text-[#E5E5E5]">{h.symbol}</p>
                             <p className="text-xs text-[#E5E5E5]/50 mt-1">{h.quantity} units</p>
                           </div>
                           <div className="text-right">
                             <p className="font-mono text-[#E5E5E5]">Avg ₹{h.avgPrice.toLocaleString('en-IN')}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                 )}
                 <button onClick={() => navigate('/portfolio')} className="mt-8 text-xs font-bold text-[#D4A574] uppercase tracking-widest hover:text-[#E5E5E5] transition-colors flex items-center gap-1">
                   View Full Portfolio <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                 </button>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="xl:col-span-7 bg-[#D4A574] rounded-[32px] p-8 shadow-[0_20px_40px_-15px_rgba(212,165,116,0.3)] text-[#0B0D10] relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-[#ffffff]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                 <div className="flex items-center gap-3 mb-6 relative z-10">
                   <span className="material-symbols-outlined text-[24px]">insights</span>
                   <h3 className="text-xs uppercase tracking-[0.2em] font-black text-[#0B0D10]/60">Trade of the Day</h3>
                 </div>
                 <div className="relative z-10">
                   <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-snug mb-4">
                     <span className="font-black">{gainers[0]?.symbol || 'MARKETS'}</span> showing strong momentum with <span className="font-bold text-green-900">{gainers[0]?.change.toFixed(2) || 'bullish'}%</span> upside.
                   </h2>
                   <p className="text-[#0B0D10]/70 font-medium max-w-lg mb-8">
                     Our AI sentiment engine detects institutional accumulation. Consider watching key breakout levels in the next 15 minutes.
                   </p>
                   <button onClick={() => setSelectedAsset(gainers[0]?.symbol || 'NIFTY 50')} className="bg-[#0B0D10] text-[#D4A574] px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#16181D] hover-lift transition-all shadow-xl">
                     Analyze Asset
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

export default Dashboard;
