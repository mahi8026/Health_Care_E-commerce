'use client';

import { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import GA4Tracker from '@/services/GA4Tracker';

export default function FloatingCartButton({ onClick }) {
  const { getCartCount, getCartTotal } = useCart();
  const [bounce, setBounce] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  useEffect(() => {
    (async () => {
      if (cartCount > prevCount && cartCount > 0) {
        setBounce(true);
        setTimeout(() => setBounce(false), 600);
      }
      setPrevCount(cartCount);
    })();
  }, [cartCount, prevCount]);

  if (cartCount === 0) return null;

  const handleClick = () => {
    GA4Tracker.trackEvent('cart_sidebar_open', { trigger: 'floating_button', item_count: cartCount, cart_value: cartTotal });
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed top-[110px] right-4 md:right-5 z-dropdown transition-all duration-300 hover:scale-105 active:scale-95 ${bounce ? 'animate-bounce-cart' : ''}`}
      style={{
        background: 'rgba(11,37,69,0.72)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(1.1)',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(1.1)',
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
          <FaShoppingCart size={18} style={{ color: 'var(--color-brand-teal-light)' }} />
          <span className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: 'linear-gradient(135deg,var(--color-brand-teal-light),var(--color-brand-teal))', color: '#fff', boxShadow: '0 2px 6px rgba(14,138,110,0.5)' }}>
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        </div>

        {/* Total */}
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cart Total</span>
          <span className="text-sm font-semibold leading-none text-white">৳{cartTotal.toLocaleString()}</span>
        </div>
      </div>
    </button>
  );
}
