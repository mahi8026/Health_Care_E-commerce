'use client';

/**
 * RecentlyViewed — Display Recently Viewed Products
 * 
 * Shows horizontal scrollable list of products user has viewed.
 * Perfect for product detail pages and homepage.
 */

import { useMemo, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { FiClock, FiX } from 'react-icons/fi';

const ProductItem = memo(function ProductItem({ product, onRemove }) {
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const price = product.price || 0;
  const oldPrice = product.originalPrice || 0;
  const discount = oldPrice > price && oldPrice > 0
    ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const hasDiscount = discount > 0 && oldPrice > price;

  return (
    <div
      className="group relative flex-shrink-0 w-48 snap-start"
      style={{
        background: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--color-border-primary)',
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
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(product._id);
        }}
        className="absolute top-2 right-2 z-10 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-[var(--color-status-danger-tint)]"
        aria-label="Remove from recently viewed"
        style={{ border: '1px solid var(--color-border-primary)' }}
      >
        <FiX className="w-3.5 h-3.5 text-[var(--color-text-secondary)] hover:text-[var(--color-status-danger)]" />
      </button>

      <Link
        href={`/products/${product.slug || product._id}`}
        className="block"
      >
        <div style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          background: 'var(--color-background-secondary)',
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
                loading="lazy"
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
                  background: 'var(--color-background-secondary)'
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
              background: 'var(--color-background-secondary)'
            }}>
              🏥
            </div>
          )}

          {hasDiscount && (
            <div style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: 'var(--color-status-danger)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 6
            }}>
              -{discount}%
            </div>
          )}

          {product.stock === 0 && (
            <div style={{
              position: 'absolute',
              top: hasDiscount ? 34 : 10,
              left: 10,
              background: 'var(--color-text-secondary)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 6
            }}>
              Out of Stock
            </div>
          )}
        </div>

        <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column' }}>
          {brandName && (
            <div style={{
              fontSize: 10,
              color: 'var(--color-brand-teal)',
              fontWeight: 600,
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

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'auto' }}>
            {price > 0 ? (
              <>
                <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-brand-navy)' }}>
                  ৳{price.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}>
                    ৳{oldPrice.toLocaleString()}
                  </span>
                )}
              </>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                Contact for price
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
});

const CompactProductItem = memo(function CompactProductItem({ product }) {
  return (
    <Link
      key={product._id}
      href={`/products/${product.slug || product._id}`}
      className="flex gap-3 p-2 rounded-lg hover:bg-[var(--color-background-secondary)] dark:hover:bg-gray-800 transition-colors"
    >
      <div className="relative w-16 h-16 flex-shrink-0 bg-[var(--color-background-tertiary)] dark:bg-gray-900 rounded">
        {product.images?.[0] ? (
          <>
            <Image
              src={typeof product.images[0] === 'string' ? product.images[0] : (product.images[0].url || product.images[0])}
              alt={product.name}
              fill
              className="object-cover rounded"
              sizes="64px"
              unoptimized={!(typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)?.includes('res.cloudinary.com')}
              loading="lazy"
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
        <h4 className="text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100 line-clamp-2">
          {product.name}
        </h4>
        <p className="text-sm font-semibold text-brand-teal dark:text-brand-teal mt-1">
          ৳{product.price?.toLocaleString()}
        </p>
      </div>
    </Link>
  );
});

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
          <FiClock style={{ width: 20, height: 20, color: 'var(--color-brand-teal)' }} />
          <h2 style={{ 
            fontFamily: 'Georgia, serif',
            fontSize: 28,
            fontWeight: 600,
            margin: 0,
            color: 'var(--color-brand-navy)'
          }}>
            {title}
          </h2>
          <span style={{ 
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
            marginLeft: 4
          }}>
            ({products.length} {products.length === 1 ? 'item' : 'items'})
          </span>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {products.map((product) => (
          <ProductItem key={product._id} product={product} onRemove={removeFromRecentlyViewed} />
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
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-tertiary)] flex items-center gap-2">
        <FiClock className="w-4 h-4" />
        Recently Viewed
      </h3>
      
      {products.map((product) => (
        <CompactProductItem key={product._id} product={product} />
      ))}
    </div>
  );
}
