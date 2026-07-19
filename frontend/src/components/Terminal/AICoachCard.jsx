import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AICoachCard({ aiFeedback, onClose }) {
  if (!aiFeedback) return null;

  const { score, verdict, risk, confidence, insights, warnings } = aiFeedback;

  // Color mapping based on score
  let scoreColor = 'var(--color-positive)';
  if (score < 80) scoreColor = 'var(--color-accent-gold)';
  if (score < 50) scoreColor = 'var(--color-negative)';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mt-6 rounded-lg overflow-hidden border"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Header */}
        <div className="p-3 flex justify-between items-center bg-surface-raised border-b border-border">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent" style={{ fontSize: '18px' }}>smart_toy</span>
            <span className="type-label">AI Coach Analysis</span>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          <div className="flex items-baseline justify-between">
            <div className="flex flex-col">
              <span className="type-caption-muted mb-1">Trade Score</span>
              <span className="text-3xl font-bold font-mono tracking-tight" style={{ color: scoreColor }}>
                {score}<span className="text-lg text-text-tertiary">/100</span>
              </span>
            </div>
            <div className="text-right">
              <div className="type-caption-muted mb-1">Risk Level</div>
              <div className={`type-label px-2 py-0.5 rounded-sm inline-block ${risk === 'Low' ? 'bg-positive/20 text-positive' : risk === 'Medium' ? 'bg-accent-gold/20 text-accent-gold' : 'bg-negative/20 text-negative'}`}>
                {risk}
              </div>
            </div>
          </div>

          <div>
            <h4 className="type-label text-text-primary mb-1">Verdict</h4>
            <p className="type-caption text-text-secondary">{verdict} (Confidence: {confidence}%)</p>
          </div>

          {(insights?.length > 0 || warnings?.length > 0) && (
            <div className="space-y-2 pt-2 border-t border-border">
              {warnings?.map((w, i) => (
                <div key={`w-${i}`} className="flex items-start gap-2 type-caption text-negative">
                  <span className="material-symbols-outlined shrink-0" style={{ fontSize: '14px', marginTop: '2px' }}>warning</span>
                  <span>{w.replace('⚠ ', '')}</span>
                </div>
              ))}
              {insights?.map((ins, i) => (
                <div key={`i-${i}`} className="flex items-start gap-2 type-caption text-text-secondary">
                  <span className="material-symbols-outlined shrink-0 text-positive" style={{ fontSize: '14px', marginTop: '2px' }}>check_circle</span>
                  <span>{ins.replace('✓ ', '')}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
