import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import TradeModal from '../components/TradeModal';
import { PageHeader, Panel, SegmentedControl } from '../components/workspace/Workspace';
import { useMarketSession } from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL', 'LT', 'AXISBANK'];
const INDICES = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];
const SECTOR = {
  RELIANCE: 'Energy', TCS: 'Technology', INFY: 'Technology', HDFCBANK: 'Banking',
  ICICIBANK: 'Banking', SBIN: 'Banking', AXISBANK: 'Banking', ITC: 'Consumer',
  BHARTIARTL: 'Telecom', LT: 'Infrastructure',
};
const SECTORS = ['All', 'Banking', 'Technology', 'Energy', 'Consumer', 'Infrastructure', 'Telecom'];

const money = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function LineTrace({ values, positive }) {
  if (!values || values.length < 2) return <span style={{ color: 'var(--color-text-tertiary)' }}>Collecting ticks</span>;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 72},${22 - ((value - min) / range) * 20}`).join(' ');
  return <svg width="72" height="24" role="img" aria-label="Recent price trace"><polyline points={points} fill="none" stroke={positive ? 'var(--color-positive)' : 'var(--color-negative)'} strokeWidth="1.5" /></svg>;
}

export default function Markets() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const session = useMarketSession();
  const [user, setUser] = useState({ name: '', avatar: '', balance: 0 });
  const [holdings, setHoldings] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [traces, setTraces] = useState({});
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('All');
  const [sort, setSort] = useState('change');
  const [selectedAsset, setSelectedAsset] = useState(null);

  const fetchAccount = useCallback(async (signal) => {
    if (!token) return;
    const [userResponse, portfolioResponse] = await Promise.all([
      fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token }, signal }),
      fetch(`${API_URL}/api/trade/portfolio`, { headers: { 'auth-token': token }, signal }),
    ]);
    if (userResponse.ok) {
      const data = await userResponse.json();
      setUser({ name: data.name?.split(' ')[0] || 'Trader', avatar: data.avatar || '', balance: data.virtualBalance ?? data.balance ?? 0 });
    }
    if (portfolioResponse.ok) setHoldings(await portfolioResponse.json());
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/login'); return undefined; }
    const controller = new AbortController();
    fetchAccount(controller.signal).catch(() => {});
    return () => controller.abort();
  }, [fetchAccount, navigate, token]);

  useEffect(() => {
    let controller = new AbortController();
    let timeoutId;
    const load = async () => {
      controller.abort();
      controller = new AbortController();
      try {
        const response = await fetch(`${API_URL}/api/trade/live-prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: [...STOCKS, ...INDICES] }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Quote request failed');
        const data = await response.json();
        setQuotes(data);
        setTraces((previous) => {
          const next = { ...previous };
          Object.entries(data).forEach(([symbol, quote]) => {
            if (!Number.isFinite(quote?.price)) return;
            next[symbol] = [...(next[symbol] || []).slice(-23), quote.price];
          });
          return next;
        });
      } catch (error) {
        if (error.name !== 'AbortError') setQuotes((previous) => previous);
      } finally {
        if (!controller.signal.aborted) timeoutId = setTimeout(load, 5000);
      }
    };
    load();
    return () => { controller.abort(); clearTimeout(timeoutId); };
  }, []);

  const rows = useMemo(() => STOCKS
    .filter((symbol) => symbol.toLowerCase().includes(query.toLowerCase()))
    .filter((symbol) => sector === 'All' || SECTOR[symbol] === sector)
    .map((symbol) => ({ symbol, sector: SECTOR[symbol], ...(quotes[symbol] || {}) }))
    .sort((a, b) => sort === 'symbol'
      ? a.symbol.localeCompare(b.symbol)
      : Number(b[sort] || 0) - Number(a[sort] || 0)), [query, quotes, sector, sort]);

  return (
    <AppShell userName={user.name} marketStatus={session.mode} avatar={user.avatar}>
      <main className="workspace-page">
        <div className="workspace-page__inner">
          <PageHeader title="Markets" description="NSE watch universe and executable paper quotes." session={session} />

          <div className="workspace-grid market-index-grid" style={{ marginBottom: 16 }}>
            {INDICES.map((symbol) => {
              const quote = quotes[symbol] || {};
              const change = Number(quote.change || 0);
              return (
                <Panel key={symbol}>
                  <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 12 }}>
                    <div><p className="type-label" style={{ margin: 0 }}>{symbol}</p><p className="type-data-lg" style={{ margin: '6px 0 0' }}>{quote.price ? money(quote.price) : '—'}</p></div>
                    <div style={{ textAlign: 'right' }}><LineTrace values={traces[symbol]} positive={change >= 0} /><p className={change >= 0 ? 'type-positive type-data-sm' : 'type-negative type-data-sm'} style={{ margin: '4px 0 0' }}>{change > 0 ? '+' : ''}{change.toFixed(2)}%</p></div>
                  </div>
                </Panel>
              );
            })}
          </div>

          <Panel
            title="Cash market"
            meta={`${rows.length} tracked instruments · click a symbol for its chart`}
            actions={<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><input className="desk-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search symbol" aria-label="Search symbols" /><select className="desk-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort market table"><option value="change">Daily change</option><option value="price">Price</option><option value="symbol">Symbol</option></select></div>}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
              <SegmentedControl label="Sector" value={sector} options={SECTORS} onChange={setSector} />
            </div>
            <div className="desk-table-wrap">
              <table className="desk-table">
                <thead><tr><th>Symbol</th><th>Sector</th><th data-numeric>Last</th><th data-numeric>Change</th><th>Trace</th><th data-numeric>Position</th><th aria-label="Actions" /></tr></thead>
                <tbody>
                  {rows.map((row) => {
                    const change = Number(row.change || 0);
                    const owned = holdings.find((item) => item.symbol === row.symbol)?.quantity || 0;
                    return (
                      <tr key={row.symbol}>
                        <td><button type="button" onClick={() => navigate(`/terminal/${encodeURIComponent(row.symbol)}`)} style={{ background: 'none', border: 0, padding: 0, color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer' }}>{row.symbol}</button></td>
                        <td>{row.sector}</td>
                        <td data-numeric>{row.price ? `₹${money(row.price)}` : '—'}</td>
                        <td data-numeric className={change >= 0 ? 'type-positive' : 'type-negative'}>{change > 0 ? '+' : ''}{change.toFixed(2)}%</td>
                        <td><LineTrace values={traces[row.symbol]} positive={change >= 0} /></td>
                        <td data-numeric>{owned || '—'}</td>
                        <td data-numeric><button className="desk-button" type="button" onClick={() => setSelectedAsset(row.symbol)}>Trade</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </main>

      <AnimatePresence>
        {selectedAsset && <TradeModal symbol={selectedAsset} marketData={quotes[selectedAsset]} balance={user.balance} ownedQty={holdings.find((item) => item.symbol === selectedAsset)?.quantity || 0} token={token} onClose={() => setSelectedAsset(null)} onSuccess={() => fetchAccount(new AbortController().signal)} />}
      </AnimatePresence>
    </AppShell>
  );
}
