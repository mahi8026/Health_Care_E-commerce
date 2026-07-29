"use client";

import { useState, useEffect } from 'react';

/**
 * Fetches and manages brand/manufacturer list.
 * 
 * @returns {{ 
 *   brands: Object[], 
 *   loading: boolean, 
 *   error: string|null 
 * }}
 * 
 * @example
 * const { brands, loading, error } = useBrands();
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * return <BrandList brands={brands} />;
 */
export function useBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchBrands = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manufacturers`, {
          signal: controller.signal,
        });
        
        if (!res.ok) throw new Error('Failed to fetch brands');
        
        const data = await res.json();
        const brandsData = data.manufacturers || data.data?.manufacturers || data.data || [];
        
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load brands');
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();

    return () => controller.abort();
  }, []);

  return { brands, loading, error };
}
