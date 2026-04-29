"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/utils/api';

export function useProducts(filters = {}, initialData = null) {
  const [products, setProducts] = useState(
    initialData && initialData.length > 0 ? initialData : []
  );
  const [loading, setLoading] = useState(
    // Only show loading spinner if we have no initial data
    !(initialData && initialData.length > 0)
  );
  const [error, setError] = useState(null);
  const filtersRef = useRef('');
  const isMountedRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProducts(filters);
      setProducts(response.products || response.data?.products || response || []);
    } catch (err) {
      // FIX 9: show error state instead of silently showing fake mock data
      const errorMessage = err.message || 'Failed to load products';
      setError(`Failed to load products. Please check your connection and try again.`);
      setProducts([]);
      console.error('[useProducts] fetch error:', errorMessage);
      console.error('[useProducts] error details:', err);
      console.error('[useProducts] filters:', filters);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const currentFilters = JSON.stringify(filters);

    // Skip first mount if no filters and we already have initial data
    if (!isMountedRef.current && Object.keys(filters).length === 0 && initialData?.length > 0) {
      isMountedRef.current = true;
      return;
    }

    // Only fetch if filters actually changed
    if (currentFilters !== filtersRef.current) {
      filtersRef.current = currentFilters;
      isMountedRef.current = true;
      fetchProducts();
    }
  }, [JSON.stringify(filters), fetchProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  return { products, loading, error, refetch: fetchProducts };
}

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
      setProduct(response.product || response.data || response);
    } catch (err) {
      setError('Product not found or failed to load.');
      console.error('[useProduct] fetch error:', err.message);
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
