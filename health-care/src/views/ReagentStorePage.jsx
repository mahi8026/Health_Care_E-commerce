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
            className="px-6 py-2.5 bg-[#0E8A6E] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0c7a61]"
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
  { label: 'Cold 2–8°C', className: 'bg-[#E6F1FB] text-[#0C447C]' },
  { label: 'Frozen −20°C', className: 'bg-[#EEEDFE] text-[#3C3489]' },
  { label: 'Room temp', className: 'bg-[#E1F5EE] text-[#085041]' },
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
      const params = new URLSearchParams({
        category: 'Laboratory Reagents',
        limit: '24',
      });

      if (filters.brands?.length) params.set('brand', filters.brands[0]);
      if (filters.priceRange < 50000) params.set('maxPrice', String(filters.priceRange));
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      // Wire temperature and hazard filters to API
      if (filters.temperature?.length) params.set('temperature', filters.temperature.join(','));
      if (filters.hazards?.length) params.set('hazards', filters.hazards.join(','));

      if (sortBy === 'price-low') params.set('sortBy', 'price-low');
      else if (sortBy === 'price-high') params.set('sortBy', 'price-high');
      else if (sortBy === 'brand') params.set('sortBy', 'name');

      const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = data.data?.products ?? data.products ?? [];
      setReagents(Array.isArray(list) ? list : []);
      setTotal(data.data?.total ?? data.total ?? list.length);
    } catch (err) {
      if (err.name !== 'AbortError') setFetchError(true);
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
      <div className="min-h-screen bg-page">
        {/* Page hero */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-4 pb-5">
            <Breadcrumb items={breadcrumbs} variant="embedded" />
            <div className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-[22px] md:text-[26px] font-semibold text-[#0B2545] font-[family-name:var(--font-lora)]">
                  Reagent Store
                </h1>
                <p className="text-[13px] text-[#6B7280] mt-1 max-w-xl">
                  Laboratory reagents and diagnostic kits with cold-chain handling across Bangladesh.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STORAGE_LEGEND.map(({ label, className }) => (
                  <span
                    key={label}
                    className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${className}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto flex">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[240px] flex-shrink-0">
            <div className="sticky top-[62px] max-h-[calc(100vh-78px)] overflow-y-auto bg-white border-r border-gray-100">
              <ReagentFilters filters={filters} setFilters={setFilters} />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
                  <span className="text-[15px] font-semibold text-[#0B2545]">Filters</span>
                  <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-[#6B7280]">
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
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-medium bg-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                Filters
                {(filters.brands?.length > 0 || filters.temperature?.length > 0 || filters.hazards?.length > 0 || filters.priceRange < 50000) && (
                  <span className="w-5 h-5 bg-[#0E8A6E] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
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
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-gray-100">
                <p className="text-[15px] font-semibold text-[#0B2545] mb-1">Could not load products</p>
                <p className="text-[13px] text-[#6B7280] mb-4">Check your connection and try again.</p>
                <button
                  type="button"
                  onClick={fetchReagents}
                  className="px-5 py-2.5 bg-[#0E8A6E] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0c7a61]"
                >
                  Retry
                </button>
              </div>
            ) : reagents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-gray-100">
                <span className="text-4xl mb-3">🔬</span>
                <p className="text-[15px] font-semibold text-[#0B2545] mb-1">No reagents found</p>
                <p className="text-[13px] text-[#6B7280]">Try different filters or search terms.</p>
              </div>
            ) : (
              <ReagentGrid reagents={reagents} onProductClick={handleProductClick} />
            )}
          </main>
        </div>
      </div>
    </ReagentErrorBoundary>
  );
}
