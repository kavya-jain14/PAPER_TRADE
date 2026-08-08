import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import TradeModal from '../components/TradeModal';
import { EmptyDesk, PageHeader, Panel } from '../components/workspace/Workspace';
import useAnalytics from '../hooks/useAnalytics';
import { useMarketSession } from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const money = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Portfolio() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const session = useMarketSession();
  const { metrics } = useAnalytics(token);
  const [user, setUser] = useState({ name: '', avatar: '', balance: 0 });
  const [holdings, setHoldings] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const load = useCallback(async (signal) => {
    try {
      const [userResponse, portfolioResponse] = await Promise.all([
        fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token }, signal }),
        fetch(`${API_URL}/api/trade/portfolio`, { headers: { 'auth-token': token }, signal }),
      ]);
      if (userResponse.ok) {
        const data = await userResponse.json();
        setUser({ name: data.name?.split(' ')[0] || 'Trader', avatar: data.avatar || '', balance: data.virtualBalance ?? data.balance ?? 0 });
      }
      if (portfolioResponse.ok) {
        const positions = await portfolioResponse.json();
        setHoldings(positions);
        if (positions.length) {
          const quoteResponse = await fetch(`${API_URL}/api/trade/live-prices`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols: positions.map((item) => item.symbol) }), signal,
          });
          if (quoteResponse.ok) setQuotes(await quoteResponse.json());
        } else setQuotes({});
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/login'); return undefined; }
    let controller = new AbortController();
    let timeoutId;
    const poll = async () => {
      controller.abort();
      controller = new AbortController();
      try { await load(controller.signal); } catch (error) { if (error.name !== 'AbortError') setLoading(false); }
      if (!controller.signal.aborted) timeoutId = setTimeout(poll, 5000);
    };
    poll();
    return () => { controller.abort(); clearTimeout(timeoutId); };
  }, [load, navigate, token]);

  const positions = useMemo(() => holdings.map((holding) => {
    const quote = quotes[holding.symbol];
    const last = Number(quote?.price || holding.averagePrice || 0);
    const invested = Number(holding.averagePrice || 0) * Number(holding.quantity || 0);
    const marketValue = last * Number(holding.quantity || 0);
    const pnl = marketValue - invested;
    return { ...holding, last, invested, marketValue, pnl, pnlPct: invested ? (pnl / invested) * 100 : 0, priceMode: quote?.priceMode || session.mode };
  }), [holdings, quotes, session.mode]);

  const invested = positions.reduce((sum, item) => sum + item.invested, 0);
  const marketValue = positions.reduce((sum, item) => sum + item.marketValue, 0);
  const unrealized = marketValue - invested;
  const equity = user.balance + marketValue;
  const maxAbsPnl = Math.max(1, ...positions.map((item) => Math.abs(item.pnl)));

  return (
    <AppShell userName={user.name} marketStatus={session.mode} avatar={user.avatar}>
      <main className="workspace-page">
        <div className="workspace-page__inner">
          <PageHeader title="Portfolio" description="Open positions, cost basis and marked-to-market equity." session={session} actions={<button className="desk-button desk-button--primary" type="button" onClick={() => navigate('/markets')}>New order</button>} />

          <div className="workspace-grid ledger-stats" style={{ marginBottom: 16 }}>
            {[
              ['Account equity', `₹${money(equity)}`],
              ['Available balance', `₹${money(user.balance)}`],
              ['Invested capital', `₹${money(invested)}`],
              ['Unrealized P&L', `${unrealized >= 0 ? '+' : ''}₹${money(unrealized)}`],
            ].map(([label, value]) => <Panel key={label}><div style={{ padding: 16 }}><p className="type-label" style={{ margin: 0 }}>{label}</p><p className="type-data-lg" style={{ margin: '7px 0 0', color: label === 'Unrealized P&L' ? (unrealized >= 0 ? 'var(--color-positive)' : 'var(--color-negative)') : undefined }}>{value}</p></div></Panel>)}
          </div>

          {metrics && (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '10px 2px 20px', color: 'var(--color-text-muted)', fontSize: 'var(--text-caption)' }}>
              <span>Closed trades <strong style={{ color: 'var(--color-text-secondary)' }}>{metrics.totalClosedTrades}</strong></span>
              <span>Realized P&L <strong style={{ color: metrics.totalRealizedPnL >= 0 ? 'var(--color-positive)' : 'var(--color-negative)', fontFamily: 'var(--font-mono)' }}>{metrics.totalRealizedPnL >= 0 ? '+' : ''}₹{money(metrics.totalRealizedPnL)}</strong></span>
              <span>Win rate <strong style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{Number(metrics.winRate || 0).toFixed(1)}%</strong></span>
              <span>Profit factor <strong style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{Number(metrics.profitFactor || 0).toFixed(2)}</strong></span>
            </div>
          )}

          <div className="workspace-grid workspace-grid--two">
            <Panel title="Open positions" meta={`${positions.length} active`}>
              {loading ? <EmptyDesk title="Loading positions" detail="Updating portfolio marks." /> : positions.length === 0 ? <EmptyDesk title="No open positions" detail="Your first filled buy order will appear here." /> : (
                <div className="desk-table-wrap"><table className="desk-table"><thead><tr><th>Symbol</th><th>Mode</th><th data-numeric>Qty</th><th data-numeric>Average</th><th data-numeric>Last</th><th data-numeric>Value</th><th data-numeric>P&L</th><th aria-label="Actions" /></tr></thead><tbody>
                  {positions.map((position) => <tr key={position.symbol}><td><button type="button" onClick={() => navigate(`/terminal/${encodeURIComponent(position.symbol)}`)} style={{ background: 'none', border: 0, color: 'var(--color-text-primary)', padding: 0, fontWeight: 600, cursor: 'pointer' }}>{position.symbol}</button></td><td>{position.priceMode}</td><td data-numeric>{position.quantity}</td><td data-numeric>₹{money(position.averagePrice)}</td><td data-numeric>₹{money(position.last)}</td><td data-numeric>₹{money(position.marketValue)}</td><td data-numeric className={position.pnl >= 0 ? 'type-positive' : 'type-negative'}>{position.pnl >= 0 ? '+' : ''}₹{money(position.pnl)}<br /><span style={{ fontSize: 10 }}>{position.pnlPct >= 0 ? '+' : ''}{position.pnlPct.toFixed(2)}%</span></td><td data-numeric><button className="desk-button" type="button" onClick={() => setSelectedAsset(position.symbol)}>Trade</button></td></tr>)}
                </tbody></table></div>
              )}
            </Panel>

            <Panel title="Position contribution" meta="Absolute P&L scaled within this portfolio">
              {positions.length === 0 ? <EmptyDesk title="No contribution data" detail="Open positions are needed for comparison." /> : <div style={{ padding: 16, display: 'grid', gap: 15 }}>
                {positions.map((position) => <div key={position.symbol}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-caption)' }}><span style={{ color: 'var(--color-text-secondary)' }}>{position.symbol}</span><span style={{ color: position.pnl >= 0 ? 'var(--color-positive)' : 'var(--color-negative)', fontFamily: 'var(--font-mono)' }}>{position.pnl >= 0 ? '+' : ''}₹{money(position.pnl)}</span></div><div style={{ height: 5, background: 'var(--color-bg)', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${Math.max(2, (Math.abs(position.pnl) / maxAbsPnl) * 100)}%`, height: '100%', background: position.pnl >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }} /></div></div>)}
              </div>}
            </Panel>
          </div>
        </div>
      </main>

      <AnimatePresence>{selectedAsset && <TradeModal symbol={selectedAsset} marketData={quotes[selectedAsset] || {}} onClose={() => setSelectedAsset(null)} balance={user.balance} token={token} onSuccess={() => load(new AbortController().signal)} ownedQty={holdings.find((item) => item.symbol === selectedAsset)?.quantity || 0} />}</AnimatePresence>
    </AppShell>
  );
}
