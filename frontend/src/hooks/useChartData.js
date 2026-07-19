import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * useChartData — Custom hook to fetch OHLC history and stream SSE updates.
 *
 * Architecture:
 * We avoid storing the live 1s ticks in React state to prevent render thrashing.
 * Instead, we call `onTick` imperatively so the chart canvas can update itself.
 *
 * @param {string} symbol - Ticker symbol
 * @param {string} interval - e.g. '1m', '5m', '1d'
 * @param {function} onTick - Callback fired when a live candle arrives
 */
export default function useChartData(symbol, interval, onTick) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // To prevent stale closures inside SSE message listener
  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!symbol) return;
    let isMounted = true;
    let eventSource = null;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`${API_URL}/api/trade/chart/${encodeURIComponent(symbol)}?interval=${interval}`);
        
        if (!res.ok) {
           // Fallback to synthetic if Yahoo fails
           const synRes = await fetch(`${API_URL}/api/synthetic/history-ohlc/${encodeURIComponent(symbol)}`);
           if (synRes.ok) {
              const synData = await synRes.json();
              if (isMounted) setHistory(synData);
           } else {
              throw new Error('Failed to load chart data');
           }
        } else {
           const data = await res.json();
           if (isMounted) setHistory(data);
        }

        // Open SSE Stream for live ticks
        eventSource = new EventSource(`${API_URL}/api/synthetic/stream/${encodeURIComponent(symbol)}`);
        
        eventSource.onmessage = (e) => {
          if (!isMounted) return;
          if (e.data === ': ping') return;
          try {
            const parsed = JSON.parse(e.data);
            if (parsed.type === 'CANDLE' && parsed.candle) {
               if (onTickRef.current) onTickRef.current(parsed.candle);
            }
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        };

        if (isMounted) setLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
    };
  }, [symbol, interval]);

  return { history, loading, error };
}
