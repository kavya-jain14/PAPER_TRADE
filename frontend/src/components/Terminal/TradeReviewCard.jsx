import React from 'react';

export default function TradeReviewCard({ feedback, onClose }) {
  if (!feedback) return null;
  const { score, verdict, risk, confidence, insights = [], warnings = [] } = feedback;
  const tone = score >= 80 ? 'var(--color-positive)' : score < 50 ? 'var(--color-negative)' : 'var(--color-warning)';

  return (
    <section style={{ marginTop: 20, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}><div><p className="type-label" style={{ margin: 0 }}>Post-trade rule review</p><p className="type-caption-muted" style={{ margin: '2px 0 0' }}>Educational diagnostics</p></div><button type="button" onClick={onClose} aria-label="Close review" style={{ border: 0, background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>×</button></header>
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}><span className="type-data-lg" style={{ color: tone }}>{score}/100</span><span className="type-caption">Risk {risk} · {confidence}% confidence</span></div>
        <p style={{ margin: '10px 0', color: 'var(--color-text-secondary)', fontSize: 'var(--text-caption)', lineHeight: 1.6 }}>{verdict}</p>
        {[...warnings, ...insights].map((item, index) => <p key={`${item}-${index}`} style={{ margin: '6px 0 0', paddingTop: 6, borderTop: '1px solid var(--color-border)', color: index < warnings.length ? 'var(--color-negative)' : 'var(--color-text-muted)', fontSize: 11, lineHeight: 1.5 }}>{item.replace(/^⚠\s|^✓\s/, '')}</p>)}
      </div>
    </section>
  );
}
