import React, { useEffect, useMemo, useState } from 'react';

const PRIOR_COUNT = 15;
const CONFIRMATION_COUNT = 5;

const hash = (value) => [...value].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 17);

const resolveOutcome = (pattern) => {
  const text = `${pattern.id} ${pattern.type}`.toLowerCase();
  if (text.includes('bear') || text.includes('top') || text.includes('down')) return -1;
  if (text.includes('bull') || text.includes('bottom') || text.includes('up')) return 1;
  return pattern.preTrendDir || 1;
};

const makeCandle = (open, close, spread, phase) => ({
  open,
  close,
  high: Math.max(open, close) + spread * (0.65 + phase * 0.12),
  low: Math.min(open, close) - spread * (0.55 + (1 - phase) * 0.12),
});

function buildSequence(pattern) {
  const seed = hash(pattern.id);
  const trend = pattern.preTrendDir || 1;
  const prior = [];
  let close = trend > 0 ? 78 : 122;

  for (let index = 0; index < PRIOR_COUNT; index += 1) {
    const open = close + Math.sin((seed % 13) + index * 1.7) * 0.75;
    const impulse = trend * (1.55 + ((seed + index * 11) % 6) * 0.18);
    close = open + impulse + Math.sin(index * 1.35) * 0.85;
    prior.push({ ...makeCandle(open, close, 1.5 + ((seed + index) % 4) * 0.25, 0.45), segment: 'prior' });
  }

  const formation = [];
  let base = close;
  pattern.animationCandles.forEach((item) => {
    formation.push({
      open: base + item.o,
      close: base + item.c,
      high: base + item.h,
      low: base + item.l,
      segment: 'formation',
    });
    base += item.c;
  });

  const confirmation = [];
  const outcome = resolveOutcome(pattern);
  close = formation.at(-1)?.close ?? close;
  for (let index = 0; index < CONFIRMATION_COUNT; index += 1) {
    const open = close + Math.sin(seed + index) * 0.6;
    close = open + outcome * (1.8 + index * 0.34) + Math.cos(index * 1.2) * 0.5;
    confirmation.push({ ...makeCandle(open, close, 1.7, 0.55), segment: 'confirmation' });
  }

  return [...prior, ...formation, ...confirmation];
}

export function PatternFormationChart({ pattern }) {
  const candles = useMemo(() => buildSequence(pattern), [pattern]);
  const [mode, setMode] = useState('Candles');
  const [visible, setVisible] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? candles.length : 1);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      setVisible((count) => {
        if (count >= candles.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 115);
    return () => window.clearInterval(timer);
  }, [candles.length, replayKey]);

  const shown = candles.slice(0, visible);
  const values = candles.flatMap((item) => [item.high, item.low]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 920;
  const height = 380;
  const plot = { left: 52, right: 22, top: 24, bottom: 48 };
  const innerWidth = width - plot.left - plot.right;
  const innerHeight = height - plot.top - plot.bottom;
  const step = innerWidth / candles.length;
  const candleWidth = Math.max(5, Math.min(14, step * 0.58));
  const x = (index) => plot.left + step * index + step / 2;
  const y = (value) => plot.top + ((max - value) / range) * innerHeight;
  const formationStart = PRIOR_COUNT;
  const formationEnd = PRIOR_COUNT + pattern.animationCandles.length;
  const linePoints = shown.map((item, index) => `${x(index)},${y(item.close)}`).join(' ');
  const progress = Math.round((visible / candles.length) * 100);

  return (
    <div className="pattern-canvas">
      <div className="pattern-canvas__toolbar">
        <div><span className="type-label">Formation sequence</span><p>{visible < candles.length ? `Drawing candle ${visible} of ${candles.length}` : 'Sequence complete'}</p></div>
        <div className="pattern-canvas__actions">
          <div className="segmented-control" role="group" aria-label="Pattern chart style">
            {['Candles', 'Line'].map((option) => <button key={option} type="button" className={mode === option ? 'is-active' : ''} onClick={() => setMode(option)}>{option}</button>)}
          </div>
          <button className="desk-button" type="button" onClick={() => { setVisible(1); setReplayKey((key) => key + 1); }}>Replay</button>
        </div>
      </div>

      <div className="pattern-canvas__plot">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${pattern.title}: prior trend, highlighted formation and illustrative confirmation`}>
          <defs><linearGradient id={`formation-${pattern.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.13" /><stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.025" /></linearGradient></defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const gridY = plot.top + innerHeight * ratio;
            return <g key={ratio}><line x1={plot.left} x2={width - plot.right} y1={gridY} y2={gridY} className="pattern-grid-line" /><text x={plot.left - 10} y={gridY + 4} textAnchor="end" className="pattern-axis-label">{(max - range * ratio).toFixed(0)}</text></g>;
          })}
          <rect x={plot.left + formationStart * step} y={plot.top} width={(formationEnd - formationStart) * step} height={innerHeight} fill={`url(#formation-${pattern.id})`} />
          <line x1={plot.left + formationStart * step} x2={plot.left + formationStart * step} y1={plot.top} y2={plot.top + innerHeight} className="pattern-boundary" />
          <line x1={plot.left + formationEnd * step} x2={plot.left + formationEnd * step} y1={plot.top} y2={plot.top + innerHeight} className="pattern-boundary" />
          {mode === 'Candles' ? shown.map((candle, index) => {
            const rising = candle.close >= candle.open;
            const color = rising ? 'var(--color-positive)' : 'var(--color-negative)';
            const bodyTop = Math.min(y(candle.open), y(candle.close));
            const bodyHeight = Math.max(2, Math.abs(y(candle.open) - y(candle.close)));
            const opacity = candle.segment === 'formation' ? 1 : candle.segment === 'confirmation' ? 0.82 : 0.62;
            return <g key={`${pattern.id}-${index}`} opacity={opacity}><line x1={x(index)} x2={x(index)} y1={y(candle.high)} y2={y(candle.low)} stroke={color} strokeWidth="1.4" /><rect x={x(index) - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={rising ? 'transparent' : color} stroke={color} strokeWidth={candle.segment === 'formation' ? 1.8 : 1.2} /></g>;
          }) : <polyline points={linePoints} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
          <text x={plot.left + (formationStart * step) / 2} y={height - 16} textAnchor="middle" className="pattern-segment-label">PRIOR TREND</text>
          <text x={plot.left + ((formationStart + formationEnd) * step) / 2} y={height - 16} textAnchor="middle" className="pattern-segment-label is-focus">FORMATION</text>
          <text x={plot.left + (formationEnd + (candles.length - formationEnd) / 2) * step} y={height - 16} textAnchor="middle" className="pattern-segment-label">CONFIRMATION</text>
        </svg>
      </div>
      <div className="pattern-canvas__footer"><span>Illustrative geometry—not historical market data</span><div aria-label={`${progress}% of animation complete`}><i style={{ width: `${progress}%` }} /></div></div>
    </div>
  );
}
