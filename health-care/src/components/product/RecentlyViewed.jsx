'use client';

/**
 * RecentlyViewed — Display Recently Viewed Products
 * 
 * Shows horizontal scrollable list of products user has viewed.
 * Perfect for product detail pages and homepage.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { FiClock, FiX } from 'react-icons/fi';

export default function RecentlyViewed({ 
  currentProductId = null,
  limit = 6,
  title = 'Recently Viewed',
  className = ''
}) {
  const { recentlyViewed, removeFromRecentlyViewed } = useRecentlyViewed();
  
  // Use useMemo instead of useEffect + useState for derived state
  const products = useMemo(() => {
    return recentlyViewed
      .filter(p => p._id !== currentProductId)
      .slice(0, limit);
  }, [recentlyViewed, currentProductId, limit]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={`py-8 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FiClock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({products.length})
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {products.map((product) => (
          <div
            key={product._id}
            className="group relative flex-shrink-0 w-48 snap-start"
          >
            {/* Remove button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                removeFromRecentlyViewed(product._id);
              }}
              className="absolute top-2 right-2 z-10 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Remove from recently viewed"
            >
              <FiX className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
            </button>

            <Link
              href={`/products/${product.slug || product._id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
                {product.images?.[0] ? (
                  <>
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 192px, 192px"
                      unoptimized={!product.images[0].includes('res.cloudinary.com')}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                        if (fallback) {
                          fallback.classList.remove('hidden');
                          fallback.classList.add('flex');
                        }
                      }}
                    />
                    <div className="image-fallback hidden w-full h-full items-center justify-center text-gray-400 dark:text-gray-600">
                      <span className="text-4xl">🏥</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                    <span className="text-4xl">🏥</span>
                  </div>
                )}

                {/* Discount badge */}
                {product.originalPrice && product.price < product.originalPrice && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                  {product.name}
                </h3>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {typeof product.rating === 'object' 
                        ? product.rating.average?.toFixed(1) 
                        : product.rating?.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                    ৳{product.price?.toLocaleString()}
                  </span>
                  {product.originalPrice && product.price < product.originalPrice && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                      ৳{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Stock status */}
                {product.stock === 0 && (
                  <span className="inline-block mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                    Out of Stock
                  </span>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * RecentlyViewedCompact — Smaller version for sidebars
 */
export function RecentlyViewedCompact({ 
  currentProductId = null, 
  limit = 4 
}) {
  const { recentlyViewed } = useRecentlyViewed();
  
  // Use useMemo for derived state
  const products = useMemo(() => {
    return recentlyViewed
      .filter(p => p._id !== currentProductId)
      .slice(0, limit);
  }, [recentlyViewed, currentProductId, limit]);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <FiClock className="w-4 h-4" />
        Recently Viewed
      </h3>
      
      {products.map((product) => (
        <Link
          key={product._id}
          href={`/products/${product.slug || product._id}`}
          className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-900 rounded">
            {product.images?.[0] ? (
              <>
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover rounded"
                  sizes="64px"
                  unoptimized={!product.images[0].includes('res.cloudinary.com')}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback-compact');
                    if (fallback) {
                      fallback.classList.remove('hidden');
                      fallback.classList.add('flex');
                    }
                  }}
                />
                <div className="image-fallback-compact hidden w-full h-full items-center justify-center text-2xl">
                  🏥
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                🏥
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {product.name}
            </h4>
            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 mt-1">
              ৳{product.price?.toLocaleString()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
