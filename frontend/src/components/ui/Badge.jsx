import React from 'react';

export const Badge = ({ className = '', variant = 'neutral', children, ...props }) => {
  const baseClasses = "inline-flex items-center rounded-sm border px-2 py-0.5 text-label transition-colors focus:outline-none focus:ring-2 focus:ring-accent";
  
  const variants = {
    neutral: "border-border bg-surface text-text-secondary",
    positive: "border-positive/20 bg-positive-muted text-positive",
    negative: "border-negative/20 bg-negative-muted text-negative",
    brand: "border-accent/20 bg-accent-muted text-accent",
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
