import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasActiveSession } from '../lib/api';

export default function AuthGate({ children }) {
  const location = useLocation();
  const [state, setState] = useState('checking');

  useEffect(() => {
    const controller = new AbortController();
    hasActiveSession(controller.signal)
      .then((active) => setState(active ? 'ready' : 'signed-out'))
      .catch((error) => { if (error.name !== 'AbortError') setState('signed-out'); });
    return () => controller.abort();
  }, [location.pathname]);

  if (state === 'checking') return <div className="auth-gate-loader" role="status"><span />Checking secure session…</div>;
  if (state === 'signed-out') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
