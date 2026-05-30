import React, { useState, useEffect, useRef } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const addAreaSafe = (chart, options) => {
  if (typeof chart.addAreaSeries === 'function') return chart.addAreaSeries(options);
  if (typeof chart.addSeries === 'function') {
    if (AreaSeries) return chart.addSeries(AreaSeries, options);
    const lc = window.LightweightCharts || {};
    if (lc.AreaSeries) return chart.addSeries(lc.AreaSeries, options);
  }
  throw new Error('lightweight-charts version mismatch');
};

const isMarketOpen = () => {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay();
  if (day === 0 || day === 6) return false;
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
};

// 🚀 THE BULLETPROOF TIME NORMALIZER
// Ye kisi bhi time format (Object, String, Date) ko force karke Unix Timestamp (Seconds) mein badal dega
// Taaki lightweight-charts kabhi confuse ho kar crash na ho.
const normalizeTime = (t) => {
  if (!t) return Math.floor(Date.now() / 1000);
  if (typeof t === 'number') return t > 10000000000 ? Math.floor(t / 1000) : t;
  if (typeof t === 'string') return Math.floor(new Date(t).getTime() / 1000);
  if (t instanceof Date) return Math.floor(t.getTime() / 1000);
  if (t && t.year) return Math.floor(new Date(`${t.year}-${t.month}-${t.day}`).getTime() / 1000);
  return Math.floor(Date.now() / 1000);
};

const SmartChart = ({ symbol, currentPrice, isGreen, mini = false }) => {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const sseRef       = useRef(null);
  const lastTimeRef  = useRef(0); // 🚀 TRACKS LAST CANDLE TIME

  const [mode, setMode]       = useState(null);
  const [error, setError]     = useState(null);
  const [bias, setBias]       = useState(null);
  const [loading, setLoading] = useState(true);

  const lineColor  = isGreen ? '#22c55e' : '#ef4444';
  const topColor   = isGreen ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)';

  const initChart = (w, h) => {
    if (!containerRef.current || w === 0 || h === 0) return;
    containerRef.current.innerHTML = '';

    const chart = createChart(containerRef.current, {
      width:  w,
      height: h,
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#9ca3af' },
      grid:   { 
        vertLines: { visible: !mini, color: 'rgba(255,255,255,0.03)' }, 
        horzLines: { visible: !mini, color: 'rgba(255,255,255,0.03)' } 
      },
      timeScale: { visible: !mini, timeVisible: !mini, borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
      crosshair: { 
        horzLine: { visible: !mini, labelVisible: !mini }, 
        vertLine: { visible: !mini, labelVisible: !mini } 
      },
      rightPriceScale: { visible: !mini, borderVisible: false },
      handleScroll: !mini,
      handleScale: !mini,
    });

    const series = addAreaSafe(chart, {
      lineColor,
      topColor,
      bottomColor: 'rgba(0,0,0,0)',
      lineWidth:   2,
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
    // 1. Normalize and Clean
    let cleanData = rawData.map(d => ({
      time: normalizeTime(d.time || d.date),
      value: Number(d.value || d.close || currentPrice)
    })).filter(d => !isNaN(d.time) && !isNaN(d.value));

    // 2. Sort Strict Ascending
    cleanData.sort((a, b) => a.time - b.time);

    // 3. Remove Duplicates (Lightweight-charts hates duplicates)
    const uniqueData = [];
    for (let i = 0; i < cleanData.length; i++) {
      if (i === 0 || cleanData[i].time > cleanData[i - 1].time) {
        uniqueData.push(cleanData[i]);
      }
    }

    if (uniqueData.length > 0) {
      lastTimeRef.current = uniqueData[uniqueData.length - 1].time;
      seriesRef.current?.setData(uniqueData);
      chartRef.current?.timeScale().fitContent();
    }
  };

  const loadRealData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/trade/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`);
      if (!res.ok) throw new Error('Real data fetch failed');
      const data = await res.json();
      if (!data || data.length === 0) throw new Error('No data returned');

      processAndSetData(data);
      setMode('REAL');
      setLoading(false);
    } catch (err) {
      loadAIData(); // Fallback
    }
  };

  const loadAIData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/synthetic/history/${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error('Synthetic history fetch failed');
      const historyData = await res.json();

      if (historyData.length > 0) {
        processAndSetData(historyData);
      }

      setMode('AI');
      setLoading(false);

      if (!mini) {
        if (sseRef.current) sseRef.current.close();
        const sse = new EventSource(`${BASE_URL}/api/synthetic/stream/${encodeURIComponent(symbol)}`);
        sseRef.current = sse;

        sse.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);

            if (payload.type === 'BIAS') {
              setBias({
                regime: payload.regime,
                bullishProbability: payload.bullishProbability,
                rsi: payload.rsi,
                patterns: payload.patterns,
              });
              return;
            }

            if (payload.type === 'CANDLE' && payload.symbol === symbol && seriesRef.current) {
              const cTime = normalizeTime(payload.candle.time);
              const cVal = Number(payload.candle.close);
              
              if (cTime >= lastTimeRef.current) {
                lastTimeRef.current = cTime;
                seriesRef.current.update({ time: cTime, value: cVal });
              }
            }
          } catch (_) {}
        };
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    initChart(w || 400, h || 300);

    if (isMarketOpen()) loadRealData();
    else loadAIData();

    const ro = new ResizeObserver(entries => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0 && chartRef.current) {
        chartRef.current.applyOptions({ width, height });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (sseRef.current) sseRef.current.close();
      if (chartRef.current) chartRef.current.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, [symbol]);

  useEffect(() => {
    // 🚀 THE ULTIMATE SHIELD: Try-Catch prevents WSOD
    if (seriesRef.current && currentPrice && (mode === 'REAL' || mini)) {
      try {
        let t = Math.floor(Date.now() / 1000);
        if (t < lastTimeRef.current) t = lastTimeRef.current; // Force valid chronological time
        
        lastTimeRef.current = t;
        seriesRef.current.update({
          time: t,
          value: Number(currentPrice),
        });
      } catch (err) {
        console.warn("Chart Update Skipped: Waiting for valid data sync.", err);
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
          <p className="text-red-500/70 text-[11px] font-mono text-center">Chart unavailable<br />{error}</p>
        </div>
      )}

      {!mini && !loading && !error && mode && (
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2">
          {/* Live Market Badge */}
          {mode === 'REAL' && (
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2.5 py-1.5 rounded-lg w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Live Market Data</span>
            </div>
          )}

          {/* AI Simulation — Full Banner */}
          {mode === 'AI' && (
            <div className="bg-purple-900/30 border border-purple-500/40 rounded-xl px-3 py-2.5 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
                <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">⚠️ AI Simulation Mode — Not Real Market Data</span>
              </div>
              <p className="text-[9px] text-purple-300/70 leading-relaxed">
                Market is closed (9:15 AM–3:30 PM IST). This chart runs a predictive simulation based on historical patterns and momentum analysis. For educational purposes only.
              </p>
              {bias && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-purple-500/20">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-purple-400/60 uppercase font-bold">AI Regime</span>
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
                      <span className="text-[8px] text-purple-400/60 uppercase font-bold">Bull %</span>
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