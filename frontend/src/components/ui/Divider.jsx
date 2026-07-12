/**
 * Divider — semantic horizontal rule
 * Replaces ad-hoc `border-t border-border` patterns across the app.
 */
import React from 'react';

export const Divider = ({ className = '', ...props }) => (
  <hr
    className={`border-0 border-t border-border ${className}`}
    role="separator"
    {...props}
  />
);
