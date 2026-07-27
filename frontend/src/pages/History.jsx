import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AppShell } from '../components/AppShell';
import useMarketStatus from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const FILTERS = ['All', 'Buys', 'Sells', 'Profits', 'Losses'];

function History() {
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const marketStatus = useMarketStatus();
  const [activeFilter, setActiveFilter] = useState('All');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');


  const fetchUserDataAndHistory = useCallback(async () => {
    try {
      const userRes = await fetch(`${API_URL}/api/auth/getuser`, {
        headers: { "Content-Type": "application/json", "auth-token": token }
      });
      const userData = await userRes.json();
      if (userRes.ok) {
        setUserName(userData.name ? userData.name.split(' ')[0] : 'Trader');
        setAvatar(userData.avatar || '');
      }

      const histRes = await fetch(`${API_URL}/api/trade/history`, {
        headers: { "Content-Type": "application/json", "auth-token": token }
      });
      
      if (histRes.ok) {
        const rawHistData = await histRes.json();
        const oldestFirst = [...rawHistData].reverse();
        const costBasis = {};
        
        const enriched = oldestFirst.map(t => {
          const sym = t.symbol;
          if (!costBasis[sym]) costBasis[sym] = { qty: 0, invested: 0 };
          
          if (t.transactionType?.toUpperCase() === 'BUY') {
            costBasis[sym].qty += t.quantity;
            costBasis[sym].invested += t.quantity * t.pricePerShare;
            return { ...t, realizedPnL: null }; 
          } else {
            const avgCost = costBasis[sym].qty > 0 
               ? costBasis[sym].invested / costBasis[sym].qty 
               : t.pricePerShare;
               
            const pnl = (t.pricePerShare - avgCost) * t.quantity;
            
            costBasis[sym].qty -= t.quantity;
            costBasis[sym].invested = costBasis[sym].qty * avgCost; 
            
            return { ...t, realizedPnL: pnl };
          }
        });

        setTradeHistory(enriched.reverse()); 
      }
    } catch (error) { 
      console.error(error); 
      toast.error("Failed to load trade ledger.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchUserDataAndHistory();
  }, [token, navigate, fetchUserDataAndHistory]);

  // Metrics
  const totalTrades = tradeHistory.length;
  const sellTrades = tradeHistory.filter(t => t.transactionType?.toUpperCase() === 'SELL');
  const profitableSells = sellTrades.filter(t => (t.realizedPnL || 0) > 0).length;
  const winRate = sellTrades.length > 0 ? ((profitableSells / sellTrades.length) * 100).toFixed(1) : '—';
  const totalRealizedPnL = sellTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
  const isOverallGreen = totalRealizedPnL >= 0;

  // Filter logic
  const filteredTrades = tradeHistory.filter(trade => {
    const isBuy = trade.transactionType?.toUpperCase() === 'BUY';
    const pnl = trade.realizedPnL || 0;
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Buys') return isBuy;
    if (activeFilter === 'Sells') return !isBuy;
    if (activeFilter === 'Profits') return !isBuy && pnl > 0;
    if (activeFilter === 'Losses') return !isBuy && pnl < 0;
    return true;
  });

  return (
    <AppShell userName={userName} marketStatus={marketStatus} avatar={avatar}>
      <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col min-w-0 relative h-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1400px] mx-auto space-y-8">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
              <div>
                <Motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="type-h2 mb-1">
                  Trade Ledger
                </Motion.h1>
                <Motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${marketStatus === 'LIVE' ? 'bg-positive animate-pulse' : marketStatus === 'SIMULATED' ? 'bg-accent' : 'bg-text-tertiary'}`} />
                  <p className="type-caption uppercase tracking-widest">{marketStatus === 'LIVE' ? 'Live Market' : marketStatus === 'SIMULATED' ? 'AI Synthetic Mode' : 'Checking Status'}</p>
                </Motion.div>
              </div>
              <button onClick={fetchUserDataAndHistory} className="flex items-center gap-1.5 type-caption text-text-secondary hover:text-text-primary transition-colors bg-surface-raised px-3 py-1.5 rounded-lg border border-border">
                <span className="material-symbols-outlined" style={{fontSize:'16px'}}>refresh</span> Refresh
              </button>
            </header>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="bg-surface-raised border border-border rounded-lg p-5 shadow-1">
                <p className="type-label mb-2">Total Executions</p>
                <p className="type-data-xl">{totalTrades}</p>
              </Motion.div>
              <Motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y:0}} transition={{delay: 0.15}} className="bg-surface-raised border border-border rounded-lg p-5 shadow-1">
                <p className="type-label mb-2">Win Rate (Closed)</p>
                <p className="type-data-xl">{winRate}{winRate !== '—' ? '%' : ''}</p>
                <p className="type-caption-muted mt-1">{profitableSells} of {sellTrades.length} sells profitable</p>
              </Motion.div>
              <Motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className={`rounded-lg p-5 border shadow-1 ${isOverallGreen ? 'bg-positive-muted border-positive/20' : 'bg-negative-muted border-negative/20'}`}>
                <p className={`type-label mb-2 ${isOverallGreen ? 'type-positive' : 'type-negative'}`}>Realized P&L</p>
                <p className={`type-data-xl ${isOverallGreen ? 'type-positive' : 'type-negative'}`}>
                  {isOverallGreen ? '+' : ''}₹{totalRealizedPnL.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </Motion.div>
            </div>

            {/* Filter Pills + Execution Feed */}
            <div>
              {/* Filter bar */}
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-4">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-4 py-1.5 rounded-full type-caption whitespace-nowrap transition-colors ${activeFilter === f ? 'bg-text-primary text-bg' : 'bg-surface-raised text-text-secondary border border-border hover:border-border-strong'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Trade List */}
              <div className="bg-surface border border-border rounded-lg shadow-1 overflow-hidden">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-2 p-3 border-b border-border bg-surface-raised/50 type-label text-text-secondary">
                  <div className="col-span-1">TYPE</div>
                  <div className="col-span-3">SYMBOL</div>
                  <div className="col-span-3">DATE / TIME</div>
                  <div className="col-span-3 text-right">QTY @ PRICE</div>
                  <div className="col-span-2 text-right">TOTAL / P&L</div>
                </div>

                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredTrades.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 text-center h-full">
                    <div className="w-16 h-16 rounded-full bg-surface-raised border border-border flex items-center justify-center mb-4 shadow-1">
                      <span className="material-symbols-outlined text-text-tertiary" style={{fontSize: '28px'}}>
                        {activeFilter === 'All' ? 'receipt_long' : activeFilter === 'Profits' ? 'trending_up' : activeFilter === 'Losses' ? 'trending_down' : 'filter_list'}
                      </span>
                    </div>
                    <h3 className="type-body font-medium text-text-primary mb-1">
                      {activeFilter === 'All' ? 'No trades yet' : `No ${activeFilter.toLowerCase()} found`}
                    </h3>
                    <p className="type-caption text-text-secondary mb-6 max-w-[200px]">
                      {activeFilter === 'All' ? "You haven't executed any orders. Let's make your first trade." : "Try adjusting your filters."}
                    </p>
                    {activeFilter === 'All' && (
                      <button onClick={() => navigate('/markets')} className="px-5 py-2.5 bg-accent hover:opacity-90 transition-opacity text-bg type-label rounded-lg font-bold">
                        Browse Markets
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredTrades.map((trade, i) => {
                      const isBuy = trade.transactionType?.toUpperCase() === 'BUY';
                      const pnl = trade.realizedPnL || 0;
                      const isProfit = pnl > 0;
                      const isLoss = pnl < 0;
                      const total = trade.quantity * trade.pricePerShare;

                      return (
                        <Motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i * 0.03, 0.3) }}
                          key={i}
                          className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-surface-raised transition-colors"
                        >
                          {/* Type pill */}
                          <div className="col-span-2 md:col-span-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${isBuy ? 'bg-accent/10 text-accent' : 'bg-surface-overlay text-text-secondary border border-border'}`}>
                              {isBuy ? 'BUY' : 'SELL'}
                            </span>
                          </div>

                          {/* Symbol */}
                          <div className="col-span-5 md:col-span-3">
                            <p className="type-body font-medium text-text-primary">{trade.symbol}</p>
                          </div>

                          {/* Date/Time */}
                          <div className="hidden md:block col-span-3">
                            <p className="type-data-sm text-text-secondary">{new Date(trade.date || trade.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            <p className="type-caption-muted">{new Date(trade.date || trade.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>

                          {/* Qty @ Price */}
                          <div className="hidden md:block col-span-3 text-right">
                            <p className="type-data-sm text-text-primary">{trade.quantity} @ ₹{Number(trade.pricePerShare).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                          </div>

                          {/* Total / P&L */}
                          <div className="col-span-5 md:col-span-2 text-right">
                            {isBuy ? (
                              <p className="type-data-sm text-text-secondary">₹{total.toLocaleString('en-IN', {minimumFractionDigits: 0})}</p>
                            ) : (
                              <>
                                <p className={`type-data-sm ${isProfit ? 'type-positive' : isLoss ? 'type-negative' : 'text-text-secondary'}`}>
                                  {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                </p>
                                <p className="type-caption-muted">₹{total.toLocaleString('en-IN', {minimumFractionDigits: 0})} total</p>
                              </>
                            )}
                          </div>
                        </Motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </Motion.div>
    </AppShell>
  );
}

export default History;
