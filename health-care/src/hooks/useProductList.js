"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/api';

/**
 * Fetches paginated product list with filters and sorting.
 * 
 * Supports infinite scroll pagination by accumulating products across pages.
 * Automatically resets pagination when filters change.
 * 
 * @param {Object} filters - Filter options
 * @param {string} [filters.search] - Search query
 * @param {string} [filters.category] - Category filter
 * @param {string} [filters.brand] - Brand filter
 * @param {number} [filters.minPrice] - Minimum price
 * @param {number} [filters.maxPrice] - Maximum price
 * @param {boolean} [filters.inStock] - In stock only filter
 * @param {string} [filters.sortBy] - Sort option (name, price-low, price-high, newest, popular)
 * @param {number} page - Current page number (1-indexed)
 * @returns {{ 
 *   products: Object[], 
 *   loading: boolean, 
 *   error: string|null, 
 *   pagination: Object,
 *   hasMore: boolean 
 * }}
 * 
 * @example
 * const { products, loading, pagination, hasMore } = useProductList(
 *   { category: 'Diagnostics', inStock: true, sortBy: 'price-low' },
 *   1
 * );
 */
export function useProductList(filters, page) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
    count: 0
  });

  // Serialize the filters object for the dependency array: parents routinely
  // pass inline object literals whose identity changes every render, which
  // previously retriggered the fetch effect (and wiped accumulated pages).
  const filtersKey = JSON.stringify(filters);

  const fetchProducts = useCallback(async (signal) => {
    const activeFilters = JSON.parse(filtersKey);
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (activeFilters.search) params.set('search', activeFilters.search);
      if (activeFilters.category) params.set('category', activeFilters.category);
      if (activeFilters.brand) params.set('brand', activeFilters.brand);
      if (activeFilters.minPrice) params.set('minPrice', activeFilters.minPrice);
      if (activeFilters.maxPrice) params.set('maxPrice', activeFilters.maxPrice);
      if (activeFilters.inStock) params.set('inStock', 'true');
      if (activeFilters.sortBy) params.set('sort', activeFilters.sortBy);
      params.set('page', page);
      params.set('limit', 20);

      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_URL}/products?${params.toString()}`,
        { signal }
      );
      
      if (!res.ok) throw new Error('Failed to fetch products');
      
      const data = await res.json();
      const productsData = data.products || data.data?.products || data.data || [];
      
      // Infinite scroll: ACCUMULATE pages (the docblock always promised this,
      // but the old code replaced the array, so page 2 wiped page 1).
      setProducts(prev => {
        const fresh = Array.isArray(productsData) ? productsData : [];
        return page > 1 ? [...prev, ...fresh] : fresh;
      });
      
      // Store pagination metadata
      const paginationData = data.pagination || {};
      setPagination({
        total: data.total || paginationData.total || 0,
        page: data.page || paginationData.page || page,
        pages: data.pages || paginationData.pages || 0,
        count: data.count || productsData.length || 0
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to load products');
      // Keep already-loaded pages on a page>1 failure; only reset on page 1.
      if (page <= 1) {
        setProducts([]);
        setPagination({ total: 0, page: 1, pages: 0, count: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [filtersKey, page]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => fetchProducts(controller.signal));
    return () => controller.abort();
  }, [fetchProducts]);

  const hasMore = pagination.page < pagination.pages;

  return { products, loading, error, pagination, hasMore };
}
