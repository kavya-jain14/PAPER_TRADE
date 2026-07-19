/**
 * Sidebar — Primary navigation for desktop.
 * MobileBottomNav — Fixed bottom bar for mobile.
 *
 * Design decisions:
 * - No background fills on nav items. Active state = typography weight + indicator dot.
 * - Sidebar blends into the app background (no separate surface color).
 * - Single right border divides sidebar from content. No duplicate borders.
 * - User section: inline, not a card. No decorative container.
 * - Footer: Legal/Support/Logout aligned flat, no icons except logout.
 */
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', icon: 'grid_view',  label: 'Dashboard' },
  { path: '/markets',   icon: 'monitoring', label: 'Markets'   },
  { path: '/portfolio', icon: 'pie_chart',  label: 'Portfolio' },
  { path: '/history',     icon: 'history',            label: 'Ledger'    },
  { path: '/academy',     icon: 'school',             label: 'Academy'   },
  { path: '/leaderboard', icon: 'social_leaderboard', label: 'Rankings'  },
  { path: '/ai',          icon: 'smart_toy',          label: 'AI'        },
];

/* ── Mobile bottom navigation ─────────────────────────────────────────────── */
export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t"
      style={{ background: 'rgba(12,12,12,0.96)', borderColor: 'var(--color-border)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-14">
        {NAV_ITEMS.map(({ path, icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{
                color: isActive
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-tertiary)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 'var(--icon-md)', fontVariationSettings: isActive ? "'wght' 400" : "'wght' 300" }}
              >
                {icon}
              </span>
              <span
                className="tracking-wide"
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ── Desktop sidebar ──────────────────────────────────────────────────────── */
function Sidebar({ userName = '', isMarketOpen = false, avatar = '' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const initials = userName
    ? userName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside
      className="w-[220px] hidden md:flex flex-col justify-between shrink-0 border-r z-10"
      style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
      aria-label="Primary navigation"
    >
      {/* ── Top: Logo + Nav ──────────────────────────────────────────── */}
      <div className="flex flex-col pt-8 px-5">

        {/* Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 mb-10 group text-left"
          aria-label="Go to dashboard"
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'wght' 500" }}>
              show_chart
            </span>
          </div>
          <span
            className="font-medium tracking-tight"
            style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-primary)' }}
          >
            Paper Trade
          </span>
        </button>

        {/* Navigation items */}
        <nav className="flex flex-col gap-0.5" aria-label="App sections">
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                aria-current={isActive ? 'page' : undefined}
                className="flex items-center gap-3 relative rounded-md transition-colors group"
                style={{
                  padding: '7px 10px',
                  color: isActive
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)',
                  background: isActive ? 'var(--color-surface)' : 'transparent',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: 'var(--text-caption)',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.color = 'var(--color-text-tertiary)';
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                    style={{ background: 'var(--color-accent)' }}
                    aria-hidden="true"
                  />
                )}
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 'var(--icon-md)',
                    fontVariationSettings: isActive ? "'wght' 400" : "'wght' 300",
                    color: isActive ? 'var(--color-text-primary)' : 'inherit',
                  }}
                >
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Bottom: Market status + User + Footer ─────────────────────── */}
      <div className="px-5 pb-7 flex flex-col gap-5">

        {/* Market status */}
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'animate-pulse' : ''}`}
            style={{ background: isMarketOpen ? 'var(--color-positive)' : 'var(--color-text-tertiary)' }}
            aria-hidden="true"
          />
          <span style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {isMarketOpen ? 'Market Open' : 'Market Closed'}
          </span>
        </div>

        {/* User row */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 group text-left w-full transition-opacity hover:opacity-80"
          aria-label="Go to profile"
        >
          {avatar ? (
            <img
              src={avatar}
              alt={userName}
              className="w-7 h-7 rounded-full object-cover shrink-0"
              style={{ border: '1px solid var(--color-border)' }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
            >
              <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="truncate"
              style={{ fontSize: 'var(--text-caption)', fontWeight: 500, color: 'var(--color-text-primary)' }}
            >
              {userName || 'Trader'}
            </p>
            <p
              className="truncate"
              style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-tertiary)' }}
            >
              Pro Account
            </p>
          </div>
        </button>

        {/* Footer links */}
        <div
          className="flex items-center gap-4 pt-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <Link
            to="/legal"
            style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-tertiary)' }}
            className="hover:opacity-80 transition-opacity"
          >
            Legal
          </Link>
          <a
            href="mailto:support@papertrade.com"
            style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-tertiary)' }}
            className="hover:opacity-80 transition-opacity"
          >
            Support
          </a>
          <button
            onClick={handleLogout}
            className="ml-auto hover:opacity-80 transition-opacity"
            title="Logout"
            aria-label="Logout"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 'var(--icon-sm)', color: 'var(--color-text-tertiary)' }}
            >
              logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
