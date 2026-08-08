import React from 'react';
import styles from './PatternRail.module.css';

// ─── Pattern data ─────────────────────────────────────────────────────────────
// Deterministic. No external fetching, no component state.
// SVGs are inlined per pattern so geometry is fully controlled.

const PATTERNS = [
  {
    id: 'doji',
    name: 'Doji',
    classification: 'Indecision',
    svg: (
      // Single candle: open ≈ close — tiny body, equal wicks both directions
      <svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true" fill="none">
        <line x1="14" y1="2"  x2="14" y2="16" stroke="var(--color-text-primary)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="10" y="16" width="8" height="2" fill="var(--color-text-primary)" opacity="0.9" rx="0.5" />
        <line x1="14" y1="18" x2="14" y2="34" stroke="var(--color-text-primary)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'hammer',
    name: 'Hammer',
    classification: 'Bullish reversal',
    svg: (
      // Small body at top, long lower wick, minimal upper wick
      <svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true" fill="none">
        <line x1="14" y1="4"  x2="14" y2="8"  stroke="var(--color-positive)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="9"  y="8"  width="10" height="9" fill="var(--color-positive)" opacity="0.85" rx="0.5" />
        <line x1="14" y1="17" x2="14" y2="34" stroke="var(--color-positive)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'shooting-star',
    name: 'Shooting Star',
    classification: 'Bearish reversal',
    svg: (
      // Long upper wick, small body at bottom, minimal lower wick
      <svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true" fill="none">
        <line x1="14" y1="2"  x2="14" y2="19" stroke="var(--color-negative)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="9"  y="19" width="10" height="9" fill="var(--color-negative)" opacity="0.85" rx="0.5" />
        <line x1="14" y1="28" x2="14" y2="32" stroke="var(--color-negative)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'bullish-engulfing',
    name: 'Bullish Engulfing',
    classification: 'Momentum shift',
    svg: (
      // Smaller bearish candle followed by larger bullish candle
      <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true" fill="none">
        <line x1="10" y1="6"  x2="10" y2="10" stroke="var(--color-negative)" strokeWidth="1.1" strokeLinecap="round" />
        <rect x="6"  y="10" width="8" height="12" fill="var(--color-negative)" opacity="0.8" rx="0.5" />
        <line x1="10" y1="22" x2="10" y2="26" stroke="var(--color-negative)" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="24" y1="4"  x2="24" y2="8"  stroke="var(--color-positive)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="19" y="8"  width="10" height="20" fill="var(--color-positive)" opacity="0.85" rx="0.5" />
        <line x1="24" y1="28" x2="24" y2="32" stroke="var(--color-positive)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="6"  x2="16" y2="30" stroke="var(--color-accent)" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'bearish-engulfing',
    name: 'Bearish Engulfing',
    classification: 'Momentum shift',
    svg: (
      // Smaller bullish candle followed by larger bearish candle
      <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true" fill="none">
        <line x1="10" y1="6"  x2="10" y2="10" stroke="var(--color-positive)" strokeWidth="1.1" strokeLinecap="round" />
        <rect x="6"  y="10" width="8" height="12" fill="var(--color-positive)" opacity="0.8" rx="0.5" />
        <line x1="10" y1="22" x2="10" y2="26" stroke="var(--color-positive)" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="24" y1="4"  x2="24" y2="8"  stroke="var(--color-negative)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="19" y="8"  width="10" height="20" fill="var(--color-negative)" opacity="0.85" rx="0.5" />
        <line x1="24" y1="28" x2="24" y2="32" stroke="var(--color-negative)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="6"  x2="16" y2="30" stroke="var(--color-accent)" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'morning-star',
    name: 'Morning Star',
    classification: 'Bullish reversal',
    svg: (
      // Bearish → tiny doji at trough → bullish
      <svg viewBox="0 0 52 36" width="52" height="36" aria-hidden="true" fill="none">
        <line x1="9"  y1="4"  x2="9"  y2="8"  stroke="var(--color-negative)" strokeWidth="1.1" strokeLinecap="round" />
        <rect x="5"  y="8"  width="8" height="14" fill="var(--color-negative)" opacity="0.8" rx="0.5" />
        <line x1="9"  y1="22" x2="9"  y2="26" stroke="var(--color-negative)" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="26" y1="20" x2="26" y2="24" stroke="var(--color-text-primary)" strokeWidth="1.1" strokeLinecap="round" />
        <rect x="22" y="24" width="8" height="3"  fill="var(--color-text-primary)" opacity="0.7" rx="0.5" />
        <line x1="26" y1="27" x2="26" y2="30" stroke="var(--color-text-primary)" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="43" y1="4"  x2="43" y2="8"  stroke="var(--color-positive)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="39" y="8"  width="8" height="16" fill="var(--color-positive)" opacity="0.85" rx="0.5" />
        <line x1="43" y1="24" x2="43" y2="28" stroke="var(--color-positive)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'evening-star',
    name: 'Evening Star',
    classification: 'Bearish reversal',
    svg: (
      // Bullish → tiny doji at peak → bearish
      <svg viewBox="0 0 52 36" width="52" height="36" aria-hidden="true" fill="none">
        <line x1="9"  y1="8"  x2="9"  y2="12" stroke="var(--color-positive)" strokeWidth="1.1" strokeLinecap="round" />
        <rect x="5"  y="12" width="8" height="14" fill="var(--color-positive)" opacity="0.8" rx="0.5" />
        <line x1="9"  y1="26" x2="9"  y2="30" stroke="var(--color-positive)" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="26" y1="6"  x2="26" y2="10" stroke="var(--color-text-primary)" strokeWidth="1.1" strokeLinecap="round" />
        <rect x="22" y="10" width="8" height="3"  fill="var(--color-text-primary)" opacity="0.7" rx="0.5" />
        <line x1="26" y1="13" x2="26" y2="17" stroke="var(--color-text-primary)" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="43" y1="8"  x2="43" y2="12" stroke="var(--color-negative)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="39" y="12" width="8" height="16" fill="var(--color-negative)" opacity="0.85" rx="0.5" />
        <line x1="43" y1="28" x2="43" y2="32" stroke="var(--color-negative)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'three-white-soldiers',
    name: 'Three White Soldiers',
    classification: 'Bullish continuation',
    svg: (
      // Three consecutive ascending bullish candles
      <svg viewBox="0 0 52 36" width="52" height="36" aria-hidden="true" fill="none">
        <line x1="9"  y1="18" x2="9"  y2="21" stroke="var(--color-positive)" strokeWidth="1.1" strokeLinecap="round" />
        <rect x="5"  y="21" width="8" height="10" fill="var(--color-positive)" opacity="0.75" rx="0.5" />
        <line x1="9"  y1="31" x2="9"  y2="34" stroke="var(--color-positive)" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="26" y1="10" x2="26" y2="14" stroke="var(--color-positive)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="22" y="14" width="8" height="12" fill="var(--color-positive)" opacity="0.82" rx="0.5" />
        <line x1="26" y1="26" x2="26" y2="29" stroke="var(--color-positive)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="43" y1="4"  x2="43" y2="7"  stroke="var(--color-positive)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="39" y="7"  width="8" height="14" fill="var(--color-positive)" opacity="0.9" rx="0.5" />
        <line x1="43" y1="21" x2="43" y2="24" stroke="var(--color-positive)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
// Purely presentational. No state, no effects, no fetching.
// Two identical sequences rendered from the same PATTERNS array.
// The CSS animates the shared .patternTrack parent via translate3d(-50%,0,0).

const PatternRail = () => {
  // One render function shared by both sequences.
  // Identical output → identical intrinsic widths → -50% is exact.
  const renderSequence = () =>
    PATTERNS.map((pattern) => (
      <div key={pattern.id} className={styles.item}>
        <div className={styles.svgWrap}>
          {pattern.svg}
        </div>
        <div className={styles.meta}>
          <span className={styles.name}>{pattern.name}</span>
          <span className={styles.classification}>{pattern.classification}</span>
        </div>
      </div>
    ));

  return (
    <section
      className={styles.rail}
      aria-label="Technical analysis patterns"
    >
      <div className={styles.patternViewport}>
        <div className={styles.patternTrack}>
          {/* Primary sequence — announced to screen readers */}
          <div className={styles.patternSequence}>
            {renderSequence()}
          </div>
          {/* Duplicate — visual loop only, hidden from assistive tech */}
          <div className={styles.patternSequence} aria-hidden="true">
            {renderSequence()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PatternRail;
