"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import SearchBar from '@/components/search/SearchBar';
import SearchResults from '@/components/search/SearchResults';
import { FaTimes } from 'react-icons/fa';

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
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Fetch categories and brands
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/manufacturers`)
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          console.log('Categories loaded:', categoriesData);
          setCategories(categoriesData.categories || []);
        } else {
          console.error('Failed to fetch categories:', categoriesRes.status);
        }

        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          console.log('Brands loaded:', brandsData);
          setBrands(brandsData.manufacturers || []);
        } else {
          console.error('Failed to fetch brands:', brandsRes.status);
        }
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };

    fetchFiltersData();
  }, []);

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

  const productFilters = useMemo(() => {
    const categoryValue = searchCategory || filters.categories?.[0] || '';
    const brandValue = filters.brands?.[0] || '';
    
    return {
      search: searchQuery,
      category: categoryValue,
      brand: brandValue, // Changed from 'brands' to 'brand'
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 sticky top-4">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                {(searchCategory || filters.brands?.length > 0 || filters.minPrice || filters.maxPrice || filters.inStock) && (
                  <button
                    onClick={() => {
                      setSearchCategory('');
                      handleFilterChange({});
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <FaTimes className="text-xs" />
                    Clear all
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📂 Category
                </label>
                <select
                  value={searchCategory}
                  onChange={(e) => {
                    setSearchCategory(e.target.value);
                    setPage(1);
                    setAllProducts([]);
                    setHasMore(true);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all cursor-pointer"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🏭 Brand
                </label>
                <select
                  value={filters.brands?.[0] || ''}
                  onChange={(e) => {
                    const brand = e.target.value;
                    handleFilterChange({
                      ...filters,
                      brands: brand ? [brand] : []
                    });
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all cursor-pointer"
                >
                  <option value="">All brands</option>
                  {brands.map((brand) => (
                    <option key={brand._id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  💰 Price Range
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">Minimum</label>
                    <input
                      type="number"
                      placeholder="Min price"
                      value={filters.minPrice || ''}
                      onChange={(e) => {
                        handleFilterChange({
                          ...filters,
                          minPrice: e.target.value ? Number(e.target.value) : undefined
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">Maximum</label>
                    <input
                      type="number"
                      placeholder="Max price"
                      value={filters.maxPrice || ''}
                      onChange={(e) => {
                        handleFilterChange({
                          ...filters,
                          maxPrice: e.target.value ? Number(e.target.value) : undefined
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📦 Availability
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#0E8A6E] hover:bg-[#0E8A6E]/5 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStock || false}
                    onChange={(e) => {
                      handleFilterChange({
                        ...filters,
                        inStock: e.target.checked
                      });
                    }}
                    className="w-4 h-4 text-[#0E8A6E] border-gray-300 rounded focus:ring-[#0E8A6E] focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">
                    In stock only
                  </span>
                </label>
              </div>

              {/* Results Count */}
              {pagination.total > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0E8A6E]/5 border border-[#0E8A6E]/20 rounded-lg">
                    <span className="text-sm font-bold text-[#0E8A6E]">
                      {pagination.total}
                    </span>
                    <span className="text-sm text-gray-700">
                      product{pagination.total !== 1 ? 's' : ''} found
                    </span>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right Content - Products */}
          <main className="flex-1 min-w-0">
            {/* Top Bar - Sort */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-2.5 mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {allProducts.length} of {pagination.total || 0} products
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all cursor-pointer"
                >
                  <option value="name">Name: A to Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
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
          </main>
        </div>
      </div>
    </div>
  );
}
