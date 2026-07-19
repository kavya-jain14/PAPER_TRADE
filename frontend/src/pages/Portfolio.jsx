import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import SmartChart from '../components/SmartChart';
import { AppShell } from '../components/AppShell';
import TradeModal from '../components/TradeModal';
import useAnalytics from '../hooks/useAnalytics';
import AnalyticsDashboard from '../components/Portfolio/AnalyticsDashboard';
import useMarketStatus from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
    <div className="flex flex-col gap-6 p-6 font-inter w-full max-w-[500px] border border-negative/20 bg-bg rounded-lg shadow-3">
      <div className="text-center">
        <div className="w-20 h-20 bg-negative/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-negative/20">
           <span className="material-symbols-outlined text-negative text-5xl">warning</span>
        </div>
        <h3 className="text-2xl font-extrabold text-text-primary tracking-tight">Danger Zone</h3>
        <p className="type-caption-muted mt-3 leading-relaxed px-2">
          This is irreversible. It will permanently delete all trades, wipe your ledger history, and reset your virtual margin.
        </p>
      </div>
      <div className="flex gap-3 mt-2">
        <button onClick={() => toast.dismiss(t.id)} className="flex-1 py-3 rounded-lg type-label-body bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-border transition-colors">
          Cancel
        </button>
        <button
          onClick={() => { toast.dismiss(t.id); onConfirm(); }}
          disabled={countdown > 0}
          className={`flex-1 py-3 rounded-lg type-label-body transition-all ${
            countdown > 0 ? 'bg-negative/10 text-negative/30 cursor-not-allowed border border-negative/10' : 'bg-negative text-white hover:opacity-90'
          }`}
        >
          {countdown > 0 ? `Wait (${countdown}s)` : 'Yes, Reset Everything'}
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
      <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="type-caption text-text-tertiary mb-1">{label}</p>
        <p className={`type-data-sm ${isProfit ? 'type-positive' : 'type-negative'}`}>
          {isProfit ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

function Portfolio() {
  const [userName, setUserName] = useState('');
  const [balance, setBalance] = useState(0);
  const [avatar, setAvatar] = useState('');
  const [holdings, setHoldings] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { metrics, loading: analyticsLoading } = useAnalytics(token);
  const isMarketOpen = useMarketStatus();

  const fetchUserDataAndPortfolio = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchUserDataAndPortfolio();
    const interval = setInterval(fetchUserDataAndPortfolio, 5000);
    return () => clearInterval(interval);
  }, [token, navigate, fetchUserDataAndPortfolio]);

  const handleReset = () => {
    toast((t) => (
      <ResetConfirmToast 
        t={t} 
        onConfirm={async () => {
          const tid = toast.loading("Resetting account...");
          try {
            const res = await fetch(`${API_URL}/api/trade/reset`, { method: "DELETE", headers: { "auth-token": token } });
            if (res.ok) { toast.success("Account reset successfully!", { id: tid }); fetchUserDataAndPortfolio(); } 
            else { toast.error("Failed to reset account", { id: tid }); }
          } catch { toast.error("Network Error", { id: tid }); }
        }} 
      />
    ), { duration: Infinity, position: 'top-center', style: { background: 'transparent', padding: '0px', boxShadow: 'none', border: 'none', marginTop: '20vh' } });
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
    return { name: pos.symbol, pnl, invested: parseFloat(inv.toFixed(2)), current: parseFloat(cur.toFixed(2)) };
  }).sort((a, b) => b.pnl - a.pnl);

  return (
    <AppShell userName={userName} isMarketOpen={isMarketOpen} avatar={avatar}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col min-w-0 relative h-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1400px] mx-auto space-y-8">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
              <div>
                <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="type-h2 mb-1">
                  Portfolio
                </motion.h1>
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-positive animate-pulse' : 'bg-text-tertiary'}`} />
                  <p className="type-caption uppercase tracking-widest">{isMarketOpen ? 'Live Prices' : 'AI Synthetic Mode'}</p>
                </motion.div>
              </div>
              <button onClick={handleReset} className="flex items-center gap-1.5 type-caption text-negative/70 hover:text-negative transition-colors bg-negative/5 hover:bg-negative/10 px-3 py-1.5 rounded-lg border border-negative/20">
                <span className="material-symbols-outlined" style={{fontSize:'16px'}}>restart_alt</span> Reset Account
              </button>
            </header>

            {!analyticsLoading && <AnalyticsDashboard metrics={metrics} />}

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              
              {/* Holdings Table */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="xl:col-span-7 flex flex-col">
                <div className="bg-surface border border-border rounded-lg shadow-1 overflow-hidden flex flex-col">
                  
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 p-3 border-b border-border bg-surface-raised/50 type-label text-text-secondary">
                    <div className="col-span-4">POSITION</div>
                    <div className="col-span-3 text-right">LTP / AVG</div>
                    <div className="col-span-3 text-right">VALUE</div>
                    <div className="col-span-2 text-right">P&L</div>
                  </div>

                  <div className="min-h-[320px]">
                    {isLoading ? (
                      <div className="p-10 flex justify-center">
                        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : holdings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-16 text-center h-full">
                        <div className="w-16 h-16 rounded-full bg-surface-raised border border-border flex items-center justify-center mb-4 shadow-1">
                          <span className="material-symbols-outlined text-text-tertiary" style={{ fontSize: '28px' }}>inventory_2</span>
                        </div>
                        <h3 className="type-body font-medium text-text-primary mb-1">No open positions</h3>
                        <p className="type-caption text-text-secondary mb-6 max-w-[200px]">You haven't bought any stocks yet. Head to the markets to place your first trade.</p>
                        <button onClick={() => navigate('/markets')} className="px-5 py-2.5 bg-accent hover:opacity-90 transition-opacity text-bg type-label rounded-lg font-bold">Browse Markets</button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {holdings.map((pos, i) => {
                          const liveData = livePrices[pos.symbol] || {};
                          const currentPrice = liveData.price || pos.avgPrice;
                          const investedValue = pos.investedValue || (pos.avgPrice * pos.quantity);
                          const currentValue = currentPrice * pos.quantity;
                          const pnl = currentValue - investedValue;
                          const pnlPercent = investedValue > 0 ? ((pnl / investedValue) * 100) : 0;
                          const isProfit = pnl >= 0;
                          // Position weight bar
                          const weightPct = currentTotalValue > 0 ? (currentValue / currentTotalValue) * 100 : 0;

                          return (
                            <div key={i} onClick={() => setSelectedAsset(pos.symbol)} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-surface-raised transition-colors cursor-pointer group">
                              <div className="col-span-4 flex items-center gap-3">
                                <div className="w-7 h-7 rounded-md bg-surface-overlay border border-border flex items-center justify-center type-label font-bold text-text-primary shrink-0">
                                  {pos.symbol.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="type-body font-medium text-text-primary group-hover:text-accent transition-colors truncate">{pos.symbol}</p>
                                  <p className="type-caption-muted truncate">{pos.quantity} units</p>
                                  {/* Weight bar — staggered mount */}
                                  <div className="w-full h-0.5 bg-border rounded-full mt-1 overflow-hidden">
                                    <div
                                      className="h-full bg-accent/60 rounded-full"
                                      style={{
                                        width: `${weightPct}%`,
                                        transition: `width 700ms cubic-bezier(0.2, 0, 0, 1) ${i * 80}ms`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="col-span-3 text-right">
                                <p className="type-data-sm text-text-primary">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                <p className="type-caption-muted">avg ₹{pos.avgPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                              </div>
                              <div className="col-span-3 text-right">
                                <p className="type-data-sm text-text-primary">₹{currentValue.toLocaleString('en-IN', {minimumFractionDigits: 0})}</p>
                                <p className="type-caption-muted">{weightPct.toFixed(1)}% of port.</p>
                              </div>
                              <div className="col-span-2 text-right">
                                <p className={`type-data-sm ${isProfit ? 'type-positive' : 'type-negative'}`}>
                                  {isProfit ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', {minimumFractionDigits: 0})}
                                </p>
                                <p className={`type-caption ${isProfit ? 'type-positive' : 'type-negative'}`}>
                                  {isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Portfolio Insights */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="xl:col-span-5 flex flex-col gap-6">
                
                {/* P&L Summary Card */}
                <div className={`rounded-lg p-5 border shadow-1 relative overflow-hidden ${isOverallGreen ? 'bg-positive-muted border-positive/20' : 'bg-negative-muted border-negative/20'}`}>
                  <p className={`type-label mb-3 ${isOverallGreen ? 'type-positive' : 'type-negative'}`}>Unrealized P&L</p>
                  <p className={`type-data-xl ${isOverallGreen ? 'type-positive' : 'type-negative'}`}>
                    {isOverallGreen ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                  <p className={`type-caption mt-1 ${isOverallGreen ? 'type-positive' : 'type-negative'}`}>
                    {isOverallGreen ? '+' : ''}{pnlPercentage.toFixed(2)}% overall return
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/30">
                    <div>
                      <p className="type-label mb-1">Invested</p>
                      <p className="type-data-sm text-text-primary">₹{totalInvested.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div>
                      <p className="type-label mb-1">Current</p>
                      <p className="type-data-sm text-text-primary">₹{currentTotalValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                    </div>
                  </div>
                </div>

                {/* P&L by Asset Chart */}
                {pnlChartData.length > 0 && (
                  <div className="bg-surface border border-border rounded-lg p-5 shadow-1 flex-1 flex flex-col">
                    <p className="type-label mb-4">P&L by Position</p>
                    <div className="flex-1 w-full min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={pnlChartData} margin={{ top: 6, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="pnlGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="pnlRed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" tick={{ fill: 'rgba(229,229,229,0.3)', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                          <YAxis tick={{ fill: 'rgba(229,229,229,0.3)', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                          <Tooltip content={<PnLTooltip />} cursor={{ stroke: 'rgba(229,229,229,0.08)', strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="pnl" stroke={isOverallGreen ? '#22C55E' : '#F43F5E'} strokeWidth={2} fill={isOverallGreen ? 'url(#pnlGreen)' : 'url(#pnlRed)'} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Quick margin info */}
                <div className="bg-surface-raised border border-border rounded-lg p-4 shadow-1 flex items-center justify-between">
                  <div>
                    <p className="type-label mb-1">Available Margin</p>
                    <p className="type-data-md text-text-primary">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                  </div>
                  <button onClick={() => navigate('/markets')} className="px-4 py-2 bg-text-primary text-bg rounded-lg type-label-body hover:opacity-90 transition-opacity">
                    + Trade
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
            marketData={livePrices[selectedAsset] || {}} 
            onClose={() => setSelectedAsset(null)} 
            balance={balance} token={token} onSuccess={fetchUserDataAndPortfolio}
            ownedQty={holdings.find(h => h.symbol === selectedAsset)?.quantity || 0}
         />
         )}
      </AnimatePresence>
    </AppShell>
  );
}

export default Portfolio;
