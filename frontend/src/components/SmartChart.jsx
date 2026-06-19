import React, { useState, useEffect, useRef } from 'react';
import { createChart, AreaSeries, CandlestickSeries } from 'lightweight-charts';

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

// ── Market hours helper ────────────────────────────────────────────────────
const isMarketOpen = () => {
  const ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay();
  if (day === 0 || day === 6) return false;
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
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
// 🕯️  CANDLESTICK EXPAND MODAL — full OHLC chart with live SSE updates
// ─────────────────────────────────────────────────────────────────────────────
export const CandlestickModal = ({ symbol, onClose, isGreen }) => {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const sseRef       = useRef(null);
  const lastTimeRef  = useRef(0);

  const [bias,    setBias]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [candleCount, setCandleCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Build chart
    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background:  { type: 'solid', color: '#0a0a0a' },
        textColor:   '#6b7280',
        fontFamily:  '"Geist", "Inter", sans-serif',
        fontSize:    11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      timeScale: {
        borderColor:  'rgba(255,255,255,0.06)',
        timeVisible:  true,
        secondsVisible: false,
      },
      crosshair: {
        horzLine: { labelBackgroundColor: '#1a1a1a' },
        vertLine: { labelBackgroundColor: '#1a1a1a' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
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

    // Load OHLC history
    const load = async () => {
      try {
        const res  = await fetch(`${BASE_URL}/api/synthetic/history-ohlc/${encodeURIComponent(symbol)}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          // Normalize, sort, dedupe
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

          // Remove duplicate timestamps
          const unique = [];
          for (let i = 0; i < candles.length; i++) {
            if (i === 0 || candles[i].time > candles[i - 1].time) unique.push(candles[i]);
          }

          if (unique.length > 0) {
            lastTimeRef.current = unique[unique.length - 1].time;
            seriesRef.current?.setData(unique);
            chartRef.current?.timeScale().fitContent();
            setCandleCount(unique.length);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('[CandlestickModal] load error:', err);
        setLoading(false);
      }
    };
    load();

    // Get bias
    fetch(`${BASE_URL}/api/synthetic/bias/${encodeURIComponent(symbol)}`)
      .then(r => r.json())
      .then(d => setBias(d))
      .catch(() => {});

    // Subscribe SSE
    const sse = new EventSource(`${BASE_URL}/api/synthetic/stream/${encodeURIComponent(symbol)}`);
    sseRef.current = sse;

    sse.onmessage = (event) => {
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
            seriesRef.current.update({
              time,
              open:  Number(c.open),
              high:  Number(c.high),
              low:   Number(c.low),
              close: Number(c.close),
            });
            setCandleCount(n => n + 1);
          }
        }
      } catch (_) {}
    };

    return () => {
      ro.disconnect();
      sse.close();
      if (chartRef.current) chartRef.current.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, [symbol]);

  const regimeColor = !bias ? '#9ca3af'
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0d0d0d] shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{symbol}</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">
                Candlestick Chart • {isMarketOpen() ? 'Live Market' : 'AI Synthetic'} • 5m Candles
              </p>
            </div>
            {/* Status badges */}
            <div className="flex items-center gap-2 ml-4">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                isMarketOpen()
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isMarketOpen() ? 'bg-green-400' : 'bg-purple-400'}`} />
                {isMarketOpen() ? 'Live' : 'AI Sim'}
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-white/50 uppercase tracking-widest">
                {candleCount} candles
              </div>
            </div>
          </div>

          {/* Bias info strip */}
          {bias && (
            <div className="hidden md:flex items-center gap-5 mr-8">
              <div className="text-center">
                <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Regime</p>
                <p className="text-[11px] font-black mt-0.5" style={{ color: regimeColor }}>
                  {bias.regime?.replace('_', ' ')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">RSI</p>
                <p className={`text-[11px] font-black font-mono mt-0.5 ${
                  bias.rsi < 30 ? 'text-green-400' : bias.rsi > 70 ? 'text-red-400' : 'text-white/70'
                }`}>{bias.rsi?.toFixed(1)}</p>
              </div>
              {bias.bullishProbability != null && (
                <div className="text-center">
                  <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Bull%</p>
                  <p className={`text-[11px] font-black font-mono mt-0.5 ${bias.bullishProbability > 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {bias.bullishProbability}%
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Chart area */}
        <div className="flex-1 relative bg-[#0a0a0a]">
          <div ref={containerRef} className="w-full h-full" />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a]">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
                <div className="absolute inset-0 border-2 border-t-green-500 rounded-full animate-spin" />
              </div>
              <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold">
                Loading candlestick data...
              </p>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-6 py-2.5 border-t border-white/5 bg-[#0d0d0d] flex items-center justify-between shrink-0">
          <p className="text-[10px] text-white/20 font-medium">
            {isMarketOpen()
              ? '🟢 Live NSE data via Yahoo Finance • Refreshes every 5 seconds'
              : '🟣 AI synthetic engine • Powered by MarketBrain pattern recognition • Educational use only'}
          </p>
          <p className="text-[10px] text-white/20 font-mono">Click anywhere outside to close</p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 📈  SMART CHART — Area/line chart with AI bias overlay (mini & full)
// ─────────────────────────────────────────────────────────────────────────────
const SmartChart = ({ symbol, currentPrice, isGreen, mini = false }) => {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const sseRef       = useRef(null);
  const lastTimeRef  = useRef(0);

  const [mode,    setMode]    = useState(null);
  const [error,   setError]   = useState(null);
  const [bias,    setBias]    = useState(null);
  const [loading, setLoading] = useState(true);

  const lineColor = isGreen ? '#22c55e' : '#ef4444';
  const topColor  = isGreen ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)';

  const initChart = (w, h) => {
    if (!containerRef.current || w === 0 || h === 0) return;
    containerRef.current.innerHTML = '';

    const chart = createChart(containerRef.current, {
      width:  w,
      height: h,
      layout: {
        background:  { type: 'solid', color: 'transparent' },
        textColor:   '#6b7280',
        fontFamily:  '"Geist", "Inter", sans-serif',
      },
      grid: {
        vertLines: { visible: !mini, color: 'rgba(255,255,255,0.03)' },
        horzLines: { visible: !mini, color: 'rgba(255,255,255,0.03)' },
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
      lineColor,
      topColor,
      bottomColor: 'rgba(0,0,0,0)',
      lineWidth:   mini ? 1.5 : 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    setTimeout(() => {
      containerRef.current?.querySelectorAll('a').forEach(a => a.style.display = 'none');
    }, 200);

    return { chart, series };
  };

  const processAndSetData = (rawData) => {
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
  };

  const loadRealData = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/trade/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`);
      if (!res.ok) throw new Error('Real data fetch failed');
      const data = await res.json();
      if (!data || data.length === 0) throw new Error('No data returned');
      processAndSetData(data);
      setMode('REAL');
      setLoading(false);
    } catch (err) {
      loadAIData(); // Fallback to AI
    }
  };

  const loadAIData = async (signal) => {
    try {
      const res = await fetch(`${BASE_URL}/api/synthetic/history/${encodeURIComponent(symbol)}`, { signal });
      if (!res.ok) throw new Error('Synthetic history fetch failed');
      const historyData = await res.json();

      // Bail out if the component was unmounted while we were fetching
      if (signal?.aborted) return;

      if (historyData.length > 0) processAndSetData(historyData);

      setMode('AI');
      setLoading(false);

      // Only open SSE for the full (non-mini) chart
      if (!mini) {
        if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
        const sse = new EventSource(`${BASE_URL}/api/synthetic/stream/${encodeURIComponent(symbol)}`);
        sseRef.current = sse;

        sse.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'BIAS') {
              setBias({ regime: payload.regime, bullishProbability: payload.bullishProbability, rsi: payload.rsi, patterns: payload.patterns });
              return;
            }
            if (payload.type === 'CANDLE' && payload.symbol === symbol && seriesRef.current) {
              const cTime = normalizeTime(payload.candle.time);
              const cVal  = Number(payload.candle.close);
              // STRICT greater-than guard — lightweight-charts throws on equal/backward time
              if (cTime > lastTimeRef.current) {
                lastTimeRef.current = cTime;
                seriesRef.current.update({ time: cTime, value: cVal });
              }
            }
          } catch (_) {}
        };

        sse.onerror = () => {
          // Don't crash — SSE will auto-reconnect or stay silent
        };
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // Component unmounted — ignore
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    initChart(w || 400, h || 300);

    // AbortController lets us cancel in-flight fetches on unmount
    const controller = new AbortController();

    if (isMarketOpen()) loadRealData();
    else loadAIData(controller.signal);

    // Update colors on isGreen change
    seriesRef.current?.applyOptions({ lineColor, topColor });

    const ro = new ResizeObserver(entries => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0 && chartRef.current) {
        chartRef.current.applyOptions({ width, height });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      controller.abort();           // Cancel any pending fetch
      ro.disconnect();
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
      seriesRef.current = null;
    };
  }, [symbol]);

  useEffect(() => {
    if (!seriesRef.current || !currentPrice) return;
    // Only push live price ticks for real-mode full charts or mini charts.
    // CRITICAL: lightweight-charts requires strictly increasing timestamps.
    // Use a 5-second bucket to avoid duplicate-time crashes on rapid re-renders.
    if (mode === 'REAL' || mini) {
      try {
        const raw = Math.floor(Date.now() / 1000);
        // Round down to the nearest 5-second bucket so rapid re-renders
        // produce the same timestamp and trigger an update (not an insert)
        const t = Math.floor(raw / 5) * 5;
        if (t > lastTimeRef.current) {
          lastTimeRef.current = t;
          seriesRef.current.update({ time: t, value: Number(currentPrice) });
        } else if (t === lastTimeRef.current) {
          // Same bucket — update the existing candle value without advancing time
          seriesRef.current.update({ time: lastTimeRef.current, value: Number(currentPrice) });
        }
        // If t < lastTimeRef.current, silently skip — time cannot go backward
      } catch (err) {
        // Don't propagate chart errors — just log in dev
        if (import.meta.env.DEV) console.warn('Chart update skipped:', err.message);
      }
    }
  }, [currentPrice, mode, mini]);

  return (
    <div className="w-full h-full absolute inset-0">
      <div ref={containerRef} className="w-full h-full" />

      {!mini && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
              {isMarketOpen() ? 'Loading Market Data...' : 'AI Engine Analyzing Patterns...'}
            </p>
          </div>
        </div>
      )}

      {!mini && error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10 p-4">
          <p className="text-red-500/70 text-[11px] font-mono text-center">
            Chart unavailable<br />{error}
          </p>
        </div>
      )}

      {!mini && !loading && !error && mode && (
        <div className="absolute top-3 left-3 max-w-[70%] z-20 flex flex-col gap-2 pointer-events-none">
          {mode === 'REAL' && (
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2.5 py-1.5 rounded-lg w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Live Market Data</span>
            </div>
          )}
          {mode === 'AI' && (
            <div className="bg-purple-900/30 border border-purple-500/40 rounded-xl px-3 py-2.5 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
                <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">⚠️ AI Simulation Mode</span>
              </div>
              <p className="text-[9px] text-purple-300/70 leading-relaxed">
                Market closed (9:15 AM–3:30 PM IST). Predictive simulation based on pattern analysis. Educational only.
              </p>
              {bias && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-purple-500/20">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-purple-400/60 uppercase font-bold">Regime</span>
                    <span className={`text-[9px] font-black ml-1 ${
                      bias.regime?.includes('BULLISH') ? 'text-green-400' :
                      bias.regime?.includes('BEARISH') ? 'text-red-400' : 'text-yellow-400'
                    }`}>{bias.regime?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-purple-400/60 uppercase font-bold">RSI</span>
                    <span className={`text-[9px] font-mono font-black ml-1 ${
                      bias.rsi < 30 ? 'text-green-400' : bias.rsi > 70 ? 'text-red-400' : 'text-white/70'
                    }`}>{bias.rsi?.toFixed(1)}</span>
                  </div>
                  {bias.bullishProbability != null && (
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-purple-400/60 uppercase font-bold">Bull%</span>
                      <span className={`text-[9px] font-mono font-black ml-1 ${bias.bullishProbability > 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {bias.bullishProbability.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartChart;