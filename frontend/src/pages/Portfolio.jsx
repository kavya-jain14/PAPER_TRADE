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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="flex h-screen bg-[#000000] text-[#E5E5E5]/90 font-inter overflow-hidden selection:bg-[#FFFFFF]/30">

      <Sidebar userName={userName} balance={balance} isMarketOpen={isMarketOpen} avatar={avatar} />
      <MobileBottomNav />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 pb-24 md:pb-0 relative custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 relative z-10">
          
          {/* 📱 Mobile top bar */}
          <div className="md:hidden flex items-center justify-between pt-2 mb-2">
            <h1 className="text-lg font-black tracking-tight"><span className="text-[#FFFFFF]">PAPER</span> TRADE</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-[#E5E5E5]/50 uppercase tracking-wider">{isMarketOpen ? 'Live' : 'Closed'}</span>
            </div>
          </div>

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-4 md:mb-8">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Your Portfolio</h2>
              <p className="text-[#E5E5E5]/60 text-sm mt-1">Track your holdings, analyze P&L, and manage positions.</p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
               <div>
                 <p className="text-[10px] font-bold text-[#E5E5E5]/50 uppercase tracking-widest mb-1">Available Margin</p>
                 <p className="text-xl font-bold font-mono text-[#E5E5E5]">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
               </div>
               <button onClick={handleReset} className="flex items-center gap-1.5 text-[10px] font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest transition-colors bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                 <span className="material-symbols-outlined text-[14px]">delete_forever</span> Reset Account
               </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0A0A0A] border border-[#222222] rounded-3xl p-6 shadow-xl">
               <div className="flex items-center gap-3 mb-4 opacity-70">
                 <span className="material-symbols-outlined text-[#E5E5E5]">account_balance_wallet</span>
                 <h3 className="text-xs font-bold text-white uppercase tracking-widest">Invested Value</h3>
               </div>
               <p className="text-3xl font-bold font-mono text-[#E5E5E5]">₹{totalInvested.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="bg-[#0A0A0A] border border-[#222222] rounded-3xl p-6 shadow-xl relative overflow-hidden">
               <div className="flex items-center gap-3 mb-4 opacity-70 relative z-10">
                 <span className="material-symbols-outlined text-[#E5E5E5]">monitoring</span>
                 <h3 className="text-xs font-bold text-white uppercase tracking-widest">Current Value</h3>
               </div>
               <p className="text-3xl font-bold font-mono text-white relative z-10">₹{currentTotalValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
               <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-20 pointer-events-none ${isOverallGreen ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <div className={`bg-gradient-to-br border rounded-3xl p-6 shadow-xl ${isOverallGreen ? 'from-[#003a00]/40 to-[#121212] border-green-500/20' : 'from-[#3a0000]/40 to-[#121212] border-red-500/20'}`}>
               <div className="flex items-center gap-3 mb-4">
                 <span className={`material-symbols-outlined ${isOverallGreen ? 'text-green-500' : 'text-red-500'}`}>
                   {isOverallGreen ? 'trending_up' : 'trending_down'}
                 </span>
                 <h3 className={`text-xs font-bold uppercase tracking-widest ${isOverallGreen ? 'text-green-500' : 'text-red-500'}`}>Total P&L</h3>
               </div>
               <div className="flex items-baseline gap-3">
                 <p className={`text-3xl font-bold font-mono ${isOverallGreen ? 'text-green-500' : 'text-red-500'}`}>
                   {isOverallGreen ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                 </p>
                 <span className={`text-sm font-bold font-mono ${isOverallGreen ? 'text-green-500' : 'text-red-500'}`}>
                   ({isOverallGreen ? '+' : ''}{pnlPercentage.toFixed(2)}%)
                 </span>
               </div>
            </div>
          </div>

          {holdings.length > 0 && (
            <div className="bg-[#0A0A0A] border border-[#222222] rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#222222]/60 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#E5E5E5]/50 text-[20px]">area_chart</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Profit & Loss by Position</h3>
                    <p className="text-[10px] text-[#E5E5E5]/40 uppercase tracking-widest font-semibold mt-0.5">Unrealized P&L per holding</p>
                  </div>
                </div>
                <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${isOverallGreen ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {isOverallGreen ? '▲' : '▼'} {Math.abs(pnlPercentage).toFixed(2)}% Overall
                </span>
              </div>

              {pnlChartData.length > 0 ? (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pnlChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pnlGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="pnlRed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                        dy={8}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        width={48}
                      />
                      <Tooltip content={<PnLTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                      <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke={isOverallGreen ? '#22c55e' : '#ef4444'}
                        strokeWidth={2.5}
                        fill={isOverallGreen ? 'url(#pnlGreen)' : 'url(#pnlRed)'}
                        dot={{
                          fill: isOverallGreen ? '#22c55e' : '#ef4444',
                          r: 4,
                          strokeWidth: 2,
                          stroke: '#0a0a0a',
                        }}
                        activeDot={{
                          r: 6,
                          fill: isOverallGreen ? '#22c55e' : '#ef4444',
                          stroke: '#0a0a0a',
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-[#E5E5E5]/30 text-sm">
                  No chart data available
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-[#222222]">
                <p className="text-[10px] text-[#E5E5E5]/30 uppercase tracking-widest font-bold mb-3">Position Summary</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {pnlChartData.map((d, i) => {
                    const isP = d.pnl >= 0;
                    const pct = d.invested > 0 ? ((d.pnl / d.invested) * 100) : 0;
                    return (
                      <div key={i} className={`rounded-2xl p-3 border ${isP ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                        <p className="text-[10px] font-bold text-[#E5E5E5]/50 uppercase tracking-widest truncate">{d.name}</p>
                        <p className={`text-sm font-black font-mono mt-1 ${isP ? 'text-green-400' : 'text-red-400'}`}>
                          {isP ? '+' : ''}₹{Math.abs(d.pnl).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </p>
                        <p className={`text-[10px] font-bold font-mono mt-0.5 ${isP ? 'text-green-500/60' : 'text-red-500/60'}`}>
                          {isP ? '+' : ''}{pct.toFixed(2)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 📱 MOBILE: card view of holdings */}
          <div className="md:hidden bg-[#0A0A0A] border border-[#222222] rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#222222] bg-[#141414]/50 flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E5E5E5]/50 text-[18px]">inventory_2</span> Active Positions
              </h3>
              <span className="text-[10px] font-bold text-[#E5E5E5]/40 uppercase tracking-widest bg-[#222222]/60 px-3 py-1 rounded-lg">{holdings.length} Assets</span>
            </div>
            {isLoading ? (
              <div className="p-10 flex justify-center">
                <span className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            ) : holdings.length === 0 ? (
              <div className="p-10 text-center">
                <span className="material-symbols-outlined text-[#E5E5E5]/20 text-4xl">inbox</span>
                <p className="text-[#E5E5E5]/40 font-medium mt-3">Portfolio is empty.</p>
                <p className="text-white/25 text-sm mt-1">Visit Markets to trade.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#222222]">
                {holdings.map((pos, i) => {
                  const liveData = livePrices[pos.symbol] || {};
                  const currentPrice = liveData.price || pos.avgPrice;
                  const investedValue = pos.investedValue || (pos.avgPrice * pos.quantity);
                  const currentValue = currentPrice * pos.quantity;
                  const pnl = currentValue - investedValue;
                  const pnlPercent = investedValue > 0 ? ((pnl / investedValue) * 100) : 0;
                  const isProfit = pnl >= 0;
                  return (
                    <div key={i} onClick={() => setSelectedAsset(pos.symbol)} className="p-4 flex items-center justify-between hover:bg-white/[0.02] active:bg-[#222222]/60 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-center font-bold text-xs text-[#E5E5E5]/80">
                          {pos.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#E5E5E5]/90 text-sm">{pos.symbol}</p>
                          <p className="text-[10px] text-[#E5E5E5]/40 mt-0.5">{pos.quantity} units · avg ₹{pos.avgPrice.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-white font-bold text-sm">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        <p className={`text-[11px] font-bold font-mono mt-0.5 ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                          {isProfit ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ({isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 🖥️ DESKTOP: table view — hidden on mobile */}
          <div className="hidden md:block bg-[#0A0A0A] border border-[#222222] rounded-3xl overflow-hidden shadow-xl">
             <div className="p-6 border-b border-[#222222] bg-[#141414]/50 flex justify-between items-center">
               <h3 className="font-bold text-white text-lg flex items-center gap-2">
                 <span className="material-symbols-outlined text-[#E5E5E5]/50 text-[20px]">inventory_2</span> Active Positions
               </h3>
               <span className="text-[10px] font-bold text-[#E5E5E5]/40 uppercase tracking-widest bg-[#222222]/60 px-3 py-1 rounded-lg">
                 {holdings.length} Assets
               </span>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse whitespace-nowrap">
                 <thead>
                   <tr className="text-[#E5E5E5]/40 text-[10px] font-bold uppercase tracking-widest border-b border-[#222222] bg-[#000000]/50">
                     <th className="px-8 py-5">Instrument</th>
                     <th className="px-8 py-5 text-right">Qty.</th>
                     <th className="px-8 py-5 text-right">Avg. Cost</th>
                     <th className="px-8 py-5 text-right">LTP</th>
                     <th className="px-8 py-5 text-right">Cur. Value</th>
                     <th className="px-8 py-5 text-right">P&L</th>
                     <th className="px-8 py-5 text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#222222]">
                   {isLoading ? (
                     <tr>
                       <td colSpan="7" className="px-8 py-12 text-center">
                         <span className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                       </td>
                     </tr>
                   ) : holdings.length === 0 ? (
                     <tr>
                       <td colSpan="7" className="px-8 py-16 text-center">
                         <div className="flex flex-col items-center gap-4">
                           <div className="w-16 h-16 rounded-full bg-[#222222]/60 flex items-center justify-center">
                             <span className="material-symbols-outlined text-[#E5E5E5]/20 text-3xl">inbox</span>
                           </div>
                           <p className="text-[#E5E5E5]/40 font-medium">Your portfolio is empty.</p>
                           <p className="text-white/25 text-sm">Visit Markets to make your first trade.</p>
                         </div>
                       </td>
                     </tr>
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
                         <tr key={i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedAsset(pos.symbol)}>
                           <td className="px-8 py-4">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-center font-bold text-xs text-[#E5E5E5]/80 group-hover:bg-[#222222] transition-colors">
                                 {pos.symbol.charAt(0)}
                               </div>
                               <div>
                                 <p className="font-bold text-[#E5E5E5]/90 group-hover:text-white transition-colors">{pos.symbol}</p>
                                 <p className="text-[10px] text-[#E5E5E5]/40 uppercase tracking-widest font-semibold mt-0.5">NSE</p>
                               </div>
                             </div>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <p className="font-mono text-white font-bold">{pos.quantity}</p>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <p className="font-mono text-[#E5E5E5]/70">₹{pos.avgPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <p className="font-mono text-white font-semibold">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <p className="font-mono text-white font-bold">₹{currentValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <p className={`font-mono font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                  {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </p>
                                <p className={`text-[10px] font-bold font-mono mt-0.5 ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                  {isProfit ? '▲' : '▼'} {Math.abs(pnlPercent).toFixed(2)}%
                                </p>
                              </div>
                           </td>
                           <td className="px-8 py-4 text-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedAsset(pos.symbol); }} 
                                className="bg-[#141414] border border-[#222222] hover:border-white/20 text-[#E5E5E5]/80 hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors"
                              >
                                Exit / Add
                              </button>
                           </td>
                         </tr>
                       );
                     })
                   )}
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
               marketData={livePrices[selectedAsset] || {}} 
               onClose={() => { setSelectedAsset(null); fetchUserDataAndPortfolio(); }} 
               balance={balance} token={token} refreshData={fetchUserDataAndPortfolio}
               ownedQty={holdings.find(h => h.symbol === selectedAsset)?.quantity || 0}
            />
         )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Portfolio;
