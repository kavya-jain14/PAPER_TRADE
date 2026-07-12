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
      <div className="fixed inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm z-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} 
          className="bg-surface border border-border rounded-lg shadow-elevation-3 w-full max-w-[900px] overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
          
          <div className="w-full md:w-[60%] p-6 md:p-8 border-b md:border-b-0 md:border-r border-border flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-h2 font-medium tracking-tight text-text-primary">{symbol}</h3>
                <p className="text-label text-text-muted mt-1">{INDICES.includes(symbol) ? 'MARKET INDEX' : 'EQUITY • NSE'}</p>
              </div>
              <div className="text-right">
                <p className="text-h3 font-mono font-medium text-text-primary">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                <p className={`text-caption font-medium mt-1 ${isGreen ? 'text-positive' : 'text-negative'}`}>{isGreen ? '▲' : '▼'} {isGreen ? '+' : ''}{changePercent}% (1D)</p>
              </div>
            </div>
            <div className="flex-1 min-h-[250px] w-full border border-border rounded-md overflow-hidden relative group mb-6">
              <SmartChart symbol={symbol} currentPrice={currentPrice} isGreen={isGreen} />
              <button
                onClick={() => setShowCandlestick(true)}
                title="Expand as Candlestick Chart"
                className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-surface-elevated border border-border hover:border-border-hover text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md text-label transition-colors opacity-0 group-hover:opacity-100 shadow-elevation-1"
              >
                <span className="material-symbols-outlined text-[14px]">candlestick_chart</span>
                Candlestick
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between items-center py-2 border-t border-border">
                <span className="text-label text-text-muted">Day Low</span>
                <span className="text-body font-mono font-medium text-text-primary">₹{dayLow.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-border">
                <span className="text-label text-text-muted">Day High</span>
                <span className="text-body font-mono font-medium text-text-primary">₹{dayHigh.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[40%] p-6 md:p-8 flex flex-col bg-surface">
            <div className="flex justify-end mb-6">
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex p-1 bg-surface-elevated rounded-md mb-8 border border-border">
              <button onClick={() => setActiveTab('BUY')} className={`flex-1 py-2 rounded-[4px] text-label transition-colors ${activeTab === 'BUY' ? 'bg-background text-text-primary shadow-elevation-1' : 'text-text-muted hover:text-text-primary'}`}>Buy</button>
              <button onClick={() => setActiveTab('SELL')} className={`flex-1 py-2 rounded-[4px] text-label transition-colors ${activeTab === 'SELL' ? 'bg-background text-text-primary shadow-elevation-1' : 'text-text-muted hover:text-text-primary'}`}>Sell</button>
            </div>

            <form onSubmit={handleExecute} className="flex-1 flex flex-col">
              <div className="space-y-6 flex-1">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-label text-text-muted">{activeTab === 'BUY' ? 'Max Affordable' : 'Units Owned'}</span>
                  <span className={`text-body font-mono font-medium ${activeTab === 'BUY' ? 'text-positive' : 'text-text-primary'}`}>{activeTab === 'BUY' ? maxBuyQty.toLocaleString() : ownedQty.toLocaleString()} units</span>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-label text-text-muted">Quantity (Units)</label>
                    <Badge variant="neutral" className="cursor-pointer hover:bg-border transition-colors" onClick={handleMax}>MAX</Badge>
                  </div>
                  <Input autoFocus type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" required min="1" step="1" className="font-mono text-lg text-right" />
                </div>
                
                <div className="flex justify-between items-center py-4 border-y border-border">
                  <span className="text-label text-text-muted">Limit Price</span>
                  <span className="text-body font-mono font-medium text-text-primary">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-label text-text-muted">Est. Margin</span>
                  <span className="text-h3 font-mono font-medium text-text-primary">₹{(estCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {numQty > 0 && (
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-label text-text-muted">Balance After</span>
                    <span className={`text-body font-mono font-medium ${balanceAfter >= 0 ? 'text-text-primary' : 'text-negative'}`}>
                      ₹{Math.max(0, balanceAfter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <Button type="submit" variant={activeTab === 'BUY' ? 'primary' : 'danger'} className="w-full h-12 uppercase tracking-widest text-label font-bold">
                  Place Order
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
    <div className="flex h-screen bg-background text-text-primary font-sans overflow-hidden">

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
                  <span className="text-text-muted">{sym}</span>
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
                  <span className="text-text-muted">{sym}</span>
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
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
              <div>
                <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-h2 font-medium tracking-tight mb-2">
                  {greeting}, {userName}.
                </motion.h1>
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap items-center gap-8 mt-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-label text-text-muted">AVAILABLE MARGIN</span>
                    <span className="text-subtitle font-mono font-medium">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="hidden md:block w-px h-8 bg-border" />
                  <div className="flex flex-col gap-1">
                    <span className="text-label text-text-muted">MARKET STATUS</span>
                    <div className="flex items-center gap-2 h-7">
                      <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-positive animate-pulse' : 'bg-negative'}`} />
                      <span className="text-body font-medium">{isMarketOpen ? 'Live Market' : 'Offline'}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </header>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 md:gap-16 pt-2">
              
              {/* Primary Content (Chart & Insights) */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="xl:col-span-8 flex flex-col gap-10">
                
                {/* Live Chart Block */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline gap-4">
                      <h2 className="text-subtitle font-medium">{mainChartAsset}</h2>
                      <span className="text-body font-mono text-text-secondary">₹{mainChartData.price > 0 ? mainChartData.price.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '...'}</span>
                      <span className={`text-body font-medium ${mainChartIsGreen ? 'text-positive' : 'text-negative'}`}>{mainChartIsGreen ? '+' : ''}{mainChartData.change || 0}%</span>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setSelectedAsset(mainChartAsset)}>Trade</Button>
                  </div>
                  <Card className="h-[450px] p-0 overflow-hidden">
                    <SmartChart symbol={mainChartAsset} currentPrice={mainChartData.price} isGreen={mainChartIsGreen} />
                  </Card>
                </div>

                {/* Insights Block - Unboxed */}
                <div className="border-t border-border pt-8">
                  <h3 className="text-label text-text-muted mb-4">MARKET INSIGHTS</h3>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                     <div className="flex-1">
                       <h4 className="text-subtitle font-medium mb-2">{gainers[0]?.symbol || 'MARKETS'} showing strong momentum</h4>
                       <p className="text-text-secondary text-body max-w-lg">
                         AI sentiment engine detects institutional accumulation. Consider watching key breakout levels in the next 15 minutes.
                       </p>
                     </div>
                     <Button onClick={() => setSelectedAsset(gainers[0]?.symbol || 'NIFTY 50')}>
                       Trade {gainers[0]?.symbol || 'Now'}
                     </Button>
                  </div>
                </div>

              </motion.div>

              {/* Secondary Content (Watchlist & Portfolio) */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="xl:col-span-4 flex flex-col gap-10">
                
                {/* Watchlist - Unboxed List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-label text-text-muted">WATCHLIST</h3>
                    <button className="text-text-muted hover:text-text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-col divide-y divide-border border-t border-border">
                    {watchlist.slice(0, 6).map((sym) => {
                      const data = marketPrices[sym] || {};
                      const isUp = (data.change || 0) >= 0;
                      return (
                        <div key={sym} onClick={() => setSelectedAsset(sym)} className="flex items-center justify-between py-4 group cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-medium text-body group-hover:text-accent transition-colors">{sym}</span>
                            <span className="text-caption text-text-muted">NSE</span>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-medium text-body">₹{(data.price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                            <p className={`text-caption font-medium mt-0.5 ${isUp ? 'text-positive' : 'text-negative'}`}>{isUp ? '+' : ''}{(data.change || 0).toFixed(2)}%</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Open Positions - Unboxed List */}
                <div>
                  <h3 className="text-label text-text-muted mb-4">OPEN POSITIONS</h3>
                  <div className="flex flex-col divide-y divide-border border-t border-border">
                    {holdings.length === 0 ? (
                      <div className="py-4 text-text-muted text-caption">No open positions.</div>
                    ) : (
                      holdings.slice(0,4).map((h, i) => (
                        <div key={i} className="flex justify-between items-center py-4">
                           <div className="flex flex-col">
                             <span className="font-medium text-body">{h.symbol}</span>
                             <span className="text-caption text-text-muted">{h.quantity} units</span>
                           </div>
                           <div className="text-right">
                             <span className="font-mono text-body text-text-secondary">Avg ₹{h.avgPrice.toLocaleString('en-IN')}</span>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                  {holdings.length > 0 && (
                    <Button variant="ghost" className="w-full mt-2" onClick={() => navigate('/portfolio')}>
                      View Full Portfolio
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
