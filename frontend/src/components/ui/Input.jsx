import React from 'react';

export const Input = React.forwardRef(({ className = '', error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <input
        ref={ref}
        className={`flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary file:border-0 file:bg-transparent file:text-body file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${error ? 'border-negative focus-visible:ring-negative' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-negative text-caption mt-1">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';
