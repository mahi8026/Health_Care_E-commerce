import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useCompare } from '@/context/CompareContext';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/hooks/useT';
import WishlistButton from './wishlist/WishlistButton';
import RatingStars from '@/components/ui/RatingStars';
import { getProductPriceDisplay } from '@/utils/pricing';

const ProductCard = React.memo(function ProductCard({ product, onProductClick, showStockBadge = false, showFeaturedBadge = false, showCategory = false }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleCompare, isInCompare } = useCompare();
  const { user } = useAuth();
  const t = useT();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);
  
  // IntersectionObserver for lazy rendering
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible
        }
      },
      { 
        rootMargin: '150px', // Load 150px before entering viewport
        threshold: 0.01 
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);
  // Compute primary image from product.images array - handle both old and new formats
  const imageData = product.images?.find(img => typeof img === 'object' && img.isPrimary) || product.images?.[0];
  const primaryImage = imageData ? {
    url: typeof imageData === 'string' ? imageData : imageData.url,
    alt: typeof imageData === 'object' ? imageData.alt : product.name
  } : null;

  // Calculate B2B pricing if user is eligible
  const category = typeof product.category === 'object' ? product.category : null;
  const priceDisplay = getProductPriceDisplay(product, user, category);

  // Calculate savings and discount percentage (from oldPrice or B2B discount)
  const price = priceDisplay.price || 0;
  const oldPrice = product.oldPrice || 0;
  
  // Show B2B savings if applicable, otherwise show regular discount
  const savings = priceDisplay.isB2BPrice 
    ? priceDisplay.savings 
    : (oldPrice > price ? oldPrice - price : 0);
  
  const discountPercent = priceDisplay.isB2BPrice
    ? priceDisplay.discountPct
    : (oldPrice > 0 ? Math.round((savings / oldPrice) * 100) : 0);
  
  const hasDiscount = savings > 0 && discountPercent > 0;

  // Check if product is in compare list
  const inCompareList = isInCompare(product._id || product.id);

  // Handle add to cart
  const handleAddToCart = useCallback(async (e) => {
    e.stopPropagation(); // Prevent card click
    setAddingToCart(true);
    try {
      addToCart(product, 1);
      // Show brief success feedback
      setTimeout(() => setAddingToCart(false), 1000);
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Error adding to cart:', error);
      setAddingToCart(false);
    }
  }, [addToCart, product]);

  // Handle compare toggle
  const handleCompareToggle = useCallback((e) => {
    e.stopPropagation(); // Prevent card click
    setIsComparing(true);
    try {
      toggleCompare(product);
      setTimeout(() => setIsComparing(false), 500);
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Error toggling compare:', error);
      setIsComparing(false);
    }
  }, [toggleCompare, product]);

  // Handle view details — always navigate to slug for canonical SEO URLs
  const handleViewDetails = useCallback((e) => {
    e.stopPropagation();
    const productSlug = product.slug || product._id || product.id;
    if (onProductClick) {
      onProductClick(productSlug);
    } else {
      router.push(`/products/${productSlug}`);
    }
  }, [product, onProductClick, router]);

  // Handle card click
  const handleCardClick = useCallback(() => {
    const productSlug = product.slug || product._id || product.id;
    if (onProductClick) {
      onProductClick(productSlug);
    } else {
      router.push(`/products/${productSlug}`);
    }
  }, [product, onProductClick, router]);

  return (
    <div 
      ref={cardRef}
      role="link"
      tabIndex={0}
      aria-label={`${product.name} — view details`}
      className="group bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-md overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 ease-out cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1"
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Image Container - Extra compact on mobile: 3:2, desktop: 4:3 */}
      <div className="aspect-[3/2] sm:aspect-[4/3] w-full bg-[var(--color-background-secondary)] flex items-center justify-center relative flex-shrink-0 overflow-hidden">
        {isVisible && primaryImage ? (
          <>
            <Image
              src={primaryImage.url}
              alt={`${product.name}${typeof product.brand === 'string' && product.brand ? ` — ${product.brand}` : typeof product.brand === 'object' && product.brand?.name ? ` — ${product.brand.name}` : ''} — Price ৳${product.price?.toLocaleString() || ''} Bangladesh`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-200 ease-out"
              loading="lazy"
              decoding="async"
              unoptimized={!primaryImage.url.includes('res.cloudinary.com')}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                if (fallback) {
                  fallback.classList.remove('hidden');
                  fallback.classList.add('flex');
                }
              }}
            />
            {/* Fallback shown when image fails to load */}
            <div className="image-fallback hidden absolute inset-0 items-center justify-center text-5xl text-[var(--color-text-tertiary)] bg-[var(--color-background-tertiary)]">
              🏥
            </div>
          </>
        ) : !isVisible ? (
          /* Skeleton placeholder while not in viewport */
          <div className="w-full h-full bg-gradient-to-r from-[var(--color-background-tertiary)] via-[var(--color-background-muted)] to-[var(--color-background-tertiary)] animate-pulse" />
        ) : (
          /* Fallback shown when no image exists */
          <div className="flex items-center justify-center w-full h-full text-5xl text-[var(--color-text-tertiary)] bg-[var(--color-background-tertiary)]">
            🏥
          </div>
        )}
        
        {/* Save Badge - Top Left - Compact version */}
        {hasDiscount && (
          <div className="absolute top-1 left-1 bg-[#7C3AED] text-white px-1.5 py-0.5 rounded text-[10px] font-semibold shadow-sm">
            -{discountPercent}%
          </div>
        )}
        
        {/* Other Badges - Compact */}
        <div className="absolute top-1 left-1 flex flex-col gap-0.5" style={{ marginTop: hasDiscount ? '20px' : '0' }}>
          {product.badges?.map((badge, idx) => (
            <span key={idx} className={`text-[10px] px-1 py-0.5 rounded font-medium ${badge.className}`}>
              {badge.text}
            </span>
          ))}
          {showFeaturedBadge && product.isFeatured && !hasDiscount && (
            <span className="bg-warning text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm">
              ⭐
            </span>
          )}
        </div>

        {/* Stock badge - Top Right (optional) - Compact */}
        {showStockBadge && (
          <div className={`absolute top-1 right-7 px-1.5 py-0.5 rounded text-[10px] font-semibold shadow-sm ${
            product.stock > 0 ? 'bg-[var(--color-status-success-tint)] text-white' : 'bg-[var(--color-status-danger-tint)] text-white'
          }`}>
            {product.stock > 0 ? `${product.stock > 99 ? '99+' : product.stock}` : 'Out'}
          </div>
        )}
        
        {/* Wishlist Button - Top Right - Compact */}
        <div className="absolute top-1 right-1 flex gap-0.5">
          <WishlistButton productId={product._id || product.id} size="small" />
          {/* Compare Button - Compact */}
          <button
            onClick={handleCompareToggle}
            disabled={isComparing}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm ${
              inCompareList
                ? 'bg-[#7C3AED] text-white'
                : 'bg-white/90 text-[var(--color-text-secondary)] hover:bg-white'
            }`}
            title={inCompareList ? 'Remove from compare' : 'Add to compare'}
            aria-label={inCompareList ? 'Remove from compare' : 'Add to compare'}
            aria-pressed={inCompareList}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Content - Extra Compact on Mobile */}
      <div className="p-1.5 sm:p-2 flex-1 flex flex-col">
        {/* Category (optional) + Brand */}
        {showCategory && (
          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
            <span className="text-[10px] font-semibold text-brand-teal uppercase tracking-wide">
              {typeof product.category === 'object' ? product.category?.name : product.category}
            </span>
            <span className="text-[var(--color-text-tertiary)] text-[10px]">·</span>
          </div>
        )}
        {/* Brand - Extra Compact */}
        <div className="text-[9px] sm:text-[10px] text-brand-teal font-medium uppercase tracking-wide mb-0.5">
          {typeof product.brand === 'object' ? product.brand?.name : product.brand}
        </div>
        
        {/* Product Name - Compact with 2 lines */}
        <div className="text-[11px] sm:text-xs font-medium leading-tight text-[var(--color-text-primary)] mb-0.5 sm:mb-1 flex-1 line-clamp-2 min-h-[2rem] sm:min-h-[2.25rem]">
          {product.name}
        </div>
        
        {/* Rating - Extra Compact */}
        <div className="mb-1 sm:mb-1.5">
          <RatingStars rating={product.rating || 0} count={product.reviews} size="sm" />
        </div>
        
        {/* Price - Extra Compact with B2B indicator */}
        <div className="flex flex-col gap-0.5 mb-1 sm:mb-1.5">
          <div className="flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-lora)] text-sm sm:text-sm font-bold text-brand-navy">
              {priceDisplay.formatted}
            </span>
            {priceDisplay.showOriginalPrice && (
              <span className="text-[10px] text-[var(--color-text-secondary)] line-through">
                {priceDisplay.originalPriceFormatted}
              </span>
            )}
            {!priceDisplay.isB2BPrice && product.oldPrice && (
              <span className="text-[10px] text-[var(--color-text-secondary)] line-through">
                {product.oldPrice}
              </span>
            )}
          </div>
          {/* B2B Price Badge - Compact */}
          {priceDisplay.isB2BPrice && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-[#7C3AED] font-semibold bg-purple-50 px-1.5 py-0.5 rounded-full w-fit">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/>
              </svg>
              B2B
            </span>
          )}
        </div>
        
        {/* Stock Status - Extra Compact */}
        <div className="flex items-center gap-0.5 sm:gap-1 mb-1 sm:mb-1.5">
          <div className="w-1 h-1 sm:w-1 sm:h-1 rounded-full bg-[#639922] flex-shrink-0"></div>
          <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)]">{product.stock}</span>
        </div>
        
        {/* Action Buttons - Extra Compact on mobile */}
        <div className="grid grid-cols-2 gap-0.5 sm:gap-1">
          <button 
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="relative overflow-hidden bg-brand-navy text-white border-none px-1.5 sm:px-2 py-1 sm:py-1.5 rounded text-[10px] sm:text-[11px] font-medium cursor-pointer hover:bg-[var(--color-brand-navy-hover)] active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-0.5 sm:gap-1"
          >
            {addingToCart ? (
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
                <span className="hidden sm:inline">{t('products.addToCart')}</span>
                <span className="sm:hidden">Add</span>
              </>
            )}
          </button>
          <button 
            onClick={handleViewDetails}
            className="bg-transparent text-brand-navy border border-brand-navy px-1.5 sm:px-2 py-1 sm:py-1.5 rounded text-[10px] sm:text-[11px] font-medium cursor-pointer hover:bg-[var(--color-background-secondary)] active:scale-95 transition-all duration-150"
          >
            <span className="hidden sm:inline">{t('products.viewDetails')}</span>
            <span className="sm:hidden">View</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
