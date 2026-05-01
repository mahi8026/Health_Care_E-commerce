'use client';

import { useState } from 'react';
import { FaHeart } from 'react-icons/fa';

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
        className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center cursor-pointer relative hover:bg-gray-50 transition-colors group"
      >
        <FaHeart size={14} className="text-gray-700 group-hover:text-[#E24B4A] transition-colors" />
        
        {/* Badge for wishlist count (placeholder) */}
        {/* Uncomment when wishlist is implemented
        {wishlistCount > 0 && (
          <div 
            aria-hidden="true" 
            className="absolute -top-[5px] -right-[5px] bg-[#E24B4A] text-white text-[8px] w-[14px] h-[14px] rounded-full flex items-center justify-center border-[1.5px] border-white"
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
