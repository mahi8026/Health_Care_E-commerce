'use client';

import { useState } from 'react';

export default function WishlistButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    // TODO: Implement wishlist functionality
    // For now, show a professional message
    alert('Wishlist feature is coming soon! 💝\n\nYou\'ll be able to:\n• Save your favorite products\n• Get notified about price drops\n• Share your wishlist with colleagues');
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Wishlist"
        className="w-8 h-8 rounded-[7px] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] flex items-center justify-center cursor-pointer relative hover:bg-[var(--color-background-secondary)] transition-colors group"
      >
        <svg 
          width="13" 
          height="13" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          aria-hidden="true"
          className="group-hover:stroke-[#E24B4A] transition-colors"
        >
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        
        {/* Badge for wishlist count (placeholder) */}
        {/* Uncomment when wishlist is implemented
        {wishlistCount > 0 && (
          <div 
            aria-hidden="true" 
            className="absolute -top-[5px] -right-[5px] bg-[#E24B4A] text-white text-[8px] w-[14px] h-[14px] rounded-full flex items-center justify-center border-[1.5px] border-[var(--color-background-primary)]"
          >
            {wishlistCount}
          </div>
        )}
        */}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#0B2545] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
          Wishlist (Coming Soon)
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0B2545] rotate-45"></div>
        </div>
      )}
    </div>
  );
}
