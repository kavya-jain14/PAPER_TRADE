import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// Professional "neural network / brain" SVG icon for AI Assistant
const AIBrainIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C9.5 2 7.5 3.5 7 5.5C5.5 5.5 4 7 4 8.5C4 9.2 4.3 9.9 4.7 10.4C4.3 11 4 11.7 4 12.5C4 14.2 5.2 15.6 6.8 16C7.2 17.7 8.9 19 10.8 19H13.2C15.1 19 16.8 17.7 17.2 16C18.8 15.6 20 14.2 20 12.5C20 11.7 19.7 11 19.3 10.4C19.7 9.9 20 9.2 20 8.5C20 7 18.5 5.5 17 5.5C16.5 3.5 14.5 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="9" cy="10" r="1" fill="currentColor"/>
    <circle cx="15" cy="10" r="1" fill="currentColor"/>
    <circle cx="12" cy="13" r="1" fill="currentColor"/>
    <path d="M9 10 L12 13 L15 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <path d="M12 16 L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 22 L14 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const NAV_ITEMS = [
  { path: '/dashboard', icon: 'grid_view',  label: 'Dashboard' },
  { path: '/markets',   icon: 'monitoring', label: 'Markets'   },
  { path: '/portfolio', icon: 'pie_chart',  label: 'Portfolio' },
  { path: '/academy',   icon: 'school',     label: 'Academy'   },
  { path: '/history',   icon: 'history',    label: 'History'   },
  { path: '/profile',   icon: 'person',     label: 'Profile'   },
];

// ─────────────────────────────────────────────────────────────────────────────
// 📱 MOBILE BOTTOM NAV — fixed bottom bar, visible only on < md screens
// ─────────────────────────────────────────────────────────────────────────────
const BOTTOM_NAV = [
  { path: '/dashboard', icon: 'grid_view',  label: 'Home'      },
  { path: '/markets',   icon: 'monitoring', label: 'Markets'   },
  { path: '/ai',        icon: 'psychology', label: 'AI'        },
  { path: '/portfolio', icon: 'pie_chart',  label: 'Portfolio' },
  { path: '/profile',   icon: 'person',     label: 'Profile'   },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-xl border-t border-white/[0.07]">
      <div className="flex items-stretch h-16">
        {BOTTOM_NAV.map(({ path, icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 relative flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                isActive ? 'text-[#3de530]' : 'text-white/35'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#3de530] rounded-b-full" />
              )}
              <span className={`material-symbols-outlined transition-all ${
                isActive ? 'text-[22px]' : 'text-[20px]'
              }`}>
                {icon}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider leading-none ${
                isActive ? 'text-[#3de530]' : 'text-white/30'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Sidebar({ userName = '', balance, isMarketOpen = false, avatar = '' }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const initials = userName
    ? userName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isAIActive     = location.pathname === '/ai';
  const isLegalActive  = location.pathname === '/legal';

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

          {/* Balance chip */}
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
              <Link
                key={path}
                to={path}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group
                  ${isActive
                    ? 'bg-white/[0.05] text-white'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.03]'
                  }`}
              >
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
              </Link>
            );
          })}

          {/* AI Assistant — in the main nav, below Profile */}
          <Link
            to="/ai"
            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group
              ${isAIActive
                ? 'bg-purple-600/20 text-purple-300'
                : 'text-white/40 hover:text-purple-300 hover:bg-purple-600/10'
              }`}
          >
            {isAIActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-purple-400 rounded-r-full" />
            )}
            <AIBrainIcon className={`w-5 h-5 shrink-0 transition-colors ${isAIActive ? 'text-purple-400' : 'text-white/40 group-hover:text-purple-400'}`} />
            <span className={`text-sm ${isAIActive ? 'font-bold' : 'font-semibold'}`}>AI Assistant</span>
            <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">Beta</span>
          </Link>
        </nav>
      </div>

      {/* ── BOTTOM ───────────────────────────── */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <a href="mailto:kavyajain1407@gmail.com" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.03] transition-colors">
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
          <span className="font-bold text-sm">Support</span>
        </a>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-colors">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="font-bold text-sm">Sign Out</span>
        </button>
        <Link
          to="/legal"
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-colors border-t border-white/5 pt-3 mt-1 ${isLegalActive ? 'text-white/60' : 'text-white/20 hover:text-white/50 hover:bg-white/[0.02]'}`}
        >
          <span className="material-symbols-outlined text-[16px]">gavel</span>
          <span className="font-bold text-[10px] uppercase tracking-widest">Legal & Privacy</span>
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;
