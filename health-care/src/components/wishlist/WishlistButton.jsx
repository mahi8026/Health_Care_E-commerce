'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

export default function WishlistButton({ productId, className = '', size = 'default' }) {
  const router = useRouter();
  const { isInWishlist, toggleWishlist, wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // If no productId provided, render as header icon with badge
  if (!productId) {
    return (
      <button
        onClick={() => router.push('/wishlist')}
        aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist'}
        className="w-8 h-8 rounded-[7px] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] flex items-center justify-center cursor-pointer relative hover:bg-[var(--color-background-secondary)] transition-colors"
        title={wishlistCount > 0 ? `${wishlistCount} items in wishlist` : 'Wishlist'}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        {wishlistCount > 0 && (
          <div aria-hidden="true" className="absolute -top-[5px] -right-[5px] bg-[#E24B4A] text-white text-[8px] w-[14px] h-[14px] rounded-full flex items-center justify-center border-[1.5px] border-[var(--color-background-primary)]">
            {wishlistCount}
          </div>
        )}
      </button>
    );
  }

  // Product-specific wishlist toggle button
  const inWishlist = isInWishlist(productId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    const result = await toggleWishlist(productId);
    setIsLoading(false);

    if (!result.success && result.requiresLogin) {
      router.push('/login');
    }
  };

  const sizeClasses = {
    small: 'w-[26px] h-[26px]',
    default: 'w-[32px] h-[32px]',
    large: 'w-[40px] h-[40px]'
  };

  const iconSizes = {
    small: 12,
    default: 14,
    large: 16
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`${sizeClasses[size]} rounded-full bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-background-secondary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isLoading ? (
        <svg className="animate-spin" width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
        </svg>
      ) : (
        <svg 
          width={iconSizes[size]} 
          height={iconSizes[size]} 
          viewBox="0 0 24 24" 
          fill={inWishlist ? '#E24B4A' : 'none'} 
          stroke={inWishlist ? '#E24B4A' : 'currentColor'} 
          strokeWidth="1.5"
        >
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      )}
    </button>
  );
}
