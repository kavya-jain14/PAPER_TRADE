import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import SmartChart from '../components/SmartChart';
import Sidebar from '../components/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TOP_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL', 'LT', 'AXISBANK'];
const INDICES = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];

// 📈 PREMIUM AREA SPARKLINE COMPONENT
const Sparkline = ({ data, color, width = 100, height = 30 }) => {
  if (!data || data.length < 2) return <div style={{width, height}} className="animate-pulse bg-white/5 rounded-md"></div>;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Create coordinates for the line
  const pointsArray = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / range) * height}`);
  const linePath = pointsArray.join(' L ');
  
  // Create coordinates for the filled area (closes the loop at the bottom)
  const areaPath = `M ${linePath} L ${width},${height} L 0,${height} Z`;
  
  // Generate a unique ID for the gradient based on the color hex
  const gradientId = `sparkline-gradient-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Area Fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      {/* Crisp Line on Top */}
      <path d={`M ${linePath}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// 📊 UNIVERSAL PRO-TRADE MODAL
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
    const cost = Number(qty) * currentPrice;
    if (activeTab === 'BUY' && cost > balance) return toast.error('Insufficient Funds!');
    if (activeTab === 'SELL' && Number(qty) > ownedQty) return toast.error(`You only own ${ownedQty} units!`);
    
    const endpoint = activeTab === 'BUY' ? '/api/trade/buy' : '/api/trade/sell';
    const tid = toast.loading(`Routing ${activeTab} Order...`);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json", "auth-token": token },
        body: JSON.stringify({ symbol, quantity: Number(qty), currentPrice })
      });
      if (res.ok) { toast.success('Order Filled!', { id: tid }); refreshData(); onClose(); }
      else { const d = await res.json(); toast.error(d.message, { id: tid }); }
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
                <input autoFocus type="number" value={qty} onChange={(e) => setQty(e.target.value)} className={`w-full bg-[#0a0a0a] border rounded-2xl p-4 text-white outline-none font-mono text-xl transition-colors ${activeTab === 'BUY' ? 'border-white/10 focus:border-green-500' : 'border-white/10 focus:border-red-500'}`} placeholder="0" required min="1" />
              </div>
              <div className="p-4 bg-[#171717] rounded-2xl border border-white/5">
                <span className="block text-[10px] uppercase text-white/50 font-bold tracking-widest mb-1">Limit Price</span>
                <span className="text-lg font-mono text-white/90">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6 px-1">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Est. Margin</span>
                <span className="text-xl font-black font-mono text-white">₹{(Number(qty) * currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits:2 })}</span>
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

function Markets() {
  const [userName, setUserName] = useState('');
  const [balance, setBalance] = useState(0);
  const [marketPrices, setMarketPrices] = useState({});
  const [priceHistory, setPriceHistory] = useState({}); // 🚀 Sparkline History
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
        setBalance(data.virtualBalance !== undefined ? data.virtualBalance : data.balance || 0);
      }
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
        
        // 🚀 SPARKLINE HISTORY ENGINE
        setPriceHistory(prev => {
          const updated = { ...prev };
          Object.keys(realPrices).forEach(sym => {
            const p = realPrices[sym]?.price;
            if (!p) return;
            const existing = updated[sym] || [];
            updated[sym] = [...existing.slice(-19), p]; // Keep last 20 ticks
          });
          return updated;
        });
      } catch (error) { console.error("Market fetch error"); }
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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="flex h-screen bg-[#0a0a0a] text-white/90 font-inter overflow-hidden selection:bg-green-500/30">

      <Sidebar userName={userName} balance={balance} isMarketOpen={isMarketOpen} avatar={avatar} />

      {/* 🔴 MAIN MARKETS CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          
          <header className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Market Explorer</h2>
            <p className="text-white/60 text-sm mt-1">Discover, analyze, and trade listed equities.</p>
          </header>

          {/* INDICES OVERVIEW */}
          {/* INDICES OVERVIEW */}
          <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
            {INDICES.map((idx) => {
              const liveData = marketPrices[idx] || {};
              const p = liveData.price || 0;
              const cPercent = liveData.change || 0;
              const isGreen = cPercent >= 0;
              
              return (
                <div key={idx} onClick={() => setSelectedAsset(idx)} className="bg-[#121212] border border-white/5 rounded-3xl p-6 flex flex-col min-w-[280px] cursor-pointer hover:border-white/20 transition-all shadow-xl group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">{idx}</p>
                      <p className="text-2xl font-bold font-mono text-white mt-1">{p > 0 ? p.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg bg-[#1c1c1c] border border-white/5`}>
                        <p className={`text-[11px] font-bold font-mono ${isGreen ? 'text-green-500' : 'text-red-500'}`}>
                          {isGreen ? '▲' : '▼'} {isGreen ? '+' : ''}{cPercent}%
                        </p>
                    </div>
                  </div>
                  {/* 🚀 MAGIC: EMBEDDED REAL MINI CHART (WIDER FOR MARKETS PAGE) */}
                  <div className="w-full h-[60px] opacity-70 group-hover:opacity-100 transition-opacity relative pointer-events-none mt-2">
                    <SmartChart symbol={idx} currentPrice={p} isGreen={isGreen} mini={true} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* ALL STOCKS TABLE */}
          <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
             <div className="p-6 border-b border-white/5 bg-[#171717]/50 flex justify-between items-center">
               <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-white/50 text-[20px]">list_alt</span> All Instruments
               </h3>
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg">
                  {TOP_STOCKS.length} Assets
               </span>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse whitespace-nowrap">
                 <thead>
                   <tr className="text-white/40 text-[10px] font-bold uppercase tracking-widest border-b border-white/5 bg-[#0a0a0a]/50">
                     <th className="px-8 py-5">Instrument</th>
                     <th className="px-8 py-5 text-center hidden md:table-cell">Trend (1D)</th>
                     <th className="px-8 py-5 text-right">LTP</th>
                     <th className="px-8 py-5 text-right">Change</th>
                     <th className="px-8 py-5 text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {TOP_STOCKS.map((sym, i) => {
                     const liveData = marketPrices[sym] || {};
                     const price = liveData.price || 0;
                     const change = liveData.change || 0;
                     const isUp = change >= 0;
                     const trendData = priceHistory[sym]?.length > 1 ? priceHistory[sym] : [liveData.prevClose || price, price];

                     return (
                       <tr key={i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedAsset(sym)}>
                         <td className="px-8 py-4">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-white/5 flex items-center justify-center font-bold text-xs text-white/80 group-hover:bg-white/10 transition-colors">
                               {sym.substring(0, 1)}
                             </div>
                             <div>
                               <p className="font-bold text-white/90 group-hover:text-white transition-colors">{sym}</p>
                               <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">Equity • NSE</p>
                             </div>
                           </div>
                         </td>
                         {/* 🚀 MAGIC: EMBEDDED REAL MINI CHART FOR MARKETS TABLE */}
                        <td className="px-8 py-4 text-center hidden md:table-cell opacity-50 group-hover:opacity-100 transition-opacity align-middle">
                          <div className="inline-block w-[140px] h-[40px] relative pointer-events-none mt-1">
                            <SmartChart symbol={sym} currentPrice={price} isGreen={isUp} mini={true} />
                          </div>
                        </td>
                         <td className="px-8 py-4 text-right">
                            <p className="font-mono text-white font-bold text-base">₹{price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                         </td>
                         <td className="px-8 py-4 text-right">
                            <div className="inline-block px-3 py-1 rounded bg-[#1c1c1c] border border-white/5">
                              <p className={`text-[11px] font-bold font-mono ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                                {isUp ? '+' : ''}{change.toFixed(2)}%
                              </p>
                            </div>
                         </td>
                         <td className="px-8 py-4 text-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedAsset(sym); }} 
                              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Trade
                            </button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
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
            />
         )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Markets;
