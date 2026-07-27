import React from 'react';
import useTradeExecution from '../../hooks/useTradeExecution';
import { Button, Input } from '../ui';
import AICoachCard from './AICoachCard';

/**
 * OrderPanel — The trade execution sidebar for the Pro Terminal.
 * Implements the Staff-level design system tokens.
 */
export default function OrderPanel({ symbol, quote, balance, ownedQty, token, isReplayMode = false, onSuccess }) {
  const {
    qty, setQty, side, setSide,
    estCost, afterBal, maxBuy, handleExecute,
    aiFeedback, setAiFeedback, priceInvalid, price
  } = useTradeExecution(symbol, quote, balance, ownedQty, token, onSuccess, isReplayMode);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--color-surface)' }}>
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h2 className="type-subtitle mb-1">Order Execution</h2>
        <p className="type-caption-muted flex justify-between">
          <span>Available Margin</span>
          <span className="type-data-sm">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </p>
      </div>

      {/* ── SCROLLABLE FORM ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Toggle BUY/SELL */}
        <div 
          className="flex p-1 rounded-md mb-6 transition-fast"
          style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
        >
          {['BUY', 'SELL'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className="flex-1 py-1.5 rounded transition-all type-label"
              style={{
                background: side === s ? 'var(--color-surface-overlay)' : 'transparent',
                color: side === s
                  ? s === 'BUY' ? 'var(--color-positive)' : 'var(--color-negative)'
                  : 'var(--color-text-tertiary)',
                boxShadow: side === s ? 'var(--shadow-1)' : 'none',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleExecute} className="space-y-5">
          
          {/* Order Type (Mocked for now as Market) */}
          <div>
            <label className="type-label block mb-2">Order Type</label>
            <div className="flex gap-2">
              <button type="button" className="flex-1 py-1.5 rounded type-caption border-accent-gold text-accent-gold bg-accent-gold-muted border transition-fast">
                Market
              </button>
              <button type="button" className="flex-1 py-1.5 rounded type-caption text-text-tertiary border border-border hover:border-border-strong transition-fast" title="Limit orders coming soon">
                Limit
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="type-label" htmlFor="pro-qty">Quantity</label>
              <button
                type="button"
                onClick={() => setQty(String(side === 'BUY' ? maxBuy : ownedQty))}
                className="type-label text-text-secondary hover:text-text-primary transition-fast"
              >
                Max: {side === 'BUY' ? maxBuy : ownedQty}
              </button>
            </div>
            <Input
              id="pro-qty"
              type="number"
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder="0"
              required
              min="1"
              step="1"
              className="font-mono text-right"
              style={{ height: '48px', fontSize: 'var(--text-subtitle)' }}
              disabled={priceInvalid}
            />
          </div>

          {/* Price Summary */}
          <div className="rounded-md p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <div className="flex justify-between items-baseline mb-2">
              <span className="type-label">Market Price</span>
              <span className="type-data-md">
                {priceInvalid ? 'Unavailable' : `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2" style={{ borderTop: '1px solid var(--color-border-strong)' }}>
              <span className="type-label text-text-primary">Required Margin</span>
              <span className="type-data-lg text-text-primary">₹{estCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Post-Trade Balance */}
          {Number(qty) > 0 && !priceInvalid && (
            <div className="flex justify-between items-baseline px-1">
              <span className="type-caption-muted">Balance After</span>
              <span className={`type-data-sm ${afterBal < 0 ? 'type-negative' : 'type-positive'}`}>
                ₹{afterBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Execute Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full h-12 shadow-1"
            disabled={priceInvalid || (Number(qty) <= 0)}
            style={{ 
              background: priceInvalid ? 'var(--color-surface-raised)' : side === 'BUY' ? 'var(--color-positive)' : 'var(--color-negative)',
              color: priceInvalid ? 'var(--color-text-tertiary)' : '#000',
              fontWeight: 600,
              cursor: priceInvalid ? 'not-allowed' : 'pointer',
              opacity: priceInvalid ? 0.5 : 1
            }}
          >
            {priceInvalid ? 'Quote unavailable' : side === 'BUY' ? 'Place Buy Order' : 'Place Sell Order'}
          </Button>

          {/* AI Coach Feedback Drawer */}
          <AICoachCard aiFeedback={aiFeedback} onClose={() => setAiFeedback(null)} />

        </form>
      </div>
    </div>
  );
}
