import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import SmartChart from '../components/SmartChart';
import Sidebar from '../components/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TOP_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL', 'LT', 'AXISBANK'];
const INDICES = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];

const UniversalTradeModal = ({ symbol, marketData, onClose, balance, token, refreshData, ownedQty = 0 }) => {
  const [qty, setQty] = useState('');
  const [activeTab, setActiveTab] = useState('BUY');

  const currentPrice = marketData?.price || 0;
  const changePercent = marketData?.change || 0;
  const dayHigh = marketData?.high || currentPrice;
  const dayLow = marketData?.low || currentPrice;
  const isGreen = changePercent >= 0; 

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center backdrop-blur-md z-50 p-4 font-inter">
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
              {/* Available Units Chip */}
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
              <div className="flex justify-between items-center mb-6 px-1">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Est. Margin</span>
                <span className="text-xl font-black font-mono text-white">₹{(Number(qty) * currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits:2 })}</span>
              </div>
              <button type="submit" className={`w-full py-4 font-black rounded-2xl uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] text-sm ${activeTab === 'BUY' ? 'bg-green-500 text-[#003a00]' : 'bg-red-500 text-white'}`}>
                Place Order
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
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
    const fetchLivePrices = async () => {
      try {
        const response = await fetch(`${API_URL}/api/trade/live-prices`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: [...TOP_STOCKS, ...INDICES] })
        });
        const realPrices = await response.json();
        setMarketPrices(prev => ({ ...prev, ...realPrices }));
      } catch (error) { console.error("Market error"); }
    };
    
    fetchLivePrices(); 
    const intervalId = setInterval(fetchLivePrices, 5000); 
    return () => clearInterval(intervalId);
  }, []);

  // Global listener for Command Palette Trade Action
  useEffect(() => {
    const handleOpenModal = (e) => setSelectedAsset(e.detail);
    window.addEventListener('open-trade-modal', handleOpenModal);
    return () => window.removeEventListener('open-trade-modal', handleOpenModal);
  }, []);

  const addToWatchlist = (e) => {
    e.preventDefault();
    if(newStock && TOP_STOCKS.includes(newStock.toUpperCase()) && !watchlist.includes(newStock.toUpperCase())) {
      setWatchlist([...watchlist, newStock.toUpperCase()]);
      setNewStock('');
      toast.success(`${newStock.toUpperCase()} added to Watchlist`);
    } else {
      toast.error("Invalid or duplicate symbol");
    }
  };

  const [sentiment, setSentiment] = useState({ zone: 'neutral', globalScore: 50 });
  
  useEffect(() => {
    const activeGainers = TOP_STOCKS.filter(sym => {
      const liveData = marketPrices[sym] || {};
      return (liveData.change || 0) >= 0;
    }).length;

    const marketStrength = activeGainers / TOP_STOCKS.length; 
    const score = Math.round(marketStrength * 100) || 50;
    
    let sZone = 'neutral';
    if (score <= 33) sZone = 'bearish';
    else if (score >= 67) sZone = 'bullish';
    
    setSentiment({ zone: sZone, globalScore: score });
  }, [marketPrices]);

  const needleLeft = sentiment.globalScore;

  // ── Dynamic News Engine ──
  const newsImages = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80',
    'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=400&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
    'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&q=80',
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&q=80',
  ];
  const buildNewsFeed = () => {
    const all = Object.entries(marketPrices).map(([sym, d]) => ({ sym, change: d?.change || 0, price: d?.price || 0 }));
    const sorted = [...all].sort((a, b) => b.change - a.change);
    const topGainer = sorted[0]; const topLoser = sorted[sorted.length - 1];
    const feed = [];
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hm = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} IST`;
    if (topGainer?.change > 0) feed.push({ title: `${topGainer.sym} surges ${topGainer.change.toFixed(2)}% — Bulls accelerate buying momentum`, time: `Updated ${hm}`, link: 'https://www.moneycontrol.com/', img: newsImages[0], tag: 'GAINER' });
    if (topLoser?.change < 0) feed.push({ title: `${topLoser.sym} falls ${Math.abs(topLoser.change).toFixed(2)}% — Profit booking & sector headwinds weigh on price`, time: `Updated ${hm}`, link: 'https://economictimes.indiatimes.com/', img: newsImages[1], tag: 'LOSER' });
    const extra = [
      { title: 'FIIs net buyers for 3rd session; Nifty Bank eyes fresh highs above key resistance', time: 'Market Outlook', link: 'https://www.livemint.com/', img: newsImages[2], tag: 'FII' },
      { title: `India VIX ${sentiment.zone === 'Fearful' ? 'spikes — uncertainty rising' : 'cools — market confidence returning'} ahead of data`, time: 'Volatility', link: 'https://www.nseindia.com/', img: newsImages[3], tag: 'VIX' },
      { title: 'RBI policy minutes: Rates steady, liquidity support continues for markets', time: 'Policy', link: 'https://www.livemint.com/', img: newsImages[4], tag: 'RBI' },
    ];
    return [...feed, ...extra].slice(0, 5);
  };
  const newsFeed = Object.keys(marketPrices).length > 0 ? buildNewsFeed() : [{ title: 'Fetching live market news...', time: 'Loading', link: '#', img: newsImages[0], tag: 'LIVE' }];


  const stocksWithChange = TOP_STOCKS.map(sym => {
    const liveData = marketPrices[sym] || {};
    const price = liveData.price || 0;
    const change = liveData.change || 0;
    return { symbol: sym, price, change, prevClose: liveData.prevClose || price };
  }).sort((a,b) => b.change - a.change);

  const gainers = stocksWithChange.filter(s => s.change >= 0).slice(0, 4);
  const losers = stocksWithChange.filter(s => s.change < 0).reverse().slice(0, 4);

  const istTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const currentHour = istTime.getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="flex h-screen bg-[#0a0a0a] text-white/90 font-inter overflow-hidden selection:bg-green-500/30">

      <Sidebar userName={userName} balance={balance} isMarketOpen={isMarketOpen} avatar={avatar} />

      {/* 🔴 MAIN DASHBOARD */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          
          <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">{greeting}, {userName}</h2>
              <p className="text-white/60 text-sm mt-1">Available Margin: <span className="text-[#3de530] font-mono font-bold text-base">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></p>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 xl:pb-0 custom-scrollbar">
              {INDICES.map((idx) => {
                const liveData = marketPrices[idx] || {};
                const p = liveData.price || 0;
                const cPercent = liveData.change || 0;
                const isGreen = cPercent >= 0;
                
                return (
                  <div key={idx} onClick={() => setSelectedAsset(idx)} className="bg-[#121212] border border-white/5 rounded-2xl p-5 flex justify-between items-center min-w-[240px] cursor-pointer hover:border-white/20 transition-all shadow-md group">
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">{idx}</p>
                      <p className="text-lg font-bold font-mono text-white mt-1">{p > 0 ? p.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}</p>
                      <p className={`text-[11px] font-bold mt-0.5 ${isGreen ? 'text-green-500' : 'text-red-500'}`}>{isGreen ? '▲' : '▼'} {isGreen ? '+' : ''}{cPercent}%</p>
                    </div>
                    <div className="opacity-70 group-hover:opacity-100 transition-opacity w-[90px] h-[40px] relative pointer-events-none">
                      <SmartChart symbol={idx} currentPrice={p} isGreen={isGreen} mini={true} />
                    </div>
                  </div>
                )
              })}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                 <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#171717]/50">
                   <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      <span className="material-symbols-outlined text-white/50 text-[20px]">visibility</span> My Watchlist
                   </h3>
                   <form onSubmit={addToWatchlist} className="flex gap-2">
                     <input type="text" value={newStock} onChange={(e)=>setNewStock(e.target.value.toUpperCase())} placeholder="Add Symbol..." className="bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-green-500 w-36 uppercase font-mono transition-colors" />
                     <button type="submit" className="bg-[#222222] hover:bg-white/10 text-white/50 hover:text-white rounded-xl px-3 py-2 transition-colors"><span className="material-symbols-outlined text-[18px]">add</span></button>
                   </form>
                 </div>

                 <div className="divide-y divide-white/5">
                     {watchlist.length === 0 ? (
                        <div className="p-10 text-center text-white/40 text-sm font-medium">Watchlist is empty. Search and add assets to track.</div>
                     ) : (
                        watchlist.map(sym => {
                          const liveData = marketPrices[sym] || {};
                          const price = liveData.price || 0;
                          const change = liveData.change || 0;
                          const isUp = change >= 0;
                          
                          return (
                            <div key={sym} onClick={() => setSelectedAsset(sym)} className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer group">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl bg-[#1c1c1c] border border-white/5 flex items-center justify-center font-bold text-sm text-white/80">
                                  {sym.substring(0, 1)}
                                </div>
                                <div>
                                  <p className="font-bold text-white/90 group-hover:text-white">{sym}</p>
                                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">NSE</p>
                                </div>
                              </div>
                              
                              <div className="hidden sm:block flex-1 px-10 opacity-40 group-hover:opacity-100 transition-opacity">
                                <div className="w-full h-[35px] relative pointer-events-none">
                                  <SmartChart symbol={sym} currentPrice={price} isGreen={isUp} mini={true} />
                                </div>
                              </div>

                              <div className="text-right flex items-center gap-6">
                                <div>
                                  <p className="font-mono text-white font-bold text-base">₹{price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                  <p className={`text-[11px] font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>{isUp ? '+' : ''}{change.toFixed(2)}%</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setWatchlist(watchlist.filter(s => s !== sym)); }} className="text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                              </div>
                            </div>
                          )
                        })
                     )}
                 </div>
              </div>

              <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                 <div className="flex p-2 bg-[#171717] border-b border-white/5">
                    <button onClick={() => setActiveMoverTab('gainers')} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 ${activeMoverTab === 'gainers' ? 'bg-[#222222] text-green-400 shadow-sm' : 'text-white/30 hover:text-white/70'}`}>
                      <span className="material-symbols-outlined text-[16px]">trending_up</span> Top Gainers
                    </button>
                    <button onClick={() => setActiveMoverTab('losers')} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 ${activeMoverTab === 'losers' ? 'bg-[#222222] text-red-400 shadow-sm' : 'text-white/30 hover:text-white/70'}`}>
                      <span className="material-symbols-outlined text-[16px]">trending_down</span> Top Losers
                    </button>
                 </div>
                 
                 <div className="p-2 relative min-h-[300px]">
                   <AnimatePresence mode="wait">
                     <motion.div key={activeMoverTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="absolute inset-0 p-2">
                       {(activeMoverTab === 'gainers' ? gainers : losers).map((m, i) => {
                          return (
                          <div key={i} onClick={() => setSelectedAsset(m.symbol)} className="flex justify-between items-center p-3.5 rounded-xl hover:bg-white/[0.03] cursor-pointer group">
                            <div>
                              <p className="font-bold text-white/90 text-sm tracking-tight group-hover:text-white">{m.symbol}</p>
                              <p className="text-[11px] text-white/40 font-mono mt-0.5">₹{m.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                            </div>
                            <div className="opacity-30 group-hover:opacity-100 transition-opacity w-[70px] h-[30px] relative pointer-events-none">
                              <SmartChart symbol={m.symbol} currentPrice={m.price} isGreen={activeMoverTab === 'gainers'} mini={true} />
                            </div>
                            <div className={`px-2.5 py-1 rounded bg-[#1c1c1c] border border-white/5`}>
                              <p className={`text-[11px] font-bold font-mono ${activeMoverTab === 'gainers' ? 'text-green-500' : 'text-red-500'}`}>{activeMoverTab === 'gainers' ? '+' : ''}{m.change.toFixed(2)}%</p>
                            </div>
                          </div>
                       )})}
                     </motion.div>
                   </AnimatePresence>
                 </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                 <div className="mb-8">
                   <h3 className="text-lg font-bold text-white flex items-center gap-2">
                     <span className="material-symbols-outlined text-white/50 text-[18px]">psychology</span> Live Sentiment
                   </h3>
                   <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-semibold">Sub-Zone Analysis Engine</p>
                 </div>
                 
                 <div className="relative mt-8 mb-4">
                    <motion.div 
                      animate={{ left: `${needleLeft}%` }} transition={{ type: "spring", stiffness: 40 }}
                      className="absolute top-[-28px] flex flex-col items-center z-20"
                      style={{ transform: 'translateX(-50%)' }}
                    >
                       <span className={`text-[10px] font-black mb-0.5 px-2 py-0.5 rounded shadow-lg ${sentiment.zone === 'bearish' ? 'bg-red-500/20 text-red-500' : sentiment.zone === 'bullish' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                         {sentiment.globalScore}%
                       </span>
                       <span className="text-white text-xs drop-shadow-[0_0_5px_white]">▼</span>
                    </motion.div>

                    <div className="h-3 w-full rounded-full overflow-hidden flex shadow-inner">
                       <div className="h-full w-1/3 bg-gradient-to-r from-red-600 to-red-400 border-r border-[#121212]"></div>
                       <div className="h-full w-1/3 bg-gradient-to-r from-yellow-500 to-yellow-400 border-r border-[#121212]"></div>
                       <div className="h-full w-1/3 bg-gradient-to-r from-green-400 to-green-600"></div>
                    </div>
                 </div>

                 <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mt-4">
                    <span className={`transition-opacity ${sentiment.zone === 'bearish' ? 'text-red-500 opacity-100' : 'text-white/30 opacity-40'}`}>Bearish</span>
                    <span className={`text-center relative -left-2 transition-opacity ${sentiment.zone === 'neutral' ? 'text-yellow-500 opacity-100' : 'text-white/30 opacity-40'}`}>Neutral</span>
                    <span className={`text-right transition-opacity ${sentiment.zone === 'bullish' ? 'text-green-500 opacity-100' : 'text-white/30 opacity-40'}`}>Bullish</span>
                 </div>
              </div>

              <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                 <div className="p-6 border-b border-white/5 flex items-center gap-2 bg-[#171717]/50">
                   <span className="material-symbols-outlined text-white/50 text-[20px]">public</span>
                   <h3 className="font-bold text-white text-lg">Market Updates</h3>
                 </div>
                 <div className="p-2">
                    {newsFeed.map((news, i) => (
                       <a key={i} href={news.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 p-5 hover:bg-white/[0.03] transition-colors group border-b border-white/5 last:border-0 rounded-xl">
                         <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors z-10"></div>
                            <img src={news.img} alt="news" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.style.display='none'; }} />
                         </div>
                         <div className="flex-1 min-w-0">
                            {news.tag && <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-1.5 inline-block ${news.tag === 'GAINER' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : news.tag === 'LOSER' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'}`}>{news.tag}</span>}
                            <p className="text-sm font-semibold text-white/90 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">{news.title}</p>
                            <p className="text-[10px] text-white/40 mt-1.5 uppercase tracking-widest font-semibold flex items-center gap-1">
                              {news.time} <span className="material-symbols-outlined text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                            </p>
                         </div>
                       </a>
                    ))}

                 </div>
              </div>
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
