import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function useAnalytics(token) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analytics/metrics`, {
          headers: { 'auth-token': token }
        });
        const data = await res.json();
        
        if (res.ok) {
          setMetrics(data);
        } else {
          toast.error(data.message || 'Failed to fetch analytics');
        }
      } catch {
        toast.error('Network error while fetching analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  return { metrics, loading };
}
