/**
 * Badge — inline status indicators
 *
 * Variants:
 *   default  → neutral gray, for metadata and categories
 *   positive → green, for profit/success/bull signals
 *   negative → red, for loss/danger/bear signals
 *   warning  → amber, for caution states
 *   outline  → border-only, low-emphasis labels
 */
import React from 'react';

export const Badge = ({ className = '', variant = 'default', children, ...props }) => {
  const base = 'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-label font-medium leading-none';

  const variants = {
    default:  'bg-surface-raised text-text-secondary border border-border',
    positive: 'bg-positive-muted text-positive border border-positive-border',
    negative: 'bg-negative-muted text-negative border border-negative-border',
    warning:  'bg-warning-muted text-warning border border-warning/20',
    outline:  'text-text-tertiary border border-border bg-transparent',
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
