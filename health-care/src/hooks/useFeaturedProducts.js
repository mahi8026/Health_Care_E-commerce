"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * Fetches featured products with optional category filtering.
 * 
 * @param {Object} options - Fetch options
 * @param {string} [options.category] - Category filter (optional)
 * @param {number} [options.limit=24] - Number of products to fetch
 * @returns {{ 
 *   products: Object[], 
 *   loading: boolean, 
 *   error: string|null,
 *   refetch: (category?: string) => Promise<void>
 * }}
 * 
 * @example
 * const { products, loading, refetch } = useFeaturedProducts({ category: 'Diagnostics', limit: 12 });
 */
export function useFeaturedProducts({ category = null, limit = 24 } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      // Build URLs for featured and fallback queries
      const baseParams = `limit=${limit}`;
      const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
      
      const featuredUrl = `${process.env.NEXT_PUBLIC_API_URL}/products?isFeatured=true${categoryParam}&${baseParams}`;
      const fallbackUrl = `${process.env.NEXT_PUBLIC_API_URL}/products?${categoryParam}&${baseParams}`;

      // Try featured first, fallback to all products if not enough
      const [featuredRes, fallbackRes] = await Promise.all([
        fetch(featuredUrl, { signal }),
        fetch(fallbackUrl, { signal })
      ]);

      const featuredData = await featuredRes.json();
      const fallbackData = await fallbackRes.json();

      const featured = featuredData.data?.products || featuredData.products || [];
      const fallback = fallbackData.data?.products || fallbackData.products || [];

      // Use featured if we have enough, otherwise use fallback
      const productsToShow = featured.length >= 12 ? featured : fallback;
      
      setProducts(Array.isArray(productsToShow) ? productsToShow : []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to load featured products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, limit]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => fetchProducts(controller.signal));
    return () => controller.abort();
  }, [fetchProducts]);

  return { 
    products, 
    loading, 
    error,
    refetch: fetchProducts
  };
}
