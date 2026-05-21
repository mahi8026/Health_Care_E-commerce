"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import SearchBar from '@/components/search/SearchBar';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResults from '@/components/search/SearchResults';
import SortOptions from '@/components/search/SortOptions';
import Breadcrumb from '@/components/ui/Breadcrumb';

const DEBOUNCE_MS = 400;

export default function SearchPage({ onProductClick }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL query params so filters persist on back navigation
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
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search input — 400ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to page 1 when query changes
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (searchCategory) params.set('category', searchCategory);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.inStock) params.set('inStock', 'true');
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debouncedQuery, searchCategory, filters, sortBy, router]);

  const productFilters = useMemo(() => ({
    search: debouncedQuery,
    category: searchCategory || filters.categories?.[0] || '',
    brands: filters.brands,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStock: filters.inStock,
    sortBy,
    page
  }), [debouncedQuery, searchCategory, filters, sortBy, page]);

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
    { label: 'Search', href: '#' }
  ];

  return (
    <div className="min-h-screen bg-page">
      {/* Mobile Sticky Search Bar */}
      <div className="md:static md:bg-transparent sticky top-0 z-10 bg-white border-b md:border-b-0 border-[var(--color-border-tertiary)]">
        <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
      </div>

      <Breadcrumb items={breadcrumbs} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-6">
          {/* Desktop Filters */}
          <div className="hidden md:block">
            <SearchFilters
              onFilterChange={handleFilterChange}
              activeFilters={filters}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold font-[family-name:var(--font-lora)]">
                Search Results
              </h2>
              <SortOptions sortBy={sortBy} onSortChange={handleSortChange} />
            </div>

            <SearchResults
              products={products}
              loading={loading}
              query={debouncedQuery}
              onProductClick={onProductClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
