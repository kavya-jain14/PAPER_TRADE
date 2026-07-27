import React, { useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';

// CountUp component for animating numbers
const CountUp = ({ to, prefix = '', suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const end = parseFloat(to);
    if (isNaN(end)) return;

    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      setCount(start + (end - start) * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [to]);

  const end = parseFloat(to);
  if (isNaN(end)) return <span>{prefix}{to}{suffix}</span>;

  return <span>{prefix}{Number(count).toFixed(decimals)}{suffix}</span>;
};

const StatCard = ({ title, value, prefix, suffix, decimals, colorClass = 'text-text-primary', icon }) => (
  <Motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 rounded-lg border border-border bg-surface flex flex-col"
  >
    <div className="flex items-center gap-2 type-caption-muted mb-2">
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
      {title}
    </div>
    <div className={`text-2xl font-bold font-mono ${colorClass}`}>
      <CountUp to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
    </div>
  </Motion.div>
);

export default function AnalyticsDashboard({ metrics }) {
  if (!metrics) return null;

  const {
    totalClosedTrades,
    totalRealizedPnL,
    winRate,
    profitFactor,
    bestTrade,
    worstTrade
  } = metrics;

  return (
    <div className="w-full space-y-4 mb-8">
      <h2 className="type-h3 text-text-primary">Performance Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Realized P&L"
          value={totalRealizedPnL}
          prefix={totalRealizedPnL >= 0 ? '+$' : '-$'}
          decimals={2}
          colorClass={totalRealizedPnL >= 0 ? 'text-positive' : 'text-negative'}
          icon="account_balance_wallet"
        />

        <StatCard
          title="Win Rate"
          value={winRate}
          suffix="%"
          decimals={1}
          colorClass={winRate >= 50 ? 'text-positive' : 'text-accent-gold'}
          icon="pie_chart"
        />

        <StatCard
          title="Profit Factor"
          value={profitFactor}
          decimals={2}
          colorClass={profitFactor >= 1.5 ? 'text-positive' : profitFactor >= 1 ? 'text-accent-gold' : 'text-negative'}
          icon="show_chart"
        />

        <StatCard
          title="Total Trades"
          value={totalClosedTrades}
          icon="history"
        />
      </div>

      {(bestTrade || worstTrade) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestTrade && (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-lg border border-border bg-surface">
              <div className="type-caption-muted mb-1">Best Trade</div>
              <div className="flex justify-between items-center">
                <span className="type-label px-2 py-0.5 bg-surface-raised rounded">{bestTrade.symbol}</span>
                <span className="text-positive font-mono font-bold">+${bestTrade.pnl.toFixed(2)}</span>
              </div>
            </Motion.div>
          )}
          {worstTrade && (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-lg border border-border bg-surface">
              <div className="type-caption-muted mb-1">Worst Trade</div>
              <div className="flex justify-between items-center">
                <span className="type-label px-2 py-0.5 bg-surface-raised rounded">{worstTrade.symbol}</span>
                <span className="text-negative font-mono font-bold">-${Math.abs(worstTrade.pnl).toFixed(2)}</span>
              </div>
            </Motion.div>
          )}
        </div>
      )}
    </div>
  );
}
