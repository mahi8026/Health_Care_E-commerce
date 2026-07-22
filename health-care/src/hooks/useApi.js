import { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '@/constants/api';

/**
 * Generic API fetch hook with loading, error, and data states
 * Automatically cancels requests on unmount
 * 
 * @param {string} endpoint - API endpoint (e.g., '/products')
 * @param {object} options - Fetch options
 * @returns {object} { data, loading, error, refetch }
 */
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  // Stringify options for stable dependency
  const optionsStr = JSON.stringify(options);

  const fetchData = useCallback(async () => {
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      // Parse options back from string
      const opts = JSON.parse(optionsStr);
      const response = await fetch(`${API}${endpoint}`, {
        ...opts,
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      setData(json.data || json);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, optionsStr]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
