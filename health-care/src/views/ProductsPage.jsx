"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import SearchBar from '@/components/search/SearchBar';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResults from '@/components/search/SearchResults';
import SortOptions from '@/components/search/SortOptions';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function ProductsPage({ onProductClick }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL query params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchCategory, setSearchCategory] = useState(searchParams.get('category') || '');
  const [filters, setFilters] = useState(() => {
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    return {
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: searchParams.get('inStock') === 'true'
    };
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name');
  const [page, setPage] = useState(1);

  // Sync state to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchCategory) params.set('category', searchCategory);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.inStock) params.set('inStock', 'true');
    if (sortBy !== 'name') params.set('sort', sortBy);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }, [searchQuery, searchCategory, filters, sortBy, router]);

  const productFilters = useMemo(() => {
    const categoryValue = searchCategory || filters.categories?.[0] || '';
    console.log('[ProductsPage] Building filters:', {
      search: searchQuery,
      category: categoryValue,
      brands: filters.brands,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStock: filters.inStock,
      sortBy,
      page
    });
    
    return {
      search: searchQuery,
      category: categoryValue,
      brands: filters.brands,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStock: filters.inStock,
      sortBy,
      page
    };
  }, [searchQuery, searchCategory, filters, sortBy, page]);

  const { products, loading } = useProducts(productFilters);

  const handleSearch = useCallback(({ query, category }) => {
    setSearchQuery(query);
    setSearchCategory(category);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    // Validate price range
    if (newFilters.minPrice !== undefined && newFilters.maxPrice !== undefined) {
      if (newFilters.minPrice > newFilters.maxPrice) {
        newFilters.maxPrice = newFilters.minPrice;
      }
    }
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setPage(1);
  }, []);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)]">
      <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />

      <Breadcrumb items={breadcrumbs} />

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-[280px_1fr] gap-6">
          <SearchFilters
            onFilterChange={handleFilterChange}
            activeFilters={filters}
          />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-[24px] font-semibold font-[family-name:var(--font-lora)]">
                  All Products
                </h1>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                  Browse our complete catalog of medical equipment and supplies
                </p>
              </div>
              <SortOptions sortBy={sortBy} onSortChange={handleSortChange} />
            </div>

            <SearchResults
              products={products}
              loading={loading}
              query={searchQuery}
              onProductClick={onProductClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
