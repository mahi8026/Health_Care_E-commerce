"use client";

import { useState, useEffect } from 'react';

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
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`);
        
        if (!res.ok) throw new Error('Failed to fetch stats');
        
        const data = await res.json();
        const statsData = data.data || data;
        
        if (statsData) {
          setStats(statsData);
        }
      } catch (err) {
        setError(err.message || 'Failed to load stats');
        // Keep default stats on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}
