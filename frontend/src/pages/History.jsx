import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function History() {
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarketOpen, setIsMarketOpen] = useState(false); 
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // 🚀 STRICT FIX: IST Timezone Checker
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

  const fetchUserDataAndHistory = async () => {
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
        
        // 🧠 QUANT-LEVEL P&L ACCOUNTING (Average Cost Basis)
        // Backend returns newest first. Reverse to oldest first for accurate sequential math.
        const oldestFirst = [...rawHistData].reverse();
        const costBasis = {};
        
        const enriched = oldestFirst.map(t => {
          const sym = t.symbol;
          if (!costBasis[sym]) costBasis[sym] = { qty: 0, invested: 0 };
          
          if (t.transactionType?.toUpperCase() === 'BUY') {
            costBasis[sym].qty += t.quantity;
            costBasis[sym].invested += t.quantity * t.pricePerShare;
            return { ...t, realizedPnL: null }; // Unrealized until sold
          } else {
            // It's a SELL. Calculate average cost of held units.
            const avgCost = costBasis[sym].qty > 0 
               ? costBasis[sym].invested / costBasis[sym].qty 
               : t.pricePerShare;
               
            const pnl = (t.pricePerShare - avgCost) * t.quantity;
            
            costBasis[sym].qty -= t.quantity;
            // Recalculate remaining invested value
            costBasis[sym].invested = costBasis[sym].qty * avgCost; 
            
            return { ...t, realizedPnL: pnl };
          }
        });

        // Reverse back to newest first for UI display
        setTradeHistory(enriched.reverse()); 
      }
    } catch (error) { 
      console.error(error); 
      toast.error("Failed to load trade ledger.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchUserDataAndHistory();
  }, [token, navigate]);

  // 🧠 CALCULATE PERFORMANCE METRICS
  const totalTrades = tradeHistory.length;
  
  // 🚀 FIX: Using Correct Fields
  const sellTrades = tradeHistory.filter(t => t.transactionType?.toUpperCase() === 'SELL');
  const profitableSells = sellTrades.filter(t => (t.realizedPnL || 0) > 0).length;
  const winRate = sellTrades.length > 0 ? ((profitableSells / sellTrades.length) * 100).toFixed(1) : 0;
  
  const totalRealizedPnL = sellTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
  const isOverallGreen = totalRealizedPnL >= 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="flex h-screen bg-[#0A0906] text-[#F5F0E8]/90 font-inter overflow-hidden selection:bg-[#C8833A]/30">

      <Sidebar userName={userName} isMarketOpen={isMarketOpen} avatar={avatar} />
      <MobileBottomNav />

      {/* 🔴 MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 pb-24 md:pb-0 relative custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 relative z-10">
          
          {/* 📱 Mobile top bar */}
          <div className="md:hidden flex items-center justify-between pt-2 mb-2">
            <h1 className="text-lg font-black tracking-tight"><span className="text-[#C8833A]">PAPER</span> TRADE</h1>
            <button onClick={fetchUserDataAndHistory} className="flex items-center gap-1.5 text-[10px] font-bold text-[#F5F0E8]/50 bg-[#1C1710] px-3 py-2 rounded-xl border border-[#2A2318]">
              <span className="material-symbols-outlined text-[14px]">refresh</span> Refresh
            </button>
          </div>

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-4 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Trade Ledger</h2>
              <p className="text-[#F5F0E8]/60 text-sm mt-1">Review your past executions and overall terminal performance.</p>
            </div>
            <button onClick={fetchUserDataAndHistory} className="hidden md:flex items-center gap-2 text-[11px] font-bold text-[#F5F0E8]/50 hover:text-white uppercase tracking-widest transition-colors bg-[#1C1710] px-4 py-2.5 rounded-xl border border-[#2A2318] hover:border-white/20">
               <span className="material-symbols-outlined text-[16px]">refresh</span> Refresh Ledger
            </button>
          </header>

          {/* 🟢 PERFORMANCE METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#131009] border border-[#2A2318] rounded-3xl p-6 shadow-xl relative overflow-hidden">
               <div className="flex items-center gap-3 mb-4 opacity-70">
                 <span className="material-symbols-outlined text-[#F5F0E8]">receipt_long</span>
                 <h3 className="text-xs font-bold text-white uppercase tracking-widest">Total Executions</h3>
               </div>
               <p className="text-4xl font-bold font-mono text-[#F5F0E8]">{totalTrades}</p>
            </div>
            <div className="bg-[#131009] border border-[#2A2318] rounded-3xl p-6 shadow-xl relative overflow-hidden">
               <div className="flex items-center gap-3 mb-4 opacity-70">
                 <span className="material-symbols-outlined text-[#F5F0E8]">track_changes</span>
                 <h3 className="text-xs font-bold text-white uppercase tracking-widest">Win Rate (Closed)</h3>
               </div>
               <p className="text-4xl font-bold font-mono text-[#F5F0E8]">{winRate}%</p>
            </div>
            <div className={`bg-gradient-to-br border rounded-3xl p-6 shadow-xl ${isOverallGreen ? 'from-[#003a00]/40 to-[#121212] border-green-500/20' : 'from-[#3a0000]/40 to-[#121212] border-red-500/20'}`}>
               <div className="flex items-center gap-3 mb-4">
                 <span className={`material-symbols-outlined ${isOverallGreen ? 'text-green-500' : 'text-red-500'}`}>
                   {isOverallGreen ? 'price_check' : 'money_off'}
                 </span>
                 <h3 className={`text-xs font-bold uppercase tracking-widest ${isOverallGreen ? 'text-green-500' : 'text-red-500'}`}>Realized P&L</h3>
               </div>
               <p className={`text-4xl font-bold font-mono ${isOverallGreen ? 'text-green-500' : 'text-red-500'}`}>
                 {isOverallGreen ? '+' : ''}₹{totalRealizedPnL.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
               </p>
            </div>
          </div>

          {/* 📱 MOBILE: card view of trade history */}
          <div className="md:hidden bg-[#131009] border border-[#2A2318] rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[#2A2318] bg-[#1C1710]/50">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F5F0E8]/50 text-[18px]">history</span> Transaction History
              </h3>
            </div>
            {isLoading ? (
              <div className="p-10 flex justify-center">
                <span className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            ) : tradeHistory.length === 0 ? (
              <div className="p-10 text-center text-[#F5F0E8]/40 text-sm">No trading history yet.</div>
            ) : (
              <div className="divide-y divide-[#2A2318]">
                {tradeHistory.map((trade, i) => {
                  const isBuy = trade.transactionType?.toUpperCase() === 'BUY';
                  const pnl = trade.realizedPnL || 0;
                  const isProfit = pnl > 0;
                  const isLoss = pnl < 0;
                  return (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${isBuy ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                          {trade.transactionType}
                        </span>
                        <div>
                          <p className="font-bold text-[#F5F0E8]/90 text-sm">{trade.symbol}</p>
                          <p className="text-[10px] text-[#F5F0E8]/40 mt-0.5">{trade.quantity} units · ₹{Number(trade.pricePerShare).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-white font-bold text-sm">₹{(trade.quantity * trade.pricePerShare).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                        {!isBuy && (
                          <p className={`text-[11px] font-bold font-mono mt-0.5 ${isProfit ? 'text-green-500' : isLoss ? 'text-red-500' : 'text-[#F5F0E8]/40'}`}>
                            {isProfit ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 🖥️ DESKTOP: full table */}
          <div className="hidden md:block bg-[#131009] border border-[#2A2318] rounded-3xl overflow-hidden shadow-xl">
             <div className="p-6 border-b border-[#2A2318] bg-[#1C1710]/50 flex justify-between items-center">
               <h3 className="font-bold text-white text-lg flex items-center gap-2">
                 <span className="material-symbols-outlined text-[#F5F0E8]/50 text-[20px]">history</span> Transaction History
               </h3>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse whitespace-nowrap">
                 <thead>
                   <tr className="text-[#F5F0E8]/40 text-[10px] font-bold uppercase tracking-widest border-b border-[#2A2318] bg-[#0A0906]/50">
                     <th className="px-8 py-5">Date & Time</th>
                     <th className="px-8 py-5">Asset</th>
                     <th className="px-8 py-5 text-center">Type</th>
                     <th className="px-8 py-5 text-right">Qty.</th>
                     <th className="px-8 py-5 text-right">Exec. Price</th>
                     <th className="px-8 py-5 text-right">Total Value</th>
                     <th className="px-8 py-5 text-right">Realized P&L</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#2A2318]">
                   {isLoading ? (
                     <tr>
                       <td colSpan="7" className="px-8 py-12 text-center">
                         <span className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                       </td>
                     </tr>
                   ) : tradeHistory.length === 0 ? (
                     <tr>
                       <td colSpan="7" className="px-8 py-16 text-center text-[#F5F0E8]/40 font-medium">
                         No trading history found. Your ledger is clean.
                       </td>
                     </tr>
                   ) : (
                     tradeHistory.map((trade, i) => {
                       const isBuy = trade.transactionType?.toUpperCase() === 'BUY';
                       const pnl = trade.realizedPnL || 0;
                       const isProfit = pnl > 0;
                       const isLoss = pnl < 0;

                       return (
                         <motion.tr initial={{opacity:0}} animate={{opacity:1}} transition={{delay: i * 0.05}} key={i} className="hover:bg-white/[0.02] transition-colors group">
                           <td className="px-8 py-4">
                              <p className="font-mono text-[#F5F0E8]/80 text-sm">
                                {new Date(trade.date || trade.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] text-[#F5F0E8]/40 font-mono mt-0.5">
                                {new Date(trade.date || trade.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </p>
                           </td>
                           <td className="px-8 py-4">
                             <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isBuy ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                 {trade.symbol?.charAt(0)}
                               </div>
                               <p className="font-bold text-[#F5F0E8]/90">{trade.symbol}</p>
                             </div>
                           </td>
                           <td className="px-8 py-4 text-center">
                              <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${isBuy ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                {trade.transactionType}
                              </span>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <p className="font-mono text-white font-bold">{trade.quantity}</p>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <p className="font-mono text-[#F5F0E8]/70">₹{Number(trade.pricePerShare).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <p className="font-mono text-white font-semibold">₹{(trade.quantity * trade.pricePerShare).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                           </td>
                           <td className="px-8 py-4 text-right">
                              {isBuy ? (
                                <span className="text-[#F5F0E8]/30 text-[10px] uppercase font-bold tracking-widest">-</span>
                              ) : (
                                <p className={`font-mono font-bold ${isProfit ? 'text-green-500' : isLoss ? 'text-red-500' : 'text-[#F5F0E8]/50'}`}>
                                  {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </p>
                              )}
                           </td>
                         </motion.tr>
                       );
                     })
                   )}
                 </tbody>
               </table>
             </div>
          </div>

        </div>
      </main>
    </motion.div>
  );
}

export default History;
