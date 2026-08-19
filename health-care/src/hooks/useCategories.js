"use client";

import { useState, useEffect } from 'react';

/**
 * Fetches and manages category list.
 * 
 * @returns {{ 
 *   categories: Object[], 
 *   loading: boolean, 
 *   error: string|null 
 * }}
 * 
 * @example
 * const { categories, loading, error } = useCategories();
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * return <CategoryList categories={categories} />;
 */
export function useCategories(initialData = null) {
  const [categories, setCategories] = useState(
    Array.isArray(initialData) && initialData.length > 0 ? initialData : []
  );
  const [loading, setLoading] = useState(
    !(Array.isArray(initialData) && initialData.length > 0)
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    if (Array.isArray(initialData) && initialData.length > 0) return;
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
          signal: controller.signal,
        });
        
        if (!res.ok) throw new Error('Failed to fetch categories');
        
        const data = await res.json();
        const categoriesData = data.categories || data.data?.categories || data.data || [];
        
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { categories, loading, error };
}
