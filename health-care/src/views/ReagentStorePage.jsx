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
import { FaSnowflake, FaTruck, FaCertificate, FaFlask, FaMicroscope, FaVial, FaTint } from 'react-icons/fa';

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

const REAGENT_CATEGORIES = [
  { name: 'Clinical Chemistry', icon: <FaFlask />, color: 'from-blue-500 to-cyan-500', count: '200+' },
  { name: 'Hematology', icon: <FaTint />, color: 'from-red-500 to-pink-500', count: '150+' },
  { name: 'Immunoassay', icon: <FaMicroscope />, color: 'from-purple-500 to-indigo-500', count: '180+' },
  { name: 'Molecular Biology', icon: <FaVial />, color: 'from-green-500 to-teal-500', count: '120+' },
];

const FEATURES = [
  { icon: <FaSnowflake />, title: 'Cold-Chain Delivery', desc: 'Temperature-controlled logistics from warehouse to your lab' },
  { icon: <FaTruck />, title: 'Express Shipping', desc: 'Next-day delivery for Dhaka metro, 2-3 days nationwide' },
  { icon: <FaCertificate />, title: 'Quality Assured', desc: 'ISO 13485 certified products with batch tracking' },
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
      // Try multiple category variations to handle database inconsistencies
      const categoryVariations = [
        'Laboratory Reagents',
        'Lab Reagents',
        'Reagents',
        'Laboratory',
        'Lab Equipment'
      ];

      let params = new URLSearchParams({
        limit: '24',
      });

      // First, try to fetch all products and filter client-side if needed
      // This is a fallback strategy if exact category match fails
      if (!searchQuery && !filters.brands?.length && filters.priceRange >= 50000) {
        // Initial load - try category search first
        params.set('category', 'Laboratory Reagents');
      } else {
        // User has filters - don't restrict by category too much
        // Remove the strict category filter to show all reagent-related products
      }

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
      let list = data.data?.products ?? data.products ?? [];
      
      // Filter results client-side for reagent-related keywords if we got generic results
      if (Array.isArray(list) && list.length > 0 && !debouncedSearch.trim()) {
        const reagentKeywords = ['reagent', 'kit', 'assay', 'antibody', 'buffer', 'solution', 'test', 'chemistry', 'hematology', 'immunoassay', 'molecular'];
        list = list.filter(product => {
          const searchText = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
          return reagentKeywords.some(keyword => searchText.includes(keyword));
        });
      }

      setReagents(Array.isArray(list) ? list : []);
      setTotal(data.data?.total ?? data.total ?? list.length);
    } catch (err) {
      if (err.name !== 'AbortError') setFetchError(true);
      setReagents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, sortBy, searchQuery]);

  useEffect(() => {
    fetchReagents();
  }, [fetchReagents]);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Reagent Store' },
  ];

  return (
    <ReagentErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] via-white to-[#F0F9FF]">
        {/* Enhanced Hero Section */}
        <div className="bg-gradient-to-r from-[#0B2545] via-[#0E3A5C] to-[#0B2545] text-white relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#0E8A6E] to-transparent rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-400 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
            <Breadcrumb items={breadcrumbs} variant="embedded" className="mb-4 opacity-80" />
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="animate-slide-up">
                <h1 className="text-[32px] md:text-[42px] font-bold mb-3 font-[family-name:var(--font-lora)] leading-tight">
                  Laboratory Reagents Store
                </h1>
                <p className="text-[15px] text-cyan-100 mb-6 leading-relaxed max-w-xl">
                  Premium laboratory reagents and diagnostic kits with temperature-controlled cold-chain delivery across Bangladesh. ISO 13485 certified products from global manufacturers.
                </p>
                
                {/* Storage legend with icons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {STORAGE_LEGEND.map(({ label, icon, className }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-lg border ${className} backdrop-blur-sm`}
                    >
                      <span className="text-[14px]">{icon}</span>
                      {label}
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {FEATURES.map(({ icon, title, desc }) => (
                    <div key={title} className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                      <div className="text-[20px] text-cyan-300 mb-2">{icon}</div>
                      <div className="text-[12px] font-semibold mb-1">{title}</div>
                      <div className="text-[10px] text-cyan-200 opacity-80 leading-relaxed">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reagent category cards */}
              <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {REAGENT_CATEGORIES.map(({ name, icon, color, count }) => (
                  <div
                    key={name}
                    className="group bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl"
                    onClick={() => setSearchQuery(name)}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-[20px] mb-3 group-hover:scale-110 transition-transform`}>
                      {icon}
                    </div>
                    <div className="text-[13px] font-semibold mb-1">{name}</div>
                    <div className="text-[11px] text-cyan-200">{count} Products</div>
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
                <p className="text-[16px] font-semibold text-[#0B2545] mb-2">No reagents found</p>
                <p className="text-[13px] text-[#6B7280] mb-6 max-w-md">
                  We couldn&apos;t find any reagents matching your criteria. Try adjusting your filters or search terms.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setFilters({ brands: [], categories: [], temperature: [], hazards: [], priceRange: 50000 }); setSearchQuery(''); }}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-[#0B2545] rounded-xl text-[13px] font-semibold hover:shadow-md transition-all"
                  >
                    Clear Filters
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
