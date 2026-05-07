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
  const [pagination, setPagination] = useState({
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
      
      // Store pagination metadata
      setPagination({
        total: response.total || response.pagination?.total || 0,
        page: response.page || response.pagination?.page || filters.page || 1,
        pages: response.pages || response.pagination?.pages || 0,
        count: response.count || productsData.length || 0
      });
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

  return { products, loading, error, pagination, refetch: fetchProducts };
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
