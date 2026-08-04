'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useT } from '@/hooks/useT';
import { getProductCardImage } from '@/utils/cloudinary';
import RankingBadge from '@/components/ui/RankingBadge';
import { showToast } from '@/components/ui/Toast';

/**
 * BestSellingCard Component
 * 
 * Product card specifically designed for Best Selling Section with ranking badge,
 * optimized images, and interactive elements.
 * 
 * @param {Object} props
 * @param {Object} props.product - Product data object
 * @param {number} props.rank - Product ranking position (1-20)
 * @param {Function} [props.onClick] - Optional custom click handler
 * @param {Function} [props.onAddToCart] - Optional custom add to cart handler
 */
export default function BestSellingCard({ product, rank, onClick, onAddToCart }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const t = useT();
  const [imageError, setImageError] = useState(false);

  // Extract product data
  const imgRaw = product.images?.[0];
  const img = typeof imgRaw === 'string' ? imgRaw : imgRaw?.url;
  const optimizedImg = img && !imageError ? getProductCardImage(img) : null;
  
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const ratingVal = typeof product.rating === 'object' ? product.rating?.average : (product.rating || 0);
  const reviewCount = product.reviewCount || product.rating?.count || 0;
  
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const discount = product.discountPct || (oldPrice > price && oldPrice > 0
    ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);
  const hasDiscount = discount > 0 && oldPrice > price;
  const inStock = product.stock === undefined || product.stock > 0;
  const isTopThree = rank <= 3;

  // Handlers
  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    } else {
      router.push(`/products/${product.slug || product._id}`);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    try {
      if (onAddToCart) {
        await onAddToCart(product);
      } else {
        addToCart(product, 1);
        showToast(`${product.name} added to cart`, 'success');
      }
    } catch (error) {
      showToast('Failed to add to cart', 'error');
      console.error('Add to cart error:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      className="best-selling-card"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="article"
      tabIndex={0}
      aria-label={`Rank ${rank}: ${product.name}, price ${price > 0 ? `৳${price}` : 'contact for price'}`}
      style={{
        position: 'relative',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Ranking Badge - Positioned Above Card */}
      <div style={{
        position: 'absolute',
        top: '-12px',
        left: '12px',
        zIndex: 10,
      }}>
        <RankingBadge rank={rank} />
      </div>

      {/* Image Container */}
      <div style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        background: '#F9FAFB',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {optimizedImg ? (
          <Image
            src={optimizedImg}
            alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Best Seller Rank ${rank} — Price ৳${price > 0 ? price.toLocaleString() : 'on request'} Bangladesh`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            style={{ objectFit: 'cover' }}
            className="product-image"
            onError={() => setImageError(true)}
            loading="lazy"
            quality={85}
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

        {/* Best Seller Badge (Top 3) */}
        {isTopThree && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 8px rgba(255,107,107,0.3)',
          }}>
            Best Seller
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
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

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff',
              color: '#1F2937',
              fontSize: '13px',
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '8px',
              textTransform: 'uppercase',
            }}>
              Out of Stock
            </div>
          </div>
        )}

        {/* Quick Add Button (Shows on Hover) */}
        {inStock && (
          <button
            onClick={handleAddToCart}
            className="quick-add-button"
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
              zIndex: 5,
            }}
            aria-label={`Add ${product.name} to cart`}
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
        {/* Brand Name */}
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
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '40px',
          margin: '0 0 10px 0',
        }}>
          {product.name}
        </h3>

        {/* Rating */}
        {ratingVal > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '10px',
          }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                style={{
                  color: star <= Math.round(ratingVal) ? '#FBBF24' : '#E5E7EB',
                  fontSize: '13px',
                }}
              >
                ★
              </span>
            ))}
            <span style={{ fontSize: '10px', color: '#9CA3AF', marginLeft: '2px' }}>
              ({reviewCount})
            </span>
          </div>
        )}

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
              {price > 0 ? `৳${price.toLocaleString()}` : t('common.contactForPrice')}
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

      {/* Hover & Focus Styles */}
      <style jsx>{`
        .best-selling-card:hover {
          border-color: var(--color-brand-teal) !important;
          box-shadow: 0 10px 30px rgba(11, 37, 69, 0.15) !important;
          transform: translateY(-4px) !important;
        }

        .best-selling-card:focus-visible {
          outline: 3px solid var(--color-brand-teal);
          outline-offset: 2px;
        }

        .best-selling-card:hover .product-image {
          transform: scale(1.1);
        }

        .product-image {
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .best-selling-card:hover .quick-add-button {
          opacity: 1 !important;
        }

        .quick-add-button:hover {
          background: var(--color-brand-teal-hover) !important;
          transform: translateX(-50%) scale(1.05) !important;
        }

        .quick-add-button:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 2px;
        }

        /* Mobile: Always show add button */
        @media (max-width: 640px) {
          .quick-add-button {
            opacity: 1 !important;
            position: static !important;
            transform: none !important;
            margin-top: 8px;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
