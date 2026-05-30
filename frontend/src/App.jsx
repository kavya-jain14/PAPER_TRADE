import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Markets   from './pages/Markets';
import Portfolio from './pages/Portfolio';
import Academy   from './pages/Academy';
import History   from './pages/History';
import Profile   from './pages/Profile';
import AIChat    from './components/AIChat';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' }
        }} 
      />

      <Routes>
        <Route path="/"          element={<Navigate to="/login" />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/markets"   element={<Markets />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/academy"   element={<Academy />} />
        <Route path="/history"   element={<History />} />
        <Route path="/profile"   element={<Profile />} />
      </Routes>

      {/* 🤖 Global AI Chat — visible on all authenticated pages except login */}
      <AIChat />
    </BrowserRouter>
  );
}

export default App;