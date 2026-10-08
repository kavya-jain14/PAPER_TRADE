import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_URL, apiFetch } from '../lib/api';

export default function useAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/analytics/metrics`);
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
  }, []);

  return { metrics, loading };
}
