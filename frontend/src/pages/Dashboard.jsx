import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import SmartChart from '../components/SmartChart';
import { AppShell } from '../components/AppShell';
import useMarketStatus from '../hooks/useMarketStatus';
import TradeModal from '../components/TradeModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TOP_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL', 'LT', 'AXISBANK'];
const INDICES    = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];
const ALL_SYMBOLS = [...TOP_STOCKS, ...INDICES];

const MOCK_NEWS = [
  { id: 1, title: "FIIs extend buying streak in Indian equities, pump ₹2,400 Cr.", source: "Bloomberg", time: "10 min ago" },
  { id: 2, title: "Tech stocks rally as IT majors post strong Q3 guidance.", source: "Reuters", time: "1 hr ago" },
  { id: 3, title: "RBI maintains repo rate at 6.5%, signals robust growth.", source: "Financial Times", time: "2 hrs ago" },
  { id: 4, title: "Oil prices drop below $75/bbl amid demand concerns.", source: "WSJ", time: "3 hrs ago" },
];

function Dashboard() {
  const [userName, setUserName] = useState('');
  const [balance, setBalance] = useState(0);
  const [avatar, setAvatar] = useState('');
  const [holdings, setHoldings] = useState([]);
  const [marketPrices, setMarketPrices] = useState({}); 
  const [tradeHistory, setTradeHistory] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);

  
  const [watchlist] = useState(() => {
    const saved = localStorage.getItem('paper_watchlist');
    return saved ? JSON.parse(saved) : ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK'];
  });
  const [priceFlash, setPriceFlash] = useState({}); // symbol → 'positive' | 'negative'
  const prevPricesRef = useRef({});

  useEffect(() => { localStorage.setItem('paper_watchlist', JSON.stringify(watchlist)); }, [watchlist]);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const marketStatus = useMarketStatus();

  const fetchUserData = useCallback(async (signal) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/getuser`, {
        method: "GET", headers: { "Content-Type": "application/json", "auth-token": token },
        signal
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
          headers: { "Content-Type": "application/json", "auth-token": token },
          signal
        });
        if (portRes.ok) {
          const portData = await portRes.json();
          setHoldings(portData || []);
        }
      } catch { /* ignore */ }

      try {
        const histRes = await fetch(`${API_URL}/api/trade/history`, {
          headers: { "Content-Type": "application/json", "auth-token": token },
          signal
        });
        if (histRes.ok) {
          const rawHistData = await histRes.json();
          
          // Calculate Win Rate logic
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
      } catch { /* ignore */ }
    } catch (error) { if (error.name !== 'AbortError') console.error(error); }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const controller = new AbortController();
    const init = async () => { await fetchUserData(controller.signal); };
    init();
    return () => { controller.abort(); };
  }, [token, navigate, fetchUserData]);

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
        
        // Compute flash directions
        const flashes = {};
        Object.entries(realPrices).forEach(([sym, data]) => {
          const prev = prevPricesRef.current[sym]?.price;
          const curr = data?.price;
          if (prev !== undefined && curr !== undefined && curr !== prev) {
            flashes[sym] = curr > prev ? 'positive' : 'negative';
          }
        });
        prevPricesRef.current = realPrices;
        setMarketPrices(prev => ({ ...prev, ...realPrices }));
        if (Object.keys(flashes).length > 0) {
          setPriceFlash(flashes);
          setTimeout(() => setPriceFlash({}), 450);
        }
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


  // Metrics Calculations
  let holdingsValue = 0;
  let todaysPnL = 0;
  
  holdings.forEach(h => {
    const liveData = marketPrices[h.symbol] || {};
    const price = liveData.price || h.avgPrice;
    holdingsValue += price * h.quantity;
    const change = liveData.change || 0; // % change today
    const prevClose = price / (1 + (change/100));
    todaysPnL += (price - prevClose) * h.quantity;
  });

  const portfolioValue = balance + holdingsValue;
  
  const sellTrades = tradeHistory.filter(t => t.transactionType?.toUpperCase() === 'SELL');
  const profitableSells = sellTrades.filter(t => (t.realizedPnL || 0) > 0).length;
  const winRate = sellTrades.length > 0 ? ((profitableSells / sellTrades.length) * 100).toFixed(0) : 0;

  // Sentiment Calculation
  const advancing = TOP_STOCKS.filter(sym => (marketPrices[sym]?.change || 0) >= 0).length;
  const declining = TOP_STOCKS.length - advancing;
  const sentimentScore = advancing / TOP_STOCKS.length;
  const sentimentLabel = sentimentScore > 0.6 ? 'Bullish' : sentimentScore < 0.4 ? 'Bearish' : 'Neutral';
  const sentimentColor = sentimentScore > 0.6 ? 'text-positive' : sentimentScore < 0.4 ? 'text-negative' : 'text-warning';

  const istTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const currentHour = istTime.getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  
  const mainChartAsset = 'NIFTY 50';
  const mainChartData = marketPrices[mainChartAsset] || {};
  const mainChartIsGreen = (mainChartData.change || 0) >= 0;

  return (
    <AppShell userName={userName} marketStatus={marketStatus} avatar={avatar}>
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1400px] mx-auto space-y-8">
            
            {/* HERO & QUICK ACTIONS */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border">
              <Motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <h1 className="type-h2 mb-2">{greeting}, {userName}.</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${marketStatus === 'LIVE' ? 'bg-positive animate-pulse' : marketStatus === 'SIMULATED' ? 'bg-accent' : 'bg-text-tertiary'}`} />
                  <span className="type-caption uppercase tracking-widest">{marketStatus === 'LIVE' ? 'Market is Open' : marketStatus === 'SIMULATED' ? 'AI Synthetic Mode' : 'Checking Status'}</span>
                </div>
              </Motion.div>
              <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-3">
                <button onClick={() => navigate('/portfolio')} className="px-4 py-2 bg-surface-raised hover:bg-border border border-border rounded-lg type-label-body text-text-primary transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{fontSize: '16px'}}>account_balance_wallet</span> Deposit
                </button>
                <button onClick={() => navigate('/markets')} className="px-4 py-2 bg-text-primary hover:bg-accent-hover text-bg border border-transparent rounded-lg type-label-body transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{fontSize: '16px'}}>add</span> Trade
                </button>
              </Motion.div>
            </header>

            {/* BALANCE CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="bg-surface-raised border border-border rounded-lg p-5 shadow-1">
                <p className="type-label mb-2">Total Value</p>
                <p className="type-data-xl">₹{portfolioValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </Motion.div>
              <Motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y:0}} transition={{delay: 0.15}} className="bg-surface-raised border border-border rounded-lg p-5 shadow-1">
                <p className="type-label mb-2">Available Margin</p>
                <p className="type-data-lg text-text-primary mt-1">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </Motion.div>
              <Motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="bg-surface-raised border border-border rounded-lg p-5 shadow-1">
                <p className="type-label mb-2">Today's P&L (Unrealized)</p>
                <p className={`type-data-lg mt-1 ${todaysPnL >= 0 ? 'type-positive' : 'type-negative'}`}>
                  {todaysPnL >= 0 ? '+' : ''}₹{todaysPnL.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </Motion.div>
              <Motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y:0}} transition={{delay: 0.25}} className="bg-surface-raised border border-border rounded-lg p-5 shadow-1 relative overflow-hidden group">
                <p className="type-label mb-2">Win Rate</p>
                <p className="type-data-lg text-text-primary mt-1">{winRate}% <span className="type-data-sm text-text-tertiary font-normal tracking-normal ml-1">of {sellTrades.length} closed</span></p>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined" style={{fontSize: '48px'}}>sports_score</span>
                </div>
              </Motion.div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: Chart & Trades */}
              <div className="xl:col-span-8 flex flex-col gap-8">
                
                {/* Index Ticker Bar */}
                <div className="grid grid-cols-3 gap-4">
                  {INDICES.map((idx, i) => {
                    const data = marketPrices[idx] || {};
                    const isUp = (data.change || 0) >= 0;
                    return (
                      <Motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.3 + (i*0.05)}} key={idx} onClick={() => setSelectedAsset(idx)} className="bg-surface border border-border rounded-lg p-3 flex flex-col cursor-pointer hover:border-border-strong transition-colors">
                        <p className="type-label text-text-secondary">{idx}</p>
                        <div className="flex items-baseline justify-between mt-1">
                          <p className="type-data-md">{(data.price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                          <p className={`type-caption ${isUp ? 'type-positive' : 'type-negative'}`}>{isUp ? '+' : ''}{(data.change || 0).toFixed(2)}%</p>
                        </div>
                      </Motion.div>
                    )
                  })}
                </div>

                {/* Main Chart */}
                <Motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.4}} className="bg-surface border border-border rounded-lg shadow-1 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-surface-raised/50">
                    <div>
                      <h2 className="type-subtitle">{mainChartAsset}</h2>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="type-data-md">₹{mainChartData.price > 0 ? mainChartData.price.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '—'}</span>
                        <span className={`type-caption ${mainChartIsGreen ? 'type-positive' : 'type-negative'}`}>{mainChartIsGreen ? '+' : ''}{mainChartData.change || 0}%</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedAsset(mainChartAsset)} className="text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors">
                      <span className="material-symbols-outlined" style={{fontSize: '16px'}}>open_in_new</span> Expand
                    </button>
                  </div>
                  <div className="h-[380px] w-full">
                    <SmartChart symbol={mainChartAsset} currentPrice={mainChartData.price} isGreen={mainChartIsGreen} />
                  </div>
                </Motion.div>

                {/* Recent Trades Feed */}
                <Motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.5}}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="type-label">Recent Executions</p>
                    <button onClick={() => navigate('/history')} className="text-xs font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1">
                      View Ledger <span className="material-symbols-outlined" style={{fontSize: '14px'}}>arrow_forward</span>
                    </button>
                  </div>
                  <div className="bg-surface border border-border rounded-lg shadow-1 overflow-hidden">
                    {tradeHistory.length === 0 ? (
                      <p className="type-caption-muted p-6 text-center">No recent executions.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {tradeHistory.slice(0, 4).map((trade, i) => {
                          const isBuy = trade.transactionType?.toUpperCase() === 'BUY';
                          const pnl = trade.realizedPnL || 0;
                          const isProfit = pnl > 0;
                          return (
                            <div key={i} className="flex items-center justify-between p-4 hover:bg-surface-raised/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] uppercase ${isBuy ? 'bg-accent-gold-muted text-accent-gold' : isProfit ? 'bg-positive-muted type-positive' : 'bg-negative-muted type-negative'}`}>
                                  {isBuy ? 'Buy' : 'Sell'}
                                </div>
                                <div>
                                  <p className="type-body font-medium">{trade.symbol}</p>
                                  <p className="type-caption-muted">{new Date(trade.date || trade.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="type-data-sm text-text-primary">{trade.quantity} @ ₹{Number(trade.pricePerShare).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                                {!isBuy && (
                                  <p className={`type-caption ${isProfit ? 'type-positive' : 'type-negative'}`}>
                                    {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </Motion.div>

              </div>

              {/* RIGHT COLUMN: Watchlist, Portfolio, News */}
              <div className="xl:col-span-4 flex flex-col gap-8">
                
                {/* Market Sentiment */}
                <Motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.4}} className="bg-surface border border-border rounded-lg p-5 shadow-1">
                  <p className="type-label mb-4">Market Sentiment</p>
                  <div className="flex items-end justify-between mb-2">
                    <p className={`text-2xl font-black tracking-tight ${sentimentColor}`}>{sentimentLabel}</p>
                    <p className="type-caption-muted">{advancing} Adv / {declining} Dec</p>
                  </div>
                  {/* Gauge bar */}
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden flex">
                    <div className="h-full bg-positive transition-all duration-1000" style={{ width: `${(advancing / TOP_STOCKS.length) * 100}%` }}></div>
                    <div className="h-full bg-negative transition-all duration-1000" style={{ width: `${(declining / TOP_STOCKS.length) * 100}%` }}></div>
                  </div>
                </Motion.div>

                {/* Watchlist */}
                <Motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.5}} className="bg-surface border border-border rounded-lg shadow-1 flex flex-col">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <p className="type-label">Watchlist</p>
                    <button className="text-text-tertiary hover:text-text-primary transition-colors"><span className="material-symbols-outlined" style={{fontSize: '18px'}}>add</span></button>
                  </div>
                  <div className="divide-y divide-border">
                    {watchlist.slice(0, 5).map((sym) => {
                      const data = marketPrices[sym] || {};
                      const isUp = (data.change || 0) >= 0;
                      const flash = priceFlash[sym];
                      return (
                        <div key={sym} onClick={() => setSelectedAsset(sym)} className="flex items-center justify-between p-3.5 hover:bg-surface-raised transition-colors cursor-pointer group">
                          <div>
                            <p className="type-body font-medium group-hover:text-text-primary text-text-secondary transition-colors">{sym}</p>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <p className={`type-data-md rounded px-1 ${flash ? `flash-${flash}` : ''}`}>₹{(data.price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                            <div className={`w-14 text-right type-caption ${isUp ? 'type-positive' : 'type-negative'}`}>
                              {isUp ? '+' : ''}{(data.change || 0).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      )
                    })}

                  </div>
                </Motion.div>

                {/* Open Positions */}
                <Motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.6}} className="bg-surface border border-border rounded-lg shadow-1 flex flex-col">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <p className="type-label">Open Positions</p>
                    <button onClick={() => navigate('/portfolio')} className="text-text-tertiary hover:text-text-primary transition-colors"><span className="material-symbols-outlined" style={{fontSize: '18px'}}>open_in_new</span></button>
                  </div>
                  <div className="divide-y divide-border">
                    {holdings.length === 0 ? (
                      <p className="type-caption-muted p-6 text-center">No open positions.</p>
                    ) : (
                      holdings.slice(0,3).map((h, i) => {
                        const data = marketPrices[h.symbol] || {};
                        const currentVal = (data.price || h.avgPrice) * h.quantity;
                        const pnl = currentVal - (h.avgPrice * h.quantity);
                        const isUp = pnl >= 0;
                        return (
                          <div key={i} onClick={() => setSelectedAsset(h.symbol)} className="flex items-center justify-between p-3.5 hover:bg-surface-raised transition-colors cursor-pointer group">
                             <div>
                               <p className="type-body font-medium group-hover:text-text-primary text-text-secondary">{h.symbol}</p>
                               <p className="type-caption-muted">{h.quantity} units</p>
                             </div>
                             <div className="text-right">
                               <p className="type-data-md">₹{currentVal.toLocaleString('en-IN', {minimumFractionDigits: 0})}</p>
                               <p className={`type-caption ${isUp ? 'type-positive' : 'type-negative'}`}>
                                 {isUp ? '+' : ''}₹{pnl.toLocaleString('en-IN', {minimumFractionDigits: 0})}
                               </p>
                             </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </Motion.div>

                {/* News Panel */}
                <Motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.7}}>
                  <p className="type-label mb-3">Top Stories</p>
                  <div className="space-y-3">
                    {MOCK_NEWS.map(news => (
                      <div key={news.id} className="p-3 bg-surface hover:bg-surface-raised border border-border rounded-lg transition-colors cursor-pointer group">
                        <p className="type-body leading-tight text-text-secondary group-hover:text-text-primary transition-colors mb-2">{news.title}</p>
                        <div className="flex items-center justify-between">
                          <p className="type-caption-muted">{news.source}</p>
                          <p className="type-caption-muted">{news.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Motion.div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAsset && (
          <TradeModal 
            symbol={selectedAsset} 
            marketData={marketPrices[selectedAsset]} 
            onClose={() => setSelectedAsset(null)} 
            balance={balance} 
            token={token} 
            onSuccess={fetchUserData}
            ownedQty={holdings.find(h => h.symbol === selectedAsset)?.quantity || 0}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

export default Dashboard;
