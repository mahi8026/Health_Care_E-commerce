"use client";

import { useState, useEffect, useRef } from 'react';
import { API as API_BASE } from '@/constants/api';
import GA4Tracker from '@/services/GA4Tracker';

/**
 * Fetches product data by ID or slug and returns normalized product details.
 * 
 * Handles data normalization for:
 * - Rating objects (converts to average + count)
 * - Brand objects (extracts name and ID)
 * - Category objects (extracts name and ID)
 * - Specifications cleanup (removes MongoDB operators)
 * 
 * Automatically tracks product views with GA4.
 * 
 * @param {string} productId - MongoDB ObjectId or URL slug
 * @returns {{ product: Object|null, loading: boolean, error: string|null }}
 * 
 * @example
 * const { product, loading, error } = useProductDetail('siemens-ecg-pro-12');
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * return <ProductDisplay product={product} />;
 */
export function useProductDetail(productId) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Guard against double-fetch in React 18 strict mode
    if (fetchedRef.current) return;
    
    if (!productId) {
      setError('No product selected.');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`${API_BASE}/products/${productId}`);
        if (!res.ok) throw new Error('Product not found');
        
        const data = await res.json();
        const p = data.data || data.product || data;

        // Normalize rating object
        if (p.rating && typeof p.rating === 'object') {
          p.reviewCount = p.reviewCount || p.rating.count || 0;
          p.rating = p.rating.average || 0;
        }

        // Normalize brand object
        if (p.brand && typeof p.brand === 'object') {
          p.brandId = p.brand._id;
          p.brandName = p.brand.name;
          p.brand = p.brand.name;
        }

        // Normalize category object
        if (p.category && typeof p.category === 'object') {
          p.categoryId = p.category._id;
          p.categoryName = p.category.name;
        }

        // Clean specifications (remove MongoDB operators)
        if (p.specifications && typeof p.specifications === 'object') {
          const cleanSpecs = {};
          for (const [k, v] of Object.entries(p.specifications)) {
            if (typeof k === 'string' && !k.startsWith('$') && typeof v !== 'object') {
              cleanSpecs[k] = String(v);
            }
          }
          p.specifications = cleanSpecs;
        }

        setProduct(p);
        
        // Track product view in GA4
        GA4Tracker.trackViewItem(p);
        
        fetchedRef.current = true;
      } catch (err) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
}
