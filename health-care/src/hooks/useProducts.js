"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/utils/api';

// Mock product data (fallback)
const mockProducts = [
  {
    id: 1,
    sku: 'SIE-ECG-001',
    name: 'Siemens Cardiostat ECG 12-lead',
    brand: 'Siemens Healthineers',
    category: 'Diagnostic Equipment',
    price: 95000,
    oldPrice: 110000,
    stock: 45,
    description: 'Professional 12-lead ECG machine with advanced diagnostic capabilities',
    images: ['📊', '📈', '🩺'],
    variants: {
      connectivity: ['USB', 'LAN', 'USB+LAN'],
      warranty: ['1-year', '2-year', '3-year']
    },
    specifications: {
      'Model': 'Cardiostat ECG-12',
      'Channels': '12-lead',
      'Display': '10.1" touchscreen',
      'Connectivity': 'USB, LAN, WiFi',
      'Battery': '4 hours',
      'Weight': '2.5 kg'
    },
    badge: 'sale',
    rating: 4.8,
    reviews: 124
  },
  {
    id: 2,
    sku: 'ROC-HBA-002',
    name: 'Roche Cobas HbA1c reagent kit',
    brand: 'Roche Diagnostics',
    category: 'Laboratory Reagents',
    price: 8500,
    stock: 8,
    description: 'High-precision HbA1c testing reagent for diabetes monitoring',
    images: ['🧪', '🔬', '💉'],
    temperature: 'cold',
    hazard: 'bio',
    lotNumber: 'LOT-2025-08841',
    expiry: 'Aug 2026',
    tests: '100 tests per kit',
    minOrder: 5,
    badge: 'new',
    rating: 4.9,
    reviews: 89
  },
  {
    id: 3,
    sku: 'ABB-TRO-003',
    name: 'Abbott Troponin I reagent',
    brand: 'Abbott Laboratories',
    category: 'Laboratory Reagents',
    price: 22000,
    stock: 15,
    description: 'Cardiac marker testing reagent for acute myocardial infarction',
    images: ['💉', '🧪', '🔬'],
    temperature: 'cold',
    hazard: 'bio',
    lotNumber: 'LOT-2025-11243',
    expiry: 'Dec 2025',
    tests: '200 tests per pack',
    minOrder: 2,
    rating: 4.7,
    reviews: 56
  }
];

export function useProducts(filters = {}, initialData = null) {
  // Use server-prefetched initial data when available; otherwise fall back to
  // mock products so the UI is never empty on first render.
  const [products, setProducts] = useState(
    initialData && initialData.length > 0 ? initialData : mockProducts
  );
  // If we have real server data, skip the initial loading state.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const filtersRef = useRef('');
  const isMountedRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from API
      const response = await api.getProducts(filters);
      setProducts(response.products || response);
      setError(null);
    } catch (err) {
      // Fallback to mock data when API is unavailable
      let filtered = [...mockProducts];

      // Apply filters
      if (filters.category) {
        filtered = filtered.filter(p => p.category === filters.category);
      }
      if (filters.brand) {
        filtered = filtered.filter(p => p.brand === filters.brand);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.brand.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search)
        );
      }
      if (filters.minPrice) {
        filtered = filtered.filter(p => p.price >= filters.minPrice);
      }
      if (filters.maxPrice) {
        filtered = filtered.filter(p => p.price <= filters.maxPrice);
      }

      // Apply sorting
      if (filters.sortBy === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (filters.sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }

      setProducts(filtered);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - we'll manually control when to fetch

  useEffect(() => {
    const currentFilters = JSON.stringify(filters);
    
    // Skip first mount if no filters
    if (!isMountedRef.current && Object.keys(filters).length === 0) {
      isMountedRef.current = true;
      return;
    }
    
    // Only fetch if filters actually changed
    if (currentFilters !== filtersRef.current) {
      filtersRef.current = currentFilters;
      isMountedRef.current = true;
      
      // Don't fetch if only limit changed and it's the initial load
      if (filters.limit && Object.keys(filters).length === 1) {
        // Just slice the mock data
        setProducts(mockProducts.slice(0, filters.limit));
        return;
      }
      
      fetchProducts();
    }
  }, [JSON.stringify(filters), fetchProducts]);

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
    try {
      // Try to fetch from API
      const response = await api.getProduct(productId);
      setProduct(response.product || response);
      setError(null);
    } catch (err) {
      // Fallback to mock data when API is unavailable
      const found = mockProducts.find(p => p.id === parseInt(productId));
      if (found) {
        setProduct(found);
        setError(null);
      } else {
        setError('Product not found');
      }
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
