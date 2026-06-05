"use client";

import { useState, useEffect, useCallback, Component } from 'react';
import { useRouter } from 'next/navigation';
import ReagentFilters from '@/components/reagent/ReagentFilters';
import ReagentToolbar from '@/components/reagent/ReagentToolbar';
import ReagentGrid from '@/components/reagent/ReagentGrid';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';
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
          <h2 className="text-[18px] font-bold text-[#0B2545] mb-2">Reagent Store Unavailable</h2>
          <p className="text-[13px] text-[#6B7280] mb-6 max-w-md">
            We couldn&apos;t load the reagent catalog right now. Please try again.
          </p>
          <button
            type="button"
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-6 py-2.5 bg-[#0E8A6E] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0c7a61] transition-colors"
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
  { label: 'Cold 2–8°C', icon: <FaSnowflake />, className: 'bg-gradient-to-br from-[#E6F1FB] to-[#D0E7F8] text-[#0C447C] border-[#B8D9F3]' },
  { label: 'Frozen −20°C', icon: <FaSnowflake />, className: 'bg-gradient-to-br from-[#EEEDFE] to-[#DDD9FE] text-[#3C3489] border-[#C5C0F5]' },
  { label: 'Room temp', icon: <FaTint />, className: 'bg-gradient-to-br from-[#E1F5EE] to-[#C8EBDD] text-[#085041] border-[#B0E1CE]' },
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const fetchReagents = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      let params = new URLSearchParams({
        limit: '48', // Show more products
      });

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
        signal: AbortSignal.timeout(15000),
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
      setTotal(data.data?.total ?? data.total ?? data.pagination?.total ?? (Array.isArray(list) ? list.length : 0));
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch reagents error:', err);
        setFetchError(true);
      }
      setReagents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, sortBy]);

  useEffect(() => {
    fetchReagents();
  }, [fetchReagents]);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Reagent Store' },
  ];

  return (
    <ReagentErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Compact Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4">
            <Breadcrumb items={breadcrumbs} className="mb-3" />
            
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-[20px] md:text-[24px] font-bold text-[#0B2545] mb-1 font-[family-name:var(--font-lora)]">
                  Laboratory Reagents
                </h1>
                <p className="text-[12px] text-gray-600">
                  Premium reagents and diagnostic kits with temperature-controlled delivery
                </p>
              </div>
              
              {/* Storage legend - compact inline */}
              <div className="flex flex-wrap gap-2">
                {STORAGE_LEGEND.map(({ label, icon, className }) => (
                  <div key={label} className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border ${className}`}>
                    <span className="text-[11px]">{icon}</span>
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
              <ReagentFilters filters={filters} setFilters={setFilters} />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white overflow-y-auto shadow-2xl animate-slide-in-left">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
                  <span className="text-[15px] font-semibold text-[#0B2545]">Filters</span>
                  <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-[#6B7280] hover:text-[#0B2545] transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <ReagentFilters filters={filters} setFilters={(f) => { setFilters(f); setMobileFiltersOpen(false); }} />
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0 px-4 md:px-6 py-6">
            {/* Mobile filter toggle */}
            <div className="flex items-center gap-3 mb-4 lg:hidden">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                Filters
                {(filters.brands?.length > 0 || filters.temperature?.length > 0 || filters.hazards?.length > 0 || filters.priceRange < 50000) && (
                  <span className="w-5 h-5 bg-gradient-to-br from-[#0E8A6E] to-[#0a6b56] text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-sm">
                    {[filters.brands?.length, filters.temperature?.length, filters.hazards?.length, filters.priceRange < 50000 ? 1 : 0].reduce((a, b) => a + (b || 0), 0)}
                  </span>
                )}
              </button>
            </div>

            <ReagentToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              totalCount={total}
              loading={loading}
            />

            {loading ? (
              <div className="flex justify-center py-24">
                <Spinner size="lg" />
              </div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-[28px]">⚠️</span>
                </div>
                <p className="text-[15px] font-semibold text-[#0B2545] mb-1">Could not load products</p>
                <p className="text-[13px] text-[#6B7280] mb-4 max-w-sm">Check your connection and try again.</p>
                <button
                  type="button"
                  onClick={fetchReagents}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#0E8A6E] to-[#0a6b56] text-white rounded-xl text-[13px] font-semibold hover:shadow-lg transition-all"
                >
                  Retry
                </button>
              </div>
            ) : reagents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-[36px]">🔬</span>
                </div>
                <p className="text-[16px] font-semibold text-[#0B2545] mb-2">No laboratory reagents found</p>
                <p className="text-[13px] text-[#6B7280] mb-6 max-w-md">
                  {debouncedSearch 
                    ? 'No reagents match your search. Try different keywords or clear your search.' 
                    : filters.brands?.length || filters.categories?.length || filters.priceRange < 50000
                      ? 'No reagents match your current filters. Try adjusting or clearing them.'
                      : 'No products are currently categorized as Laboratory Reagents. Please check back later or contact support to add reagent products.'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setFilters({ brands: [], categories: [], temperature: [], hazards: [], priceRange: 50000 }); setSearchQuery(''); }}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-[#0B2545] rounded-xl text-[13px] font-semibold hover:shadow-md transition-all"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => router.push('/products')}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#0E8A6E] to-[#0a6b56] text-white rounded-xl text-[13px] font-semibold hover:shadow-lg transition-all"
                  >
                    Browse All Products
                  </button>
                </div>
              </div>
            ) : (
              <ReagentGrid reagents={reagents} onProductClick={handleProductClick} />
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
