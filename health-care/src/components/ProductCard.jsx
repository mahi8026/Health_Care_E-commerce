import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useCompare } from '@/context/CompareContext';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/hooks/useT';
import WishlistButton from './wishlist/WishlistButton';
import { getProductPriceDisplay } from '@/utils/pricing';

const ProductCard = React.memo(function ProductCard({ product, onProductClick }) {
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
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Error adding to cart:', error);
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
      className="group bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[10px] overflow-hidden flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 ease-out cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image Container - Responsive Height with hover zoom */}
      <div className="h-[140px] sm:h-[160px] md:h-[130px] bg-[var(--color-background-secondary)] flex items-center justify-center relative flex-shrink-0 overflow-hidden">
        {isVisible && primaryImage ? (
          <>
            <Image
              src={primaryImage.url}
              alt={`${product.name}${typeof product.brand === 'string' && product.brand ? ` — ${product.brand}` : typeof product.brand === 'object' && product.brand?.name ? ` — ${product.brand.name}` : ''} — Price ৳${product.price?.toLocaleString() || ''} Bangladesh`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
              className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
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
            <div className="image-fallback hidden absolute inset-0 items-center justify-center text-[40px] text-[#9CA3AF] bg-[#F3F4F6]">
              🏥
            </div>
          </>
        ) : !isVisible ? (
          /* Skeleton placeholder while not in viewport */
          <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
        ) : (
          /* Fallback shown when no image exists */
          <div className="flex items-center justify-center w-full h-full text-[40px] text-[#9CA3AF] bg-[#F3F4F6]">
            🏥
          </div>
        )}
        
        {/* Save Badge - Top Left - Responsive with entrance animation */}
        {hasDiscount && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#7C3AED] text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md shadow-md animate-bounce-in">
            <span className="text-[9px] sm:text-[11px] font-semibold">
              {priceDisplay.isB2BPrice ? 'B2B Save' : 'Save'}: {savings.toLocaleString()}৳ (-{discountPercent}%)
            </span>
          </div>
        )}
        
        {/* Other Badges */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1" style={{ marginTop: hasDiscount ? '32px' : '0' }}>
          {product.badges?.map((badge, idx) => (
            <span key={idx} className={`text-[8px] sm:text-[9px] px-[6px] py-[2px] sm:px-[7px] sm:py-[3px] rounded font-medium ${badge.className}`}>
              {badge.text}
            </span>
          ))}
        </div>
        
        {/* Wishlist Button - Top Right */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1">
          <WishlistButton productId={product._id || product.id} size="small" />
          {/* Compare Button */}
          <button
            onClick={handleCompareToggle}
            disabled={isComparing}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
              inCompareList
                ? 'bg-[#7C3AED] text-white'
                : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
            title={inCompareList ? 'Remove from compare' : 'Add to compare'}
            aria-label={inCompareList ? 'Remove from compare' : 'Add to compare'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Content - Responsive Padding */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
        {/* Brand */}
        <div className="text-[8px] sm:text-[9px] text-[#0E8A6E] font-medium uppercase tracking-[0.5px] mb-[3px]">
          {typeof product.brand === 'object' ? product.brand?.name : product.brand}
        </div>
        
        {/* Product Name - Responsive Font */}
        <div className="text-[11px] sm:text-[12px] font-medium leading-[1.35] text-[var(--color-text-primary)] mb-[6px] flex-1 line-clamp-2">
          {product.name}
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex gap-[1px]">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`w-[11px] h-[11px] sm:w-[12px] sm:h-[12px] ${i < product.rating ? 'bg-[#F59E0B]' : 'bg-[var(--color-border-secondary)]'}`} 
                style={{ clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }}
              ></div>
            ))}
          </div>
          <span className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)]">({product.reviews})</span>
        </div>
        
        {/* Price - Responsive Font with B2B indicator */}
        <div className="flex flex-col gap-1 mb-[10px]">
          <div className="flex items-baseline gap-[6px]">
            <span className="font-[family-name:var(--font-lora)] text-[15px] sm:text-[16px] text-[#0B2545] font-semibold">
              {priceDisplay.formatted}
            </span>
            {priceDisplay.showOriginalPrice && (
              <span className="text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] line-through">
                {priceDisplay.originalPriceFormatted}
              </span>
            )}
            {!priceDisplay.isB2BPrice && product.oldPrice && (
              <span className="text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] line-through">
                {product.oldPrice}
              </span>
            )}
            {product.discount && !priceDisplay.isB2BPrice && (
              <span className="text-[9px] sm:text-[10px] text-[#0E8A6E] font-medium">
                {product.discount}
              </span>
            )}
          </div>
          {/* B2B Price Badge */}
          {priceDisplay.isB2BPrice && (
            <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] text-[#7C3AED] font-semibold bg-purple-50 px-2 py-0.5 rounded-full w-fit">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/>
              </svg>
              B2B Price
            </span>
          )}
        </div>
        
        {/* Stock Status */}
        <div className="flex items-center gap-[5px] mb-[10px]">
          <div className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-full bg-[#639922] flex-shrink-0"></div>
          <span className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)]">{product.stock}</span>
        </div>
        
        {/* Action Buttons - Responsive with enhanced interactions */}
        <div className="grid grid-cols-2 gap-[5px] sm:gap-[6px]">
          <button 
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="relative overflow-hidden bg-[#0B2545] text-white border-none px-2 py-1.5 sm:py-2 rounded-[7px] text-[10px] sm:text-[11px] font-medium cursor-pointer font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0d2d52] hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1 group/btn"
          >
            {/* Ripple effect container */}
            <span className="absolute inset-0 overflow-hidden">
              <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-pulse-glow"></span>
            </span>
            <span className="relative flex items-center gap-1">
              {addingToCart ? (
                <>
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span className="hidden sm:inline">{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden sm:inline group-hover/btn:animate-cart-bounce">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                  </svg>
                  {t('products.addToCart')}
                </>
              )}
            </span>
          </button>
          <button 
            onClick={handleViewDetails}
            className="bg-transparent text-[#0B2545] border-[0.5px] border-[#0B2545] px-2 py-1.5 sm:py-2 rounded-[7px] text-[10px] sm:text-[11px] cursor-pointer font-[family-name:var(--font-plus-jakarta)] hover:bg-gray-50 hover:border-[#0d2d52] active:scale-95 transition-all duration-200"
          >
            {t('products.viewDetails')}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
