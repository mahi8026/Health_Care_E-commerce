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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const { products, loading, pagination } = useProducts(productFilters);

  const handleSearch = useCallback(({ query, category }) => {
    setSearchQuery(query);
    setSearchCategory(category);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
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

  // Count active filters for badge
  const activeFilterCount = [
    filters.minPrice, filters.maxPrice, filters.inStock
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-page">
      {/* Mobile Sticky Search Bar */}
      <div className="md:static md:bg-transparent sticky top-0 z-10 bg-white border-b md:border-b-0 border-[var(--color-border-tertiary)]">
        <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
      </div>

      <Breadcrumb items={breadcrumbs} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">

        {/* Mobile filter toggle bar */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg text-[13px] font-medium bg-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-[#0E8A6E] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <SortOptions sortBy={sortBy} onSortChange={handleSortChange} />
        </div>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-tertiary)] sticky top-0 bg-white z-10">
                <span className="text-[15px] font-semibold">Filters</span>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-[var(--color-text-secondary)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <SearchFilters
                  onFilterChange={(f) => { handleFilterChange(f); setMobileFiltersOpen(false); }}
                  activeFilters={filters}
                />
              </div>
            </div>
          </div>
        )}

        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-6">
          {/* Desktop Filters */}
          <div className="hidden md:block">
            <SearchFilters onFilterChange={handleFilterChange} activeFilters={filters} />
          </div>

          <div>
            <div className="hidden md:flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold font-[family-name:var(--font-lora)]">
                Search Results
              </h2>
              <SortOptions sortBy={sortBy} onSortChange={handleSortChange} />
            </div>
            <h2 className="md:hidden text-[16px] font-semibold font-[family-name:var(--font-lora)] mb-3">
              Search Results
            </h2>

            <SearchResults
              products={products}
              loading={loading}
              query={debouncedQuery}
              onProductClick={onProductClick}
              totalResults={pagination?.total}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
