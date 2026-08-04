"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Spinner, { ProductCardSkeleton } from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import ProductCard from '@/components/ProductCard';
import { smartSearch } from '@/utils/smartSearch';

/* ─── Search Results Container ────────────────────────────────────────────── */
export default function SearchResults({ 
  products, 
  loading, 
  query, 
  onProductClick, 
  hasMore, 
  onLoadMore, 
  loadingMore, 
  totalResults,
  // Pagination props
  currentPage,
  totalPages,
  onPageChange,
  // Smart search props
  allProducts = [], // Pass all products for smart search
  useSmartSearch = false, // Enable smart search
}) {
  const router = useRouter();

  // Apply smart search using useMemo for derived state
  const { displayedProducts, correctedQuery, searchSuggestions } = useMemo(() => {
    if (useSmartSearch && query && allProducts.length > 0) {
      const { results, suggestions, correctedQuery: corrected } = smartSearch(query, allProducts, {
        threshold: 0.3,
        limit: 50,
        includeOutOfStock: false,
      });
      
      return {
        displayedProducts: results,
        correctedQuery: corrected,
        searchSuggestions: suggestions
      };
    }
    
    return {
      displayedProducts: products,
      correctedQuery: null,
      searchSuggestions: []
    };
  }, [query, products, allProducts, useSmartSearch]);

  if (loading && displayedProducts.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!loading && displayedProducts.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No products found"
        description={
          query
            ? `No results for "${query}". Try different keywords.`
            : 'Try adjusting your filters or search terms.'
        }
        action={{ label: 'View All Products', href: '/products' }}
        className="bg-white rounded-2xl border border-[var(--color-border-tertiary)]"
      >
        {/* Search suggestions */}
        {searchSuggestions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Try searching for:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {searchSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => router.push(`/products?q=${encodeURIComponent(suggestion)}`)}
                  className="px-3 py-1.5 bg-[var(--color-background-tertiary)] hover:bg-brand-teal-tint text-sm text-[var(--color-text-primary)] hover:text-brand-teal rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </EmptyState>
    );
  }

  return (
    <div>
      {/* Typo correction notification */}
      {correctedQuery && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <span className="text-blue-600">💡</span>
          <p className="text-sm text-blue-900">
            Showing results for <strong>&ldquo;{correctedQuery}&rdquo;</strong> instead of &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {/* Result count */}
      <div className="text-xs text-[var(--color-text-secondary)] mb-4">
        {loading ? (
          'Searching...'
        ) : (
          <>
            <strong className="text-[var(--color-text-primary)]">{totalResults || displayedProducts.length}</strong> result{(totalResults || displayedProducts.length) !== 1 ? 's' : ''}
            {query && (
              <>
                {' '}for <strong className="text-[var(--color-text-primary)]">&ldquo;{correctedQuery || query}&rdquo;</strong>
              </>
            )}
          </>
        )}
      </div>

      {/* Loading Overlay */}
      <div className="relative">
        {loading && displayedProducts.length > 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <div className="bg-white shadow-lg rounded-2xl px-8 py-6 flex flex-col items-center gap-3 border border-[var(--color-border-tertiary)] animate-scale-in">
              <Spinner size="lg" variant="medical" />
              <p className="text-sm text-[var(--color-text-secondary)] font-medium">Loading page {currentPage}...</p>
            </div>
          </div>
        )}

        {/* Grid with staggered fade-in */}
        <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}>
          {displayedProducts.map((product, index) => (
            <div
              key={product._id || product.id}
              className="animate-fadeSlideUp"
              style={{
                animationDelay: `${index * 30}ms`,
                animationFillMode: 'both'
              }}
            >
              <ProductCard
                product={product}
                onProductClick={onProductClick}
                showStockBadge
                showFeaturedBadge
                showCategory
              />
            </div>
          ))}
        </div>
      </div>

      {/* Search suggestions (if available) */}
      {searchSuggestions.length > 0 && (
        <div className="mt-6 p-4 bg-[var(--color-background-secondary)] rounded-lg">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Related searches:</p>
          <div className="flex flex-wrap gap-2">
            {searchSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => router.push(`/products?q=${encodeURIComponent(suggestion)}`)}
                className="px-3 py-1.5 bg-white border border-[var(--color-border-primary)] hover:border-brand-teal text-sm text-[var(--color-text-primary)] hover:text-brand-teal rounded-lg transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="mt-6 mb-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      ) : (
        <div className="mt-6 mb-3 text-center text-sm text-[var(--color-text-secondary)]">
          Showing all {displayedProducts.length} products
        </div>
      )}
    </div>
  );
}
