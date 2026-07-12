/**
 * Stat — Component for displaying numerical KPIs (Key Performance Indicators)
 */
import React from 'react';

export const Stat = ({ label, value, trend, isCurrency = true, className = '' }) => {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <p className="type-label">{label}</p>
      <p className="type-data-xl">
        {isCurrency ? '₹' : ''}
        {value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      {trend !== undefined && (
        <p className={`type-caption ${isPositive ? 'type-positive' : isNegative ? 'type-negative' : 'type-caption-muted'}`}>
          {isPositive ? '▲' : isNegative ? '▼' : ''} {isPositive ? '+' : ''}{trend}%
        </p>
      )}
    </div>
  );
};
