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
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutGrid, LineChart, PieChart, History, GraduationCap, Trophy, MessageSquareText, Menu, User, FileText, LifeBuoy, LogOut, X } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutGrid,  label: 'Dashboard' },
  { path: '/markets',   icon: LineChart,   label: 'Markets'   },
  { path: '/portfolio', icon: PieChart,    label: 'Portfolio' },
  { path: '/history',   icon: History,     label: 'Ledger'    },
  { path: '/academy',   icon: GraduationCap, label: 'Study'   },
  { path: '/leaderboard', icon: Trophy,    label: 'Rankings'  },
  { path: '/ai',        icon: MessageSquareText, label: 'Market Desk'  },
];

const MOBILE_NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { path: '/markets',   icon: LineChart,  label: 'Markets' },
  { path: '/portfolio', icon: PieChart,   label: 'Portfolio' },
  { path: '/history',   icon: History,    label: 'Ledger' },
];

/* ── Mobile bottom navigation ─────────────────────────────────────────────── */
export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef   = useRef(null);
  const moreButtonRef = useRef(null);
  const firstFocusRef = useRef(null);

  // Focus trap + escape + scroll lock
  useEffect(() => {
    if (!isMoreOpen) return;

    // Lock background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first item when opened
    requestAnimationFrame(() => firstFocusRef.current?.focus());

    const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const trapFocus = (e) => {
      if (!moreMenuRef.current) return;
      const focusable = Array.from(moreMenuRef.current.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', trapFocus);
    return () => {
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMoreOpen]);

  const closeMore = () => {
    setIsMoreOpen(false);
    // Restore focus to the More button
    requestAnimationFrame(() => moreButtonRef.current?.focus());
  };

  const handleLinkClick = () => closeMore();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t"
        style={{ background: 'rgba(12,12,12,0.96)', borderColor: 'var(--color-border)' }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch h-16">
          {MOBILE_NAV_ITEMS.map(({ path, icon, label }) => {
            const Icon = icon;
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                aria-current={isActive ? 'page' : undefined}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
                style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                <span style={{ fontSize: '10px', fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            ref={moreButtonRef}
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            aria-expanded={isMoreOpen}
            aria-controls="mobile-more-menu"
            aria-haspopup="dialog"
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            style={{ color: isMoreOpen ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {isMoreOpen ? <X size={20} strokeWidth={2} className="shrink-0" /> : <Menu size={20} strokeWidth={1.5} className="shrink-0" />}
            <span style={{ fontSize: '10px', fontWeight: isMoreOpen ? 500 : 400, color: isMoreOpen ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More Sheet — accessible dialog */}
      {isMoreOpen && (
        /* Backdrop */
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          aria-hidden="true"
          onClick={closeMore}
        />
      )}

      <div
        id="mobile-more-menu"
        ref={moreMenuRef}
        role="dialog"
        aria-modal="true"
        aria-label="More navigation options"
        className="md:hidden fixed left-0 right-0 z-50 rounded-t-2xl border-t"
        style={{
          bottom: '64px', // sits above the 64px nav bar
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-3)',
          transform: isMoreOpen ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 200ms cubic-bezier(0.2,0,0,1)',
          pointerEvents: isMoreOpen ? 'auto' : 'none',
        }}
      >
        <div style={{ padding: '8px' }}>
          <Link ref={firstFocusRef} to="/academy" onClick={handleLinkClick} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-raised transition-colors type-body">
            <GraduationCap size={20} strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} /> Academy
          </Link>
          <Link to="/leaderboard" onClick={handleLinkClick} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-raised transition-colors type-body">
            <Trophy size={20} strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} /> Rankings
          </Link>
          <Link to="/ai" onClick={handleLinkClick} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-raised transition-colors type-body">
            <MessageSquareText size={20} strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} /> Market Desk
          </Link>
          <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />
          <Link to="/profile" onClick={handleLinkClick} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-raised transition-colors type-body">
            <User size={20} strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} /> Profile
          </Link>
          <Link to="/legal" onClick={handleLinkClick} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-raised transition-colors type-body">
            <FileText size={20} strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} /> Legal
          </Link>
          <a href="mailto:kavyajain1407@gmail.com" onClick={handleLinkClick} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-raised transition-colors type-body">
            <LifeBuoy size={20} strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} /> Support
          </a>
          <button
            type="button"
            onClick={handleLogout}
            style={{ color: 'var(--color-negative)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-raised transition-colors type-body"
          >
            <LogOut size={20} strokeWidth={1.5} style={{ flexShrink: 0 }} /> Logout
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Desktop sidebar ──────────────────────────────────────────────────────── */
function Sidebar({ userName = '', avatar = '' }) {
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
      className="w-[72px] xl:w-[220px] hidden md:flex flex-col justify-between shrink-0 border-r z-10 transition-[width] duration-200"
      style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
      aria-label="Primary navigation"
    >
      {/* ── Top: Logo + Nav ──────────────────────────────────────────── */}
      <div className="flex flex-col pt-8 px-0 xl:px-5">

        {/* Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex flex-col gap-0.5 mb-10 group text-left px-5 xl:px-0 items-center xl:items-start"
          aria-label="Go to dashboard"
        >
          <div className="flex items-center gap-2">
            <img src="/papertrade-mark.svg" className="w-5 h-5 shrink-0" alt="PaperTrade" />
            <span
              className="font-medium tracking-tight hidden xl:block"
              style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-primary)' }}
            >
              PAPERTRADE
            </span>
          </div>
          <span className="type-label ml-7 normal-case tracking-normal hidden xl:block">
            Market Simulator
          </span>
        </button>

        {/* Navigation items */}
        <nav className="flex flex-col gap-2 xl:gap-0.5 px-3 xl:px-0" aria-label="App sections">
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const Icon = icon;
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                aria-current={isActive ? 'page' : undefined}
                className="flex items-center gap-3 relative rounded-md transition-colors group justify-center xl:justify-start"
                style={{
                  padding: '10px',
                  color: isActive
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)',
                  background: isActive ? 'var(--color-surface)' : 'transparent',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: 'var(--text-caption)',
                }}
                title={label}
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
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full hidden xl:block"
                    style={{ background: 'var(--color-accent)' }}
                    aria-hidden="true"
                  />
                )}
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className={`shrink-0 ${isActive ? 'text-text-primary' : ''}`} />
                <span className="hidden xl:block">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Bottom: User + Footer ─────────────────────── */}
      <div className="px-3 xl:px-5 pb-7 flex flex-col gap-5 items-center xl:items-stretch">
        {/* User row */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 group text-left w-full transition-opacity hover:opacity-80 justify-center xl:justify-start"
          aria-label="Go to profile"
          title={userName || 'Trader'}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={userName}
              className="w-8 h-8 xl:w-7 xl:h-7 rounded-full object-cover shrink-0"
              style={{ border: '1px solid var(--color-border)' }}
            />
          ) : (
            <div
              className="w-8 h-8 xl:w-7 xl:h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
            >
              <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0 hidden xl:block">
            <p
              className="truncate"
              style={{ fontSize: 'var(--text-caption)', fontWeight: 500, color: 'var(--color-text-primary)' }}
            >
              {userName || 'Trader'}
            </p>
            <p
              className="truncate"
              style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-tertiary)', textTransform: 'none', letterSpacing: 'normal' }}
            >
              Paper Account
            </p>
          </div>
        </button>

        {/* Footer links (Hidden on tablet rail) */}
        <div
          className="hidden xl:flex items-center gap-4 pt-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <Link
            to="/legal"
            style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-tertiary)', textTransform: 'none', letterSpacing: 'normal' }}
            className="hover:opacity-80 transition-opacity"
          >
            Legal
          </Link>
          <a
            href="mailto:kavyajain1407@gmail.com"
            style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-tertiary)', textTransform: 'none', letterSpacing: 'normal' }}
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
            <LogOut size={16} strokeWidth={1.5} className="text-text-tertiary" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
