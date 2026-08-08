import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const INITIAL_SESSION = {
  mode: 'UNKNOWN',
  state: 'UNKNOWN',
  label: 'Checking market session',
  timezone: 'Asia/Kolkata',
  exchangeTime: null,
  nextTransitionAt: null,
  holiday: null,
};

export function useMarketSession() {
  const [session, setSession] = useState(INITIAL_SESSION);

  useEffect(() => {
    let mounted = true;
    let controller = new AbortController();
    let timeoutId;

    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/api/synthetic/status`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Market status unavailable');
        const data = await response.json();
        if (!mounted) return;
        setSession({
          ...INITIAL_SESSION,
          ...(data.session || {}),
          mode: data.mode || (data.marketOpen ? 'LIVE' : 'SIMULATED'),
        });
      } catch (error) {
        if (error.name !== 'AbortError' && mounted) setSession(INITIAL_SESSION);
      } finally {
        if (mounted && !controller.signal.aborted) timeoutId = setTimeout(load, 30000);
      }
    };

    load();
    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  return session;
}

export default function useMarketStatus() {
  return useMarketSession().mode;
}
