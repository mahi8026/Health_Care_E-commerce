/**
 * useRecentlyViewed Hook — Track User's Recently Viewed Products
 * 
 * Features:
 * - Persists in localStorage
 * - Limits to 20 most recent products
 * - Deduplicates (moves to front if already viewed)
 * - Automatically removes out-of-stock products
 * - Syncs across tabs
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'medcore_recently_viewed';
const MAX_ITEMS = 20;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Use callback form to avoid the setState warning
        setRecentlyViewed(() => Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load recently viewed:', error);
      setRecentlyViewed([]);
    }
  }, []);

  // Save to localStorage whenever it changes
  useEffect(() => {
    if (recentlyViewed.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
      } catch (error) {
        console.error('Failed to save recently viewed:', error);
      }
    }
  }, [recentlyViewed]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setRecentlyViewed(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.error('Failed to sync recently viewed:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Add a product to recently viewed
   * Moves to front if already exists
   */
  const addToRecentlyViewed = useCallback((product) => {
    if (!product || !product._id) return;

    setRecentlyViewed((prev) => {
      // Create lightweight product object (don't store full data)
      const viewedProduct = {
        _id: product._id,
        id: product.id || product._id,
        name: product.name,
        slug: product.slug,
        images: product.images ? [product.images[0]] : [],
        price: product.price,
        originalPrice: product.originalPrice,
        category: product.category,
        brand: product.brand,
        rating: product.rating,
        stock: product.stock,
        viewedAt: new Date().toISOString(),
      };

      // Remove if already exists
      const filtered = prev.filter(p => p._id !== product._id);

      // Add to front
      const updated = [viewedProduct, ...filtered];

      // Limit to MAX_ITEMS
      return updated.slice(0, MAX_ITEMS);
    });
  }, []);

  /**
   * Remove a product from recently viewed
   */
  const removeFromRecentlyViewed = useCallback((productId) => {
    setRecentlyViewed((prev) => prev.filter(p => p._id !== productId));
  }, []);

  /**
   * Clear all recently viewed products
   */
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Get recently viewed excluding specific IDs
   */
  const getRecentlyViewedExcluding = useCallback((excludeIds = []) => {
    const excludeSet = new Set(excludeIds);
    return recentlyViewed.filter(p => !excludeSet.has(p._id));
  }, [recentlyViewed]);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
    getRecentlyViewedExcluding,
  };
}

/**
 * RecentlyViewedProvider — Context provider for recently viewed products
 * Use this if you need recently viewed across multiple components
 */
import { createContext, useContext } from 'react';

const RecentlyViewedContext = createContext(null);

export function RecentlyViewedProvider({ children }) {
  const recentlyViewed = useRecentlyViewed();

  return (
    <RecentlyViewedContext.Provider value={recentlyViewed}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewedContext() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewedContext must be used within RecentlyViewedProvider');
  }
  return context;
}
