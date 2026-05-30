import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', icon: 'grid_view',  label: 'Dashboard' },
  { path: '/markets',   icon: 'monitoring', label: 'Markets'   },
  { path: '/portfolio', icon: 'pie_chart',  label: 'Portfolio' },
  { path: '/academy',   icon: 'school',     label: 'Academy'   },
  { path: '/history',   icon: 'history',    label: 'History'   },
  { path: '/profile',   icon: 'person',     label: 'Profile'   },
];

/**
 * Unified Sidebar — single source of truth for all pages.
 * Props:
 *  userName    – display name (string)
 *  balance     – virtualBalance number; omit to hide the balance chip
 *  isMarketOpen– boolean (market hours indicator)
 */
function Sidebar({ userName = '', balance, isMarketOpen = false, avatar = '' }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Build 1–2 letter initials from the user's name
  const initials = userName
    ? userName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#121212] border-r border-white/5 flex flex-col justify-between hidden md:flex z-10 shrink-0">

      {/* ── TOP ──────────────────────────────── */}
      <div className="flex flex-col min-h-0">

        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-white/5 shrink-0">
          <h1 className="text-xl font-black tracking-tight">
            <span className="text-[#3de530]">PAPER</span> TRADE
          </h1>
        </div>

        {/* User card — clickable → profile page */}
        <div className="px-4 pt-4 pb-3 border-b border-white/5 shrink-0">
          <button onClick={() => navigate('/profile')} className="w-full bg-[#1c1b1b] p-3 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-white/[0.04] transition-colors group">
            {/* Avatar: image or initials */}
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3de530]/20 to-[#00850a]/20 border border-[#3de530]/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-[#3de530] leading-none">{initials}</span>
              </div>
            )}
            <div className="overflow-hidden flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#3de530] transition-colors">{userName || 'Loading…'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMarketOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider truncate">
                  {isMarketOpen ? 'Market Open' : 'Market Closed'}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[14px] text-white/20 group-hover:text-white/50 transition-colors shrink-0">chevron_right</span>
          </button>


          {/* Balance chip — only shown when balance is provided */}
          {balance !== undefined && (
            <div className="mt-2.5 px-3 py-2 rounded-xl bg-[#0d0d0d] border border-white/[0.06]">
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Available Margin</p>
              <p className="text-sm font-mono font-bold text-[#3de530] tracking-tight">
                ₹{Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-3 pt-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <a
                key={path}
                href={path}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group
                  ${isActive
                    ? 'bg-white/[0.05] text-white'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.03]'
                  }`}
              >
                {/* Active accent bar on the left edge */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#3de530] rounded-r-full" />
                )}
                <span className={`material-symbols-outlined text-[20px] transition-colors
                  ${isActive ? 'text-[#3de530]' : 'group-hover:text-white/70'}`}>
                  {icon}
                </span>
                <span className={`text-sm ${isActive ? 'font-bold' : 'font-semibold'}`}>
                  {label}
                </span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* ── BOTTOM ───────────────────────────── */}
      <div className="p-4 border-t border-white/5 space-y-2">
        {/* AI Assistant Button */}
        <button 
          onClick={() => window.dispatchEvent(new Event('toggle-ai-chat'))}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-all group"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">🤖</span>
          <span className="font-bold text-sm">AI Assistant</span>
        </button>

        <a href="mailto:support@papertrade.com" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.03] transition-colors">
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
          <span className="font-bold text-sm">Support</span>
        </a>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-colors">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="font-bold text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
