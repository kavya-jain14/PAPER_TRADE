import React, { useRef, useEffect, memo } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import useReplayData from '../../hooks/useReplayData';
import ReplayControlBar from './ReplayControlBar';

/**
 * ReplayCanvas — Visualization component for Replay Mode.
 */
const ReplayCanvas = memo(({ symbol, interval, targetDate, token, onPriceUpdate }) => {
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
        background: { type: 'solid', color: 'transparent' },
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
      rightPriceScale: { borderColor: 'var(--color-border)' },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: 'var(--color-positive)', downColor: 'var(--color-negative)',
      borderUpColor: 'var(--color-positive)', borderDownColor: 'var(--color-negative)',
      wickUpColor: 'var(--color-positive)', wickDownColor: 'var(--color-negative)',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'var(--color-text-tertiary)', priceFormat: { type: 'volume' }, priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    seriesRef.current = series;
    volumeSeriesRef.current = volumeSeries;

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

  // Handle Initial State Load
  const handleInit = (history) => {
    if (seriesRef.current && volumeSeriesRef.current) {
      seriesRef.current.setData(history);
      const volData = history.map(c => ({
        time: c.time, value: c.volume,
        color: c.close >= c.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(244, 63, 94, 0.4)',
      }));
      volumeSeriesRef.current.setData(volData);
      chartRef.current.timeScale().fitContent();
    }
  };

  // Handle Live Ticks imperatively
  const handleTick = (candle) => {
    if (seriesRef.current && volumeSeriesRef.current) {
      seriesRef.current.update(candle);
      volumeSeriesRef.current.update({
        time: candle.time, value: candle.volume,
        color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(244, 63, 94, 0.4)',
      });
      // Pan to new candle
      chartRef.current.timeScale().scrollToPosition(0, true);
    }
  };

  const {
    loading, isPlaying, togglePlay, stepForward, 
    speedMultiplier, setSpeed, progress, currentPrice
  } = useReplayData(symbol, targetDate, interval, token, handleInit, handleTick);

  // Sync price to parent
  useEffect(() => {
    if (currentPrice > 0 && onPriceUpdate) {
      onPriceUpdate(currentPrice);
    }
  }, [currentPrice, onPriceUpdate]);

  return (
    <div className="w-full h-full relative" style={{ background: 'var(--color-bg)' }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full border-2 border-border-strong border-t-accent animate-spin mb-3"></div>
          <p className="type-label">Loading historical replay data...</p>
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full" />
      
      <ReplayControlBar 
        active={!loading}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        stepForward={stepForward}
        speedMultiplier={speedMultiplier}
        setSpeed={setSpeed}
        progress={progress}
        onExit={() => window.location.reload()} // Simple exit for now
      />
    </div>
  );
});

export default ReplayCanvas;
