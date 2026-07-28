import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import SmartChart from '../components/SmartChart';
import { AppShell } from '../components/AppShell';
import useMarketStatus from '../hooks/useMarketStatus';
import TradeModal from '../components/TradeModal';
import { Shield, ArrowUpRight, History } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TOP_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL', 'LT', 'AXISBANK'];
const INDICES = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const safeNum = (n) => (Number.isFinite(n) ? n : 0);

const hasValidQuote = (d) =>
  d != null && Number.isFinite(d.price) && d.price > 0;

const fmtINR = (n) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtTradeTs = (raw) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const mon = d.toLocaleString('en-IN', { month: 'short' });
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  return `${day} ${mon} · ${time}`;
};

/* Small inline P&L badge */
function PnlSpan({ value }) {
  if (!Number.isFinite(value) || value === 0)
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>—</span>;
  const up = value > 0;
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-caption)',
      color: up ? 'var(--color-positive)' : 'var(--color-negative)',
    }}>
      {up ? '▲' : '▼'} ₹{fmtINR(Math.abs(value))}
    </span>
  );
}

/* ── Shared inline-style objects (defined once, reused) ─────────────────────── */
const LABEL = {
  fontSize: 'var(--text-label)',
  color: 'var(--color-text-secondary)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '4px',
};
const MONO_VAL = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-body)',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
};
const MUTED_MONO = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-body)',
  color: 'var(--color-text-muted)',
};

