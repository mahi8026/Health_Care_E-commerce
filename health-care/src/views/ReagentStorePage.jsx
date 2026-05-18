"use client";

import { useState, useEffect, useCallback, Component } from 'react';
import ReagentFilters from '@/components/reagent/ReagentFilters';
import ReagentToolbar from '@/components/reagent/ReagentToolbar';
import ReagentGrid from '@/components/reagent/ReagentGrid';
import LotSearch from '@/components/reagent/LotSearch';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';
import { API as API_BASE } from '@/constants/api';

// ── Error boundary catches any render-time crash in child components ──────────
class ReagentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="text-5xl mb-4">🧪</div>
          <h2 className="text-[18px] font-bold text-[#0B2545] mb-2">
            Reagent Store Unavailable
          </h2>
          <p className="text-[13px] text-[#6B7280] mb-6 max-w-md">
            We couldn&apos;t load the reagent catalog right now. This is usually a temporary issue.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReagentStorePage({ onNavigateToProduct }) {
  const [reagents, setReagents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filters, setFilters]       = useState({
    brands: [],
    categories: [],
    temperature: [],
    hazards: [],
    priceRange: 50000,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy]           = useState('relevance');
  const [total, setTotal]             = useState(0);

  const fetchReagents = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({
        category: 'Laboratory Reagents',
        limit: '24',
      });

      if (filters.brands?.length)      params.set('brand', filters.brands[0]);
      if (filters.priceRange < 50000)  params.set('maxPrice', String(filters.priceRange));
      if (searchQuery.trim())          params.set('search', searchQuery.trim());

      if (sortBy === 'price-low')       params.set('sortBy', 'price-low');
      else if (sortBy === 'price-high') params.set('sortBy', 'price-high');
      else if (sortBy === 'brand')      params.set('sortBy', 'name');

      const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
        signal: AbortSignal.timeout(10000), // 10 s timeout
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = data.data?.products ?? data.products ?? [];
      setReagents(Array.isArray(list) ? list : []);
      setTotal(data.data?.total ?? data.total ?? list.length);
    } catch (err) {
      // AbortError = timeout, TypeError = network down — show error state, don't crash
      if (err.name !== 'AbortError') {
        setFetchError(true);
      }
      setReagents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortBy]);

  useEffect(() => {
    fetchReagents();
  }, [fetchReagents]);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Reagent Store', href: '#' },
  ];

  return (
    <ReagentErrorBoundary>
      <div className="min-h-screen bg-white">
        <Breadcrumb items={breadcrumbs} />

        {/* Info Bar */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex gap-3 items-center flex-wrap">
          <div>
            <span className="text-[13px] font-semibold text-[#0B2545]">
              Reagents &amp; Diagnostic Kits
            </span>
            <span className="text-[11px] text-[#6B7280] ml-2">
              {loading ? 'Loading…' : `${total.toLocaleString()} products`}
              {' · '}Cold chain available
            </span>
          </div>
          <div className="flex gap-1.5 ml-auto flex-wrap">
            {[
              { label: '❄ Cold (2–8°C)',  bg: '#E6F1FB', text: '#0C447C' },
              { label: '🧊 Frozen (−20°C)', bg: '#EEEDFE', text: '#3C3489' },
              { label: '🌡 Room temp',     bg: '#E1F5EE', text: '#085041' },
              { label: '⚠ Biohazard',     bg: '#FCEBEB', text: '#791F1F' },
              { label: '⚠ Chemical',      bg: '#FAEEDA', text: '#633806' },
              { label: '✓ Safe',          bg: '#E1F5EE', text: '#085041' },
            ].map(({ label, bg, text }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-[2px] rounded font-medium"
                style={{ backgroundColor: bg, color: text }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="flex">
          {/* Sidebar — hidden on mobile */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0 border-r border-gray-100 min-h-screen">
            <ReagentFilters filters={filters} setFilters={setFilters} />
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 p-4 md:p-5">
            <LotSearch />

            <ReagentToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              totalCount={total}
            />

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-[14px] font-semibold text-[#0B2545] mb-1">
                  Could not load products
                </p>
                <p className="text-[12px] text-[#6B7280] mb-4">
                  The server may be temporarily unavailable. Please try again.
                </p>
                <button
                  onClick={fetchReagents}
                  className="px-5 py-2 bg-[#0E8A6E] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0c7a61] transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : reagents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-4xl mb-3">🔬</div>
                <p className="text-[14px] font-semibold text-[#0B2545] mb-1">
                  No reagents found
                </p>
                <p className="text-[12px] text-[#6B7280]">
                  Try adjusting your filters or search query.
                </p>
              </div>
            ) : (
              <ReagentGrid
                reagents={reagents}
                onProductClick={onNavigateToProduct}
              />
            )}
          </main>
        </div>
      </div>
    </ReagentErrorBoundary>
  );
}
