import { useState } from 'react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * useTradeExecution — Manages trade math and API execution logic.
 * 
 * @param {string} symbol - Ticker symbol
 * @param {number} price - Current market price
 * @param {number} balance - User's available margin
 * @param {number} ownedQty - Units currently held by user
 * @param {string} token - Auth token
 * @param {function} onSuccess - Callback upon successful trade
 */
export default function useTradeExecution(symbol, price, balance, ownedQty, token, onSuccess, isReplayMode = false) {
  const [qty, setQty] = useState('');
  const [side, setSide] = useState('BUY');
  const [aiFeedback, setAiFeedback] = useState(null);

  const numQty   = Number(qty) || 0;
  const estCost  = numQty * price;
  const afterBal = side === 'BUY' ? balance - estCost : balance + estCost;
  const maxBuy   = price > 0 ? Math.floor(balance / price) : 0;

  const handleExecute = async (e) => {
    if (e) e.preventDefault();
    const n = Number(qty);
    setAiFeedback(null);
    
    if (!n || n <= 0 || !Number.isInteger(n)) {
      return toast.error('Enter a valid whole number.');
    }
    if (!isReplayMode && side === 'BUY' && n * price > balance) {
      return toast.error('Insufficient margin.');
    }
    if (!isReplayMode && side === 'SELL' && n > ownedQty) {
      return toast.error(`You only hold ${ownedQty} units.`);
    }

    const id = toast.loading('Routing order…');

    // ── REPLAY MODE SIMULATION ──
    if (isReplayMode) {
      setTimeout(() => {
        toast.success(`[REPLAY] ${side} order filled at $${price}`, { id });
        if (onSuccess) onSuccess();
      }, 500);
      return;
    }

    // ── LIVE TRADING ──
    try {
      const res = await fetch(`${API_URL}/api/trade/${side === 'BUY' ? 'buy' : 'sell'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
        body: JSON.stringify({ symbol, quantity: n, currentPrice: price }),
      });
      const d = await res.json();
      
      if (res.ok) {
        toast.success('Order filled.', { id });
        if (d.aiFeedback) {
           setAiFeedback(d.aiFeedback);
        }
        if (onSuccess) onSuccess();
      } else {
        toast.error(d.message || 'Order failed.', { id });
      }
    } catch {
      toast.error('Network error.', { id });
    }
  };

  return {
    qty,
    setQty,
    side,
    setSide,
    estCost,
    afterBal,
    maxBuy,
    handleExecute,
    aiFeedback,
    setAiFeedback
  };
}
