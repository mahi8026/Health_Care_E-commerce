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
      className={`fixed top-[110px] right-4 md:right-5 z-[950] transition-all duration-300 hover:scale-105 active:scale-95 ${bounce ? 'animate-bounce-cart' : ''}`}
      style={{
        background: 'rgba(11,37,69,0.72)',
        backdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
        border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: '1rem',
        boxShadow: '0 8px 32px rgba(11,37,69,0.28), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.08)',
      }}
      aria-label={`Shopping cart with ${cartCount} items`}
    >
      <style jsx>{`
        @keyframes bounce-cart {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        .animate-bounce-cart { animation: bounce-cart 0.5s ease; }
      `}</style>

      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Icon + badge */}
        <div className="relative">
          <FaShoppingCart size={18} style={{ color: '#4ddbb8' }} />
          <span className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold"
            style={{ background: 'linear-gradient(135deg,#4ddbb8,#0E8A6E)', color: '#fff', boxShadow: '0 2px 6px rgba(14,138,110,0.5)' }}>
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        </div>

        {/* Total */}
        <div className="flex flex-col items-start">
          <span className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cart Total</span>
          <span className="text-[14px] font-bold leading-none text-white">৳{cartTotal.toLocaleString()}</span>
        </div>
      </div>
    </button>
  );
}
