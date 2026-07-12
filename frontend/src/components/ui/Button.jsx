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
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none rounded-md text-label";
  
  const variants = {
    primary: "bg-accent text-accent-foreground shadow-elevation-1 hover:bg-accent/90",
    secondary: "bg-surface-elevated text-text-primary border border-border hover:border-border-hover shadow-elevation-1",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-elevated",
    danger: "bg-negative text-white hover:bg-negative/90 shadow-elevation-1",
  };
  
  const sizes = {
    sm: "h-8 px-3 text-caption",
    md: "h-10 px-4",
    lg: "h-12 px-6 text-body",
    icon: "h-10 w-10",
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </motion.button>
  );
});
Button.displayName = 'Button';
