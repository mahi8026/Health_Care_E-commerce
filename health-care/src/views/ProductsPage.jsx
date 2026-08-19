"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { useT } from '@/hooks/useT';
import Breadcrumb from '@/components/ui/Breadcrumb';
import SearchResults from '@/components/search/SearchResults';
import ProductFilters from '@/components/product/ProductFilters';
import ProductFiltersMobile from '@/components/product/ProductFiltersMobile';
import { CATEGORY_CONTENT, CATEGORY_SEO } from '@/config/seo';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';

export default function ProductsPage({
  onProductClick,
  initialCategory,
  initialData = null,
  initialPagination = null,
  initialCategories = null,
  initialBrands = null,
  initialFilters = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useT();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  // initialCategory (from slug route) takes priority over query param
  const [searchCategory, setSearchCategory] = useState(
    initialCategory || searchParams.get('category') || ''
  );
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
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return Number.isNaN(p) || p < 1 ? 1 : p;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync URL search params back to state when URL changes (e.g. Header search navigation)
  useEffect(() => {
    const isOnCategoryPage = pathname?.startsWith('/products/category/');
    const urlQuery = searchParams.get('q') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlBrand = searchParams.get('brand') || '';
    
    // Batch state updates to avoid cascading renders
    const updates = {};
    let needsUpdate = false;
    
    if (urlQuery !== searchQuery) {
      updates.query = urlQuery;
      needsUpdate = true;
    }
    
    // Only sync category from URL params if NOT on a category page route
    // (category pages get their category from initialCategory prop, not query params)
    if (!isOnCategoryPage && urlCategory !== searchCategory) {
      updates.category = urlCategory;
      needsUpdate = true;
    }
    
    const currentBrand = filters.brands?.[0] || '';
    if (urlBrand !== currentBrand) {
      updates.brand = urlBrand;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      // Apply all updates in one batch
      void Promise.resolve().then(() => {
        if (updates.query !== undefined) {
          setSearchQuery(updates.query);
          setSearchInput(updates.query);
        }
        if (updates.category !== undefined) {
          setSearchCategory(updates.category);
        }
        if (updates.brand !== undefined) {
          setFilters((f) => ({ ...f, brands: updates.brand ? [updates.brand] : [] }));
        }
        setPage(1);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);

  // Use custom hooks for data fetching
  const { categories, loading: categoriesLoading } = useCategories(initialCategories);
  const { brands, loading: brandsLoading } = useBrands(initialBrands);

  // Sync filters to URL - but preserve category page URLs (/products/category/slug)
  useEffect(() => {
    // If we're on a category page (/products/category/[slug]), don't redirect to /products?category=...
    const isOnCategoryPage = pathname?.startsWith('/products/category/');
    
    if (isOnCategoryPage) {
      // On category pages, only sync search and filters as query params, not the category itself
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.inStock) params.set('inStock', 'true');
      if (filters.brands?.[0]) params.set('brand', filters.brands[0]);
      if (sortBy !== 'name') params.set('sort', sortBy);
      
      const qs = params.toString();
      // Update query params only, keep the category slug in the URL
      if (qs !== searchParams.toString()) {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    } else {
      // On /products page, include category in query params
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
    }
  }, [searchQuery, searchCategory, filters, sortBy, router, pathname, searchParams]);

  const productFilters = useMemo(() => ({
    search: searchQuery,
    // Send slug to API — avoids & encoding issues with names like "IV & Infusion Therapy"
    category: CATEGORY_NAME_TO_SLUG[searchCategory] || searchCategory || filters.categories?.[0] || '',
    brand: filters.brands?.[0] || '',
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStock: filters.inStock,
    sortBy,
    page
  }), [searchQuery, searchCategory, filters, sortBy, page]);

  const { products, loading, pagination, error } = useProducts(
    productFilters,
    initialData,
    initialPagination,
    initialFilters
  );

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleFilterChange = useCallback((newFilters) => {
    if (newFilters.minPrice !== undefined && newFilters.maxPrice !== undefined) {
      if (newFilters.minPrice > newFilters.maxPrice) newFilters.maxPrice = newFilters.minPrice;
    }
    setFilters(newFilters);
    setPage(1);
  }, [setFilters, setPage]);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setPage(1);
  }, [setSortBy, setPage]);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    // Smooth scroll to top of page with offset for header
    const yOffset = -100; // Offset for fixed header
    const element = document.querySelector('main') || document.body;
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    
    window.scrollTo({
      top: y,
      behavior: 'smooth'
    });
  }, [setPage]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSearchInput('');
    setSearchCategory('');
    handleFilterChange({ brands: [] });
    setPage(1);
  };

  // Category change with slug-based SEO navigation
  const handleCategoryChange = useCallback((name) => {
    const slug = CATEGORY_NAME_TO_SLUG[name];
    if (slug) {
      router.push(`/products/category/${slug}`);
    } else {
      setSearchCategory(name);
      setPage(1);
    }
  }, [router]);

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
      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <Breadcrumb 
        items={[
          { label: 'Home', href: '/' },
          { label: searchCategory || 'Products' }
        ]}
      />

      {/* ── Active filters + category pills bar ─────────────────────────── */}
      {(hasActiveFilters || true) && (
        <div className="bg-brand-navy border-b border-[var(--color-brand-navy-hover)]">
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
                          setPage(1);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                        searchCategory === name
                          ? 'bg-brand-teal text-white'
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
                    <span className="flex items-center gap-1 bg-white/15 text-white text-xs px-2.5 py-1 rounded-full flex-shrink-0">
                      &ldquo;{searchQuery}&rdquo;
                      <button onClick={() => { setSearchQuery(''); setSearchInput(''); setPage(1); }} className="hover:text-red-300 ml-0.5" aria-label="Clear search query">×</button>
                    </span>
                  )}
                  {filters.inStock && (
                    <span className="flex items-center gap-1 bg-white/15 text-white text-xs px-2.5 py-1 rounded-full flex-shrink-0">
                      In Stock
                      <button onClick={() => handleFilterChange({ ...filters, inStock: false })} className="hover:text-red-300 ml-0.5" aria-label="Remove in stock filter">×</button>
                    </span>
                  )}
                  {(filters.minPrice || filters.maxPrice) && (
                    <span className="flex items-center gap-1 bg-white/15 text-white text-xs px-2.5 py-1 rounded-full flex-shrink-0">
                      ৳{filters.minPrice || 0}–{filters.maxPrice ? `৳${filters.maxPrice}` : '∞'}
                      <button onClick={() => handleFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined })} className="hover:text-red-300 ml-0.5" aria-label="Remove price range filter">×</button>
                    </span>
                  )}
                  <button onClick={clearAllFilters}
                    className="text-red-300 hover:text-red-200 text-xs font-medium underline ml-1 flex-shrink-0">
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
            <ProductFilters
              categories={categories}
              brands={brands}
              selectedCategory={searchCategory}
              selectedBrand={filters.brands?.[0] || ''}
              priceRange={{ minPrice: filters.minPrice, maxPrice: filters.maxPrice }}
              inStock={!!filters.inStock}
              onCategoryChange={handleCategoryChange}
              onBrandChange={(brand) => handleFilterChange({ ...filters, brands: brand ? [brand] : [] })}
              onPriceRangeChange={(range) => handleFilterChange({ ...filters, minPrice: range.minPrice, maxPrice: range.maxPrice })}
              onInStockChange={(checked) => handleFilterChange({ ...filters, inStock: checked })}
              onClearAll={clearAllFilters}
              totalResults={pagination.total || 0}
              hasActiveFilters={hasActiveFilters}
              t={t}
            />
          </aside>

          {/* ── Products Area ────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            <h1 className="sr-only">
              {searchCategory
                ? CATEGORY_SEO[searchCategory]?.h1 || `${searchCategory} in Bangladesh`
                : 'Medical Equipment in Bangladesh'}
            </h1>

            {/* Top bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border-tertiary)] px-3 sm:px-4 py-2.5 sm:py-3 mb-4 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Mobile filter toggle */}
                <button onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 border border-[var(--color-border-primary)] rounded-lg text-xs sm:text-xs font-medium text-[var(--color-text-secondary)] hover:border-brand-teal hover:text-brand-teal transition-colors flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[14px] sm:h-[14px]">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
                  </svg>
                  <span className="hidden xs:inline">{t('products.filters')}</span>
                  {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />}
                </button>

                <div className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate min-w-0">
                  {loading && (!products || products.length === 0) ? (
                    <span className="text-[var(--color-text-secondary)]">{t('products.loading')}</span>
                  ) : (
                    <>
                      {searchCategory
                        ? <span className="font-semibold text-brand-navy truncate">{searchCategory}</span>
                        : <span className="text-[var(--color-text-secondary)]">{t('products.allProducts')}</span>}
                      <span className="text-[var(--color-text-secondary)] mx-1 sm:mx-1.5">·</span>
                      <span className="font-medium text-[var(--color-text-primary)]">{products?.length || 0}</span>
                      <span className="text-[var(--color-text-secondary)] hidden xs:inline"> of </span>
                      <span className="text-[var(--color-text-secondary)] xs:hidden">/</span>
                      <span className="font-medium text-[var(--color-text-primary)]">{pagination.total || 0}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <span className="text-xs sm:text-xs text-[var(--color-text-secondary)] hidden sm:block">{t('products.sortBy')}</span>
                <select aria-label="Sort products" value={sortBy} onChange={e => handleSortChange(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 border border-[var(--color-border-primary)] rounded-xl text-xs sm:text-xs bg-white focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10 transition-all cursor-pointer text-[var(--color-text-primary)] font-medium min-w-0 max-w-[140px] sm:max-w-none">
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <SearchResults
              products={products}
              loading={loading}
              error={error}
              onProductClick={onProductClick}
              currentPage={pagination.page || 1}
              totalPages={pagination.pages || 1}
              onPageChange={handlePageChange}
              totalResults={pagination.total}
            />

            {/* SEO Content */}
            {CATEGORY_CONTENT[searchCategory] && (
              <section className="mt-6 bg-white border border-[var(--color-border-tertiary)] rounded-2xl p-4 shadow-sm">
                <h2 className="text-base font-semibold text-brand-navy mb-3">
                  About {searchCategory} in Bangladesh
                </h2>
                <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                  {CATEGORY_CONTENT[searchCategory]}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile Sidebar Drawer ────────────────────────────────────────── */}
      <ProductFiltersMobile
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={categories}
        brands={brands}
        selectedCategory={searchCategory}
        selectedBrand={filters.brands?.[0] || ''}
        priceRange={{ minPrice: filters.minPrice, maxPrice: filters.maxPrice }}
        inStock={!!filters.inStock}
        onCategoryChange={handleCategoryChange}
        onBrandChange={(brand) => handleFilterChange({ ...filters, brands: brand ? [brand] : [] })}
        onPriceRangeChange={(range) => handleFilterChange({ ...filters, minPrice: range.minPrice, maxPrice: range.maxPrice })}
        onInStockChange={(checked) => handleFilterChange({ ...filters, inStock: checked })}
        onClearAll={clearAllFilters}
        t={t}
      />
    </div>
  );
}
