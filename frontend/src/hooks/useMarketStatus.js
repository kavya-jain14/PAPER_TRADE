import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function useMarketStatus() {
  const [marketStatus, setMarketStatus] = useState('UNKNOWN');

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();
    let timeoutId = null;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/synthetic/status`, { signal: abortController.signal });
        if (!res.ok) {
          if (isMounted) setMarketStatus('UNKNOWN');
          return;
        }
        const data = await res.json();
        if (typeof data.marketOpen === 'boolean') {
          if (isMounted) setMarketStatus(data.marketOpen ? 'LIVE' : 'SIMULATED');
        } else {
          if (isMounted) setMarketStatus('UNKNOWN');
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
          setMarketStatus('UNKNOWN');
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          timeoutId = setTimeout(fetchStatus, 30000);
        }
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
      abortController.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return marketStatus;
}
