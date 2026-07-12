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
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          fontFamily: '"Roboto",sans-serif',
          color: '#E5E5E5',
          padding: '24px',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>⚠</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(229,229,229,0.4)', margin: 0, textAlign: 'center', maxWidth: 340 }}>
            {this.state.errorMsg}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard'; }}
            style={{
              padding: '12px 28px',
              background: '#FFFFFF',
              color: '#000000',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
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
            background: '#141414',
            color: '#E5E5E5',
            border: '1px solid #222222',
            fontFamily: '"Roboto", sans-serif',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '14px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#FFFFFF', secondary: '#000000' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
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