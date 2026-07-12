import React from 'react';

export const Card = ({ className = '', children, ...props }) => {
  return (
    <div className={`rounded-lg border border-border bg-surface shadow-elevation-1 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`flex flex-col space-y-1 p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }) => (
  <h3 className={`text-subtitle font-medium leading-none tracking-tight text-text-primary ${className}`} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className = '', children, ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);
