import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { createChart, AreaSeries, CandlestickSeries } from 'lightweight-charts';
import useMarketStatus from '../hooks/useMarketStatus';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ── Safe series creators ───────────────────────────────────────────────────
const addAreaSafe = (chart, options) => {
  if (typeof chart.addAreaSeries === 'function')  return chart.addAreaSeries(options);
  if (typeof chart.addSeries === 'function') {
    if (AreaSeries) return chart.addSeries(AreaSeries, options);
    const lc = window.LightweightCharts || {};
    if (lc.AreaSeries) return chart.addSeries(lc.AreaSeries, options);
  }
  throw new Error('lightweight-charts: AreaSeries unavailable');
};

const addCandlestickSafe = (chart, options) => {
  if (typeof chart.addCandlestickSeries === 'function') return chart.addCandlestickSeries(options);
  if (typeof chart.addSeries === 'function') {
    if (CandlestickSeries) return chart.addSeries(CandlestickSeries, options);
    const lc = window.LightweightCharts || {};
    if (lc.CandlestickSeries) return chart.addSeries(lc.CandlestickSeries, options);
  }
  throw new Error('lightweight-charts: CandlestickSeries unavailable');
};

// ── Time normalizer ────────────────────────────────────────────────────────
const normalizeTime = (t) => {
  if (!t) return Math.floor(Date.now() / 1000);
  if (typeof t === 'number') return t > 10000000000 ? Math.floor(t / 1000) : t;
  if (typeof t === 'string') return Math.floor(new Date(t).getTime() / 1000);
  if (t instanceof Date)     return Math.floor(t.getTime() / 1000);
  if (t && t.year)           return Math.floor(new Date(`${t.year}-${t.month}-${t.day}`).getTime() / 1000);
  return Math.floor(Date.now() / 1000);
};

