import React, { useRef, useEffect, useLayoutEffect, useImperativeHandle, forwardRef, memo } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import useChartData from '../../hooks/useChartData';

/**
 * ChartCanvas — Pure visualization component.
 * Uses `React.memo` to prevent React re-renders when parent state changes.
 * Updates are handled imperatively via lightweight-charts API.
 */
const ChartCanvas = memo(forwardRef(({ symbol, interval, quote }, ref) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const lastCandleRef = useRef(null);

  // Initialize Chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: 'solid', color: 'transparent' }, // Inherits CSS background
        textColor: '#92877D',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(244, 238, 230, 0.06)' },
        horzLines: { color: 'rgba(244, 238, 230, 0.06)' },
      },
      timeScale: {
        borderColor: 'rgba(244, 238, 230, 0.10)',
        timeVisible: true,
      },
      crosshair: {
        horzLine: { labelBackgroundColor: '#1C1C1C' },
        vertLine: { labelBackgroundColor: '#1C1C1C' },
      },
      rightPriceScale: {
        borderColor: 'rgba(244, 238, 230, 0.10)',
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#5A9A78',
      downColor: '#B96262',
      borderUpColor: '#5A9A78',
      borderDownColor: '#B96262',
      wickUpColor: '#5A9A78',
      wickDownColor: '#B96262',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#655E57',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // set as an overlay
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = series;
    volumeSeriesRef.current = volumeSeries;

    // Remove watermark link if present
    setTimeout(() => {
      containerRef.current?.querySelectorAll('a').forEach(a => a.style.display = 'none');
    }, 100);

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Handle Live Ticks imperatively (bypasses React state)
  const handleTick = (candle) => {
    if (seriesRef.current && volumeSeriesRef.current) {
      lastCandleRef.current = candle;
      seriesRef.current.update(candle);
      volumeSeriesRef.current.update({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(244, 63, 94, 0.4)',
      });
    }
  };

  // Fetch data
  const { history, loading, error, marketMode } = useChartData(symbol, interval, handleTick);

  // Apply historical data when loaded
  useEffect(() => {
    if (!seriesRef.current || !volumeSeriesRef.current) return;

    if (history.length === 0) {
      lastCandleRef.current = null;
      seriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      return;
    }

    seriesRef.current.setData(history);
    lastCandleRef.current = history[history.length - 1];

    const volData = history.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(244, 63, 94, 0.4)',
    }));
    volumeSeriesRef.current.setData(volData);

    chartRef.current.timeScale().fitContent();
  }, [history]);

  // The executable quote is authoritative for the chart endpoint. This keeps
  // the last candle and order ticket from showing different prices.
  useLayoutEffect(() => {
    const last = lastCandleRef.current;
    const price = Number(quote?.price);
    if (!last || !seriesRef.current || !Number.isFinite(price) || price <= 0) return;
    const next = {
      ...last,
      close: price,
      high: Math.max(Number(last.high), price),
      low: Math.min(Number(last.low), price),
    };
    lastCandleRef.current = next;
    try { seriesRef.current.update(next); } catch { /* wait for the next chart load */ }
  }, [quote]);



  // Expose chart instance to parent for drawing tools
  useImperativeHandle(ref, () => ({
    getChart: () => chartRef.current,
    getSeries: () => seriesRef.current,
  }));

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center type-caption type-negative">
        Failed to load chart: {error}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ background: 'var(--color-bg)' }}>
      {marketMode === 'UNKNOWN' ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg/80 backdrop-blur-sm">
          <span className="material-symbols-outlined text-text-tertiary mb-2 text-2xl">schedule</span>
          <p className="type-label text-text-tertiary">Checking market status…</p>
        </div>
      ) : loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full border-2 border-border-strong border-t-accent animate-spin mb-3"></div>
          <p className="type-label">Loading {interval} data...</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}));

export default ChartCanvas;
