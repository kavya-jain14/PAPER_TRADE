import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Markets   from './pages/Markets';
import Portfolio from './pages/Portfolio';
import Academy   from './pages/Academy';
import History   from './pages/History';
import Profile   from './pages/Profile';
import Legal     from './pages/Legal';
import CommandPalette from './components/CommandPalette';

// ── Global Error Boundary ──────────────────────────────────────────────────────
// Catches any unhandled render errors and shows a safe fallback instead of a
// blank white/black screen — the #1 cause of "screen goes blank" reports.
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
          minHeight: '100vh',
          background: 'var(--color-bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-text-primary)',
          padding: '24px',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'var(--color-text-secondary)',
          }}>⚠</div>
          <div style={{ textAlign: 'center', maxWidth: 340 }}>
            <h1 style={{ fontSize: 'var(--text-h3)', fontWeight: 500, margin: '0 0 8px', letterSpacing: '-0.015em', color: 'var(--color-text-primary)' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-tertiary)', margin: 0 }}>
              {this.state.errorMsg}
            </p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard'; }}
            style={{
              padding: '8px 20px',
              background: 'var(--color-accent)',
              color: 'var(--color-accent-fg)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              fontSize: 'var(--text-caption)',
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"          element={<Navigate to="/login" replace />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/markets"   element={<Markets />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/academy"   element={<Academy />} />
        <Route path="/history"   element={<History />} />
        <Route path="/profile"   element={<Profile />} />
        <Route path="/legal"     element={<Legal />} />
        {/* 404 catch-all — redirect to dashboard if logged in, else login */}
        <Route path="*" element={
          <Navigate to={localStorage.getItem('token') ? '/dashboard' : '/login'} replace />
        } />
      </Routes>
    </AnimatePresence>
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

      {/* ⌨️ Global Command Palette */}
      <CommandPalette />
    </BrowserRouter>
  );
}

export default App;