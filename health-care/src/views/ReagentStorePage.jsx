"use client";

import { useState, useEffect, useCallback, Component } from 'react';
import { useRouter } from 'next/navigation';
import ReagentFilters from '@/components/reagent/ReagentFilters';
import ReagentToolbar from '@/components/reagent/ReagentToolbar';
import ReagentGrid from '@/components/reagent/ReagentGrid';
import Pagination from '@/components/ui/Pagination';
import Spinner, { ProductCardSkeleton } from '@/components/ui/Spinner';
import { useDebounce } from '@/hooks/useDebounce';
import { API as API_BASE } from '@/constants/api';
import { FaSnowflake, FaTint } from 'react-icons/fa';

class ReagentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center bg-page">
          <div className="text-5xl mb-4">🧪</div>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Reagent Store Unavailable</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-md">
            We couldn&apos;t load the reagent catalog right now. Please try again.
          </p>
          <button
            type="button"
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-6 py-2.5 bg-brand-teal text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-brand-teal-hover)] transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const STORAGE_LEGEND = [
  { label: 'Cold 2–8°C', icon: <FaSnowflake />, className: 'bg-gradient-to-br from-[#E6F1FB] to-[#D0E7F8] text-[var(--color-status-info)] border-[#B8D9F3]' },
  { label: 'Frozen −20°C', icon: <FaSnowflake />, className: 'bg-gradient-to-br from-[#EEEDFE] to-[#DDD9FE] text-[#3C3489] border-[#C5C0F5]' },
  { label: 'Room temp', icon: <FaTint />, className: 'bg-gradient-to-br from-brand-teal-tint to-[#C8EBDD] text-[var(--color-status-success)] border-[#B0E1CE]' },
];

