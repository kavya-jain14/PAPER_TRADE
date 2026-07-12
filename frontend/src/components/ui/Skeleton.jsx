import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-elevated ${className}`}
      {...props}
    />
  );
};
