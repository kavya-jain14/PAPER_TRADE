/**
 * Input — text input with optional label, helper text, and error state
 *
 * Variants:
 *   default → standard form input
 *   search  → with leading search icon
 */
import React from 'react';

export const Input = React.forwardRef(({
  className = '',
  type = 'text',
  error,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      <input
        ref={ref}
        type={type}
        className={[
          'flex h-9 w-full rounded-md',
          'border border-border bg-surface',
          'px-3 py-1.5 text-body text-text-primary',
          'placeholder:text-text-tertiary',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
          'disabled:cursor-not-allowed disabled:opacity-40',
          error ? 'border-negative focus-visible:ring-negative' : 'hover:border-border-strong',
          className,
        ].join(' ')}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-label text-negative" role="alert">{error}</p>
      )}
    </div>
  );
});
Input.displayName = 'Input';