export default function ReagentStorePage({ onNavigateToProduct }) {
  const router = useRouter();
  const handleProductClick =
    onNavigateToProduct ?? ((id) => router.push(`/products/${id}`));

  const [reagents, setReagents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filters, setFilters] = useState({
    brands: [],
    categories: [],
    temperature: [],
    hazards: [],
    priceRange: 50000,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 400);

  // Reset to page 1 whenever filters, search or sort change
  const handleFiltersChange = (f) => {
    setFilters(f);
    setPage(1);
  };
  const handleSearchChange = (q) => {
    setSearchQuery(q);
    setPage(1);
  };
  const handleSortChange = (s) => {
    setSortBy(s);
    setPage(1);
  };

  const fetchReagents = useCallback(async (signal) => {
    setLoading(true);
    setFetchError(false);
    try {
      let params = new URLSearchParams({
        limit: '48', // Show more products
      });

      params.set('page', String(page));

      // Default filter: Show only "Laboratory Reagents" category products
      // This filter is overridden if user selects different categories or searches
      if (!filters.categories?.length && !debouncedSearch.trim()) {
        params.set('category', 'Laboratory Reagents');
      }

      // Add search filter if user is searching
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }

      // Add brand filter
      if (filters.brands?.length) {
        params.set('brand', filters.brands.join(','));
      }

      // Add price filter
      if (filters.priceRange && filters.priceRange < 50000) {
        params.set('maxPrice', String(filters.priceRange));
      }

      // Add category filter if user selected specific categories
      if (filters.categories?.length) {
        params.set('category', filters.categories.join(','));
      }

      // Add sorting
      if (sortBy === 'price-low') {
        params.set('sortBy', 'price');
        params.set('order', 'asc');
      } else if (sortBy === 'price-high') {
        params.set('sortBy', 'price');
        params.set('order', 'desc');
      } else if (sortBy === 'brand') {
        params.set('sortBy', 'name');
        params.set('order', 'asc');
      }

      const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
        signal,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      // Handle multiple response formats from backend
      let list = [];
      if (data.data?.products) {
        list = data.data.products;
      } else if (data.products) {
        list = data.products;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      } else if (Array.isArray(data)) {
        list = data;
      }

      setReagents(Array.isArray(list) ? list : []);
      const pagination = data.pagination;
      setTotal(pagination?.total ?? data.data?.total ?? data.total ?? (Array.isArray(list) ? list.length : 0));
      setTotalPages(pagination?.totalPages ?? Math.ceil((pagination?.total ?? list.length) / 48));
    } catch (err) {
      if (err.name !== 'AbortError') {
        if (process.env.NODE_ENV === 'development') console.error('Fetch reagents error:', err);
        setFetchError(true);
      }
      setReagents([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, sortBy, page]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    Promise.resolve().then(() => fetchReagents(controller.signal));
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchReagents]);

  return (
    <ReagentErrorBoundary>
      <div className="min-h-screen bg-[var(--color-background-secondary)]">
        {/* Compact Header */}
        <div className="bg-white border-b border-[var(--color-border-primary)]">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-1">
                  Laboratory Reagents
                </h1>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Premium reagents and diagnostic kits with temperature-controlled delivery
                </p>
              </div>
              
              {/* Storage legend - compact inline */}
              <div className="flex flex-wrap gap-2">
                {STORAGE_LEGEND.map(({ label, icon, className }) => (
                  <div key={label} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${className}`}>
                    <span className="text-xs">{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto flex">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0">
            <div className="sticky top-[62px] max-h-[calc(100vh-78px)] overflow-y-auto">
              <ReagentFilters filters={filters} setFilters={handleFiltersChange} />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-modal lg:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMobileFiltersOpen(false); }} onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white overflow-y-auto shadow-lg animate-slide-in-left">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-tertiary)] sticky top-0 bg-white z-10">
                  <span className="text-base font-semibold text-brand-navy">Filters</span>
                  <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="p-1 text-[var(--color-text-secondary)] hover:text-brand-navy transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <ReagentFilters filters={filters} setFilters={(f) => { handleFiltersChange(f); setMobileFiltersOpen(false); }} />
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0 px-4 md:px-6 py-6">
            {/* Mobile filter toggle */}
            <div className="flex items-center gap-3 mb-4 lg:hidden">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-sm font-medium bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                Filters
                {(filters.brands?.length > 0 || filters.temperature?.length > 0 || filters.hazards?.length > 0 || filters.priceRange < 50000) && (
                  <span className="w-5 h-5 bg-gradient-to-br from-brand-teal to-[var(--color-brand-teal-hover)] text-white rounded-full text-xs flex items-center justify-center font-semibold shadow-sm">
                    {[filters.brands?.length, filters.temperature?.length, filters.hazards?.length, filters.priceRange < 50000 ? 1 : 0].reduce((a, b) => a + (b || 0), 0)}
                  </span>
                )}
              </button>
            </div>

            <ReagentToolbar
              searchQuery={searchQuery}
              setSearchQuery={handleSearchChange}
              sortBy={sortBy}
              setSortBy={handleSortChange}
              totalCount={total}
              loading={loading}
            />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-status-danger-tint)] to-[var(--color-status-danger-tint)] rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <p className="text-base font-semibold text-brand-navy mb-1">Could not load products</p>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4 max-w-sm">Check your connection and try again.</p>
                <button
                  type="button"
                  onClick={fetchReagents}
                  className="px-6 py-2.5 bg-gradient-to-r from-brand-teal to-[var(--color-brand-teal-hover)] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                >
                  Retry
                </button>
              </div>
            ) : reagents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">🔬</span>
                </div>
                <p className="text-base font-semibold text-brand-navy mb-2">No laboratory reagents found</p>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-md">
                  {debouncedSearch 
                    ? 'No reagents match your search. Try different keywords or clear your search.' 
                    : filters.brands?.length || filters.categories?.length || filters.priceRange < 50000
                      ? 'No reagents match your current filters. Try adjusting or clearing them.'
                      : 'No products are currently categorized as Laboratory Reagents. Please check back later or contact support to add reagent products.'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setFilters({ brands: [], categories: [], temperature: [], hazards: [], priceRange: 50000 }); setSearchQuery(''); setPage(1); }}
                    className="px-5 py-2.5 bg-white border border-[var(--color-border-primary)] text-brand-navy rounded-xl text-sm font-semibold hover:shadow-md transition-all"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => router.push('/products')}
                    className="px-5 py-2.5 bg-gradient-to-r from-brand-teal to-[var(--color-brand-teal-hover)] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Browse All Products
                  </button>
                </div>
              </div>
            ) : (
              <>
                <ReagentGrid reagents={reagents} onProductClick={handleProductClick} />
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={(p) => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
      `}</style>
    </ReagentErrorBoundary>
  );
}
