import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import SmartChart, { CandlestickModal } from '../components/SmartChart';
import Sidebar, { MobileBottomNav } from '../components/Sidebar';
import { Button, Input, Badge, Card, CardHeader, CardTitle, CardContent } from '../components/ui';

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
      <div className="fixed inset-0 bg-bg/80 flex items-center justify-center backdrop-blur-sm z-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} 
          className="bg-surface border border-border rounded-lg shadow-3 w-full max-w-[900px] overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
          
          <div className="w-full md:w-[60%] p-6 md:p-8 border-b md:border-b-0 md:border-r border-border flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="type-h2">{symbol}</h3>
                <p className="type-label mt-2">{INDICES.includes(symbol) ? 'Market Index' : 'Equity · NSE'}</p>
              </div>
              <div className="text-right">
                <p className="type-data-lg">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                <p className={`type-caption mt-1 ${isGreen ? 'type-positive' : 'type-negative'}`}>{isGreen ? '▲' : '▼'} {isGreen ? '+' : ''}{changePercent}% today</p>
              </div>
            </div>
            <div className="flex-1 min-h-[250px] w-full border border-border rounded-md overflow-hidden relative group mb-6">
              <SmartChart symbol={symbol} currentPrice={currentPrice} isGreen={isGreen} />
              <button
                onClick={() => setShowCandlestick(true)}
                title="Expand as Candlestick Chart"
                className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-surface-raised border border-border hover:border-border-strong type-caption-muted hover:text-text-primary px-3 py-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 shadow-1"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 'var(--icon-sm)' }}>candlestick_chart</span>
                Candlestick
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="type-label mb-1">Day Low</p>
                <p className="type-data-md">₹{dayLow.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
              </div>
              <div className="text-right">
                <p className="type-label mb-1">Day High</p>
                <p className="type-data-md">₹{dayHigh.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[40%] p-6 md:p-8 flex flex-col bg-surface">
            <div className="flex justify-end mb-6">
              <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex p-1 bg-surface-raised rounded-md mb-8 border border-border">
              <button onClick={() => setActiveTab('BUY')} className={`flex-1 py-2 rounded-[4px] text-label transition-colors ${activeTab === 'BUY' ? 'bg-bg text-text-primary shadow-1' : 'text-text-tertiary hover:text-text-primary'}`}>Buy</button>
              <button onClick={() => setActiveTab('SELL')} className={`flex-1 py-2 rounded-[4px] text-label transition-colors ${activeTab === 'SELL' ? 'bg-bg text-text-primary shadow-1' : 'text-text-tertiary hover:text-text-primary'}`}>Sell</button>
            </div>

            <form onSubmit={handleExecute} className="flex-1 flex flex-col">
              <div className="space-y-5 flex-1">
                <div className="flex justify-between items-baseline pb-4 border-b border-border">
                  <span className="type-label">{activeTab === 'BUY' ? 'Max Affordable' : 'Units Owned'}</span>
                  <span className={`type-data-md ${activeTab === 'BUY' ? 'type-positive' : ''}`}>{activeTab === 'BUY' ? maxBuyQty.toLocaleString() : ownedQty.toLocaleString()} units</span>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="type-label">Quantity</label>
                    <button type="button" onClick={handleMax} className="type-label-body hover:text-text-primary transition-colors">Use max</button>
                  </div>
                  <Input autoFocus type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" required min="1" step="1" className="font-mono text-right" style={{ fontSize: 'var(--text-h3)', height: '56px' }} />
                </div>
                
                <div className="flex justify-between items-baseline py-4 border-y border-border">
                  <span className="type-label">Market Price</span>
                  <span className="type-data-md">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="type-label">Est. Total</span>
                  <span className="type-data-lg">₹{(estCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {numQty > 0 && (
                  <div className="flex justify-between items-baseline mb-5">
                    <span className="type-label">Balance After</span>
                    <span className={`type-data-sm ${balanceAfter >= 0 ? '' : 'type-negative'}`}>
                      ₹{Math.max(0, balanceAfter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <Button type="submit" variant={activeTab === 'BUY' ? 'primary' : 'danger'} size="lg" className="w-full">
                  {activeTab === 'BUY' ? 'Buy' : 'Sell'} {symbol}
                </Button>
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
  
  const tickerItems = [...INDICES, ...TOP_STOCKS.slice(0, 5)];
  const mainChartAsset = 'NIFTY 50';
  const mainChartData = marketPrices[mainChartAsset] || {};
  const mainChartIsGreen = (mainChartData.change || 0) >= 0;

  return (
    <div className="flex h-screen bg-bg text-text-primary font-sans overflow-hidden">

      <Sidebar userName={userName} isMarketOpen={isMarketOpen} avatar={avatar} />
      <MobileBottomNav />

      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Minimal Ticker */}
        <div className="w-full border-b border-border bg-surface overflow-hidden whitespace-nowrap py-2 shrink-0 flex items-center z-20">
          <div className="flex gap-12 animate-ticker shrink-0 w-max font-mono text-label">
            {tickerItems.map((sym, i) => {
              const liveData = marketPrices[sym] || {};
              const price = liveData.price || 0;
              const change = liveData.change || 0;
              return (
                <span key={`${sym}-${i}`} className="flex items-center gap-2">
                  <span className="text-text-tertiary">{sym}</span>
                  <span className="font-medium">{price > 0 ? price.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '---'}</span>
                  <span className={change >= 0 ? 'text-positive font-medium' : 'text-negative font-medium'}>{change >= 0 ? '▲' : '▼'}{Math.abs(change).toFixed(2)}%</span>
                </span>
              )
            })}
             {tickerItems.map((sym, i) => {
              const liveData = marketPrices[sym] || {};
              const price = liveData.price || 0;
              const change = liveData.change || 0;
              return (
                <span key={`dup-${sym}-${i}`} className="flex items-center gap-2">
                  <span className="text-text-tertiary">{sym}</span>
                  <span className="font-medium">{price > 0 ? price.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '---'}</span>
                  <span className={change >= 0 ? 'text-positive font-medium' : 'text-negative font-medium'}>{change >= 0 ? '▲' : '▼'}{Math.abs(change).toFixed(2)}%</span>
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
          <div className="max-w-[1200px] mx-auto space-y-10">
            
            {/* Header: Typography focused */}
            <header className="border-b border-border pb-8">
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <h1 className="type-h2 mb-6">{greeting}, {userName}.</h1>
                <div className="flex flex-wrap items-center gap-8">
                  <div>
                    <p className="type-label mb-2">Available Margin</p>
                    <p className="type-data-xl">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                  <div className="hidden md:block w-px h-8 bg-border" />
                  <div>
                    <p className="type-label mb-2">Market Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-positive' : 'bg-text-tertiary'}`} />
                      <span className="type-body">{isMarketOpen ? 'Live' : 'Closed'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </header>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 md:gap-16 pt-2">
              
              {/* Primary Content (Chart & Insights) */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="xl:col-span-8 flex flex-col gap-10">
                
                {/* Live Chart */}
                <div>
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <h2 className="type-subtitle mb-1">{mainChartAsset}</h2>
                      <div className="flex items-baseline gap-3">
                        <span className="type-data-md">₹{mainChartData.price > 0 ? mainChartData.price.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '—'}</span>
                        <span className={`type-caption ${mainChartIsGreen ? 'type-positive' : 'type-negative'}`}>{mainChartIsGreen ? '+' : ''}{mainChartData.change || 0}% today</span>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setSelectedAsset(mainChartAsset)}>Trade</Button>
                  </div>
                  <Card className="h-[420px] p-0 overflow-hidden">
                    <SmartChart symbol={mainChartAsset} currentPrice={mainChartData.price} isGreen={mainChartIsGreen} />
                  </Card>
                </div>

                {/* Market Insight */}
                {gainers[0] && (
                  <div className="pt-6 border-t border-border">
                    <p className="type-label mb-3">Market Signal</p>
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <p className="type-subtitle mb-2">
                          <span className="type-positive">{gainers[0].symbol}</span> {gainers[0].change > 0 ? `+${gainers[0].change.toFixed(2)}%` : `${gainers[0].change.toFixed(2)}%`} today
                        </p>
                        <p className="type-body-secondary max-w-md">
                          Institutional accumulation detected. Watch key breakout levels in the next session.
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setSelectedAsset(gainers[0].symbol)}>Trade</Button>
                    </div>
                  </div>
                )}

              </motion.div>

              {/* Secondary Content (Watchlist & Portfolio) */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="xl:col-span-4 flex flex-col gap-10">
                
                {/* Watchlist */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="type-label">Watchlist</p>
                    <button className="type-caption-muted hover:text-text-primary transition-colors" aria-label="Add to watchlist">
                      <span className="material-symbols-outlined" style={{ fontSize: 'var(--icon-md)' }}>add</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-col border-t border-border">
                    {watchlist.slice(0, 6).map((sym) => {
                      const data = marketPrices[sym] || {};
                      const isUp = (data.change || 0) >= 0;
                      return (
                        <button key={sym} onClick={() => setSelectedAsset(sym)}
                          className="flex items-center justify-between py-3.5 border-b border-border group hover:bg-surface-raised -mx-1 px-1 rounded transition-colors text-left"
                        >
                          <div>
                            <p className="type-body group-hover:text-accent transition-colors">{sym}</p>
                            <p className="type-caption-muted">NSE</p>
                          </div>
                          <div className="text-right">
                            <p className="type-data-sm" style={{ color: 'var(--color-text-primary)' }}>₹{(data.price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                            <p className={`type-caption ${isUp ? 'type-positive' : 'type-negative'}`}>{isUp ? '+' : ''}{(data.change || 0).toFixed(2)}%</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Open Positions */}
                <div>
                  <p className="type-label mb-3">Open Positions</p>
                  <div className="flex flex-col border-t border-border">
                    {holdings.length === 0 ? (
                      <p className="type-caption-muted py-4">No open positions.</p>
                    ) : (
                      holdings.slice(0,4).map((h, i) => (
                        <div key={i} className="flex justify-between items-center py-3.5 border-b border-border">
                           <div>
                             <p className="type-body">{h.symbol}</p>
                             <p className="type-caption-muted">{h.quantity} units</p>
                           </div>
                           <div className="text-right">
                             <p className="type-data-sm">Avg ₹{h.avgPrice.toLocaleString('en-IN')}</p>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                  {holdings.length > 0 && (
                    <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/portfolio')}>
                      View Portfolio
                    </Button>
                  )}
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
            marketData={marketPrices[selectedAsset]} 
            onClose={() => setSelectedAsset(null)} 
            balance={balance} 
            token={token} 
            refreshData={fetchUserData}
            ownedQty={holdings.find(h => h.symbol === selectedAsset)?.quantity || 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
