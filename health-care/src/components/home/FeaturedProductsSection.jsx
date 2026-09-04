'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useT } from '@/hooks/useT';
import { ProductCardSkeleton } from '@/components/ui/Spinner';
import { API } from '@/constants/api';
import { fetchWithRetry } from '@/utils/api';
import { useCart } from '@/context/CartContext';
import { getProductCardImage } from '@/utils/cloudinary';

const ProductCard = memo(function ProductCard({ product, onClick }) {
  const { addToCart } = useCart();
  const t = useT();
  const imgRaw = product.images?.[0];
  const img = typeof imgRaw === 'string' ? imgRaw : imgRaw?.url;
  // Apply Cloudinary optimization — saves ~100-200KB per card image
  const optimizedImg = img ? getProductCardImage(img) : null;
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const ratingVal = typeof product.rating === 'object' ? product.rating?.average : (product.rating || 0);
  const reviewCount = product.reviewCount || product.rating?.count || 0;
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const discount = product.discountPct || (oldPrice > price && oldPrice > 0
    ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);
  const hasDiscount = discount > 0 && oldPrice > price;
  const inStock = product.stock === undefined || product.stock > 0;
  // Featured-section images previously went through the /_next/image
  // optimizer, which 400s for any product image hosted outside the
  // remotePatterns allowlist → blank cards. `unoptimized` (matching the
  // main ProductCard) + this error state render the 🏥 fallback instead.
  const [imgError, setImgError] = useState(false);

  return (
    <div onClick={onClick} className="group"
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      style={{ background: '#fff', borderRadius: 14, overflow: 'hidden',
        border: '1px solid var(--color-border-primary)', cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,29,93,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>

      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--color-background-secondary)', overflow: 'hidden', flexShrink: 0 }}>
        {optimizedImg && !imgError ? (
          <Image
            src={optimizedImg}
            alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Price ৳${price > 0 ? price.toLocaleString() : 'on request'} Bangladesh`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
            className="group-hover:scale-105 transition-transform duration-300"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 52, color: '#CBD5E1' }}>🏥</div>
        )}
        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hasDiscount && (
            <span style={{ background: 'var(--color-brand-orange)', color: '#fff', fontSize: 10, fontWeight: 600,
              padding: '3px 8px', borderRadius: 6 }}>-{discount}%</span>
          )}
          {!inStock && (
            <span style={{ background: 'var(--color-text-secondary)', color: '#fff', fontSize: 10, fontWeight: 600,
              padding: '3px 8px', borderRadius: 6 }}>{t('common.outOfStock')}</span>
          )}
        </div>
        {/* Quick add button on hover */}
        <button
          onClick={e => { e.stopPropagation(); addToCart(product, 1); }}
          style={{ position: 'absolute', bottom: 10, right: 10, background: 'var(--color-brand-teal)',
            color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px',
            fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--color-brand-teal-hover)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-brand-teal)'}
          className="quick-add-btn">
          + {t('nav.cart')}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {brandName && (
          <div style={{ fontSize: 10, color: 'var(--color-brand-teal)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {brandName}
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, marginBottom: 6, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          color: '#1F2937' }}>
          {product.name}
        </div>
        {ratingVal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ color: s <= Math.round(ratingVal) ? 'var(--color-warning)' : '#E5E7EB', fontSize: 13 }}>★</span>
            ))}
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>({reviewCount})</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-brand-navy)' }}>
            {price > 0 ? `৳${price.toLocaleString()}` : t('common.contactForPrice')}
          </span>
          {hasDiscount && (
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}>
              ৳{oldPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Featured products section (tabs + horizontally scrolling panel).
 * Self-fetching: mounts inside a LazyMount below the fold, so its network
 * request and re-renders happen only when the user scrolls near it instead of
 * during the initial page load window.
 */
export default function FeaturedProductsSection({ categories = [] }) {
  const router = useRouter();
  const t = useT();

  const topCategories = categories
    .filter(cat => cat.productCount && cat.productCount > 0)
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
    .slice(0, 5);

  const [activeTab, setActiveTab] = useState('all');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const fetchTabData = useCallback(async (tab) => {
    setFeaturedLoading(true);
    const featuredUrl = tab === 'all'
      ? `${API}/products?isFeatured=true&limit=24`
      : `${API}/products?category=${encodeURIComponent(tab)}&isFeatured=true&limit=24`;
    const fallbackUrl = tab === 'all'
      ? `${API}/products?limit=24`
      : `${API}/products?category=${encodeURIComponent(tab)}&limit=24`;

    try {
      // Try featured first, fallback to all products if not enough
      const [featuredData, fallbackData] = await Promise.all([
        fetchWithRetry(featuredUrl).then(r => r.json()).catch(() => ({ data: [] })),
        fetchWithRetry(fallbackUrl).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      const featured = Array.isArray(featuredData.data) ? featuredData.data : (featuredData.data?.products || featuredData.products || []);
      const fallback = Array.isArray(fallbackData.data) ? fallbackData.data : (fallbackData.data?.products || fallbackData.products || []);

      // Merge featured + fallback, deduped by _id. Featured items appear first.
      // This ensures we always show a full grid even when few products are marked isFeatured.
      const MIN_DISPLAY = 4;
      let products = featured;
      if (featured.length < MIN_DISPLAY) {
        const featuredIds = new Set(featured.map(p => p._id));
        const extra = fallback.filter(p => !featuredIds.has(p._id));
        products = [...featured, ...extra];
      }
      setFeaturedProducts(Array.isArray(products) ? products : []);
    } catch {
      setFeaturedProducts([]);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  useEffect(() => {
    // Async kick-off: keeps the first render free of cascading setState
    const t = setTimeout(() => fetchTabData('all'), 0);
    return () => clearTimeout(t);
  }, [fetchTabData]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    fetchTabData(tab);
  }, [fetchTabData]);

  return (
    <section className="home-section" style={{ padding: '28px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 9, color: 'var(--color-brand-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{t('home.handPicked')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{t('home.featuredProducts')}</h2>
          </div>
          <button onClick={() => router.push('/products')}
            style={{ fontSize: 12, color: 'var(--color-brand-teal)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
            {t('home.viewAll')}
          </button>
        </div>

        {/* Tabs - Dynamic based on top categories */}
        <div role="tablist" aria-label="Product categories" style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',     /* Firefox */
          msOverflowStyle: 'none',    /* IE/Edge */
          WebkitOverflowScrolling: 'touch',
          listStyle: 'none',
          padding: '2px 0 10px 0',
          margin: '0 0 12px 0',
          scrollSnapType: 'x mandatory',
        }}>
          {/* Always show "All Products" first */}
          <button
            onClick={() => handleTabChange('all')}
            role="tab"
            aria-selected={activeTab === 'all'}
            aria-controls="featured-products-panel"
            aria-label="View All Products"
            className={activeTab === 'all' ? 'tab-active' : ''}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              border: '1.5px solid var(--color-border-primary)',
              background: activeTab === 'all' ? 'var(--color-brand-navy)' : '#fff',
              color: activeTab === 'all' ? '#fff' : '#374151',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
              boxShadow: activeTab === 'all' ? '0 2px 8px rgba(0, 29, 93, 0.15)' : 'none',
              transform: activeTab === 'all' ? 'translateY(-1px)' : 'none',
              listStyle: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
            }}>
            All Products
          </button>

          {/* Dynamic category tabs - top 5 by product count */}
          {topCategories.map((cat, index) => {
              const categoryName = typeof cat === 'string' ? cat : cat.name;
              // Map category names to icons
              const iconMap = {
                'Orthopedic Supports': '🦴',
                'Diagnostic Equipment': '🩺',
                'Surgical & Wound Care': '💉',
                'Hospital Machines': '🏥',
                'Consumables': '📦',
                'Diabetes Care': '💉',
                'Laboratory Reagents': '🧪',
                'Surgical Instruments': '💉',
              };
              const icon = iconMap[categoryName] || '📦';

              return (
                <button
                  key={categoryName}
                  onClick={() => handleTabChange(categoryName)}
                  role="tab"
                  aria-selected={activeTab === categoryName}
                  aria-controls="featured-products-panel"
                  aria-label={`View ${categoryName}`}
                  className={activeTab === categoryName ? 'tab-active' : ''}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    border: '1.5px solid var(--color-border-primary)',
                    background: activeTab === categoryName ? 'var(--color-brand-navy)' : '#fff',
                    color: activeTab === categoryName ? '#fff' : '#374151',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    boxShadow: activeTab === categoryName ? '0 2px 8px rgba(0, 29, 93, 0.15)' : 'none',
                    transform: activeTab === categoryName ? 'translateY(-1px)' : 'none',
                    listStyle: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    scrollSnapAlign: 'start',
                  }}>
                  {icon} {categoryName.length > 18 ? categoryName.substring(0, 15) + '...' : categoryName}
                </button>
              );
            })
          }
        </div>

        {/* Products - 2 per row on mobile/tablet with arrows, 5 per row on desktop */}
        <div id="featured-products-panel" role="tabpanel" aria-label="Featured products" className="featured-products-panel" style={{ position: 'relative' }}>
          {/* Left Arrow - Mobile/Tablet only */}
          {!featuredLoading && featuredProducts.length > 2 && (
            <button
              onClick={() => {
                const container = document.getElementById('featured-scroll-container');
                if (container) {
                  const containerWidth = container.offsetWidth;
                  container.scrollBy({ left: -containerWidth, behavior: 'smooth' });
                }
              }}
              className="lg:hidden"
              style={{
                position: 'absolute',
                left: -12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.98)',
                border: '2px solid var(--color-brand-navy)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 24,
                fontWeight: 'bold',
                color: 'var(--color-brand-navy)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--color-brand-teal)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--color-brand-teal)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.98)';
                e.currentTarget.style.color = 'var(--color-brand-navy)';
                e.currentTarget.style.borderColor = 'var(--color-brand-navy)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Scroll left">
              ‹
            </button>
          )}

          {/* Right Arrow - Mobile/Tablet only */}
          {!featuredLoading && featuredProducts.length > 2 && (
            <button
              onClick={() => {
                const container = document.getElementById('featured-scroll-container');
                if (container) {
                  const containerWidth = container.offsetWidth;
                  container.scrollBy({ left: containerWidth, behavior: 'smooth' });
                }
              }}
              className="lg:hidden"
              style={{
                position: 'absolute',
                right: -12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.98)',
                border: '2px solid var(--color-brand-navy)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 24,
                fontWeight: 'bold',
                color: 'var(--color-brand-navy)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--color-brand-teal)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--color-brand-teal)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.98)';
                e.currentTarget.style.color = 'var(--color-brand-navy)';
                e.currentTarget.style.borderColor = 'var(--color-brand-navy)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Scroll right">
              ›
            </button>
          )}

        {featuredLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4" style={{ padding: '0 4px' }}>
            {[...Array(10)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No products found</p>
            <p style={{ fontSize: 14 }}>Try selecting a different category or check back later</p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet: 2 rows x 2 columns, horizontal scroll through all products */}
            <div
              id="featured-scroll-container"
              className="lg:hidden overflow-x-auto scrollbar-hide"
              style={{
                padding: '0 4px',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth',
                scrollSnapType: 'x mandatory'
              }}>
              <div style={{ 
                display: 'grid',
                gridTemplateRows: 'repeat(2, 1fr)',
                gridAutoFlow: 'column',
                gap: '12px',
                paddingBottom: '16px',
                width: 'max-content'
              }}>
                {featuredProducts.slice(0, 24).map((p, index) => (
                  <div 
                    key={p._id || index} 
                    className="product-card-item" 
                    style={{ 
                      width: 'calc((100vw - 64px) / 2)',
                      minWidth: '160px',
                      maxWidth: '200px',
                      scrollSnapAlign: index % 4 === 0 ? 'start' : 'none'
                    }}>
                    <ProductCard product={p} onClick={() => router.push(`/products/${p.slug || p._id}`)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: 5 products per row grid layout */}
            <div className="hidden lg:grid grid-cols-5 gap-5" style={{ padding: '0 4px' }}>
              {featuredProducts.slice(0, 25).map((p, index) => (
                <ProductCard key={p._id || index} product={p} onClick={() => router.push(`/products/${p.slug || p._id}`)} />
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </section>
  );
}
