import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import WishlistButton from './wishlist/WishlistButton';

const ProductCard = React.memo(function ProductCard({ product, onProductClick }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  // Compute primary image from product.images array - handle both old and new formats
  const imageData = product.images?.find(img => typeof img === 'object' && img.isPrimary) || product.images?.[0];
  const primaryImage = imageData ? {
    url: typeof imageData === 'string' ? imageData : imageData.url,
    alt: typeof imageData === 'object' ? imageData.alt : product.name
  } : null;

  // Calculate savings and discount percentage
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const savings = oldPrice > price ? oldPrice - price : 0;
  const discountPercent = oldPrice > 0 ? Math.round((savings / oldPrice) * 100) : 0;
  const hasDiscount = savings > 0 && discountPercent > 0;

  // Handle add to cart
  const handleAddToCart = useCallback(async (e) => {
    e.stopPropagation(); // Prevent card click
    setAddingToCart(true);
    try {
      addToCart(product, 1);
      // Show brief success feedback
      setTimeout(() => setAddingToCart(false), 1000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setAddingToCart(false);
    }
  }, [addToCart, product]);

  // Handle view details
  const handleViewDetails = useCallback((e) => {
    e.stopPropagation();
    const productId = product._id || product.id;
    if (onProductClick) {
      onProductClick(productId);
    } else {
      router.push(`/products/${productId}`);
    }
  }, [product, onProductClick, router]);

  // Handle card click
  const handleCardClick = useCallback(() => {
    const productId = product._id || product.id;
    if (onProductClick) {
      onProductClick(productId);
    } else {
      router.push(`/products/${productId}`);
    }
  }, [product, onProductClick, router]);

  return (
    <div 
      className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[10px] overflow-hidden flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image Container - Responsive Height */}
      <div className="h-[140px] sm:h-[160px] md:h-[130px] bg-[var(--color-background-secondary)] flex items-center justify-center relative flex-shrink-0 overflow-hidden">
        {primaryImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
            />
            {/* Fallback shown when image fails to load */}
            <div className="hidden absolute inset-0 items-center justify-center text-[40px] text-[#9CA3AF] bg-[#F3F4F6]">
              🏥
            </div>
          </>
        ) : (
          /* Fallback shown when no image exists */
          <div className="flex items-center justify-center w-full h-full text-[40px] text-[#9CA3AF] bg-[#F3F4F6]">
            🏥
          </div>
        )}
        
        {/* Save Badge - Top Left - Responsive */}
        {hasDiscount && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#7C3AED] text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md shadow-md">
            <span className="text-[9px] sm:text-[11px] font-semibold">
              Save: {savings.toLocaleString()}৳ (-{discountPercent}%)
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
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
          <WishlistButton productId={product._id || product.id} size="small" />
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
                className={`w-[9px] h-[9px] sm:w-[10px] sm:h-[10px] ${i < product.rating ? 'bg-[#F59E0B]' : 'bg-[var(--color-border-secondary)]'}`} 
                style={{ clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }}
              ></div>
            ))}
          </div>
          <span className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)]">({product.reviews})</span>
        </div>
        
        {/* Price - Responsive Font */}
        <div className="flex items-baseline gap-[6px] mb-[10px]">
          <span className="font-[family-name:var(--font-lora)] text-[15px] sm:text-[16px] text-[#0B2545] font-semibold">
            {product.price}
          </span>
          {product.oldPrice && (
            <span className="text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] line-through">
              {product.oldPrice}
            </span>
          )}
          {product.discount && (
            <span className="text-[9px] sm:text-[10px] text-[#0E8A6E] font-medium">
              {product.discount}
            </span>
          )}
        </div>
        
        {/* Stock Status */}
        <div className="flex items-center gap-[5px] mb-[10px]">
          <div className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-full bg-[#639922] flex-shrink-0"></div>
          <span className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)]">{product.stock}</span>
        </div>
        
        {/* Action Buttons - Responsive */}
        <div className="grid grid-cols-2 gap-[5px] sm:gap-[6px]">
          <button 
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="bg-[#0B2545] text-white border-none px-2 py-1.5 sm:py-2 rounded-[7px] text-[10px] sm:text-[11px] font-medium cursor-pointer font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0d2d52] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {addingToCart ? (
              <>
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="hidden sm:inline">Adding...</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden sm:inline">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
                Add to Cart
              </>
            )}
          </button>
          <button 
            onClick={handleViewDetails}
            className="bg-transparent text-[#0B2545] border-[0.5px] border-[#0B2545] px-2 py-1.5 sm:py-2 rounded-[7px] text-[10px] sm:text-[11px] cursor-pointer font-[family-name:var(--font-plus-jakarta)] hover:bg-gray-50 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
