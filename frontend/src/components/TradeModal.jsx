/**
 * TradeModal — shared trade execution modal
 *
 * Used by: Dashboard, Markets, Portfolio
 * Previously: Copy-pasted inline in each page with hardcoded colors.
 * Now: Single component consuming the design system.
 *
 * Props:
 *   symbol      — ticker symbol e.g. "RELIANCE"
 *   marketData  — { price, change, high, low }
 *   balance     — user's available margin
 *   token       — auth token for API calls
 *   ownedQty    — units currently held (for SELL validation)
 *   onClose     — close callback
 *   onSuccess   — called after successful order (parent refreshes data)
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SmartChart, { CandlestickModal } from './SmartChart';
import { Button, Input } from './ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const INDICES  = ['NIFTY 50', 'SENSEX', 'NIFTY BANK'];

export default function TradeModal({ symbol, marketData, balance, token, ownedQty = 0, onClose, onSuccess }) {
  const [qty, setQty]           = useState('');
  const [side, setSide]         = useState('BUY');
  const [showCandle, setShowCandle] = useState(false);

  const price   = marketData?.price  || 0;
  const change  = marketData?.change || 0;
  const high    = marketData?.high   || price;
  const low     = marketData?.low    || price;
  const isGreen = change >= 0;

  const numQty      = Number(qty) || 0;
  const estCost     = numQty * price;
  const afterBal    = side === 'BUY' ? balance - estCost : balance + estCost;
  const maxBuy      = price > 0 ? Math.floor(balance / price) : 0;

  const handleExecute = async (e) => {
    e.preventDefault();
    const n = Number(qty);
    if (!n || n <= 0 || !Number.isInteger(n)) return toast.error('Enter a valid whole number.');
    if (side === 'BUY'  && n * price > balance) return toast.error('Insufficient margin.');
    if (side === 'SELL' && n > ownedQty)        return toast.error(`You only hold ${ownedQty} units.`);

    const id = toast.loading('Routing order…');
    try {
      const res = await fetch(`${API_URL}/api/trade/${side === 'BUY' ? 'buy' : 'sell'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
        body: JSON.stringify({ symbol, quantity: n, currentPrice: price }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success('Order filled.', { id });
        onSuccess?.();
        onClose();
      } else {
        toast.error(d.message || 'Order failed.', { id });
      }
    } catch {
      toast.error('Network error.', { id });
    }
  };

  return (
    <>
      {showCandle && (
        <CandlestickModal symbol={symbol} isGreen={isGreen} onClose={() => setShowCandle(false)} />
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
        aria-modal="true"
        role="dialog"
        aria-label={`Trade ${symbol}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
          className="w-full max-w-[880px] max-h-[92vh] overflow-hidden flex flex-col md:flex-row rounded-lg"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-3)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Left: Chart panel (60%) ─────────────────────────────── */}
          <div
            className="w-full md:w-[60%] flex flex-col p-6 md:p-7"
            style={{ borderRight: '1px solid var(--color-border)' }}
          >
            {/* Symbol header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="type-h2">{symbol}</h2>
                <p className="type-label mt-1.5">{INDICES.includes(symbol) ? 'Market Index' : 'Equity · NSE'}</p>
              </div>
              <div className="text-right">
                <p className="type-data-lg">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className={`type-caption mt-1 ${isGreen ? 'type-positive' : 'type-negative'}`}>
                  {isGreen ? '▲' : '▼'} {isGreen ? '+' : ''}{change}% today
                </p>
              </div>
            </div>

            {/* Chart */}
            <div
              className="flex-1 min-h-[220px] rounded-md overflow-hidden relative group mb-5"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <SmartChart symbol={symbol} currentPrice={price} isGreen={isGreen} />
              <button
                onClick={() => setShowCandle(true)}
                className="absolute bottom-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2.5 py-1.5 rounded-md type-caption-muted hover:text-text-primary shadow-1"
                style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 'var(--icon-sm)' }}>candlestick_chart</span>
                Candlestick
              </button>
            </div>

            {/* OHLC Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="type-label mb-1">Day Low</p>
                <p className="type-data-md">₹{low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="type-label mb-1">Day High</p>
                <p className="type-data-md">₹{high.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* ── Right: Order panel (40%) ─────────────────────────────── */}
          <div className="w-full md:w-[40%] flex flex-col p-6 md:p-7" style={{ background: 'var(--color-bg)' }}>
            {/* Close */}
            <div className="flex justify-end mb-5">
              <button
                onClick={onClose}
                className="transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
                aria-label="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 'var(--icon-md)' }}>close</span>
              </button>
            </div>

            {/* Buy / Sell toggle */}
            <div
              className="flex p-1 rounded-md mb-6"
              style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
            >
              {['BUY', 'SELL'].map(s => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className="flex-1 py-2 rounded transition-all type-label"
                  style={{
                    background: side === s ? 'var(--color-surface-overlay)' : 'transparent',
                    color: side === s
                      ? s === 'BUY' ? 'var(--color-positive)' : 'var(--color-negative)'
                      : 'var(--color-text-tertiary)',
                    boxShadow: side === s ? 'var(--shadow-1)' : 'none',
                    fontWeight: side === s ? 500 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <form onSubmit={handleExecute} className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                {/* Capacity row */}
                <div className="flex justify-between items-baseline py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <span className="type-label">{side === 'BUY' ? 'Max affordable' : 'Units held'}</span>
                  <span className={`type-data-md ${side === 'BUY' ? 'type-positive' : ''}`}>
                    {(side === 'BUY' ? maxBuy : ownedQty).toLocaleString()} units
                  </span>
                </div>

                {/* Quantity input */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="type-label" htmlFor="trade-qty">Quantity</label>
                    <button
                      type="button"
                      onClick={() => setQty(String(side === 'BUY' ? maxBuy : ownedQty))}
                      className="type-label-body transition-opacity hover:opacity-60"
                    >
                      Use max
                    </button>
                  </div>
                  <Input
                    id="trade-qty"
                    autoFocus
                    type="number"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    placeholder="0"
                    required
                    min="1"
                    step="1"
                    className="font-mono text-right"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-h3)', height: '54px' }}
                  />
                </div>

                {/* Price row */}
                <div className="flex justify-between items-baseline py-3" style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                  <span className="type-label">Market price</span>
                  <span className="type-data-md">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Summary + CTA */}
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="type-label">Est. total</span>
                  <span className="type-data-lg">₹{estCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {numQty > 0 && (
                  <div className="flex justify-between items-baseline mb-5">
                    <span className="type-label">Balance after</span>
                    <span className={`type-data-sm ${afterBal < 0 ? 'type-negative' : ''}`}>
                      ₹{Math.max(0, afterBal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <Button
                  type="submit"
                  variant={side === 'BUY' ? 'primary' : 'danger'}
                  size="lg"
                  className="w-full"
                >
                  {side === 'BUY' ? 'Buy' : 'Sell'} {symbol}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}
