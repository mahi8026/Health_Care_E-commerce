"use client";

import { useState, useEffect } from 'react';
import { fetchCached } from '@/utils/api';

/**
 * Fetches site statistics (total products, brands, orders, clients).
 * 
 * @returns {{ 
 *   stats: Object,
 *   loading: boolean, 
 *   error: string|null 
 * }}
 * 
 * @example
 * const { stats, loading } = useSiteStats();
 * return <StatsDisplay stats={stats} />;
 */
export function useSiteStats() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBrands: 50,
    totalOrders: 0,
    totalB2BClients: 1200
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // fetchCached dedupes + caches /stats (5-min TTL) — previously every
        // mounting component fired its own raw fetch.
        const data = await fetchCached(`${process.env.NEXT_PUBLIC_API_URL}/stats`, {
          signal: controller.signal,
        });
        
        const statsData = data.data || data;
        
        if (statsData) {
          setStats(statsData);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load stats');
        // Keep default stats on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    return () => controller.abort();
  }, []);

  return { stats, loading, error };
}
