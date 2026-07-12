import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import SmartChart from '../components/SmartChart';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const INDICES = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];

// ⚠️ DANGER ZONE: MASSIVE 5-SEC DELAY TOAST
const ResetConfirmToast = ({ t, onConfirm }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="flex flex-col gap-6 p-6 font-inter w-full max-w-[500px] border border-red-500/20 bg-[#000000] rounded-3xl">
      <div className="text-center">
        <div className="w-28 h-28 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
           <span className="material-symbols-outlined text-red-500 text-6xl">warning</span>
        </div>
        <h3 className="text-4xl font-extrabold text-white tracking-tight">DANGER ZONE</h3>
        <p className="text-base text-[#E5E5E5]/70 mt-4 leading-relaxed px-2">
          This action is irreversible. It will permanently delete all trades, wipe your ledger history, and reset your starting virtual margin.
        </p>
      </div>
      <div className="flex gap-4 mt-6">
        <button onClick={() => toast.dismiss(t.id)} className="flex-1 py-5 rounded-2xl text-sm font-bold uppercase tracking-widest bg-[#141414] text-[#E5E5E5]/50 hover:text-white hover:bg-[#222222] transition-colors">
          Cancel
        </button>
        <button
          onClick={() => { toast.dismiss(t.id); onConfirm(); }}
          disabled={countdown > 0}
          className={`flex-1 py-5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${
            countdown > 0 ? 'bg-red-500/10 text-red-500/30 cursor-not-allowed border border-red-500/10' : 'bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {countdown > 0 ? `Wait (${countdown}s)` : 'Yes, Nuke Everything'}
        </button>
      </div>
    </div>
  );
};

// 📊 CUSTOM TOOLTIP FOR P&L CHART
const PnLTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const pnl = payload[0]?.value || 0;
    const isProfit = pnl >= 0;
    return (
      <div className="bg-[#141414] border border-[#222222] rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] text-[#E5E5E5]/40 uppercase tracking-widest font-bold mb-1">{label}</p>
        <p className={`text-base font-black font-mono ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className={`text-[9px] font-bold uppercase mt-0.5 ${isProfit ? 'text-green-500/60' : 'text-red-500/60'}`}>
          {isProfit ? 'Profit' : 'Loss'}
        </p>
      </div>
    );
  }
  return null;
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
      if (res.ok) { toast.success('Order Filled Successfully!', { id: tid }); refreshData(); onClose(); }
      else { toast.error(d.message || 'Order failed', { id: tid }); }
    } catch (err) { toast.error('Network Error', { id: tid }); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center backdrop-blur-md z-50 p-4 font-inter">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0A0A0A]/80 backdrop-blur-2xl rounded-3xl border border-[#222222] shadow-2xl w-full max-w-[900px] overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        <div className="bg-black/40 w-full md:w-[65%] p-6 border-b md:border-b-0 md:border-r border-[#222222] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight">{symbol}</h3>
              <p className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-widest font-bold mt-1">{INDICES.includes(symbol) ? 'MARKET INDEX' : 'EQUITY • NSE'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-mono text-white font-bold">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
              <p className={`text-xs font-bold mt-1 ${isGreen ? 'text-green-500' : 'text-red-500'}`}>{isGreen ? '▲' : '▼'} {isGreen ? '+' : ''}{changePercent}% (1D)</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] w-full border border-[#222222] rounded-2xl overflow-hidden relative bg-[#000000] group">
            <SmartChart symbol={symbol} currentPrice={currentPrice} isGreen={isGreen} />
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
        <div className="w-full md:w-[35%] p-6 flex flex-col bg-transparent">
          <div className="flex justify-end mb-6">
            <button onClick={onClose} className="text-[#E5E5E5]/40 hover:text-white bg-[#141414] p-1.5 rounded-xl transition-colors"><span className="material-symbols-outlined text-[20px]">close</span></button>
          </div>
          <div className="flex bg-[#141414] p-1.5 rounded-2xl mb-8 border border-[#222222]">
            <button onClick={() => setActiveTab('BUY')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'BUY' ? 'bg-green-500 text-[#003a00] shadow-md' : 'text-[#E5E5E5]/50 hover:text-white'}`}>Buy</button>
            <button onClick={() => setActiveTab('SELL')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'SELL' ? 'bg-red-500 text-white shadow-md' : 'text-[#E5E5E5]/50 hover:text-white'}`}>Sell</button>
          </div>
          <form onSubmit={handleExecute} className="flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center bg-[#000000] rounded-xl px-4 py-2.5 border border-[#222222]">
                <span className="text-[10px] text-[#E5E5E5]/40 uppercase tracking-widest font-bold">{activeTab === 'BUY' ? 'Max Affordable' : 'Units Owned'}</span>
                <span className={`text-sm font-black font-mono ${activeTab === 'BUY' ? 'text-green-400' : 'text-blue-400'}`}>{activeTab === 'BUY' ? maxBuyQty.toLocaleString() : ownedQty.toLocaleString()} units</span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[#E5E5E5]/50 text-[10px] uppercase tracking-widest font-bold">Quantity (Units)</label>
                  <button type="button" onClick={handleMax} className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors ${activeTab === 'BUY' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'}`}>MAX</button>
                </div>
                <input autoFocus type="number" value={qty} onChange={(e) => setQty(e.target.value)} className={`w-full bg-[#000000] border rounded-2xl p-4 text-white outline-none font-mono text-xl transition-colors ${activeTab === 'BUY' ? 'border-[#222222] focus:border-green-500' : 'border-[#222222] focus:border-red-500'}`} placeholder="0" required min="1" step="1" />
              </div>
              <div className="p-4 bg-[#141414] rounded-2xl border border-[#222222]">
                <span className="block text-[10px] uppercase text-[#E5E5E5]/50 font-bold tracking-widest mb-1">Limit Price</span>
                <span className="text-lg font-mono text-[#E5E5E5]/90">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6 px-1">
                <span className="text-[10px] font-bold text-[#E5E5E5]/50 uppercase tracking-widest">Est. Total</span>
                <span className="text-xl font-black font-mono text-[#E5E5E5]">₹{(Number(qty) * currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits:2 })}</span>
              </div>
              <button type="submit" className={`w-full py-4 font-black rounded-2xl uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] text-sm shadow-lg ${activeTab === 'BUY' ? 'bg-green-500 text-[#003a00] shadow-green-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                Execute {activeTab === 'BUY' ? 'Buy' : 'Sell'} Order
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

function Portfolio() {
  const [userName, setUserName] = useState('');
  const [balance, setBalance] = useState(0);
  const [avatar, setAvatar] = useState('');
  const [holdings, setHoldings] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchUserDataAndPortfolio = async () => {
    try {
      const userRes = await fetch(`${API_URL}/api/auth/getuser`, { headers: { "Content-Type": "application/json", "auth-token": token } });
      const userData = await userRes.json();
      if (userRes.ok) {
        setUserName(userData.name ? userData.name.split(' ')[0] : 'Trader');
        setAvatar(userData.avatar || '');
        setBalance(userData.virtualBalance !== undefined ? userData.virtualBalance : userData.balance || 0);
      }
      const portRes = await fetch(`${API_URL}/api/trade/portfolio`, { headers: { "Content-Type": "application/json", "auth-token": token } });
      const portData = await portRes.json();
      
      if (portRes.ok) {
        setHoldings(portData);
        const symbols = portData.map(h => h.symbol);
        if (symbols.length > 0) {
           const priceRes = await fetch(`${API_URL}/api/trade/live-prices`, {
             method: "POST", headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ symbols })
           });
           const pricesData = await priceRes.json();
           setLivePrices(pricesData);
        }
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchUserDataAndPortfolio();
    const interval = setInterval(fetchUserDataAndPortfolio, 5000);
    return () => clearInterval(interval);
  }, [token, navigate]);

  const handleReset = () => {
    toast((t) => (
      <ResetConfirmToast 
        t={t} 
        onConfirm={async () => {
          const tid = toast.loading("Nuking Portfolio...", { style: { background: '#121212', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } });
          try {
            const res = await fetch(`${API_URL}/api/trade/reset`, { method: "DELETE", headers: { "auth-token": token } });
            if (res.ok) { toast.success("Account Reset Successful!", { id: tid }); fetchUserDataAndPortfolio(); } 
            else { toast.error("Failed to reset account", { id: tid }); }
          } catch (error) { toast.error("Network Error", { id: tid }); }
        }} 
      />
    ), { duration: Infinity, position: 'top-center', style: { background: 'transparent', padding: '0px', boxShadow: 'none', borderRadius: '0px', border: 'none', marginTop: '22vh' } });
  };

  const totalInvested = holdings.reduce((sum, item) => sum + (item.investedValue || (item.avgPrice * item.quantity)), 0);
  const currentTotalValue = holdings.reduce((sum, item) => {
    const liveData = livePrices[item.symbol] || {};
    const ltp = liveData.price || item.avgPrice;
    return sum + (ltp * item.quantity);
  }, 0);

  const totalPnL = currentTotalValue - totalInvested;
  const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isOverallGreen = totalPnL >= 0;

  const pnlChartData = holdings.map((pos) => {
    const liveData = livePrices[pos.symbol] || {};
    const ltp = liveData.price || pos.avgPrice;
    const inv = pos.investedValue || (pos.avgPrice * pos.quantity);
    const cur = ltp * pos.quantity;
    const pnl = parseFloat((cur - inv).toFixed(2));
    return {
      name: pos.symbol,
      pnl,
      invested: parseFloat(inv.toFixed(2)),
      current: parseFloat(cur.toFixed(2)),
    };
  }).sort((a, b) => b.pnl - a.pnl);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex h-screen bg-[#0B0D10] text-[#E5E5E5] font-sans overflow-hidden selection:bg-[#D4A574]/30">

      <Sidebar userName={userName} balance={balance} isMarketOpen={isMarketOpen} avatar={avatar} />
      <MobileBottomNav />

      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1600px] mx-auto space-y-12">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-[56px] font-light tracking-tight text-[#E5E5E5] leading-none mb-4">
                  Portfolio <span className="font-bold">Holdings</span>.
                </motion.h1>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isMarketOpen ? 'bg-[#4ADE80] animate-pulse shadow-[0_0_10px_#4ADE80]' : 'bg-[#EF4444]'}`} />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5E5E5]/40">{isMarketOpen ? 'Live Market' : 'AI Synthetic Mode'}</p>
                </motion.div>
              </div>
              <button onClick={handleReset} className="flex items-center gap-1.5 text-[10px] font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest transition-colors bg-red-500/10 px-3 py-1.5 rounded border border-red-500/20 hover-glow">
                Reset Account
              </button>
            </header>

            {/* Asymmetric Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-10">
              
              {/* Massive Holdings Section (Col Span 7) */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="xl:col-span-7 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#E5E5E5]/40">Active Positions</h3>
                </div>
                
                <div className="flex-1 bg-[#16181D]/30 rounded-[24px] p-2 flex flex-col gap-1">
                  {isLoading ? (
                    <div className="p-10 flex justify-center"><span className="w-8 h-8 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin" /></div>
                  ) : holdings.length === 0 ? (
                    <div className="p-10 text-center">
                      <span className="material-symbols-outlined text-[#E5E5E5]/20 text-4xl">inbox</span>
                      <p className="text-[#E5E5E5]/40 font-medium mt-3">Portfolio is empty.</p>
                      <button onClick={() => navigate('/markets')} className="mt-4 text-xs font-bold text-[#D4A574] uppercase tracking-widest hover:text-[#E5E5E5] transition-colors">Trade Now</button>
                    </div>
                  ) : (
                    holdings.map((pos, i) => {
                      const liveData = livePrices[pos.symbol] || {};
                      const currentPrice = liveData.price || pos.avgPrice;
                      const investedValue = pos.investedValue || (pos.avgPrice * pos.quantity);
                      const currentValue = currentPrice * pos.quantity;
                      const pnl = currentValue - investedValue;
                      const pnlPercent = investedValue > 0 ? ((pnl / investedValue) * 100) : 0;
                      const isProfit = pnl >= 0;
                      return (
                        <div key={i} onClick={() => setSelectedAsset(pos.symbol)} className="flex items-center justify-between p-4 hover:bg-[#1F2229] rounded-[16px] transition-colors cursor-pointer group">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-[12px] bg-[#0B0D10] flex items-center justify-center font-bold text-lg text-[#E5E5E5]/80 group-hover:text-[#D4A574] transition-colors shadow-inner">
                              {pos.symbol.charAt(0)}
                            </div>
                            <div>
                              <p className="text-lg font-bold text-[#E5E5E5] group-hover:text-[#D4A574] transition-colors tracking-tight">{pos.symbol}</p>
                              <p className="text-[10px] uppercase tracking-widest text-[#E5E5E5]/40 mt-1">{pos.quantity} units · avg ₹{pos.avgPrice.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-mono font-bold text-[#E5E5E5]">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                            <p className={`text-[12px] font-bold mt-1 ${isProfit ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>
                              {isProfit ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ({isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>

              {/* Portfolio Insights (Col Span 5) */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="xl:col-span-5 flex flex-col gap-6">
                
                {/* Massive PnL Card */}
                <div className={`bg-gradient-to-br rounded-[32px] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group ${isOverallGreen ? 'from-[#002a10] to-[#0B0D10]' : 'from-[#2a0000] to-[#0B0D10]'}`}>
                   <div className="absolute inset-0 bg-[#ffffff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                   
                   <h3 className={`text-xs uppercase tracking-[0.2em] font-black mb-6 ${isOverallGreen ? 'text-[#4ADE80]/80' : 'text-[#EF4444]/80'}`}>Total P&L</h3>
                   
                   <div className="relative z-10 mb-8">
                     <div className="flex items-end gap-3">
                       <p className={`text-4xl md:text-5xl font-mono font-black tracking-tight ${isOverallGreen ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>
                         {isOverallGreen ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                       </p>
                     </div>
                     <p className={`text-lg font-bold mt-2 ${isOverallGreen ? 'text-[#4ADE80]/80' : 'text-[#EF4444]/80'}`}>
                       {isOverallGreen ? '+' : ''}{pnlPercentage.toFixed(2)}% Overall Returns
                     </p>
                   </div>

                   <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[#E5E5E5]/5 relative z-10">
                     <div>
                       <p className="text-[10px] uppercase tracking-widest text-[#E5E5E5]/40 font-bold mb-1">Invested Value</p>
                       <p className="text-xl font-mono font-bold text-[#E5E5E5]">₹{totalInvested.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                     </div>
                     <div>
                       <p className="text-[10px] uppercase tracking-widest text-[#E5E5E5]/40 font-bold mb-1">Current Value</p>
                       <p className="text-xl font-mono font-bold text-[#E5E5E5]">₹{currentTotalValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                     </div>
                   </div>
                </div>

                {/* Area Chart Card */}
                {pnlChartData.length > 0 && (
                  <div className="bg-[#16181D] rounded-[32px] p-8 flex-1 flex flex-col shadow-xl">
                    <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#E5E5E5]/40 mb-6">P&L by Asset</h3>
                    <div className="flex-1 w-full min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={pnlChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="pnlGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#4ADE80" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="pnlRed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" tick={{ fill: 'rgba(229,229,229,0.3)', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                          <YAxis tick={{ fill: 'rgba(229,229,229,0.3)', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                          <Tooltip content={<PnLTooltip />} cursor={{ stroke: 'rgba(229,229,229,0.1)', strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="pnl" stroke={isOverallGreen ? '#4ADE80' : '#EF4444'} strokeWidth={3} fill={isOverallGreen ? 'url(#pnlGreen)' : 'url(#pnlRed)'} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </motion.div>

            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
         {selectedAsset && (
         <UniversalTradeModal 
            symbol={selectedAsset} 
            marketData={livePrices[selectedAsset] || {}} 
            onClose={() => setSelectedAsset(null)} 
            balance={balance} token={token} refreshData={fetchUserDataAndPortfolio}
            ownedQty={holdings.find(h => h.symbol === selectedAsset)?.quantity || 0}
         />
         )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Portfolio;
