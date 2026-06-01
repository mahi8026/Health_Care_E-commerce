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
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        
        if (!res.ok) throw new Error('Failed to fetch categories');
        
        const data = await res.json();
        const categoriesData = data.categories || data.data?.categories || data.data || [];
        
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        setError(err.message || 'Failed to load categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
