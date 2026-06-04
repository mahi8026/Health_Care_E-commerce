"use client";

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import Spinner from '@/components/ui/Spinner';
import WishlistButton from '@/components/wishlist/WishlistButton';
import Pagination from '@/components/ui/Pagination';

/* ─── Individual Product Card ─────────────────────────────────────────────── */
function ProductCard({ product, onProductClick }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);

  const imageData = product.images?.find(img => typeof img === 'object' && img.isPrimary) || product.images?.[0];
  const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const catName = typeof product.category === 'object' ? product.category?.name : product.category;
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const hasDiscount = oldPrice > price && oldPrice > 0;
  const discountPct = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const inStock = product.stock > 0;

  const handleClick = useCallback(() => {
    const id = product._id || product.id;
    if (onProductClick) onProductClick(id);
    else router.push(`/products/${id}`);
  }, [product, onProductClick, router]);

  const handleAddToCart = useCallback(async (e) => {
    e.stopPropagation();
    if (addingToCart || added) return;
    setAddingToCart(true);
    try {
      addToCart(product, 1);
      setAdded(true);
      setTimeout(() => { setAdded(false); setAddingToCart(false); }, 1500);
    } catch {
      setAddingToCart(false);
    }
  }, [addToCart, product, addingToCart, added]);

  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-[#0E8A6E]/40 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col overflow-hidden"
    >
      {/* Image */}
      <div className="relative bg-surface-subtle w-full aspect-[4/3] overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Bangladesh`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : null}
        {/* Fallback */}
        <div className={`${imageUrl ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center text-5xl bg-[#F1F5F9]`}>
          🏥
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              -{discountPct}%
            </span>
          )}
          {product.isFeatured && !hasDiscount && (
            <span className="bg-[#F59E0B] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Stock badge */}
        <div className={`absolute top-2 right-8 px-2 py-0.5 rounded-md text-[10px] font-semibold shadow-sm ${
          inStock ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {inStock ? `${product.stock > 99 ? '99+' : product.stock} in stock` : 'Out of stock'}
        </div>

        {/* Wishlist */}
        <div className="absolute top-1.5 right-1.5" onClick={e => e.stopPropagation()}>
          <WishlistButton productId={product._id || product.id} size="small" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col">
        {/* Category + Brand */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {catName && (
            <span className="text-[10px] font-bold text-[#0E8A6E] uppercase tracking-wider">{catName}</span>
          )}
          {catName && brandName && <span className="text-gray-300 text-[10px]">·</span>}
          {brandName && (
            <span className="text-[10px] text-gray-400 font-medium">{brandName}</span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 flex-1 mb-3 group-hover:text-[#0E8A6E] transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[17px] font-bold text-[#0B2545]">
            {price > 0 ? `৳${price.toLocaleString()}` : <span className="text-[13px] text-gray-500 font-medium">Contact for Price</span>}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-gray-400 line-through">৳{oldPrice.toLocaleString()}</span>
          )}
          {hasDiscount && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Save ৳{(oldPrice - price).toLocaleString()}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-[11px] font-semibold transition-all ${
              added
                ? 'bg-emerald-500 text-white'
                : inStock
                  ? 'bg-[#0B2545] hover:bg-[#0d2d52] text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {addingToCart && !added ? (
              <svg className="animate-spin w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : added ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-3 sm:h-3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="hidden xs:inline">Added</span>
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-3 sm:h-3">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
                <span className="hidden xs:inline">Add</span>
                <span className="xs:hidden">+</span>
              </>
            )}
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleClick(); }}
            className="py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-[11px] font-semibold border border-[#0B2545]/20 text-[#0B2545] hover:bg-[#0B2545] hover:text-white transition-all"
          >
            <span className="hidden xs:inline">View Details</span>
            <span className="xs:hidden">View</span>
          </button>
        </div>
      </div>
    </div>
  );
}

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
  onPageChange
}) {

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner />
        <p className="text-[13px] text-gray-400">Loading products...</p>
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
        <div className="text-[56px] mb-4">🔍</div>
        <h3 className="text-[18px] font-semibold text-gray-800 mb-2 font-[family-name:var(--font-lora)]">
          No products found
        </h3>
        <p className="text-[13px] text-gray-500 mb-6 text-center max-w-xs">
          {query ? `No results for "${query}". Try different keywords.` : 'Try adjusting your filters or search terms.'}
        </p>
      </div>
    );
  }

  // Debug logging
  console.log('SearchResults pagination debug:', {
    currentPage,
    totalPages,
    totalResults,
    productsCount: products.length,
    shouldShowPagination: totalPages > 1
  });

  return (
    <div>
      {/* Result count */}
      <div className="text-[12px] text-gray-500 mb-4">
        {loading ? (
          'Searching...'
        ) : (
          <>
            <strong className="text-gray-700">{totalResults || products.length}</strong> result{(totalResults || products.length) !== 1 ? 's' : ''}
            {query && (
              <>
                {' '}for <strong className="text-gray-700">&ldquo;{query}&rdquo;</strong>
              </>
            )}
          </>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {products.map(product => (
          <ProductCard
            key={product._id || product.id}
            product={product}
            onProductClick={onProductClick}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="mt-10 mb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      ) : (
        <div className="mt-10 mb-4 text-center text-sm text-gray-400">
          Showing all {products.length} products
        </div>
      )}
    </div>
  );
}
