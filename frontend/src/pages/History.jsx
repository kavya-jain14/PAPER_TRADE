import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell } from '../components/AppShell';
import { EmptyDesk, PageHeader, Panel, SegmentedControl } from '../components/workspace/Workspace';
import { useMarketSession } from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const FILTERS = ['All', 'Buys', 'Sells', 'Profits', 'Losses'];
const money = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const enrichLedger = (transactions) => {
  const costBasis = {};
  return [...transactions].reverse().map((trade) => {
    const symbol = trade.symbol;
    costBasis[symbol] ||= { quantity: 0, invested: 0 };
    if (trade.transactionType?.toUpperCase() === 'BUY') {
      costBasis[symbol].quantity += trade.quantity;
      costBasis[symbol].invested += trade.quantity * trade.pricePerShare;
      return { ...trade, realizedPnL: null };
    }
    const averageCost = costBasis[symbol].quantity > 0 ? costBasis[symbol].invested / costBasis[symbol].quantity : trade.pricePerShare;
    const realizedPnL = (trade.pricePerShare - averageCost) * trade.quantity;
    costBasis[symbol].quantity = Math.max(0, costBasis[symbol].quantity - trade.quantity);
    costBasis[symbol].invested = costBasis[symbol].quantity * averageCost;
    return { ...trade, realizedPnL };
  }).reverse();
};

export default function History() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const session = useMarketSession();
  const [user, setUser] = useState({ name: '', avatar: '' });
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [userResponse, historyResponse] = await Promise.all([
        fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token } }),
        fetch(`${API_URL}/api/trade/history`, { headers: { 'auth-token': token } }),
      ]);
      if (userResponse.ok) {
        const data = await userResponse.json();
        setUser({ name: data.name?.split(' ')[0] || 'Trader', avatar: data.avatar || '' });
      }
      if (!historyResponse.ok) throw new Error('Trade ledger unavailable');
      setTrades(enrichLedger(await historyResponse.json()));
    } catch (error) {
      toast.error(error.message || 'Failed to load trade ledger');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    load();
  }, [load, navigate, token]);

  const visibleTrades = useMemo(() => trades.filter((trade) => {
    const buy = trade.transactionType?.toUpperCase() === 'BUY';
    if (filter === 'Buys') return buy;
    if (filter === 'Sells') return !buy;
    if (filter === 'Profits') return !buy && trade.realizedPnL > 0;
    if (filter === 'Losses') return !buy && trade.realizedPnL < 0;
    return true;
  }), [filter, trades]);

  const sells = trades.filter((trade) => trade.transactionType?.toUpperCase() === 'SELL');
  const realized = sells.reduce((sum, trade) => sum + Number(trade.realizedPnL || 0), 0);
  const winners = sells.filter((trade) => trade.realizedPnL > 0).length;
  const winRate = sells.length ? (winners / sells.length) * 100 : null;

  const exportCsv = () => {
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const header = ['Date', 'Symbol', 'Side', 'Quantity', 'Fill price', 'Notional', 'Realized P&L', 'Price mode'];
    const rows = trades.map((trade) => [
      new Date(trade.date || trade.createdAt).toISOString(), trade.symbol, trade.transactionType,
      trade.quantity, trade.pricePerShare, trade.quantity * trade.pricePerShare,
      trade.realizedPnL ?? '', trade.priceMode || 'LEGACY',
    ]);
    const blob = new Blob([[header, ...rows].map((row) => row.map(escape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paper-trade-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell userName={user.name} marketStatus={session.mode} avatar={user.avatar}>
      <main className="workspace-page">
        <div className="workspace-page__inner">
          <PageHeader
            title="Trade ledger"
            description="Every executed order, reconstructed cost basis and realized result."
            session={session}
            actions={<div style={{ display: 'flex', gap: 8 }}><button className="desk-button" type="button" onClick={load}>Refresh</button><button className="desk-button" type="button" onClick={exportCsv} disabled={!trades.length}>Export CSV</button></div>}
          />

          <div className="workspace-grid ledger-stats" style={{ marginBottom: 16 }}>
            {[
              ['Executions', trades.length],
              ['Closed sells', sells.length],
              ['Win rate', winRate === null ? '—' : `${winRate.toFixed(1)}%`],
              ['Realized P&L', `${realized >= 0 ? '+' : ''}₹${money(realized)}`],
            ].map(([label, value]) => <Panel key={label}><div style={{ padding: 16 }}><p className="type-label" style={{ margin: 0 }}>{label}</p><p className="type-data-lg" style={{ margin: '7px 0 0', color: label === 'Realized P&L' ? (realized >= 0 ? 'var(--color-positive)' : 'var(--color-negative)') : undefined }}>{value}</p></div></Panel>)}
          </div>

          <Panel title="Executions" meta={`${visibleTrades.length} records`} actions={<SegmentedControl label="Ledger filter" value={filter} options={FILTERS} onChange={setFilter} />}>
            {loading ? <EmptyDesk title="Loading ledger" detail="Reconstructing position cost basis." /> : visibleTrades.length === 0 ? <EmptyDesk title={filter === 'All' ? 'No executions yet' : `No ${filter.toLowerCase()} found`} detail={filter === 'All' ? 'Place a paper order from Markets to start the ledger.' : 'Choose a different filter to inspect the ledger.'} /> : (
              <div className="desk-table-wrap"><table className="desk-table"><thead><tr><th>Executed</th><th>Symbol</th><th>Side</th><th>Mode</th><th data-numeric>Qty</th><th data-numeric>Fill</th><th data-numeric>Notional</th><th data-numeric>Realized P&L</th></tr></thead><tbody>
                {visibleTrades.map((trade, index) => {
                  const buy = trade.transactionType?.toUpperCase() === 'BUY';
                  const date = new Date(trade.date || trade.createdAt);
                  return <tr key={trade._id || `${date.toISOString()}-${index}`}><td><span style={{ color: 'var(--color-text-secondary)' }}>{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span><br /><span style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></td><td style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{trade.symbol}</td><td className={buy ? 'type-positive' : 'type-negative'}>{buy ? 'BUY' : 'SELL'}</td><td>{trade.priceMode || 'LEGACY'}</td><td data-numeric>{trade.quantity}</td><td data-numeric>₹{money(trade.pricePerShare)}</td><td data-numeric>₹{money(trade.quantity * trade.pricePerShare)}</td><td data-numeric className={trade.realizedPnL > 0 ? 'type-positive' : trade.realizedPnL < 0 ? 'type-negative' : ''}>{trade.realizedPnL === null ? '—' : `${trade.realizedPnL > 0 ? '+' : ''}₹${money(trade.realizedPnL)}`}</td></tr>;
                })}
              </tbody></table></div>
            )}
          </Panel>
        </div>
      </main>
    </AppShell>
  );
}
