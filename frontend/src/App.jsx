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
import AIPage    from './pages/AIPage';
import CommandPalette from './components/CommandPalette';

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
        <Route path="/ai"        element={<AIPage />} />
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
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: '"Geist", "Inter", sans-serif',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '14px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#3de530', secondary: '#003a00' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <AnimatedRoutes />

      {/* ⌨️ Global Command Palette */}
      <CommandPalette />
    </BrowserRouter>
  );
}

export default App;