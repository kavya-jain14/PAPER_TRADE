import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Lazy load routes to improve initial bundle size
const Login          = React.lazy(() => import('./pages/Login'));
const Dashboard      = React.lazy(() => import('./pages/Dashboard'));
const Markets        = React.lazy(() => import('./pages/Markets'));
const Portfolio      = React.lazy(() => import('./pages/Portfolio'));
const Academy        = React.lazy(() => import('./pages/Academy'));
const History        = React.lazy(() => import('./pages/History'));
const Profile        = React.lazy(() => import('./pages/Profile'));
const Legal          = React.lazy(() => import('./pages/Legal'));
const ProTerminal    = React.lazy(() => import('./pages/ProTerminal'));
const Leaderboard    = React.lazy(() => import('./pages/Leaderboard'));
const AIPage         = React.lazy(() => import('./pages/AIPage'));
const CommandPalette = React.lazy(() => import('./components/CommandPalette'));

// ── Global Error Boundary ──────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, errorMsg: err?.message || 'Unknown error' };
  }

  componentDidCatch(err, info) {
    console.error('[ErrorBoundary]', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: 'var(--color-bg)', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)',
          padding: '24px',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'var(--color-text-secondary)',
          }}>!</div>
          <div style={{ textAlign: 'center', maxWidth: 340 }}>
            <h1 style={{ fontSize: 'var(--text-h3)', fontWeight: 500, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-tertiary)', margin: 0 }}>
              {this.state.errorMsg}
            </p>
          </div>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard'; }}
            style={{ padding: '8px 20px', background: 'var(--color-accent)', color: 'var(--color-accent-fg)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer' }}>
            Return to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Simple Suspense Fallback
const PageLoader = () => (
  <div className="w-screen h-screen flex flex-col items-center justify-center bg-bg" style={{ background: 'var(--color-bg)' }}>
    <div className="w-6 h-6 rounded-full border-2 border-border-strong border-t-accent animate-spin mb-4"></div>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <React.Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"          element={<Navigate to="/login" replace />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/markets"   element={<Markets />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/academy"   element={<Academy />} />
          <Route path="/history"   element={<History />} />
          <Route path="/profile"   element={<Profile />} />
          <Route path="/legal"     element={<Legal />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/ai"        element={<AIPage />} />
          
          {/* New Phase 12 Pro Terminal */}
          <Route path="/terminal/:symbol" element={<ProTerminal />} />
          
          {/* 404 catch-all — redirect to dashboard if logged in, else login */}
          <Route path="*" element={
            <Navigate to={localStorage.getItem('token') ? '/dashboard' : '/login'} replace />
          } />
        </Routes>
      </AnimatePresence>
    </React.Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface-raised)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-caption)',
            fontWeight: '400',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            boxShadow: 'var(--shadow-2)',
          },
          success: { iconTheme: { primary: 'var(--color-positive)', secondary: 'transparent' } },
          error:   { iconTheme: { primary: 'var(--color-negative)', secondary: 'transparent' } },
        }}
      />

      <ErrorBoundary>
        <AnimatedRoutes />
      </ErrorBoundary>

      <React.Suspense fallback={null}>
        <CommandPalette />
      </React.Suspense>
    </BrowserRouter>
  );
}

export default App;
