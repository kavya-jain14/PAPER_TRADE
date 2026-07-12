/**
 * Button — primary interactive component
 *
 * Variants:
 *   primary   → high-contrast white fill. Used for one primary CTA per screen.
 *   secondary → surface-level fill with border. Default for most actions.
 *   ghost     → text-only. Used for tertiary actions and inline links.
 *   danger    → red fill. Destructive actions only.
 *
 * Sizes:
 *   sm   → compact UI, tables, inline actions
 *   md   → default
 *   lg   → hero sections, primary page CTAs
 *   icon → square, icon-only buttons
 */
import React from 'react';
import { motion } from 'framer-motion';

export const Button = React.forwardRef(({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  ...props
}, ref) => {

  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-medium tracking-wide rounded-md',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:opacity-40 disabled:pointer-events-none',
    'select-none cursor-pointer',
  ].join(' ');

  const variants = {
    primary:   'bg-accent text-accent-fg hover:bg-accent-hover shadow-1',
    secondary: 'bg-surface-raised text-text-primary border border-border hover:border-border-strong hover:bg-surface-overlay',
    ghost:     'text-text-secondary hover:text-text-primary hover:bg-accent-muted',
    danger:    'bg-negative text-white hover:opacity-90 shadow-1',
  };

  const sizes = {
    sm:   'h-8 px-3 text-label',
    md:   'h-9 px-4 text-caption',
    lg:   'h-11 px-6 text-body',
    icon: 'h-9 w-9',
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ duration: 0.1 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <span
          className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </motion.button>
  );
});
Button.displayName = 'Button';
