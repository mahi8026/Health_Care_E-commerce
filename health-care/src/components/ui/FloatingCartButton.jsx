'use client';

import { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';

export default function FloatingCartButton({ onClick }) {
  const { getCartCount, getCartTotal } = useCart();
  const [bounce, setBounce] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  // Bounce animation when items added
  useEffect(() => {
    if (cartCount > prevCount && cartCount > 0) {
      setBounce(true);
      setTimeout(() => setBounce(false), 600);
    }
    setPrevCount(cartCount);
  }, [cartCount, prevCount]);

  if (cartCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className={`fixed top-[120px] right-4 md:right-6 z-[950] bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] hover:from-[#FF5722] hover:to-[#FF7B2E] text-white rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 ${
        bounce ? 'animate-bounce-cart' : ''
      }`}
      aria-label={`Shopping cart with ${cartCount} items`}
    >
      <style jsx>{`
        @keyframes bounce-cart {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .animate-bounce-cart {
          animation: bounce-cart 0.5s ease;
        }
      `}</style>
      
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Cart Icon with Badge */}
        <div className="relative">
          <FaShoppingCart size={20} />
          <span className="absolute -top-2 -right-2 bg-white text-[#FF6B35] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        </div>

        {/* Total Amount */}
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-medium opacity-90">Cart Total</span>
          <span className="text-[15px] font-bold leading-none">
            ৳{cartTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </button>
  );
}
