import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  TrendingUp,
  LayoutDashboard, 
  LineChart, 
  History, 
  GraduationCap, 
  User, 
  LogOut
} from 'lucide-react';

const PTLogo = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" className={`${className} text-[#FFFFFF] drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]`} fill="none" stroke="currentColor">
    <rect x="15" y="15" width="70" height="70" rx="16" strokeWidth="6" />
    <path d="M 32 35 L 68 35" strokeWidth="6" strokeLinecap="round" />
    <path d="M 42 35 L 42 65" strokeWidth="6" strokeLinecap="round" />
    <path d="M 42 35 L 54 35 A 10 10 0 0 1 54 55 L 42 55" strokeWidth="6" strokeLinecap="round" />
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
  { path: '/portfolio', icon: 'pie_chart',  label: 'Portfolio' },
  { path: '/history',  icon: 'history',    label: 'History'   },
  { path: '/profile',   icon: 'person',     label: 'Profile'   },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0D10]/95 backdrop-blur-xl border-t border-[#2C2E33]">
      <div className="flex items-stretch h-16">
        {BOTTOM_NAV.map(({ path, icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 relative flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                isActive ? 'text-[#D4A574]' : 'text-[#E5E5E5]/35'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#D4A574] rounded-b-full shadow-[0_0_10px_#D4A574]" />
              )}
              <span className={`material-symbols-outlined transition-all ${
                isActive ? 'text-[22px]' : 'text-[20px]'
              }`}>
                {icon}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider leading-none ${
                isActive ? 'text-[#E5E5E5]' : 'text-[#E5E5E5]/30'
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

  const isLegalActive  = location.pathname === '/legal';

  return (
    <aside className="w-[280px] bg-transparent flex flex-col justify-between hidden md:flex z-10 shrink-0 border-r border-[#2C2E33]/30">

      {/* ── TOP ──────────────────────────────── */}
      <div className="flex flex-col min-h-0 pt-8 px-4">
        
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-12 cursor-pointer hover-lift" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 rounded-[12px] bg-[#D4A574] flex items-center justify-center shadow-[0_0_15px_rgba(212,165,116,0.3)] shrink-0">
            <TrendingUp className="w-6 h-6 text-[#0B0D10]" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-[#D4A574]">
            <span className="text-[#E5E5E5]">PAPER</span> TRADE
          </h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 overflow-y-auto custom-scrollbar pr-2">
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`relative flex items-center gap-4 px-4 py-3.5 rounded-[12px] transition-all duration-200 group overflow-hidden
                  ${isActive
                    ? 'bg-[#16181D] text-[#E5E5E5] shadow-lg border border-[#2C2E33]/50'
                    : 'text-[#E5E5E5]/40 hover:text-[#E5E5E5] hover:bg-[#16181D]/50 border border-transparent'
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4A574] rounded-r-full shadow-[0_0_10px_#D4A574]" />
                )}
                <span className={`material-symbols-outlined text-[20px] transition-all duration-200
                  ${isActive ? 'text-[#D4A574]' : 'group-hover:text-[#E5E5E5] group-hover:scale-110'}`}>
                  {icon}
                </span>
                <span className={`text-sm tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── BOTTOM ───────────────────────────── */}
      <div className="p-6 space-y-6">
        {/* User card — clickable → profile page */}
        <button onClick={() => navigate('/profile')} className="w-full bg-[#16181D] p-4 rounded-[16px] flex flex-col gap-4 hover-lift border border-[#2C2E33]/50 group text-left relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4A574]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-[#2C2E33] shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1F2229] border border-[#2C2E33] flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-[#E5E5E5]">{initials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#E5E5E5] truncate group-hover:text-[#D4A574] transition-colors">{userName || 'Loading…'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMarketOpen ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#EF4444]'}`} />
                <p className="text-[10px] text-[#E5E5E5]/50 font-bold uppercase tracking-widest truncate">
                  {isMarketOpen ? 'Market Open' : 'Closed'}
                </p>
              </div>
            </div>
          </div>
          
          {balance !== undefined && (
            <div className="bg-[#0B0D10] rounded-[10px] p-3 flex justify-between items-center relative z-10 border border-[#2C2E33]/50">
               <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#E5E5E5]/40 font-bold mb-0.5">Margin</p>
                  <p className="font-mono text-xs font-bold text-[#E5E5E5]">₹{Number(balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] uppercase tracking-widest text-[#E5E5E5]/40 font-bold mb-0.5">Today P&L</p>
                  <p className="font-mono text-xs font-bold text-[#4ADE80]">+₹0</p>
               </div>
            </div>
          )}
        </button>

        <div className="flex items-center justify-between px-2 pt-2 border-t border-[#2C2E33]/30">
          <a href="mailto:support@papertrade.com" className="text-[#E5E5E5]/30 hover:text-[#E5E5E5] transition-colors hover-lift" title="Support">
            <span className="material-symbols-outlined text-[20px]">support_agent</span>
          </a>
          <Link to="/legal" className={`transition-colors hover-lift ${isLegalActive ? 'text-[#D4A574]' : 'text-[#E5E5E5]/30 hover:text-[#E5E5E5]'}`} title="Legal">
            <span className="material-symbols-outlined text-[20px]">gavel</span>
          </Link>
          <button onClick={handleLogout} className="text-[#EF4444]/40 hover:text-[#EF4444] transition-colors hover-lift" title="Logout">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