/* ── Component ──────────────────────────────────────────────────────────────── */
function Dashboard() {
  const [userName, setUserName] = useState('');
  const [balance, setBalance] = useState(0);
  const [avatar, setAvatar] = useState('');
  const [holdings, setHoldings] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [tradeHistory, setTradeHistory] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [watchlist] = useState(() => {
    const s = localStorage.getItem('paper_watchlist');
    return s ? JSON.parse(s) : ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK'];
  });
  const [priceFlash, setPriceFlash] = useState({});
  const prevPricesRef = useRef({});

  useEffect(() => {
    localStorage.setItem('paper_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const marketStatus = useMarketStatus();

  /* ── Data fetching ──────────────────────────────────────────────────────── */
  const fetchUserData = useCallback(async (signal) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/getuser`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
        signal,
      });
      const data = await res.json();
      if (res.ok) {
        setUserName(data.name ? data.name.split(' ')[0] : 'Trader');
        setAvatar(data.avatar || '');
        setBalance(data.virtualBalance !== undefined ? data.virtualBalance : data.balance || 0);
      }
      try {
        const pr = await fetch(`${API_URL}/api/trade/portfolio`, {
          headers: { 'Content-Type': 'application/json', 'auth-token': token }, signal,
        });
        if (pr.ok) setHoldings((await pr.json()) || []);
      } catch { /* ignored */ }
      try {
        const hr = await fetch(`${API_URL}/api/trade/history`, {
          headers: { 'Content-Type': 'application/json', 'auth-token': token }, signal,
        });
        if (hr.ok) {
          const raw = await hr.json();
          const asc = [...raw].reverse();
          const cb = {};
          const enriched = asc.map((t) => {
            const sym = t.symbol;
            if (!cb[sym]) cb[sym] = { qty: 0, invested: 0 };
            if (t.transactionType?.toUpperCase() === 'BUY') {
              cb[sym].qty += t.quantity;
              cb[sym].invested += t.quantity * t.pricePerShare;
              return { ...t, realizedPnL: null };
            }
            const avg = cb[sym].qty > 0 ? cb[sym].invested / cb[sym].qty : t.pricePerShare;
            const pnl = (t.pricePerShare - avg) * t.quantity;
            cb[sym].qty -= t.quantity;
            cb[sym].invested = cb[sym].qty * avg;
            return { ...t, realizedPnL: pnl };
          });
          setTradeHistory(enriched.reverse());
        }
      } catch { /* ignored */ }
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const c = new AbortController();
    fetchUserData(c.signal);
    return () => c.abort();
  }, [token, navigate, fetchUserData]);

  useEffect(() => {
    let ac = new AbortController();
    const poll = async () => {
      ac.abort();
      ac = new AbortController();
      try {
        const r = await fetch(`${API_URL}/api/trade/live-prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: [...TOP_STOCKS, ...INDICES] }),
          signal: ac.signal,
        });
        if (!r.ok) return;
        const p = await r.json();
        if (!p || typeof p !== 'object' || Array.isArray(p)) return;
        const fl = {};
        Object.entries(p).forEach(([s, d]) => {
          const pv = prevPricesRef.current[s]?.price;
          const cv = d?.price;
          if (pv !== undefined && cv !== undefined && cv !== pv)
            fl[s] = cv > pv ? 'positive' : 'negative';
        });
        prevPricesRef.current = p;
        setMarketPrices((prev) => ({ ...prev, ...p }));
        if (Object.keys(fl).length > 0) {
          setPriceFlash(fl);
          setTimeout(() => setPriceFlash({}), 450);
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Market price error');
      }
    };
    poll();
    const tid = setInterval(poll, 10000);
    return () => { clearInterval(tid); ac.abort(); };
  }, []);

  useEffect(() => {
    const h = (e) => setSelectedAsset(e.detail);
    window.addEventListener('open-trade-modal', h);
    return () => window.removeEventListener('open-trade-modal', h);
  }, []);

  /* ── Financial Calculations ─────────────────────────────────────────────── */
  let investedValue = 0;
  let holdingsValue = 0;
  let todaysPnL = 0;
  let allQuotesReady = true;

  holdings.forEach((h) => {
    const qty = safeNum(h.quantity);
    const avg = safeNum(h.avgPrice);
    investedValue += avg * qty;
    const ld = marketPrices[h.symbol];
    if (hasValidQuote(ld)) {
      holdingsValue += ld.price * qty;
      const ch = safeNum(ld.change);
      const pc = ch !== 0 ? ld.price / (1 + ch / 100) : ld.price;
      todaysPnL += (ld.price - pc) * qty;
    } else {
      allQuotesReady = false;
    }
  });

  const valuationPending = holdings.length > 0 && !allQuotesReady;
  const unrealizedPnL = allQuotesReady ? holdingsValue - investedValue : null;
  const sellTrades = tradeHistory.filter((t) => t.transactionType?.toUpperCase() === 'SELL');
  const realizedPnL = sellTrades.reduce(
    (a, t) => a + (Number.isFinite(t.realizedPnL) ? t.realizedPnL : 0), 0,
  );
  const totalEquity = safeNum(balance) + holdingsValue;
  const riskExposure = allQuotesReady && totalEquity > 0
    ? (holdingsValue / totalEquity) * 100 : null;
  const todayChangePercent = (totalEquity - todaysPnL) > 0
    ? (todaysPnL / (totalEquity - todaysPnL)) * 100 : 0;

  /* ── Tracked Breadth ────────────────────────────────────────────────────── */
  let advancing = 0;
  let declining = 0;
  let unchanged = 0;
  let unavailable = 0;
  const moverList = [];

  TOP_STOCKS.forEach((sym) => {
    const d = marketPrices[sym];
    if (d != null && Number.isFinite(d.price) && d.price > 0 && Number.isFinite(d.change)) {
      if (d.change > 0) advancing++;
      else if (d.change < 0) declining++;
      else unchanged++;
      moverList.push({ sym, price: d.price, change: d.change });
    } else {
      unavailable++;
    }
  });

  const coveredCount = TOP_STOCKS.length - unavailable;
  const topMovers = [...moverList]
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 3);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const mainChartAsset = 'NIFTY 50';

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <AppShell userName={userName} marketStatus={marketStatus} avatar={avatar}>
      <div className="flex-1 flex flex-col min-w-0" style={{ height: '100%' }}>

        {/* ── Environment Strip ─────────────────────────────────────────── */}
        <div
          className="w-full shrink-0 flex items-center px-4 md:px-6 xl:px-10 gap-3"
          style={{
            height: '36px',
            background: 'var(--color-surface-elevated)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Shield size={13} strokeWidth={2} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Paper Trading &middot; Simulated Capital
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: marketStatus === 'LIVE' ? 'var(--color-positive)'
                  : marketStatus === 'SIMULATED' ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
                animation: marketStatus === 'LIVE' ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
              {marketStatus === 'LIVE' ? 'NSE open · live prices'
                : marketStatus === 'SIMULATED' ? 'NSE closed · simulated prices'
                : 'Market status unavailable'}
            </span>
          </div>
        </div>

        {/* ── Scrollable content ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ paddingBottom: '6rem' }}>
          <div className="mx-auto px-4 md:px-6 xl:px-10 pt-5" style={{ maxWidth: 1400 }}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <header
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
              style={{ paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid var(--color-border)' }}
            >
              <Motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                  {currentDate}
                </p>
                <h1 className="type-h2">Portfolio command center</h1>
              </Motion.div>
              <div className="flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/portfolio')}
                  style={{
                    padding: '7px 14px', fontSize: 'var(--text-caption)', fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  }}
                >
                  Deposit funds
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/markets')}
                  style={{
                    padding: '7px 14px', fontSize: 'var(--text-caption)', fontWeight: 500,
                    color: 'var(--color-accent-fg)',
                    background: 'var(--color-accent)',
                    border: '1px solid transparent',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-accent-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-accent)'; }}
                >
                  Explore markets
                </button>
              </div>
            </header>

            {/* ── Portfolio Summary — true 8:4 grid ────────────────────── */}
            <Motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
              style={{
                display: 'grid',
                gap: 16,
                marginBottom: 20,
              }}
              className="grid-cols-1 xl:grid-cols-3"
            >
              {/* ── 8-col: Total Equity ────────────────────────────────── */}
              <div
                className="xl:col-span-2"
                style={{
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                  minWidth: 0,
                }}
              >
                {/* Top: equity value + today movement */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ ...LABEL, marginBottom: 6 }}>Total Equity</p>
                  {valuationPending ? (
                    <p style={MUTED_MONO}>Valuation pending</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px 12px', minWidth: 0 }}>
                      <p style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'clamp(22px, 3.5vw, 32px)',
                        fontWeight: 500,
                        letterSpacing: '-0.02em',
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        margin: 0,
                      }}>
                        ₹{fmtINR(totalEquity)}
                      </p>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-caption)',
                        whiteSpace: 'nowrap',
                        color: todaysPnL > 0 ? 'var(--color-positive)'
                          : todaysPnL < 0 ? 'var(--color-negative)'
                          : 'var(--color-text-muted)',
                      }}>
                        {todaysPnL > 0 ? '▲' : todaysPnL < 0 ? '▼' : '—'}
                        {' '}₹{fmtINR(Math.abs(todaysPnL))}
                        {' '}({todayChangePercent > 0 ? '+' : ''}{todayChangePercent.toFixed(2)}%) today
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 14 }} />

                {/* Bottom: three equal columns — Invested | Unrealized | Realized */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '8px 16px',
                  minWidth: 0,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={LABEL}>Invested</p>
                    <p style={MONO_VAL}>₹{fmtINR(investedValue)}</p>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={LABEL}>Unrealized P&amp;L</p>
                    {unrealizedPnL === null
                      ? <p style={MUTED_MONO}>Quote unavailable</p>
                      : <PnlSpan value={unrealizedPnL} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={LABEL}>Realized P&amp;L</p>
                    <PnlSpan value={realizedPnL} />
                  </div>
                </div>
              </div>

              {/* ── 4-col: Buying Power + Risk Exposure ────────────────── */}
              <div
                className="xl:col-span-1"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                  minWidth: 0,
                  alignSelf: 'start',
                }}
              >
                <p style={{ ...LABEL, marginBottom: 6 }}>Buying Power</p>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-h3)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                }}>
                  ₹{fmtINR(safeNum(balance))}
                </p>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {totalEquity > 0 ? ((safeNum(balance) / totalEquity) * 100).toFixed(0) : 0}% of equity available
                </p>

                <div style={{ height: 1, background: 'var(--color-border)', margin: '14px 0' }} />

                <p style={{ ...LABEL, marginBottom: 6 }}>Risk Exposure</p>
                {riskExposure === null
                  ? <p style={MUTED_MONO}>Valuation pending</p>
                  : <p style={MONO_VAL}>{riskExposure.toFixed(1)}% invested</p>}
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {holdings.length === 0 ? 'No open positions' : `${holdings.length} active holding${holdings.length > 1 ? 's' : ''}`}
                </p>
              </div>
            </Motion.div>

            {/* ── Main 8:4 grid — Chart + Ledger | Breadth + Watchlist ── */}
            <div
              style={{ display: 'grid', gap: 20 }}
              className="grid-cols-1 xl:grid-cols-3"
            >

              {/* ── LEFT: Chart + Ledger ───────────────────────────────── */}
              <div
                className="xl:col-span-2"
                style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}
              >

                {/* SmartChart container */}
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  height: 460,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div>
                      <p style={{ ...LABEL, marginBottom: 4 }}>NIFTY 50</p>
                      {marketPrices[mainChartAsset] && Number.isFinite(marketPrices[mainChartAsset].price) && Number.isFinite(marketPrices[mainChartAsset].change) ? (
                         <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                           <span style={MONO_VAL}>₹{fmtINR(marketPrices[mainChartAsset].price)}</span>
                           <span style={{ fontSize: 'var(--text-caption)', fontFamily: 'var(--font-mono)', color: marketPrices[mainChartAsset].change >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                             {marketPrices[mainChartAsset].change >= 0 ? '▲' : '▼'} ₹{fmtINR(Math.abs(marketPrices[mainChartAsset].change))}
                           </span>
                         </div>
                      ) : (
                         <span style={MUTED_MONO}>Quote unavailable</span>
                      )}
                    </div>
                    <div style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--color-surface-raised)', fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>
                      1D RANGE
                    </div>
                  </div>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <SmartChart
                      symbol={mainChartAsset}
                      currentPrice={marketPrices[mainChartAsset]?.price}
                      isGreen={marketPrices[mainChartAsset]?.change >= 0}
                    />
                  </div>
                </div>

                {/* Recent Executions */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <p style={LABEL}>Recent Executions</p>
                    <button
                      type="button"
                      onClick={() => navigate('/history')}
                      style={{
                        fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      View Ledger <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <div style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}>
                    {tradeHistory.length === 0 ? (
                      /* Compact empty state */
                      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <History size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                          No execution activity yet.{' '}
                          <button
                            type="button"
                            onClick={() => navigate('/markets')}
                            style={{ color: 'var(--color-accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit' }}
                          >
                            Explore markets →
                          </button>
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Desktop table (≥640px) */}
                        <div className="hidden sm:block" style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(24,20,16,0.5)' }}>
                                {['Symbol', 'Side', 'Qty', 'Fill Price', 'Current / P&L', 'Executed', 'Mode'].map((h, i) => (
                                  <th key={h} style={{
                                    padding: '10px 14px',
                                    fontSize: 'var(--text-label)',
                                    color: 'var(--color-text-muted)',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    fontWeight: 500,
                                    textAlign: i > 2 ? 'right' : 'left',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tradeHistory.slice(0, 5).map((trade, i) => {
                                const isBuy = trade.transactionType?.toUpperCase() === 'BUY';
                                const fp = trade.pricePerShare;
                                const ld = marketPrices[trade.symbol];
                                const lv = hasValidQuote(ld);
                                const mode = trade.priceMode ?? '—';

                                let pnlCell;
                                if (!isBuy) {
                                  const rp = trade.realizedPnL;
                                  pnlCell = Number.isFinite(rp)
                                    ? <PnlSpan value={rp} />
                                    : <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>—</span>;
                                } else if (lv) {
                                  const diff = (ld.price - safeNum(fp)) * trade.quantity;
                                  pnlCell = (
                                    <span>
                                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-primary)' }}>
                                        ₹{fmtINR(ld.price)}
                                      </span>
                                      {' · '}
                                      <PnlSpan value={diff} />
                                    </span>
                                  );
                                } else {
                                  pnlCell = <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>Quote unavailable</span>;
                                }

                                const fillDisp = Number.isFinite(fp) && fp > 0 ? `₹${fmtINR(fp)}` : '—';

                                return (
                                  <tr key={i} style={{ borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none' }}>
                                    <td style={{ padding: '10px 14px', fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                                      {trade.symbol}
                                    </td>
                                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                                      <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: isBuy ? 'var(--color-accent)' : 'var(--color-text-secondary)', letterSpacing: '0.06em' }}>
                                        {isBuy ? 'BUY' : 'SELL'}
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                                      {trade.quantity}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-primary)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                      {fillDisp}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                      {pnlCell}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                      {fmtTradeTs(trade.date || trade.createdAt)}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                      {mode === 'SIMULATED'
                                        ? <><Shield size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle', opacity: 0.7 }} />Simulated</>
                                        : mode}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile labelled rows (<640px) */}
                        <div className="sm:hidden">
                          {tradeHistory.slice(0, 5).map((trade, i) => {
                            const isBuy = trade.transactionType?.toUpperCase() === 'BUY';
                            const fp = trade.pricePerShare;
                            const ld = marketPrices[trade.symbol];
                            const lv = hasValidQuote(ld);
                            const pnlVal = !isBuy
                              ? (Number.isFinite(trade.realizedPnL) ? <PnlSpan value={trade.realizedPnL} /> : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-caption)' }}>—</span>)
                              : (lv ? <PnlSpan value={(ld.price - safeNum(fp)) * trade.quantity} /> : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-caption)' }}>Quote unavailable</span>);
                            const LS = { fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 };
                            const VS = { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-primary)' };
                            return (
                              <div key={i} style={{ padding: '12px 16px', borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{trade.symbol}</span>
                                  <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: isBuy ? 'var(--color-accent)' : 'var(--color-text-secondary)', letterSpacing: '0.06em' }}>{isBuy ? 'BUY' : 'SELL'}</span>
                                </div>
                                <div><p style={LS}>Fill Price</p><p style={VS}>{Number.isFinite(fp) && fp > 0 ? `₹${fmtINR(fp)}` : '—'}</p></div>
                                <div><p style={LS}>Qty</p><p style={VS}>{trade.quantity}</p></div>
                                <div><p style={LS}>P&amp;L</p>{pnlVal}</div>
                                <div><p style={LS}>Executed</p><p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>{fmtTradeTs(trade.date || trade.createdAt)}</p></div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Breadth + Watchlist ──────────────────────────── */}
              <div className="xl:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

                {/* Tracked Breadth */}
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                    <p style={LABEL}>Tracked Breadth</p>
                    <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)' }}>
                      {coveredCount} / {TOP_STOCKS.length} quotes
                    </p>
                  </div>

                  {/* Inline ADV · DEC · UNCH row */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    padding: '8px 0',
                    borderTop: '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    marginBottom: 14,
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', color: 'var(--color-positive)', fontWeight: 500, flex: 1, textAlign: 'center' }}>
                      {advancing} <span style={{ fontSize: 'var(--text-label)', fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}>ADV</span>
                    </span>
                    <span style={{ color: 'var(--color-border)', userSelect: 'none' }}>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', color: 'var(--color-negative)', fontWeight: 500, flex: 1, textAlign: 'center' }}>
                      {declining} <span style={{ fontSize: 'var(--text-label)', fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}>DEC</span>
                    </span>
                    <span style={{ color: 'var(--color-border)', userSelect: 'none' }}>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', color: 'var(--color-text-secondary)', fontWeight: 500, flex: 1, textAlign: 'center' }}>
                      {unchanged} <span style={{ fontSize: 'var(--text-label)', fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}>UNCH</span>
                    </span>
                  </div>

                  {/* Top Movers */}
                  <p style={{ ...LABEL, color: 'var(--color-text-muted)', marginBottom: 8 }}>Top Movers</p>
                  {topMovers.length === 0 ? (
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>Quotes loading…</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {topMovers.map((m) => (
                        <div key={m.sym} style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(100px, 1fr) auto 72px',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.sym}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                            ₹{fmtINR(m.price)}
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-caption)',
                            textAlign: 'right',
                            whiteSpace: 'nowrap',
                            color: m.change > 0 ? 'var(--color-positive)' : m.change < 0 ? 'var(--color-negative)' : 'var(--color-text-muted)',
                          }}>
                            {m.change > 0 ? '+' : ''}{m.change.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Watchlist */}
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <p style={LABEL}>Watchlist</p>
                    <button type="button" style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Manage
                    </button>
                  </div>
                  <div>
                    {watchlist.slice(0, 5).map((sym) => {
                      const d = marketPrices[sym];
                      const valid = hasValidQuote(d);
                      const change = valid && Number.isFinite(d.change) ? d.change : null;
                      const isUp = change !== null && change > 0;
                      const isDown = change !== null && change < 0;
                      const flash = priceFlash[sym];
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => setSelectedAsset(sym)}
                          className={flash ? `flash-${flash}` : ''}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) auto 72px',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '12px 18px',
                            background: 'none',
                            border: 'none',
                            borderBottom: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontSize: 'var(--text-caption)', fontWeight: 500, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sym}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                            {valid ? `₹${fmtINR(d.price)}` : '—'}
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-caption)',
                            textAlign: 'right',
                            whiteSpace: 'nowrap',
                            color: isUp ? 'var(--color-positive)' : isDown ? 'var(--color-negative)' : 'var(--color-text-muted)',
                          }}>
                            {change === null || change === 0 ? '—' : `${isUp ? '+' : ''}${change.toFixed(2)}%`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
            ownedQty={holdings.find((h) => h.symbol === selectedAsset)?.quantity || 0}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

export default Dashboard;
