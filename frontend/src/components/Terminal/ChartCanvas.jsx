import React, { useRef, useEffect, useImperativeHandle, forwardRef, memo } from 'react';
import { createChart } from 'lightweight-charts';
import useChartData from '../../hooks/useChartData';

/**
 * ChartCanvas — Pure visualization component.
 * Uses `React.memo` to prevent React re-renders when parent state changes.
 * Updates are handled imperatively via lightweight-charts API.
 */
const ChartCanvas = memo(forwardRef(({ symbol, interval }, ref) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // Initialize Chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: 'solid', color: 'transparent' }, // Inherits CSS background
        textColor: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'var(--color-border)' },
        horzLines: { color: 'var(--color-border)' },
      },
      timeScale: {
        borderColor: 'var(--color-border)',
        timeVisible: true,
      },
      crosshair: {
        horzLine: { labelBackgroundColor: 'var(--color-surface-raised)' },
        vertLine: { labelBackgroundColor: 'var(--color-surface-raised)' },
      },
      rightPriceScale: {
        borderColor: 'var(--color-border)',
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: 'var(--color-positive)',
      downColor: 'var(--color-negative)',
      borderUpColor: 'var(--color-positive)',
      borderDownColor: 'var(--color-negative)',
      wickUpColor: 'var(--color-positive)',
      wickDownColor: 'var(--color-negative)',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: 'var(--color-text-tertiary)',
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
      seriesRef.current.update(candle);
      volumeSeriesRef.current.update({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(244, 63, 94, 0.4)',
      });
    }
  };

  // Fetch data
  const { history, loading, error } = useChartData(symbol, interval, handleTick);

  // Apply historical data when loaded
  useEffect(() => {
    if (!history.length || !seriesRef.current) return;
    
    seriesRef.current.setData(history);
    
    const volData = history.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(244, 63, 94, 0.4)',
    }));
    volumeSeriesRef.current.setData(volData);
    
    chartRef.current.timeScale().fitContent();
  }, [history]);

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
      {loading && (
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
