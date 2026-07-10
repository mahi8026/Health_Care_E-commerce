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
    <section className={`${className}`}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 20 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiClock style={{ width: 20, height: 20, color: '#0E8A6E' }} />
          <h2 style={{ 
            fontFamily: 'Georgia, serif',
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
            color: '#0B2545'
          }}>
            {title}
          </h2>
          <span style={{ 
            fontSize: 13,
            color: '#9CA3AF',
            fontWeight: 500,
            marginLeft: 4
          }}>
            ({products.length} {products.length === 1 ? 'item' : 'items'})
          </span>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {products.map((product) => {
          const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
          const price = product.price || 0;
          const oldPrice = product.originalPrice || 0;
          const discount = oldPrice > price && oldPrice > 0
            ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
          const hasDiscount = discount > 0 && oldPrice > price;

          return (
            <div
              key={product._id}
              className="group relative flex-shrink-0 w-48 snap-start"
              style={{ 
                background: '#fff',
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
                transition: 'box-shadow 0.2s, transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(11,37,69,0.12)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFromRecentlyViewed(product._id);
                }}
                className="absolute top-2 right-2 z-10 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50"
                aria-label="Remove from recently viewed"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <FiX className="w-3.5 h-3.5 text-gray-600 hover:text-red-600" />
              </button>

              <Link
                href={`/products/${product.slug || product._id}`}
                className="block"
              >
                {/* Product Image */}
                <div style={{ 
                  position: 'relative', 
                  height: 190, 
                  background: '#F8FAFC',
                  overflow: 'hidden',
                  flexShrink: 0 
                }}>
                  {product.images?.[0] ? (
                    <>
                      <Image
                        src={typeof product.images[0] === 'string' ? product.images[0] : (product.images[0].url || product.images[0])}
                        alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Price ৳${price > 0 ? price.toLocaleString() : 'on request'} Bangladesh`}
                        fill
                        sizes="192px"
                        style={{ objectFit: 'cover' }}
                        className="group-hover:scale-105 transition-transform duration-300"
                        unoptimized={!(typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)?.includes('res.cloudinary.com')}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                      <div 
                        className="image-fallback" 
                        style={{ 
                          display: 'none',
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          height: '100%', 
                          fontSize: 52, 
                          color: '#CBD5E1',
                          background: '#F8FAFC'
                        }}
                      >
                        🏥
                      </div>
                    </>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%', 
                      fontSize: 52, 
                      color: '#CBD5E1',
                      background: '#F8FAFC'
                    }}>
                      🏥
                    </div>
                  )}

                  {/* Discount badge */}
                  {hasDiscount && (
                    <div style={{ 
                      position: 'absolute', 
                      top: 10, 
                      left: 10, 
                      background: '#EF4444', 
                      color: '#fff', 
                      fontSize: 10, 
                      fontWeight: 700,
                      padding: '3px 8px', 
                      borderRadius: 6 
                    }}>
                      -{discount}%
                    </div>
                  )}

                  {/* Out of stock badge */}
                  {product.stock === 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      top: hasDiscount ? 34 : 10, 
                      left: 10, 
                      background: '#6B7280', 
                      color: '#fff', 
                      fontSize: 10, 
                      fontWeight: 700,
                      padding: '3px 8px', 
                      borderRadius: 6 
                    }}>
                      Out of Stock
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column' }}>
                  {brandName && (
                    <div style={{ 
                      fontSize: 10, 
                      color: '#0E8A6E', 
                      fontWeight: 700,
                      textTransform: 'uppercase', 
                      letterSpacing: '0.06em', 
                      marginBottom: 4 
                    }}>
                      {brandName}
                    </div>
                  )}
                  
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 600, 
                    lineHeight: 1.45, 
                    marginBottom: 8,
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden',
                    color: '#1F2937',
                    minHeight: 38
                  }}>
                    {product.name}
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'auto' }}>
                    {price > 0 ? (
                      <>
                        <span style={{ fontSize: 17, fontWeight: 800, color: '#0B2545' }}>
                          ৳{price.toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>
                            ৳{oldPrice.toLocaleString()}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                        Contact for price
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
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
                  src={typeof product.images[0] === 'string' ? product.images[0] : (product.images[0].url || product.images[0])}
                  alt={product.name}
                  fill
                  className="object-cover rounded"
                  sizes="64px"
                  unoptimized={!(typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)?.includes('res.cloudinary.com')}
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
