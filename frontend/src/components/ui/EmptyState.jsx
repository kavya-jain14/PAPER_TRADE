/**
 * EmptyState — used when a list or data view has no content
 */
import React from 'react';

export const EmptyState = ({ icon = 'folder_open', title = 'No data available', description = '', action, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && <span className="type-label mb-3" style={{ color: 'var(--color-text-tertiary)' }} aria-hidden="true">{icon}</span>}
      <h3 className="type-subtitle mb-1">{title}</h3>
      {description && <p className="type-body-secondary max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