// ─────────────────────────────────────────────────────────────────────────────
// 🕯️  CANDLESTICK EXPAND MODAL — full OHLC chart with live updates
// ─────────────────────────────────────────────────────────────────────────────
export const CandlestickModal = ({ symbol, onClose }) => {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const sseRef       = useRef(null);
  const lastTimeRef  = useRef(0);

  const [bias,    setBias]    = useState(null);
  const [candleCount, setCandleCount] = useState(0);

  const marketStatus = useMarketStatus(); // 'LIVE' | 'SIMULATED' | 'UNKNOWN'

  const sessionKey = `${symbol}:${marketStatus}`;
  const [loadState, setLoadState] = useState({ key: '', status: 'loading', error: null });
  const loading = loadState.key !== sessionKey || loadState.status === 'loading';

  // Close the SSE stream
  const closeStream = useCallback(() => {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background:  { type: 'solid', color: '#000000' },
        textColor:   'rgba(229,229,229,0.4)',
        fontFamily:  '"Roboto", sans-serif',
        fontSize:    11,
      },
      grid: {
        vertLines: { color: 'rgba(42,35,24,0.8)' },
        horzLines: { color: 'rgba(42,35,24,0.8)' },
      },
      timeScale: {
        borderColor:  '#222222',
        timeVisible:  true,
        secondsVisible: false,
      },
      crosshair: {
        horzLine: { labelBackgroundColor: '#141414' },
        vertLine: { labelBackgroundColor: '#141414' },
      },
      rightPriceScale: { borderColor: '#222222' },
    });

    const series = addCandlestickSafe(chart, {
      upColor:         '#22c55e',
      downColor:       '#ef4444',
      borderUpColor:   '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor:     '#22c55e',
      wickDownColor:   '#ef4444',
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    // Remove watermark
    setTimeout(() => {
      containerRef.current?.querySelectorAll('a').forEach(a => a.style.display = 'none');
    }, 200);

    // Resize observer
    const ro = new ResizeObserver(entries => {
      if (!entries.length || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) chartRef.current.applyOptions({ width, height });
    });
    ro.observe(containerRef.current);

    const controller = new AbortController();
    let isMounted = true;
    let pollTimeout = null;
    let currentRequestToken = 0;

    const processAndSetCandles = (data, isInitial) => {
      if (!isMounted) return;
      if (Array.isArray(data) && data.length > 0) {
        let candles = data
          .map(c => ({
            time:  normalizeTime(c.time),
            open:  Number(c.open),
            high:  Number(c.high),
            low:   Number(c.low),
            close: Number(c.close),
          }))
          .filter(c => c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0)
          .sort((a, b) => a.time - b.time);

        const unique = [];
        for (let i = 0; i < candles.length; i++) {
          if (i === 0 || candles[i].time > candles[i - 1].time) unique.push(candles[i]);
        }

        if (unique.length > 0) {
          const prevLastTime = lastTimeRef.current;
          lastTimeRef.current = unique[unique.length - 1].time;

          if (isInitial) {
            seriesRef.current?.setData(unique);
            chartRef.current?.timeScale().fitContent();
          } else {
            unique.forEach(c => {
              if (c.time >= prevLastTime) {
                try { seriesRef.current?.update(c); } catch { /* ignore */ }
              }
            });
          }
          setCandleCount(unique.length);
        }
      }
    };

    const load = async () => {
      if (!isMounted) return;

      closeStream();
      currentRequestToken += 1;
      const myToken = currentRequestToken;

      try { seriesRef.current?.setData([]); } catch { /* ignore */ }

      if (marketStatus === 'UNKNOWN') {
        return;
      }

      let hasLoaded = false;

      try {
        if (marketStatus === 'LIVE') {
          const fetchRealData = async () => {
            if (!isMounted || myToken !== currentRequestToken) return;
            try {
              const res = await fetch(`${BASE_URL}/api/trade/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`, { signal: controller.signal });
              if (!res.ok) throw new Error('Live chart fetch failed');
              const data = await res.json();
              if (!Array.isArray(data)) throw new Error('Invalid chart response format');
              if (isMounted && myToken === currentRequestToken) {
                if (!hasLoaded) {
                  processAndSetCandles(data, true);
                  setLoadState({ key: sessionKey, status: 'ready', error: null });
                  hasLoaded = true;
                } else {
                  processAndSetCandles(data, false);
                }
              }
            } catch (err) {
              if (err.name === 'AbortError') return;
              if (isMounted && myToken === currentRequestToken) {
                if (!hasLoaded) setLoadState({ key: sessionKey, status: 'error', error: err.message });
              }
            } finally {
              if (isMounted && myToken === currentRequestToken && !controller.signal.aborted) {
                pollTimeout = setTimeout(() => fetchRealData(), 5000);
              }
            }
          };
          await fetchRealData();
        } else {
          // SIMULATED MODE: synthetic history + EventSource
          const res  = await fetch(
            `${BASE_URL}/api/synthetic/history-ohlc/${encodeURIComponent(symbol)}`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error('Synthetic history fetch failed');
          const data = await res.json();
          if (!Array.isArray(data)) throw new Error('Invalid synthetic chart format');
          if (!isMounted || myToken !== currentRequestToken) return;
          processAndSetCandles(data, true);
          setLoadState({ key: sessionKey, status: 'ready', error: null });

          const sse = new EventSource(`${BASE_URL}/api/synthetic/stream/${encodeURIComponent(symbol)}`);
          sseRef.current = sse;

          sse.onmessage = (event) => {
            if (!isMounted || myToken !== currentRequestToken) return;
            try {
              const payload = JSON.parse(event.data);
              if (payload.type === 'BIAS') {
                setBias({ regime: payload.regime, bullishProbability: payload.bullishProbability, rsi: payload.rsi });
                return;
              }
              if (payload.type === 'CANDLE' && payload.symbol === symbol && seriesRef.current) {
                const c    = payload.candle;
                const time = normalizeTime(c.time);
                if (time >= lastTimeRef.current) {
                  lastTimeRef.current = time;
                  try {
                    seriesRef.current.update({
                      time,
                      open:  Number(c.open),
                      high:  Number(c.high),
                      low:   Number(c.low),
                      close: Number(c.close),
                    });
                    setCandleCount(n => n + 1);
                  } catch { /* ignore */ }
                }
              }
            } catch { /* ignore */ }
          };
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (isMounted && myToken === currentRequestToken) setLoadState({ key: sessionKey, status: 'error', error: err.message });
      }
    };

    load();

    // Get bias
    fetch(`${BASE_URL}/api/synthetic/bias/${encodeURIComponent(symbol)}`)
      .then(r => r.json())
      .then(d => { if (isMounted) setBias(d); })
      .catch(() => {});

    return () => {
      isMounted = false;
      controller.abort();
      if (pollTimeout) clearTimeout(pollTimeout);
      ro.disconnect();
      closeStream();
      if (chartRef.current) { try { chartRef.current.remove(); } catch { /* ignore */ } }
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, [symbol, closeStream, marketStatus, sessionKey]);

  const regimeColor = !bias ? 'rgba(229,229,229,0.4)'
    : bias.regime?.includes('BULLISH') ? '#22c55e'
    : bias.regime?.includes('BEARISH') ? '#ef4444'
    : '#eab308';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col" onClick={onClose}>
      <div
        className="flex flex-col w-full h-full max-w-7xl mx-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#000000] shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-text-primary tracking-tight">{symbol}</h2>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mt-0.5">
                Candlestick Chart · {marketStatus === 'UNKNOWN' ? '—' : marketStatus === 'LIVE' ? 'Live Market' : 'Simulation'} · 5m Candles
              </p>
            </div>
            {/* Status badges */}
            <div className="flex items-center gap-2 ml-4">
              <div className="px-2.5 py-1 rounded-lg bg-[#141414] border border-border text-[9px] font-black text-text-secondary uppercase tracking-widest">
                {candleCount} candles
              </div>
            </div>
          </div>

          {/* Bias info strip */}
          {bias && (
            <div className="hidden md:flex items-center gap-5 mr-8">
              <div className="text-center">
                <p className="text-[8px] text-text-primary/30 uppercase tracking-widest font-bold">Regime</p>
                <p className="text-[11px] font-black mt-0.5" style={{ color: regimeColor }}>
                  {bias.regime?.replace('_', ' ')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[8px] text-text-primary/30 uppercase tracking-widest font-bold">RSI</p>
                <p className={`text-[11px] font-black font-mono mt-0.5 ${
                  bias.rsi < 30 ? 'text-green-400' : bias.rsi > 70 ? 'text-red-400' : 'text-text-primary/70'
                }`}>{bias.rsi?.toFixed(1)}</p>
              </div>
              {bias.bullishProbability != null && (
                <div className="text-center">
                  <p className="text-[8px] text-text-primary/30 uppercase tracking-widest font-bold">Bull%</p>
                  <p className={`text-[11px] font-black font-mono mt-0.5 ${bias.bullishProbability > 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {bias.bullishProbability}%
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-[#141414] hover:bg-[#222222] border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Chart area */}
        <div className="flex-1 relative bg-[#000000]">
          <div ref={containerRef} className="w-full h-full" />

          {marketStatus === 'UNKNOWN' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#000000]">
              <p className="text-[11px] text-text-primary/30 uppercase tracking-widest font-bold">
                Checking market status...
              </p>
            </div>
          ) : loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#000000]">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-2 border-border rounded-full" />
                <div className="absolute inset-0 border-2 border-t-[#FFFFFF] rounded-full animate-spin" />
              </div>
              <p className="text-[11px] text-text-primary/30 uppercase tracking-widest font-bold">
                Loading candlestick data...
              </p>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-6 py-2.5 border-t border-border bg-[#000000] flex items-center justify-between shrink-0">
          <p className="text-[10px] text-text-primary/20 font-medium">
            {marketStatus === 'UNKNOWN'
              ? 'Checking market status…'
              : marketStatus === 'LIVE'
              ? 'Live NSE quote mode · Refreshes every 5 seconds'
              : 'Generated simulation data · Educational use only'}
          </p>
          <p className="text-[10px] text-text-primary/20 font-mono">Click anywhere outside to close</p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SMART CHART — Area/line chart with rule-engine bias overlay (mini & full)
// ─────────────────────────────────────────────────────────────────────────────
const SmartChart = ({ symbol, currentPrice, isGreen, mini = false }) => {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const sseRef       = useRef(null);
  const lastTimeRef  = useRef(0);

  const marketStatus = useMarketStatus();

  const sessionKey = `${symbol}:${marketStatus}:${mini}`;
  const [loadState, setLoadState] = useState({ key: '', status: 'loading', error: null });
  const loading = loadState.key !== sessionKey || loadState.status === 'loading';
  const error = loadState.key === sessionKey && loadState.status === 'error' ? loadState.error : null;

  const lineColor = isGreen ? '#22c55e' : '#ef4444';
  const topColor  = isGreen ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)';

  const colorRef = useRef({ lineColor, topColor });
  colorRef.current = { lineColor, topColor };

  const currentPriceRef = useRef(currentPrice);
  useLayoutEffect(() => {
    currentPriceRef.current = currentPrice;
  }, [currentPrice]);

  // Close any open SSE stream
  const closeStream = useCallback(() => {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
  }, []);

  // Build/rebuild the lightweight-charts instance
  const initChart = useCallback((w, h) => {
    if (!containerRef.current || w === 0 || h === 0) return;
    containerRef.current.innerHTML = '';

    const chart = createChart(containerRef.current, {
      width:  w,
      height: h,
      layout: {
        background:  { type: 'solid', color: 'transparent' },
        textColor:   'rgba(229,229,229,0.4)',
        fontFamily:  '"Roboto", sans-serif',
      },
      grid: {
        vertLines: { visible: !mini, color: 'rgba(42,35,24,0.6)' },
        horzLines: { visible: !mini, color: 'rgba(42,35,24,0.6)' },
      },
      timeScale: {
        visible:       !mini,
        timeVisible:   !mini,
        borderVisible: false,
        fixLeftEdge:   true,
        fixRightEdge:  true,
      },
      crosshair: {
        horzLine: { visible: !mini, labelVisible: !mini },
        vertLine: { visible: !mini, labelVisible: !mini },
      },
      rightPriceScale: { visible: !mini, borderVisible: false },
      handleScroll: !mini,
      handleScale:  !mini,
    });

    const series = addAreaSafe(chart, {
      lineColor: colorRef.current.lineColor,
      topColor: colorRef.current.topColor,
      bottomColor: 'rgba(0,0,0,0)',
      lineWidth:   mini ? 1.5 : 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    setTimeout(() => {
      containerRef.current?.querySelectorAll('a').forEach(a => a.style.display = 'none');
    }, 200);
  }, [mini]);

  const processAndSetData = useCallback((rawData) => {
    let cleanData = rawData
      .map(d => {
        const val = d.value !== undefined ? d.value : d.close;
        return { time: normalizeTime(d.time || d.date), value: val !== null && !isNaN(val) ? Number(val) : null };
      })
      .filter(d => d.value !== null && d.value > 0 && !isNaN(d.time));

    cleanData.sort((a, b) => a.time - b.time);

    const uniqueData = [];
    for (let i = 0; i < cleanData.length; i++) {
      if (i === 0 || cleanData[i].time > cleanData[i - 1].time) uniqueData.push(cleanData[i]);
    }

    if (uniqueData.length > 0) {
      lastTimeRef.current = uniqueData[uniqueData.length - 1].time;
      seriesRef.current?.setData(uniqueData);
      chartRef.current?.timeScale().fitContent();
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    initChart(w || 400, h || 300);

    let isMounted = true;
    let currentRequestToken = 0;
    const controller = new AbortController();

    const loadData = async () => {
      if (!isMounted) return;

      closeStream();
      currentRequestToken += 1;
      const myToken = currentRequestToken;

      if (seriesRef.current) { try { seriesRef.current.setData([]); } catch { /* ignore */ } }

      if (marketStatus === 'UNKNOWN') {
        return;
      }

      try {
        if (marketStatus === 'LIVE') {
          // LIVE MODE: real history, no synthetic stream
          const res  = await fetch(
            `${BASE_URL}/api/trade/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error('Real data fetch failed');
          const data = await res.json();
          if (!data || data.length === 0) throw new Error('No data returned');
          if (!isMounted || myToken !== currentRequestToken) return;
          processAndSetData(data);
          setLoadState({ key: sessionKey, status: 'ready', error: null });
          // Real price updates arrive via currentPrice prop (polling)
        } else {
          // SIMULATED MODE: synthetic history + one EventSource
          const res = await fetch(
            `${BASE_URL}/api/synthetic/history/${encodeURIComponent(symbol)}`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error('Synthetic history fetch failed');
          const historyData = await res.json();
          if (!isMounted || myToken !== currentRequestToken) return;
          if (historyData.length > 0) processAndSetData(historyData);
          setLoadState({ key: sessionKey, status: 'ready', error: null });

          // Open SSE only for the full (non-mini) chart
          if (!mini) {
            const sse = new EventSource(`${BASE_URL}/api/synthetic/stream/${encodeURIComponent(symbol)}`);
            sseRef.current = sse;

            sse.onmessage = (event) => {
              if (!isMounted) return;
              try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'BIAS') {
                  return;
                }
                if (payload.type === 'CANDLE' && payload.symbol === symbol && seriesRef.current) {
                  const cTime = normalizeTime(payload.candle.time);
                  const cVal  = currentPriceRef.current != null ? Number(currentPriceRef.current) : Number(payload.candle.close);
                  if (cTime > lastTimeRef.current) {
                    lastTimeRef.current = cTime;
                    try { seriesRef.current.update({ time: cTime, value: cVal }); } catch { /* ignore */ }
                  }
                }
              } catch { /* ignore */ }
            };

            sse.onerror = () => { /* SSE will auto-reconnect or stay silent */ };
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (isMounted && myToken === currentRequestToken) {
          setLoadState({ key: sessionKey, status: 'error', error: err.message });
        }
      }
    };

    loadData();

    const ro = new ResizeObserver(entries => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0 && chartRef.current) {
        chartRef.current.applyOptions({ width, height });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      isMounted = false;
      controller.abort();
      ro.disconnect();
      closeStream();
      if (chartRef.current) { try { chartRef.current.remove(); } catch { /* ignore */ } chartRef.current = null; }
      seriesRef.current = null;
    };
  }, [symbol, mini, initChart, processAndSetData, closeStream, marketStatus, sessionKey]);

  useEffect(() => {
    if (seriesRef.current) {
      try { seriesRef.current.applyOptions({ lineColor, topColor }); } catch { /* ignore */ }
    }
  }, [lineColor, topColor]);

  // Apply authoritative price tick (arrives from parent polling)
  useLayoutEffect(() => {
    if (marketStatus === 'UNKNOWN') return;
    if (!seriesRef.current || !currentPrice) return;
    try {
      const raw = Math.floor(Date.now() / 1000);
      const t = Math.floor(raw / 5) * 5;

      // If time moved forward, extend line. Otherwise, overwrite last valid point.
      const targetTime = t > lastTimeRef.current ? t : lastTimeRef.current;
      lastTimeRef.current = targetTime;
      seriesRef.current.update({ time: targetTime, value: Number(currentPrice) });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Chart update skipped:', err.message);
    }
  }, [currentPrice, marketStatus]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full absolute inset-0" />

      {!mini && marketStatus === 'UNKNOWN' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#000000]/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">
              Checking market status…
            </p>
          </div>
        </div>
      ) : !mini && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#000000]/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">
              {marketStatus === 'LIVE' ? 'Loading market data...' : 'Loading simulation data...'}
            </p>
          </div>
        </div>
      )}

      {!mini && error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#000000] z-10 p-4">
          <p className="text-red-500/70 text-[11px] font-mono text-center">
            Chart unavailable<br />{error}
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartChart;
