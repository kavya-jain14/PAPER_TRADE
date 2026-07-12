/**
 * Card — content container, used SPARINGLY
 *
 * Rule: Only use Card when content genuinely needs visual grouping
 * (e.g. a widget, a form, an elevated data panel).
 * Do NOT use Card simply to add visual interest to a section of text.
 *
 * Variants:
 *   default  → standard surface elevation, subtle border
 *   flat     → no shadow, just border — for nested context
 *   ghost    → border only, fully transparent bg — for UI grouping without weight
 *   elevated → higher shadow for modals / floating elements
 */
import React from 'react';

export const Card = ({ className = '', variant = 'default', children, ...props }) => {
  const variants = {
    default:  'bg-surface border border-border shadow-1',
    flat:     'bg-surface border border-border',
    ghost:    'border border-border bg-transparent',
    elevated: 'bg-surface-raised border border-border shadow-2',
  };

  return (
    <div className={`rounded-lg ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`px-6 pt-5 pb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }) => (
  <h3 className={`text-body font-medium text-text-primary leading-none ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className = '', children, ...props }) => (
  <p className={`mt-1 text-caption text-text-secondary ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }) => (
  <div className={`px-6 pb-5 ${className}`} {...props}>
    {children}
  </div>
);
