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

      // Try featured first, fall back to all products only if the featured
      // result is too thin. Previously BOTH requests fired on every load via
      // Promise.all, doubling the hottest product-list request on the homepage
      // even when featured returned a full page.
      const featuredRes = await fetch(featuredUrl, { signal });
      if (!featuredRes.ok) throw new Error('Failed to load featured products');
      const featuredData = await featuredRes.json();
      const featured = featuredData.data?.products || featuredData.products || [];

      let productsToShow = featured;
      if (featured.length < 12) {
        const fallbackRes = await fetch(fallbackUrl, { signal });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          productsToShow = fallbackData.data?.products || fallbackData.products || [];
        }
      }
      
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
