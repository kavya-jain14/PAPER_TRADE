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
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchUserDataAndHistory();
  }, [token, navigate]);

  const totalTrades = tradeHistory.length;
  const sellTrades = tradeHistory.filter(t => t.transactionType?.toUpperCase() === 'SELL');
  const profitableSells = sellTrades.filter(t => (t.realizedPnL || 0) > 0).length;
  const winRate = sellTrades.length > 0 ? ((profitableSells / sellTrades.length) * 100).toFixed(1) : 0;
  
  const totalRealizedPnL = sellTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
  const isOverallGreen = totalRealizedPnL >= 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex h-screen bg-[#0B0D10] text-[#E5E5E5] font-sans overflow-hidden selection:bg-[#D4A574]/30">

      <Sidebar userName={userName} isMarketOpen={isMarketOpen} avatar={avatar} />
      <MobileBottomNav />

      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1600px] mx-auto space-y-12">
            
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-[56px] font-light tracking-tight text-[#E5E5E5] leading-none mb-4">
                  Trade <span className="font-bold">Ledger</span>.
                </motion.h1>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isMarketOpen ? 'bg-[#4ADE80] animate-pulse shadow-[0_0_10px_#4ADE80]' : 'bg-[#EF4444]'}`} />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5E5E5]/40">{isMarketOpen ? 'Live Market' : 'AI Synthetic Mode'}</p>
                </motion.div>
              </div>
              <button onClick={fetchUserDataAndHistory} className="flex items-center gap-2 text-[10px] font-bold text-[#E5E5E5]/50 hover:text-[#E5E5E5] uppercase tracking-widest transition-colors bg-[#16181D] px-4 py-2.5 rounded-full hover-glow">
                 <span className="material-symbols-outlined text-[16px]">refresh</span> Refresh Ledger
              </button>
            </header>

            {/* PERFORMANCE METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              <div className="bg-[#16181D]/50 rounded-[32px] p-8 shadow-xl relative overflow-hidden group">
                 <h3 className="text-xs font-bold text-[#E5E5E5]/40 uppercase tracking-widest mb-6">Total Executions</h3>
                 <p className="text-4xl md:text-5xl font-bold font-mono text-[#E5E5E5] group-hover:text-[#D4A574] transition-colors">{totalTrades}</p>
              </div>
              <div className="bg-[#16181D]/50 rounded-[32px] p-8 shadow-xl relative overflow-hidden group">
                 <h3 className="text-xs font-bold text-[#E5E5E5]/40 uppercase tracking-widest mb-6">Win Rate (Closed)</h3>
                 <p className="text-4xl md:text-5xl font-bold font-mono text-[#E5E5E5] group-hover:text-[#D4A574] transition-colors">{winRate}%</p>
              </div>
              <div className={`bg-gradient-to-br rounded-[32px] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden ${isOverallGreen ? 'from-[#002a10] to-[#0B0D10]' : 'from-[#2a0000] to-[#0B0D10]'}`}>
                 <h3 className={`text-xs font-bold uppercase tracking-widest mb-6 ${isOverallGreen ? 'text-[#4ADE80]/80' : 'text-[#EF4444]/80'}`}>Realized P&L</h3>
                 <p className={`text-4xl md:text-5xl font-bold font-mono ${isOverallGreen ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>
                   {isOverallGreen ? '+' : ''}₹{totalRealizedPnL.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                 </p>
              </div>
            </div>

            {/* EXECUTION FEED */}
            <div className="space-y-6">
               <div className="flex justify-between items-end mb-8">
                 <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#E5E5E5]/40 pl-4 border-l-2 border-[#D4A574]">Execution Feed</h3>
               </div>
               
               <div className="space-y-4">
                 {isLoading ? (
                   <div className="py-12 text-center">
                     <span className="w-8 h-8 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin inline-block"></span>
                   </div>
                 ) : tradeHistory.length === 0 ? (
                   <div className="bg-[#16181D]/30 rounded-[32px] p-16 text-center text-[#E5E5E5]/40 font-mono shadow-inner border border-[#E5E5E5]/5">
                     No trading history found. Your ledger is clean.
                   </div>
                 ) : (
                   tradeHistory.map((trade, i) => {
                     const isBuy = trade.transactionType?.toUpperCase() === 'BUY';
                     const pnl = trade.realizedPnL || 0;
                     const isProfit = pnl > 0;
                     const isLoss = pnl < 0;

                     return (
                       <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y:0}} transition={{delay: i * 0.05}} key={i} className={`group relative bg-[#16181D]/30 border border-[#E5E5E5]/5 rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg hover:-translate-y-1 transition-transform ${isBuy ? 'hover:shadow-[0_10px_30px_rgba(212,165,116,0.05)]' : isProfit ? 'hover:shadow-[0_10px_30px_rgba(74,222,128,0.05)]' : 'hover:shadow-[0_10px_30px_rgba(239,68,68,0.05)]'}`}>
                         
                         <div className="flex items-center gap-6">
                           <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-xs bg-[#0B0D10] border border-[#E5E5E5]/5 shadow-inner transition-colors ${isBuy ? 'text-[#D4A574]' : isProfit ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>
                             <span className="material-symbols-outlined text-[20px]">{isBuy ? 'shopping_cart' : 'sell'}</span>
                           </div>
                           <div>
                             <div className="flex items-center gap-3 mb-1">
                               <p className="font-bold text-xl text-[#E5E5E5] group-hover:text-[#D4A574] transition-colors tracking-tight">{trade.symbol}</p>
                               <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isBuy ? 'text-[#0B0D10] bg-[#D4A574]' : 'text-[#0B0D10] bg-[#E5E5E5]'}`}>
                                 {trade.transactionType}
                               </span>
                             </div>
                             <div className="flex items-center gap-3 font-mono text-xs text-[#E5E5E5]/40">
                               <p>{new Date(trade.date || trade.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                               <span className="w-1 h-1 rounded-full bg-[#E5E5E5]/20"></span>
                               <p>{new Date(trade.date || trade.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                             </div>
                           </div>
                         </div>

                         <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-[#E5E5E5]/5 pt-4 md:pt-0">
                           <div className="text-left md:text-right">
                              <p className="text-[10px] uppercase tracking-widest font-bold text-[#E5E5E5]/30 mb-1">Execution</p>
                              <p className="font-mono text-[#E5E5E5] font-semibold text-lg">{trade.quantity} <span className="text-sm text-[#E5E5E5]/50">@</span> ₹{Number(trade.pricePerShare).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest font-bold text-[#E5E5E5]/30 mb-1">Total / P&L</p>
                              {isBuy ? (
                                <p className="font-mono text-[#E5E5E5]/50 font-bold">₹{(trade.quantity * trade.pricePerShare).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                              ) : (
                                <p className={`font-mono font-bold text-lg ${isProfit ? 'text-[#4ADE80]' : isLoss ? 'text-[#EF4444]' : 'text-[#E5E5E5]/50'}`}>
                                  {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </p>
                              )}
                           </div>
                         </div>

                       </motion.div>
                     );
                   })
                 )}
               </div>
            </div>

          </div>
        </div>
      </main>
    </motion.div>
  );
}

export default History;
