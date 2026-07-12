/**
 * EmptyState — used when a list or data view has no content
 */
import React from 'react';

export const EmptyState = ({ icon = 'folder_open', title = 'No data available', description = '', action, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-12 h-12 flex items-center justify-center rounded-full mb-4" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-tertiary)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      <h3 className="type-subtitle mb-1">{title}</h3>
      {description && <p className="type-body-secondary max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
