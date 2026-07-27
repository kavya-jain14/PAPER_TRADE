import React from 'react';
import { motion as Motion } from 'framer-motion';

const PodiumPosition = ({ user, rank, heightClass, colorClass, iconClass, delay }) => {
  if (!user) return <div className="flex-1" />;

  return (
    <div className="flex-1 flex flex-col items-center justify-end h-[300px]">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, type: 'spring' }}
        className="flex flex-col items-center mb-4 z-10"
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-2 ${iconClass}`}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>
            {rank === 1 ? 'emoji_events' : 'workspace_premium'}
          </span>
        </div>
        <div className="font-bold text-text-primary text-center truncate w-full px-2">
          {user.name}
        </div>
        <div className="font-mono text-positive text-sm">
          {Number.isFinite(user.equity) ? `₹${user.equity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
        </div>
      </Motion.div>

      <Motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{ delay: delay + 0.2, duration: 0.8, type: 'spring' }}
        className={`w-full max-w-[120px] rounded-t-xl ${heightClass} ${colorClass} shadow-3 relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
        <div className="h-full w-full flex items-start justify-center pt-4">
          <span className="text-4xl font-extrabold text-white/50">{rank}</span>
        </div>
      </Motion.div>
    </div>
  );
};

export default function Podium({ topUsers }) {
  // Reorder for UI: 2nd, 1st, 3rd
  const second = topUsers[1];
  const first = topUsers[0];
  const third = topUsers[2];

  return (
    <div className="flex items-end justify-center gap-2 md:gap-6 max-w-3xl mx-auto mt-12 mb-16 px-4">
      <PodiumPosition
        user={second}
        rank={2}
        heightClass="h32 md:h-40"
        colorClass="bg-slate-400"
        iconClass="bg-slate-400"
        delay={0.4}
      />
      <PodiumPosition
        user={first}
        rank={1}
        heightClass="h-40 md:h-56"
        colorClass="bg-accent-gold"
        iconClass="bg-accent-gold"
        delay={0.2}
      />
      <PodiumPosition
        user={third}
        rank={3}
        heightClass="h-28 md:h-32"
        colorClass="bg-amber-700"
        iconClass="bg-amber-700"
        delay={0.6}
      />
    </div>
  );
}
