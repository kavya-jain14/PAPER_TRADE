/**
 * Skeleton — loading placeholder
 *
 * Uses the .skeleton utility class defined in index.css for the pulse animation.
 * Size is controlled entirely via className (w-*, h-*, rounded-*).
 */
import React from 'react';

export const Skeleton = ({ className = '', ...props }) => (
  <div className={`skeleton ${className}`} {...props} aria-hidden="true" />
);

/**
 * SkeletonText — convenience wrapper for text line skeletons
 */
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-3 rounded-sm ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);
