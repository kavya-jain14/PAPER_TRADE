import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', icon: 'grid_view',  label: 'Dashboard' },
  { path: '/markets',   icon: 'monitoring', label: 'Markets'   },
  { path: '/portfolio', icon: 'pie_chart',  label: 'Portfolio' },
  { path: '/history',   icon: 'history',    label: 'Ledger'    },
  { path: '/academy',   icon: 'school',     label: 'Academy'   },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="flex items-stretch h-14">
        {NAV_ITEMS.map(({ path, icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {icon}
              </span>
              <span className={`text-[10px] tracking-wide ${isActive ? 'font-medium' : 'font-normal'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Sidebar({ userName = '', isMarketOpen = false, avatar = '' }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const initials = userName
    ? userName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="w-[240px] bg-background flex flex-col justify-between hidden md:flex z-10 shrink-0 border-r border-border">
      
      {/* ── TOP ──────────────────────────────── */}
      <div className="flex flex-col min-h-0 pt-8 px-6">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-2 mb-10 cursor-pointer group" 
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-6 h-6 rounded flex items-center justify-center bg-text-primary text-background group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
            <span className="material-symbols-outlined text-[14px] font-bold">show_chart</span>
          </div>
          <h1 className="text-subtitle font-medium tracking-tight text-text-primary">
            Paper Trade
          </h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 py-2 transition-colors group relative ${
                  isActive
                    ? 'text-text-primary font-medium'
                    : 'text-text-muted hover:text-text-secondary font-normal'
                }`}
              >
                <div className={`w-1 h-4 rounded-r-full absolute -left-6 transition-opacity ${isActive ? 'opacity-100 bg-accent' : 'opacity-0'}`} />
                <span className={`material-symbols-outlined text-[18px] transition-transform ${isActive ? 'text-text-primary' : ''}`}>
                  {icon}
                </span>
                <span className="text-body leading-none tracking-tight">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── BOTTOM ───────────────────────────── */}
      <div className="p-6 pb-8 space-y-6">
        
        {/* System Status */}
        <div className="flex items-center gap-2 px-1">
          <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-positive' : 'bg-negative'}`} />
          <span className="text-label text-text-muted uppercase">
            {isMarketOpen ? 'Market Open' : 'System Offline'}
          </span>
        </div>

        {/* User Profile Inline */}
        <div className="flex flex-col gap-4">
          <div 
            onClick={() => navigate('/profile')} 
            className="flex items-center gap-3 cursor-pointer group px-1"
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-border group-hover:border-border-hover transition-colors" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center group-hover:border-border-hover transition-colors">
                <span className="text-caption font-medium text-text-secondary">{initials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-caption font-medium text-text-primary truncate group-hover:text-text-primary transition-colors">
                {userName || 'Trader'}
              </p>
              <p className="text-label text-text-muted truncate">
                Pro Account
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-4 px-1 pt-4 border-t border-border">
            <Link to="/legal" className="text-text-muted hover:text-text-primary transition-colors text-label">
              Legal
            </Link>
            <a href="mailto:support@papertrade.com" className="text-text-muted hover:text-text-primary transition-colors text-label">
              Support
            </a>
            <button onClick={handleLogout} className="ml-auto text-text-muted hover:text-negative transition-colors" title="Logout">
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
