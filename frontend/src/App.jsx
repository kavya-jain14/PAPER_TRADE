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
        <Route path="/"          element={<Navigate to="/login" />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/markets"   element={<Markets />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/academy"   element={<Academy />} />
        <Route path="/history"   element={<History />} />
        <Route path="/profile"   element={<Profile />} />
        <Route path="/legal"     element={<Legal />} />
        <Route path="/ai"        element={<AIPage />} />
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
          style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' }
        }} 
      />

      <AnimatedRoutes />

      {/* ⌨️ Global Command Palette */}
      <CommandPalette />
    </BrowserRouter>
  );
}

export default App;