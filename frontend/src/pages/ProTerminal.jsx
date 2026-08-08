import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ChartCanvas from '../components/Terminal/ChartCanvas';
import ReplayCanvas from '../components/Terminal/ReplayCanvas';
import OrderPanel from '../components/Terminal/OrderPanel';
import { useMarketSession } from '../hooks/useMarketStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const WATCHLIST = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL', 'LT', 'AXISBANK'];
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '1d'];
const replayDefault = () => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
const money = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProTerminal() {
  const navigate = useNavigate();
  const params = useParams();
  const symbol = decodeURIComponent(params.symbol || '').toUpperCase();
  const token = localStorage.getItem('token');
  const session = useMarketSession();
  const [timeframe, setTimeframe] = useState('5m');
  const [account, setAccount] = useState({ balance: 0, ownedQty: 0 });
  const [quote, setQuote] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [replay, setReplay] = useState(false);
  const [replayDate, setReplayDate] = useState(replayDefault);
  const [replayPrice, setReplayPrice] = useState(0);

  const loadAccount = useCallback(async (signal) => {
    if (!token) return;
    const [userResponse, portfolioResponse, historyResponse] = await Promise.all([
      fetch(`${API_URL}/api/auth/getuser`, { headers: { 'auth-token': token }, signal }),
      fetch(`${API_URL}/api/trade/portfolio`, { headers: { 'auth-token': token }, signal }),
      fetch(`${API_URL}/api/trade/history`, { headers: { 'auth-token': token }, signal }),
    ]);
    if (userResponse.ok && portfolioResponse.ok) {
      const user = await userResponse.json();
      const portfolio = await portfolioResponse.json();
      setAccount({ balance: user.virtualBalance ?? user.balance ?? 0, ownedQty: portfolio.find((item) => item.symbol === symbol)?.quantity || 0 });
    }
    if (historyResponse.ok) setRecentTrades((await historyResponse.json()).filter((item) => item.symbol === symbol).slice(0, 5));
  }, [symbol, token]);

  useEffect(() => {
    if (!token) { navigate('/login'); return undefined; }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => loadAccount(controller.signal).catch((error) => { if (error.name !== 'AbortError') toast.error('Account data unavailable'); }), 0);
    return () => { clearTimeout(timeoutId); controller.abort(); };
  }, [loadAccount, navigate, token]);

  useEffect(() => {
    let controller = new AbortController();
    let timeoutId;
    const poll = async () => {
      controller.abort();
      controller = new AbortController();
      try {
        const response = await fetch(`${API_URL}/api/trade/live-prices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbols: [symbol] }), signal: controller.signal });
        const data = await response.json();
        const item = data[symbol];
        if (response.ok && Number(item?.price) > 0) setQuote({ ...item, symbol, receivedAt: Number(item.asOf) || Date.now() });
      } catch (error) { if (error.name !== 'AbortError') setQuote(null); }
      if (!controller.signal.aborted) timeoutId = setTimeout(poll, 5000);
    };
    poll();
    return () => { controller.abort(); clearTimeout(timeoutId); };
  }, [symbol]);

  const validQuote = quote?.priceMode === session.mode ? quote : null;

  return (
    <div className="terminal-screen">
      <header className="terminal-header">
        <div className="terminal-header__identity"><button type="button" onClick={() => navigate('/markets')} aria-label="Back to markets">←</button><span>PAPERTRADE</span><strong>{symbol}</strong><small>NSE · {replay ? 'REPLAY' : validQuote?.priceMode || session.mode}</small></div>
        <div className="segmented-control" role="group" aria-label="Chart timeframe">{TIMEFRAMES.map((item) => <button key={item} type="button" className={timeframe === item ? 'is-active' : ''} onClick={() => setTimeframe(item)}>{item.toUpperCase()}</button>)}</div>
        <div className="terminal-header__replay"><input className="desk-input" type="date" value={replayDate} onChange={(event) => setReplayDate(event.target.value)} max={new Date().toISOString().slice(0, 10)} aria-label="Replay start date" /><button className="desk-button" type="button" onClick={() => { setReplayPrice(0); setReplay((value) => !value); }}>{replay ? 'Exit replay' : 'Start replay'}</button></div>
      </header>

      <div className="terminal-layout">
        <aside className="terminal-watchlist"><div className="terminal-section-title">Watchlist</div>{WATCHLIST.map((item) => <button key={item} type="button" className={item === symbol ? 'is-active' : ''} onClick={() => navigate(`/terminal/${item}`)}><span>{item}</span>{item === symbol && validQuote ? <em>₹{money(validQuote.price)}</em> : <em>Open</em>}</button>)}<div className="terminal-account"><span>Cash available</span><strong>₹{money(account.balance)}</strong><span>Position</span><strong>{account.ownedQty} units</strong></div></aside>

        <main className="terminal-chart"><div className="terminal-chart__quote"><div><strong>{symbol}</strong><span>{replay ? `Historical replay from ${replayDate}` : session.label}</span></div><div><strong>{replay ? (replayPrice ? `₹${money(replayPrice)}` : '—') : validQuote ? `₹${money(validQuote.price)}` : 'Quote unavailable'}</strong><span>{replay ? 'Study mode · orders disabled' : validQuote ? `${validQuote.priceMode} quote` : 'Waiting for a fresh server quote'}</span></div></div><div className="terminal-chart__canvas">{replay ? <ReplayCanvas key={`${symbol}-${replayDate}-${timeframe}`} symbol={symbol} interval={timeframe} targetDate={replayDate} token={token} onPriceUpdate={setReplayPrice} onExit={() => setReplay(false)} /> : <ChartCanvas key={symbol} symbol={symbol} interval={timeframe} quote={validQuote} />}</div></main>

        <aside className="terminal-ticket">{replay ? <div className="terminal-replay-note"><p className="type-label">Replay study</p><h2>Orders are disabled</h2><p>Replay lets you step through historical candles without changing your portfolio. Exit replay to place a server-resolved paper order.</p><button className="desk-button" type="button" onClick={() => setReplay(false)}>Return to current market</button></div> : <><OrderPanel symbol={symbol} quote={validQuote} balance={account.balance} ownedQty={account.ownedQty} token={token} onSuccess={() => loadAccount(new AbortController().signal)} /><div className="terminal-executions"><div className="terminal-section-title">Recent executions</div>{recentTrades.length ? recentTrades.map((trade) => <div key={trade._id || trade.createdAt}><span>{trade.transactionType} {trade.quantity}</span><strong>₹{money(trade.pricePerShare)}</strong></div>) : <p>No executions in this symbol.</p>}</div></>}</aside>
      </div>
    </div>
  );
}
