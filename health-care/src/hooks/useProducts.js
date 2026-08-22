"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/utils/api';

/**
 * Fetch and manage a paginated, filterable product listing.
 *
 * Supports both offset-based pagination (page/limit) and cursor-based pagination (lastId).
 * Caches the last filter-set to avoid redundant fetches, and
 * accepts optional `initialData` for SSR-hydrated pages.
 *
 * @param {Object}   [filters={}]      - Query params (category, brand, search, page, limit, sortBy, lastId, …)
 * @param {Object[]} [initialData=null] - Pre-fetched products from the server component
 * @param {Object}   [initialPagination=null] - Pagination metadata from the server component
 * @param {Object}   [initialFilters=null] - The exact filters used to fetch initialData; first fetch is skipped when it matches
 * @returns {{ products: Object[], loading: boolean, error: string|null, pagination: Object, refetch: () => Promise<void> }}
 *
 * @example
 * // Offset-based pagination
 * const { products, loading, pagination } = useProducts({ category: 'Diagnostics', page: 1 });
 * 
 * @example
 * // Cursor-based pagination
 * const { products, loading, pagination } = useProducts({ category: 'Diagnostics', lastId: '507f1f77bcf86cd799439011' });
 */
export function useProducts(filters = {}, initialData = null, initialPagination = null, initialFilters = null) {
  const [products, setProducts] = useState(
    Array.isArray(initialData) && initialData.length > 0 ? initialData : []
  );
  const [loading, setLoading] = useState(
    !(Array.isArray(initialData) && initialData.length > 0)
  );
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(initialPagination || {
    total: 0,
    page: 1,
    pages: 0,
    count: 0
  });
  const filtersRef = useRef('');
  const isMountedRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProducts(filters);
      
      // Handle different response structures
      const productsData = response.products || response.data?.products || response.data || [];
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      
      // Store pagination metadata (supports both offset and cursor-based)
      const paginationData = response.pagination || {};
      
      // Cursor-based pagination metadata
      if (paginationData.lastId !== undefined) {
        setPagination({
          hasMore: paginationData.hasMore || false,
          lastId: paginationData.lastId || null,
          limit: paginationData.limit || filters.limit || 20,
          count: response.count || productsData.length || 0
        });
      } else {
        // Offset-based pagination metadata (legacy)
        setPagination({
          total: response.total || paginationData.total || 0,
          page: response.page || paginationData.page || filters.page || 1,
          pages: response.pages || paginationData.pages || paginationData.totalPages || 0,
          count: response.count || productsData.length || 0
        });
      }
    } catch (err) {
      // Provide more specific error messages
      let errorMessage = 'Failed to load products';
      if (err.status === 0) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (err.status === 404) {
        errorMessage = 'Products not found.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setProducts([]);
      setPagination({ total: 0, page: 1, pages: 0, count: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const currentFilters = JSON.stringify(filters);

    // Skip first fetch when server already provided data for these exact filters
    if (!isMountedRef.current && Array.isArray(initialData) && initialData.length > 0 && (
      initialFilters === null || JSON.stringify(filters) === JSON.stringify(initialFilters)
    )) {
      isMountedRef.current = true;
      return;
    }

    // Only fetch if filters actually changed
    if (currentFilters !== filtersRef.current) {
      filtersRef.current = currentFilters;
      isMountedRef.current = true;
      fetchProducts();
    }
  // FIX-013: Only depend on fetchProducts (which already captures filters via
  // useCallback). Putting JSON.stringify(filters) in the dep array was
  // computing a new string on every render and causing unnecessary re-runs.
  }, [fetchProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  return { products, loading, error, pagination, refetch: fetchProducts };
}

/**
 * Fetch a single product by ID or slug.
 *
 * Only fetches once on mount (guarded by a ref) to avoid
 * double-fetching in React 18 strict mode.
 *
 * @param {string} productId - MongoDB ObjectId or URL slug
 * @returns {{ product: Object|null, loading: boolean, error: string|null, refetch: () => Promise<void> }}
 *
 * @example
 * const { product, loading } = useProduct('siemens-ecg-pro-12');
 */
export function useProduct(productId) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.getProduct(productId);
      
      const productData = response.product || response.data?.product || response.data || response;
      
      setProduct(productData);
    } catch (err) {
      let errorMessage = 'Product not found or failed to load.';
      if (err.status === 0) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (err.status === 404) {
        errorMessage = 'Product not found.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!fetchedRef.current && productId) {
      fetchedRef.current = true;
      fetchProduct();
    }
  }, [productId, fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}
