import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function useChartData(symbol, interval, onTick) {
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [marketMode, setMarketMode] = useState(null);

  const onTickRef = useRef(onTick);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);

  const modeRef          = useRef(null);
  const statusCheckingRef = useRef(false);

  useEffect(() => {
    if (!symbol) return;

    let isMounted = true;
    let currentRequestToken = 0;

    let historyAbort  = new AbortController();
    let statusAbort   = new AbortController();
    let statusInterval = null;
    let livePollTimeout = null;
    let sseSource = null;

    function cleanupCurrentMode() {
      if (sseSource) {
        sseSource.close();
        sseSource = null;
      }
      if (livePollTimeout) {
        clearTimeout(livePollTimeout);
        livePollTimeout = null;
      }
      historyAbort.abort();
      historyAbort = new AbortController();
      currentRequestToken += 1;
    }

    async function loadChartData(isOpen) {
      if (!isMounted) return;

      const myToken = currentRequestToken;

      setError(null);
      let hasLoaded = false;

      try {
        if (isOpen) {
          const fetchLive = async () => {
            if (!isMounted || myToken !== currentRequestToken) return;
            try {
              const res = await fetch(
                `${API_URL}/api/trade/chart/${encodeURIComponent(symbol)}?interval=${interval}`,
                { signal: historyAbort.signal }
              );
              if (!res.ok) throw new Error('Failed to load chart data');
              const data = await res.json();
              if (!isMounted || myToken !== currentRequestToken) return;

              if (!hasLoaded) {
                setHistory(data);
                setLoading(false);
                setError(null);
                hasLoaded = true;
              } else if (data && data.length > 0) {
                const lastCandle = data[data.length - 1];
                if (onTickRef.current) onTickRef.current(lastCandle);
                setError(null); // Clear transient LIVE error
              }
            } catch (err) {
              if (err.name === 'AbortError') return;
              if (isMounted && myToken === currentRequestToken) {
                if (!hasLoaded) {
                  setError(err.message);
                  setLoading(false);
                } else {
                  // transient error
                  setError(err.message);
                }
              }
            } finally {
              if (isMounted && myToken === currentRequestToken && !historyAbort.signal.aborted) {
                 livePollTimeout = setTimeout(() => fetchLive(), 5000);
              }
            }
          };

          await fetchLive();
        } else {
          const synRes = await fetch(
            `${API_URL}/api/synthetic/history-ohlc/${encodeURIComponent(symbol)}`,
            { signal: historyAbort.signal }
          );
          if (!synRes.ok) throw new Error('Failed to load synthetic chart data');
          const synData = await synRes.json();
          if (!isMounted || myToken !== currentRequestToken) return;
          setHistory(synData);
          setLoading(false);

          sseSource = new EventSource(`${API_URL}/api/synthetic/stream/${encodeURIComponent(symbol)}`);
          sseSource.onmessage = (e) => {
            if (!isMounted || myToken !== currentRequestToken) return;
            if (e.data === ': ping') return;
            try {
              const parsed = JSON.parse(e.data);
              if (parsed.type === 'CANDLE' && parsed.candle) {
                if (onTickRef.current) onTickRef.current(parsed.candle);
              }
            } catch { /* ignore malformed SSE */ }
          };
          sseSource.onerror = () => { /* SSE will auto-reconnect */ };
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (isMounted && myToken === currentRequestToken) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    async function checkMarketStatus() {
      if (statusCheckingRef.current) return;
      statusCheckingRef.current = true;

      statusAbort.abort();
      statusAbort = new AbortController();

      try {
        const res = await fetch(`${API_URL}/api/synthetic/status`, { signal: statusAbort.signal });
        if (!res.ok) throw new Error('Status fetch failed');
        const data = await res.json();
        if (typeof data.marketOpen !== 'boolean') throw new Error('Invalid status response');
        if (!isMounted) return;

        const nextMode = data.marketOpen ? 'LIVE' : 'SIMULATED';

        if (modeRef.current !== nextMode) {
          modeRef.current = nextMode;
          cleanupCurrentMode();
          setHistory([]);
          setLoading(true);
          setError(null);
          setMarketMode(nextMode);
          await loadChartData(data.marketOpen);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
            if (modeRef.current !== 'UNKNOWN') {
                modeRef.current = 'UNKNOWN';
                cleanupCurrentMode();
                setHistory([]);
                setLoading(false);
                setError(null);
                setMarketMode('UNKNOWN');
            }
        }
      } finally {
        statusCheckingRef.current = false;
      }
    }

    checkMarketStatus();
    statusInterval = window.setInterval(checkMarketStatus, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(statusInterval);
      statusAbort.abort();
      cleanupCurrentMode();
      modeRef.current = null;
      statusCheckingRef.current = false;
    };
  }, [symbol, interval]);

  return { history, loading, error, marketMode };
}
