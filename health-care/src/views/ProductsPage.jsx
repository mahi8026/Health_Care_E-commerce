"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import SearchBar from '@/components/search/SearchBar';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResults from '@/components/search/SearchResults';
import SortOptions from '@/components/search/SortOptions';
import { FaFilter, FaTimes } from 'react-icons/fa';

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
  const [allProducts, setAllProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  // Lock body scroll when mobile filters open
  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFiltersOpen]);

  const productFilters = useMemo(() => {
    const categoryValue = searchCategory || filters.categories?.[0] || '';
    
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

  const { products, loading, pagination, error } = useProducts(productFilters);

  // Update allProducts when new products are fetched
  useEffect(() => {
    if (products && products.length > 0) {
      if (page === 1) {
        setAllProducts(products);
      } else {
        setAllProducts(prev => {
          const existingIds = new Set(prev.map(p => p._id || p.id));
          const newProducts = products.filter(p => !existingIds.has(p._id || p.id));
          return [...prev, ...newProducts];
        });
      }
      setLoadingMore(false);
      setHasMore(pagination.page < pagination.pages);
    } else if (products && products.length === 0 && page > 1) {
      setHasMore(false);
      setLoadingMore(false);
    }
  }, [products, page, pagination]);

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setPage(prev => prev + 1);
  }, []);

  const handleSearch = useCallback(({ query, category }) => {
    setSearchQuery(query);
    setSearchCategory(category);
    setPage(1);
    setAllProducts([]);
    setHasMore(true);
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
    setAllProducts([]);
    setHasMore(true);
    setMobileFiltersOpen(false);
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setPage(1);
    setAllProducts([]);
    setHasMore(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)]">
      <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-[280px_1fr] gap-6">
          <SearchFilters
            onFilterChange={handleFilterChange}
            activeFilters={filters}
          />

          <div>
            {/* Compact Header Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3 mb-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">
                    All Products
                  </h1>
                  {pagination.total > 0 && (
                    <>
                      <span className="bg-[#0E8A6E] text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {pagination.total}
                      </span>
                      <span className="text-xs text-gray-500">
                        Showing {allProducts.length} of {pagination.total}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Browse our complete catalog of medical equipment and supplies
                </p>
              </div>
              <SortOptions sortBy={sortBy} onSortChange={handleSortChange} />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className="font-semibold">Error Loading Products</div>
                    <div className="text-sm">{error}</div>
                  </div>
                </div>
              </div>
            )}

            <SearchResults
              products={allProducts}
              loading={loading && page === 1}
              query={searchQuery}
              onProductClick={onProductClick}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              loadingMore={loadingMore}
              totalProducts={pagination.total}
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[20px] font-semibold font-[family-name:var(--font-lora)]">
                All Products
              </h1>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">
                {allProducts?.length || 0} products found
              </p>
            </div>
            <SortOptions sortBy={sortBy} onSortChange={handleSortChange} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <div>
                  <div className="font-semibold">Error</div>
                  <div className="text-xs">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Results */}
          <SearchResults
            products={allProducts}
            loading={loading && page === 1}
            query={searchQuery}
            onProductClick={onProductClick}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
            totalProducts={pagination.total}
          />

          {/* Mobile Filter Button - Fixed Bottom Left */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden fixed bottom-20 left-4 z-50 bg-[#0E8A6E] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold text-[14px]"
            style={{
              boxShadow: '0 4px 12px rgba(14, 138, 110, 0.4)',
            }}
          >
            <FaFilter size={14} />
            Filters
          </button>

          {/* Mobile Filter Bottom Sheet */}
          {mobileFiltersOpen && (
            <>
              {/* Backdrop */}
              <div
                onClick={() => setMobileFiltersOpen(false)}
                className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
                style={{ animation: 'fadeIn 0.3s' }}
              />

              {/* Bottom Sheet */}
              <div
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[1000] max-h-[85vh] overflow-y-auto"
                style={{
                  animation: 'slideUp 0.3s ease-out',
                  paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
                }}
              >
                {/* Sheet Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
                  <h2 className="text-[18px] font-semibold">Filters</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>

                {/* Filters Content */}
                <div className="px-4 py-4">
                  <SearchFilters
                    onFilterChange={handleFilterChange}
                    activeFilters={filters}
                  />
                </div>
              </div>

              <style jsx>{`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideUp {
                  from { transform: translateY(100%); }
                  to { transform: translateY(0); }
                }
              `}</style>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
