import React from 'react';
import styles from './MarketTicker.module.css';

const MarketTicker = ({
  items = [],
  mode = 'simulated',
  speed = 'slow',
}) => {
  if (!items.length) return null;

  // Build exactly one sequence from the original items array.
  // This function is called twice to produce the two DOM sequences.
  // Both calls receive identical data so the sequences are identical
  // in intrinsic width — the -50% animation math is exact.
  const renderSequence = () =>
    items.map((item, index) => {
      const isPositive = item.changePercent >= 0;
      return (
        <div key={index} className={styles.tickerItem}>
          <span className={styles.symbol}>{item.symbol}</span>
          <span className={styles.price}>{item.price.toFixed(2)}</span>
          <span className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
            {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
          </span>
        </div>
      );
    });

  return (
    <div className={styles.tickerContainer}>
      {/*
        tickerViewport clips the animated track and carries the
        leading padding + edge mask. It is the only animated region.
      */}
      <div className={styles.tickerViewport}>
        <div className={`${styles.tickerTrack} ${styles[speed]}`}>
          {/* Primary sequence — announced to screen readers */}
          <div className={styles.tickerSequence}>
            {renderSequence()}
          </div>
          {/* Duplicate — identical width, hidden from assistive tech */}
          <div className={styles.tickerSequence} aria-hidden="true">
            {renderSequence()}
          </div>
        </div>
      </div>

      {/*
        SIMULATED badge is a flex sibling of tickerViewport.
        It lives entirely outside the viewport and the animated track.
        It cannot cover, clip, or constrain any ticker item.
      */}
      {mode === 'simulated' && (
        <span className={styles.modeBadge} title="Deterministic illustrative market data">
          Simulated
        </span>
      )}
    </div>
  );
};

export default MarketTicker;
