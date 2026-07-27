import React from 'react';
import { motion as Motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function LeaderboardList({ users }) {
  if (!users || users.length === 0) return null;

  return (
    <Motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="bg-surface border border-border rounded-lg overflow-hidden shadow-1"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-raised border-b border-border">
              <th className="py-4 px-6 type-caption-muted uppercase tracking-wider w-20 text-center">Rank</th>
              <th className="py-4 px-6 type-caption-muted uppercase tracking-wider">Trader</th>
              <th className="py-4 px-6 type-caption-muted uppercase tracking-wider text-right">Equity</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <Motion.tr
                key={user.id}
                variants={item}
                className={`border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors ${
                  user.isCurrentUser ? 'bg-accent/5' : ''
                }`}
              >
                <td className="py-4 px-6 text-center">
                  <span className={`font-mono font-bold ${user.isCurrentUser ? 'text-accent' : 'text-text-tertiary'}`}>
                    {user.unrankedReason ? '—' : `#${user.rank}`}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                      user.isCurrentUser ? 'bg-accent' : 'bg-surface-raised text-text-secondary border border-border'
                    }`}>
                      {user.name.charAt(0)}
                    </div>
                    <span className={`font-medium ${user.isCurrentUser ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {user.name}
                    </span>
                    {user.isCurrentUser && (
                      <span className="ml-2 type-caption bg-accent/20 text-accent px-2 py-0.5 rounded">You</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="font-mono text-positive font-medium">
                    {Number.isFinite(user.equity) ? `₹${user.equity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </span>
                </td>
              </Motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Motion.div>
  );
}
