/**
 * AppShell — shared page layout
 *
 * Wraps every authenticated page with the Sidebar (desktop) and
 * MobileBottomNav (mobile). Pages never need to repeat this structure.
 *
 * Usage:
 *   <AppShell userName={...} marketStatus={...} avatar={...}>
 *     <YourPageContent />
 *   </AppShell>
 */
import React from 'react';
import Sidebar, { MobileBottomNav } from './Sidebar';

export function AppShell({ children, userName = '', marketStatus = 'UNKNOWN', avatar = '' }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar userName={userName} marketStatus={marketStatus} avatar={avatar} />
      <MobileBottomNav />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
