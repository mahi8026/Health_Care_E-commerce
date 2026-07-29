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
    const controller = new AbortController();
    
    // Guard against double-fetch in React 18 strict mode
    if (fetchedRef.current) {
      controller.abort();
      return;
    }
    
    if (!productId) {
      Promise.resolve().then(() => {
        setError('No product selected.');
        setLoading(false);
      });
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If the slug contains a slash (legacy slug), pass it as a query param
        // because Express won't match encoded slashes (%2F) in path segments.
        // For normal slugs and MongoDB IDs, use the standard path format.
        let url;
        if (productId.includes('/')) {
          url = `${API_BASE}/products?slug=${encodeURIComponent(productId)}`;
        } else {
          url = `${API_BASE}/products/${productId}`;
        }
        const res = await fetch(url, { signal: controller.signal });
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
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    return () => controller.abort();
  }, [productId]);

  return { product, loading, error };
}
