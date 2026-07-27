import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChartCanvas from '../components/Terminal/ChartCanvas';
import ReplayCanvas from '../components/Terminal/ReplayCanvas';
import OrderPanel from '../components/Terminal/OrderPanel';
import useMarketStatus from '../hooks/useMarketStatus';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function ProTerminal() {
  const { symbol } = useParams();
  const navigate = useNavigate();

  const [interval, setInterval] = useState('1D');
  const [balance, setBalance] = useState(0);
  const [ownedQty, setOwnedQty] = useState(0);
  const [quote, setQuote] = useState(null);
  const token = localStorage.getItem('token');

  // Replay Mode State
  const [isReplayMode, setIsReplayMode] = useState(false);
  const replayTargetDate = '2024-01-01'; // Hardcoded demo date
  const [replayPrice, setReplayPrice] = useState(0);

  const marketStatus = useMarketStatus();
  const validQuote = quote && quote.symbol === decodeURIComponent(symbol) && quote.priceMode === marketStatus ? quote : null;

  const fetchPortfolio = useCallback(async (signal) => {
    if (!token) return navigate('/');

    try {
      const [portfolioResponse, userResponse] = await Promise.all([
        fetch(`${API_URL}/api/trade/portfolio`, { headers: { 'auth-token': token }, signal }),
        fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token }, signal })
      ]);

      if (portfolioResponse.ok && userResponse.ok) {
        const portfolio = await portfolioResponse.json();
        const user = await userResponse.json();

        setBalance(user.balance ?? 0);
        const position = portfolio.find(item => item.symbol === decodeURIComponent(symbol));
        setOwnedQty(position?.quantity ?? 0);
      }
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('Failed to load portfolio.');
    }
  }, [symbol, token, navigate]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchPortfolio(abortController.signal);

    const decodedSym = decodeURIComponent(symbol);

    let fetchTimeout;
    const fetchLivePrice = async () => {
      try {
        const res = await fetch(`${API_URL}/api/trade/live-prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: [decodedSym] }),
          signal: abortController.signal
        });
        const data = await res.json();
        const entry = data[decodedSym];

        if (entry && Number.isFinite(entry.price) && entry.price > 0) {
          if (entry.priceMode === 'LIVE' || entry.priceMode === 'SIMULATED') {
            setQuote({
              price: entry.price,
              priceMode: entry.priceMode,
              symbol: decodedSym,
              receivedAt: entry.asOf
            });
          }
        }
      } catch {
        // ignore
      } finally {
        if (!abortController.signal.aborted) {
          fetchTimeout = setTimeout(fetchLivePrice, 5000);
        }
      }
    };

    fetchLivePrice();

    return () => {
      abortController.abort();
      clearTimeout(fetchTimeout);
    };
  }, [symbol, token, fetchPortfolio]);

  const TIMEFRAMES = ['1m', '5m', '15m', '1H', '1D'];

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* ── TOP NAVBAR ────────────────────────────────────────────── */}
      <header className="h-[60px] flex items-center justify-between px-4 z-10" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>

        {/* Left: Branding & Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/markets')}
            className="flex items-center gap-1 type-label-body hover:text-text-primary transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 'var(--icon-md)' }}>arrow_back</span>
            Back
          </button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="type-h3 flex items-center gap-2">
            {decodeURIComponent(symbol)}
            <span className="type-label px-2 py-0.5 rounded bg-surface-raised border border-border">
              NSE {isReplayMode ? '' : (validQuote ? `· ${validQuote.priceMode}` : '· —')}
            </span>
          </h1>
        </div>

        {/* Center: Timeframes */}
        <div className="flex gap-1 p-1 rounded-md" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => setInterval(tf)}
              className={`px-3 py-1 rounded transition-colors type-label ${interval === tf ? 'bg-surface-overlay text-text-primary shadow-1' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Right: Indicators/Settings */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReplayMode(!isReplayMode)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors type-label border ${isReplayMode ? 'bg-accent/20 text-accent border-accent/50' : 'text-text-secondary border-border hover:text-text-primary'}`}
            title="Toggle Replay Mode"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
            {isReplayMode ? 'Exit Replay' : 'Replay Mode'}
          </button>
          <button className="p-1.5 rounded text-text-secondary hover:text-text-primary transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {/* ── MAIN TERMINAL GRID ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar: Drawing Tools (Mocked for now) */}
        <div className="w-[60px] flex flex-col items-center py-4 gap-4 z-10" style={{ borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <button className="p-2 rounded text-accent hover:bg-surface-raised transition-colors"><span className="material-symbols-outlined">ads_click</span></button>
          <button className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"><span className="material-symbols-outlined">show_chart</span></button>
          <button className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"><span className="material-symbols-outlined">horizontal_rule</span></button>
          <button className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"><span className="material-symbols-outlined">rectangle</span></button>
        </div>

        {/* Center: Chart Canvas */}
        <div className="flex-1 relative">
          {isReplayMode ? (
            <ReplayCanvas
              key={decodeURIComponent(symbol)}
              symbol={decodeURIComponent(symbol)}
              interval={interval.toLowerCase()}
              targetDate={replayTargetDate}
              token={token}
              onPriceUpdate={(p) => setReplayPrice(p)}
            />
          ) : (
            <ChartCanvas
              key={decodeURIComponent(symbol)}
              symbol={decodeURIComponent(symbol)}
              interval={interval}
            />
          )}
        </div>

        <div className="w-[320px] flex flex-col z-10" style={{ borderLeft: '1px solid var(--color-border)' }}>
          <OrderPanel
            symbol={decodeURIComponent(symbol)}
            quote={isReplayMode ? { price: replayPrice, priceMode: 'REPLAY', symbol: decodeURIComponent(symbol), receivedAt: Date.now() } : validQuote}
            balance={balance}
            ownedQty={ownedQty}
            token={token}
            isReplayMode={isReplayMode}
            onSuccess={() => fetchPortfolio(new AbortController().signal)}
          />
        </div>

      </div>
    </div>
  );
}
