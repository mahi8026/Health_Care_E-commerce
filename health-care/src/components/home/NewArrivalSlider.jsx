'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AutoSlider from '@/components/ui/AutoSlider';
import { getProductCardImage } from '@/utils/cloudinary';
import { useCart } from '@/context/CartContext';
import { useT } from '@/hooks/useT';
import getHomeDataOnce from '@/utils/homeDataClient';

/**
 * NewArrivalSlider Component - Matches GoWell BD Design
 *
 * Displays new arrival products in an auto-scrolling horizontal slider
 * with "New" badges and pricing information.
 */
export default function NewArrivalSlider({ products: productsProp = [] }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const t = useT();

  const [products, setProducts] = useState(productsProp);
  const needsFetchRef = useRef(productsProp.length === 0);

  // Self-fetch when mounted without data: this component mounts inside a
  // LazyMount below the fold, so the request (shared one-shot /home/data)
  // only happens when the user actually scrolls near it.
  useEffect(() => {
    if (!needsFetchRef.current) return undefined;
    let mounted = true;
    getHomeDataOnce().then((data) => {
      if (mounted && data && Array.isArray(data.newArrivals) && data.newArrivals.length > 0) {
        setProducts(data.newArrivals);
      }
    });
    return () => { mounted = false; };
  }, []);

  if (!products || products.length === 0) {
    return null;
  }

  const handleProductClick = (product) => {
    router.push(`/products/${product.slug || product._id}`);
  };

  return (
    <section style={{ padding: '32px 0', background: '#fff' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
        {/* Section Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: 700, 
              color: 'var(--color-brand-navy)',
              marginBottom: '8px',
              fontFamily: 'Lora, serif'
            }}>
              New Arrival
            </h2>
            <div style={{
              width: '60px',
              height: '4px',
              background: 'var(--color-brand-teal)',
              borderRadius: '2px'
            }} />
          </div>
          
          <button
            onClick={() => router.push('/products?sort=newest')}
            style={{
              padding: '10px 24px',
              background: 'transparent',
              border: '2px solid var(--color-brand-teal)',
              borderRadius: '8px',
              color: 'var(--color-brand-teal)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-brand-teal)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-brand-teal)';
            }}
          >
            See All Products
          </button>
        </div>

        {/* Auto Slider */}
        <AutoSlider
          autoPlayInterval={4000}
          itemsToShow={6}
          itemsToScroll={1}
          gap="16px"
          pauseOnHover={true}
          showArrows={true}
          loop={true}
        >
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onClick={() => handleProductClick(product)}
              onAddToCart={() => addToCart(product, 1)}
              t={t}
            />
          ))}
        </AutoSlider>
      </div>
    </section>
  );
}

/**
 * ProductCard Component - GoWell BD Style
 */
function ProductCard({ product, onClick, onAddToCart, t }) {
  const imgRaw = product.images?.[0];
  const img = typeof imgRaw === 'string' ? imgRaw : imgRaw?.url;
  const optimizedImg = img ? getProductCardImage(img) : null;
  
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const discount = product.discountPct || (oldPrice > price && oldPrice > 0
    ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);
  const hasDiscount = discount > 0 && oldPrice > price;
  const inStock = product.stock === undefined || product.stock > 0;
  // unoptimized + error fallback — see FeaturedProductsSection rationale.
  const [imgError, setImgError] = useState(false);
  
  // Check if product is new (within last 30 days)
  const isNew = product.createdAt 
    ? (new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24) < 30
    : false;

  return (
    <div
      onClick={onClick}
      className="group new-arrival-card"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,29,93,0.15)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--color-brand-teal)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#E5E7EB';
      }}
    >
      {/* Image Container */}
      <div style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        background: '#F9FAFB',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {optimizedImg && !imgError ? (
          <Image
            src={optimizedImg}
            alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Price ৳${price > 0 ? price.toLocaleString() : 'on request'} Bangladesh`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            style={{ objectFit: 'cover' }}
            className="group-hover:scale-110 transition-transform duration-500"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '48px',
            color: '#CBD5E1'
          }}>
            🏥
          </div>
        )}

        {/* New Badge - Top Left */}
        {isNew && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
          }}>
            New
          </div>
        )}

        {/* Discount Badge - Top Right */}
        {hasDiscount && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
          }}>
            -{discount}%
          </div>
        )}

        {/* Out of Stock Badge */}
        {!inStock && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: '8px',
            textTransform: 'uppercase',
          }}>
            Out of Stock
          </div>
        )}

        {/* Quick Add Button - Shows on Hover */}
        {inStock && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
            className="quick-add-btn"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--color-brand-teal)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: 0,
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(16,152,152,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-brand-teal-hover)';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-brand-teal)';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            }}
          >
            + Add to Cart
          </button>
        )}
      </div>

      {/* Product Info */}
      <div style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        {/* Brand */}
        {brandName && (
          <div style={{
            fontSize: '10px',
            color: 'var(--color-brand-teal)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '6px',
          }}>
            {brandName}
          </div>
        )}

        {/* Product Name */}
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          lineHeight: '1.4',
          color: '#1F2937',
          marginBottom: '10px',
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '40px',
        }}>
          {product.name}
        </h3>

        {/* Price */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginTop: 'auto',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--color-brand-navy)',
            }}>
              {price > 0 ? `৳${price.toLocaleString()}` : 'Contact for Price'}
            </span>
            {hasDiscount && (
              <span style={{
                fontSize: '12px',
                color: '#9CA3AF',
                textDecoration: 'line-through',
              }}>
                ৳{oldPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Effect Styles */}
      <style jsx>{`
        .new-arrival-card:hover .quick-add-btn {
          opacity: 1 !important;
        }

        @media (max-width: 640px) {
          section {
            padding: 24px 0 !important;
          }
          
          .quick-add-btn {
            opacity: 1 !important;
            position: static !important;
            transform: none !important;
            margin-top: 8px;
            width: 100%;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1023px) {
          section {
            padding: 32px 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
