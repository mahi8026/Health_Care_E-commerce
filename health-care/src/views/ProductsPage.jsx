"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { useT } from '@/hooks/useT';
import SearchResults from '@/components/search/SearchResults';
import { CATEGORY_CONTENT, CATEGORY_SEO } from '@/config/seo';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';

export default function ProductsPage({ onProductClick, initialCategory }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  // initialCategory (from slug route) takes priority over query param
  const [searchCategory, setSearchCategory] = useState(
    initialCategory || searchParams.get('category') || ''
  );

  // Sync URL search params back to state when URL changes (e.g. Header search navigation)
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlBrand = searchParams.get('brand') || '';
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
      setSearchInput(urlQuery);
      setPage(1);
      setAllProducts([]);
      setHasMore(true);
    }
    if (urlCategory !== searchCategory) {
      setSearchCategory(urlCategory);
      setPage(1);
      setAllProducts([]);
      setHasMore(true);
    }
    const currentBrand = filters.brands?.[0] || '';
    if (urlBrand !== currentBrand) {
      setFilters((f) => ({ ...f, brands: urlBrand ? [urlBrand] : [] }));
      setPage(1);
      setAllProducts([]);
      setHasMore(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [filters, setFilters] = useState(() => {
    const brand = searchParams.get('brand');
    return {
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      inStock: searchParams.get('inStock') === 'true',
      brands: brand ? [brand] : [],
    };
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name');
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use custom hooks for data fetching
  const { categories, loading: categoriesLoading } = useCategories();
  const { brands, loading: brandsLoading } = useBrands();

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchCategory) params.set('category', searchCategory);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.brands?.[0]) params.set('brand', filters.brands[0]);
    if (sortBy !== 'name') params.set('sort', sortBy);
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : '/products', { scroll: false });
  }, [searchQuery, searchCategory, filters, sortBy, router]);

  const productFilters = useMemo(() => ({
    search: searchQuery,
    category: searchCategory || filters.categories?.[0] || '',
    brand: filters.brands?.[0] || '',
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStock: filters.inStock,
    sortBy,
    page
  }), [searchQuery, searchCategory, filters, sortBy, page]);

  const { products, loading, pagination, error } = useProducts(productFilters);

  // Update allProducts when products change (pagination handling)
  useEffect(() => {
    if (products && products.length > 0) {
      if (page === 1) {
        // Use functional update to avoid setState in effect warning
        setAllProducts(() => products);
      } else {
        setAllProducts(prev => {
          const existingIds = new Set(prev.map(p => p._id || p.id));
          return [...prev, ...products.filter(p => !existingIds.has(p._id || p.id))];
        });
      }
      setLoadingMore(false);
      setHasMore(pagination.page < pagination.pages);
    } else if (products && products.length === 0) {
      if (page === 1) {
        setAllProducts([]);
      }
      setHasMore(false);
      setLoadingMore(false);
    }
     
  }, [products, page, pagination.page, pagination.pages]);

  const resetPagination = () => { setPage(1); setAllProducts([]); setHasMore(true); };

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    resetPagination();
  }, [searchInput]);

  const handleFilterChange = useCallback((newFilters) => {
    if (newFilters.minPrice !== undefined && newFilters.maxPrice !== undefined) {
      if (newFilters.minPrice > newFilters.maxPrice) newFilters.maxPrice = newFilters.minPrice;
    }
    setFilters(newFilters);
    resetPagination();
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    resetPagination();
  }, []);

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setPage(prev => prev + 1);
  }, []);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSearchInput('');
    setSearchCategory('');
    handleFilterChange({ brands: [] });
  };

  const hasActiveFilters = searchCategory || filters.brands?.length > 0 ||
    filters.minPrice || filters.maxPrice || filters.inStock || searchQuery;

  const SORT_OPTIONS = [
    { value: 'name',       label: t('products.nameAZ') },
    { value: 'price-low',  label: t('products.priceLow') },
    { value: 'price-high', label: t('products.priceHigh') },
    { value: 'newest',     label: t('products.newest') },
    { value: 'popular',    label: t('products.popular') },
  ];

  return (
    <div className="min-h-screen bg-page">

      {/* ── Active filters + category pills bar ─────────────────────────── */}
      {(hasActiveFilters || true) && (
        <div className="bg-[#0B2545] border-b border-[#0d2d52]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0 md:flex-wrap">
              {/* Category quick-filter pills — from API */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {categories.slice(0, 8).map(cat => {
                  const name = typeof cat === 'string' ? cat : cat.name;
                  const slug = CATEGORY_NAME_TO_SLUG[name];
                  return (
                    <button key={name}
                      onClick={() => {
                        if (slug) {
                          // Navigate to slug-based category URL for SEO
                          router.push(`/products/category/${slug}`);
                        } else {
                          setSearchCategory(searchCategory === name ? '' : name);
                          resetPagination();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                        searchCategory === name
                          ? 'bg-[#0E8A6E] text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}>
                      {name}
                    </button>
                  );
                })}
              </div>

              {/* Active filter chips */}
              {hasActiveFilters && (
                <>
                  <span className="text-white/30 hidden sm:block flex-shrink-0">|</span>
                  {searchQuery && (
                    <span className="flex items-center gap-1 bg-white/15 text-white text-[11px] px-2.5 py-1 rounded-full flex-shrink-0">
                      &ldquo;{searchQuery}&rdquo;
                      <button onClick={() => { setSearchQuery(''); setSearchInput(''); resetPagination(); }} className="hover:text-red-300 ml-0.5" aria-label="Clear search query">×</button>
                    </span>
                  )}
                  {filters.inStock && (
                    <span className="flex items-center gap-1 bg-white/15 text-white text-[11px] px-2.5 py-1 rounded-full flex-shrink-0">
                      In Stock
                      <button onClick={() => handleFilterChange({ ...filters, inStock: false })} className="hover:text-red-300 ml-0.5" aria-label="Remove in stock filter">×</button>
                    </span>
                  )}
                  {(filters.minPrice || filters.maxPrice) && (
                    <span className="flex items-center gap-1 bg-white/15 text-white text-[11px] px-2.5 py-1 rounded-full flex-shrink-0">
                      ৳{filters.minPrice || 0}–{filters.maxPrice ? `৳${filters.maxPrice}` : '∞'}
                      <button onClick={() => handleFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined })} className="hover:text-red-300 ml-0.5" aria-label="Remove price range filter">×</button>
                    </span>
                  )}
                  <button onClick={clearAllFilters}
                    className="text-red-300 hover:text-red-200 text-[11px] font-medium underline ml-1 flex-shrink-0">
                    {t('products.clearAll')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 w-full max-w-full overflow-hidden">
        <div className="flex gap-5 min-w-0">

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">

              {/* Sidebar header */}
              <div className="px-5 py-4 bg-gradient-to-r from-[#0B2545] to-[#0d3060] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
                  </svg>
                  <span className="text-white font-bold text-[14px]">{t('products.filters')}</span>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters}
                    className="text-[11px] text-red-300 hover:text-red-200 font-medium transition-colors">
                    {t('products.clearAll')}
                  </button>
                )}
              </div>

              <div className="p-4 space-y-5">

                {/* Category */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <span>📂</span> {t('products.category')}
                  </label>
                  <select value={searchCategory}
                    onChange={e => {
                      const name = e.target.value;
                      const slug = CATEGORY_NAME_TO_SLUG[name];
                      if (slug) {
                        router.push(`/products/category/${slug}`);
                      } else {
                        setSearchCategory(name);
                        resetPagination();
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all cursor-pointer text-gray-700">
                    <option value="">{t('products.allCategories')}</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <span>🏭</span> {t('products.brand')}
                  </label>
                  <select value={filters.brands?.[0] || ''}
                    onChange={e => handleFilterChange({ ...filters, brands: e.target.value ? [e.target.value] : [] })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all cursor-pointer text-gray-700">
                    <option value="">{t('products.allBrands')}</option>
                    {brands.map(brand => (
                      <option key={brand._id} value={brand?.name || brand}>{brand?.name || brand}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <span>💰</span> {t('products.priceRange')}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="Min"
                      value={filters.minPrice || ''}
                      onChange={e => handleFilterChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all" />
                    <span className="text-gray-400 text-[12px] flex-shrink-0">–</span>
                    <input type="number" placeholder="Max"
                      value={filters.maxPrice || ''}
                      onChange={e => handleFilterChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all" />
                  </div>
                  {/* Quick price presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[['Under ৳1K', 0, 1000], ['৳1K–5K', 1000, 5000], ['৳5K–20K', 5000, 20000], ['৳20K+', 20000, undefined]].map(([label, min, max]) => (
                      <button key={label}
                        onClick={() => handleFilterChange({ ...filters, minPrice: min || undefined, maxPrice: max })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                          filters.minPrice === (min || undefined) && filters.maxPrice === max
                            ? 'bg-[#0E8A6E] text-white border-[#0E8A6E]'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#0E8A6E] hover:text-[#0E8A6E]'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <span>📦</span> {t('products.availability')}
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#0E8A6E] hover:bg-[#0E8A6E]/5 transition-all cursor-pointer">
                    <input type="checkbox" checked={filters.inStock || false}
                      onChange={e => handleFilterChange({ ...filters, inStock: e.target.checked })}
                      className="w-4 h-4 text-[#0E8A6E] border-gray-300 rounded focus:ring-[#0E8A6E] cursor-pointer accent-[#0E8A6E]" />
                    <span className="text-[13px] text-gray-700 font-medium">{t('products.inStockOnly')}</span>
                  </label>
                </div>

                {/* Results count */}
                {pagination.total > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0E8A6E]/8 border border-[#0E8A6E]/20 rounded-xl">
                      <span className="text-[15px] font-bold text-[#0E8A6E]">{pagination.total.toLocaleString()}</span>
                      <span className="text-[12px] text-gray-600">{t('products.productsFound')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ── Products Area ────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            <h1 className="sr-only">
              {searchCategory
                ? CATEGORY_SEO[searchCategory]?.h1 || `${searchCategory} in Bangladesh`
                : 'Medical Equipment in Bangladesh'}
            </h1>

            {/* Top bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-3 sm:px-4 py-2.5 sm:py-3 mb-4 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Mobile filter toggle */}
                <button onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] sm:text-[12px] font-medium text-gray-600 hover:border-[#0E8A6E] hover:text-[#0E8A6E] transition-colors flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[14px] sm:h-[14px]">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
                  </svg>
                  <span className="hidden xs:inline">{t('products.filters')}</span>
                  {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#0E8A6E]" />}
                </button>

                <div className="text-[11px] sm:text-[13px] text-gray-500 truncate min-w-0">
                  {loading && allProducts.length === 0 ? (
                    <span className="text-gray-400">{t('products.loading')}</span>
                  ) : (
                    <>
                      {searchCategory
                        ? <span className="font-semibold text-[#0B2545] truncate">{searchCategory}</span>
                        : <span className="text-gray-600">{t('products.allProducts')}</span>}
                      <span className="text-gray-400 mx-1 sm:mx-1.5">·</span>
                      <span className="font-medium text-gray-700">{allProducts.length}</span>
                      <span className="text-gray-400 hidden xs:inline"> of </span>
                      <span className="text-gray-400 xs:hidden">/</span>
                      <span className="font-medium text-gray-700">{pagination.total || 0}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <span className="text-[11px] sm:text-[12px] text-gray-500 hidden sm:block">{t('products.sortBy')}</span>
                <select value={sortBy} onChange={e => handleSortChange(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 border border-gray-200 rounded-xl text-[11px] sm:text-[12px] bg-white focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all cursor-pointer text-gray-700 font-medium min-w-0 max-w-[140px] sm:max-w-none">
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <SearchResults
              products={allProducts}
              loading={loading}
              error={error}
              onProductClick={onProductClick}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              loadingMore={loadingMore}
            />

            {/* SEO Content */}
            {CATEGORY_CONTENT[searchCategory] && (
              <section className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-[15px] font-semibold text-[#0B2545] mb-3">
                  About {searchCategory} in Bangladesh
                </h2>
                <div className="text-[13px] text-gray-500 leading-relaxed whitespace-pre-line">
                  {CATEGORY_CONTENT[searchCategory]}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile Sidebar Drawer ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0B2545] to-[#0d3060] flex items-center justify-between">
              <span className="text-white font-bold text-[14px]">{t('products.filters')}</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-5">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t('products.category')}</label>
                <select value={searchCategory}
                  onChange={e => {
                    const name = e.target.value;
                    const slug = CATEGORY_NAME_TO_SLUG[name];
                    if (slug) {
                      router.push(`/products/category/${slug}`);
                      setSidebarOpen(false);
                    } else {
                      setSearchCategory(name);
                      resetPagination();
                      setSidebarOpen(false);
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]">
                  <option value="">{t('products.allCategories')}</option>
                  {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t('products.brand')}</label>
                <select value={filters.brands?.[0] || ''}
                  onChange={e => { handleFilterChange({ ...filters, brands: e.target.value ? [e.target.value] : [] }); setSidebarOpen(false); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]">
                  <option value="">{t('products.allBrands')}</option>
                  {brands.map(brand => <option key={brand._id} value={brand?.name || brand}>{brand?.name || brand}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t('products.priceRange')}</label>
                <div className="flex gap-2 items-center">
                  <input type="number" placeholder="Min" value={filters.minPrice || ''}
                    onChange={e => handleFilterChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-[#0E8A6E]" />
                  <span className="text-gray-400 text-[12px]">–</span>
                  <input type="number" placeholder="Max" value={filters.maxPrice || ''}
                    onChange={e => handleFilterChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-[#0E8A6E]" />
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer">
                <input type="checkbox" checked={filters.inStock || false}
                  onChange={e => handleFilterChange({ ...filters, inStock: e.target.checked })}
                  className="w-4 h-4 accent-[#0E8A6E]" />
                <span className="text-[13px] text-gray-700 font-medium">{t('products.inStockOnly')}</span>
              </label>
              <button onClick={() => { clearAllFilters(); setSidebarOpen(false); }}
                className="w-full py-2.5 border border-red-200 text-red-600 rounded-xl text-[13px] font-medium hover:bg-red-50 transition-colors">
                {t('products.clearAll')}
              </button>
              <button onClick={() => setSidebarOpen(false)}
                className="w-full py-2.5 bg-[#0E8A6E] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0c7a61] transition-colors">
                {t('products.filters')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
