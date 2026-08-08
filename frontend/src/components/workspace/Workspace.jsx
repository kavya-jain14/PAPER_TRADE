import React from 'react';

const formatTime = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
};

export function PageHeader({ title, description, session, actions }) {
  const live = session?.mode === 'LIVE';
  const unknown = !session || session.mode === 'UNKNOWN';

  return (
    <header className="workspace-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="workspace-header__aside">
        {actions}
        {session && (
          <div className="market-session" aria-live="polite">
            <span className={`market-session__dot ${live ? 'is-live' : ''}`} />
            <div>
              <strong>{unknown ? 'Status unavailable' : live ? 'NSE live' : 'NSE simulation'}</strong>
              <span>
                {unknown ? 'Retrying automatically' : session.label}
                {session.exchangeTime ? ` · ${formatTime(session.exchangeTime)} IST` : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function Panel({ title, meta, actions, children, className = '' }) {
  return (
    <section className={`workspace-panel ${className}`.trim()}>
      {(title || meta || actions) && (
        <div className="workspace-panel__header">
          <div>
            {title && <h2>{title}</h2>}
            {meta && <p>{meta}</p>}
          </div>
          {actions && <div className="workspace-panel__actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="segmented-control" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value ?? option}
          type="button"
          className={(option.value ?? option) === value ? 'is-active' : ''}
          onClick={() => onChange(option.value ?? option)}
        >
          {option.label ?? option}
        </button>
      ))}
    </div>
  );
}

export function EmptyDesk({ title, detail }) {
  return (
    <div className="empty-desk">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}
