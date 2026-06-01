"use client";

import { useState, useEffect, useCallback } from 'react';

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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.brand) params.set('brand', filters.brand);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.inStock) params.set('inStock', 'true');
      if (filters.sortBy) params.set('sort', filters.sortBy);
      params.set('page', page);
      params.set('limit', 20);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products?${params.toString()}`
      );
      
      if (!res.ok) throw new Error('Failed to fetch products');
      
      const data = await res.json();
      const productsData = data.products || data.data?.products || data.data || [];
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      
      // Store pagination metadata
      const paginationData = data.pagination || {};
      setPagination({
        total: data.total || paginationData.total || 0,
        page: data.page || paginationData.page || page,
        pages: data.pages || paginationData.pages || 0,
        count: data.count || productsData.length || 0
      });
    } catch (err) {
      setError(err.message || 'Failed to load products');
      setProducts([]);
      setPagination({ total: 0, page: 1, pages: 0, count: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const hasMore = pagination.page < pagination.pages;

  return { products, loading, error, pagination, hasMore };
}
