'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaTimes, FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import GA4Tracker from '@/services/GA4Tracker';

export default function CartSidebar({ isOpen, onClose }) {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCart();

  const subtotal = getCartTotal();
  const freeDeliveryThreshold = 50000;
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  // Track open/close
  useEffect(() => {
    if (isOpen) {
      GA4Tracker.trackEvent('cart_sidebar_open', { item_count: getCartCount(), cart_value: subtotal });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    GA4Tracker.trackEvent('cart_sidebar_checkout_click', { item_count: getCartCount(), cart_value: subtotal });
    onClose();
    router.push('/checkout');
  };
  const handleViewCart = () => {
    GA4Tracker.trackEvent('cart_sidebar_view_cart_click', { item_count: getCartCount() });
    onClose();
    router.push('/cart');
  };

  const getImageUrl = (item) => {
    if (!item.images?.length) return null;
    const img = item.images[0];
    const url = typeof img === 'string' ? img : img?.url;
    return url?.startsWith('http') ? url : null;
  };

  return (
    <>
      {/* Backdrop — blurred glass */}
      <div
        className={`fixed inset-0 z-drawer transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backdropFilter: isOpen ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' : 'none', background: 'rgba(11,37,69,0.35)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[400px] z-drawer flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(1.04)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(1.04)',
          borderLeft: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '-8px 0 48px rgba(11,37,69,0.18), -1px 0 0 rgba(255,255,255,0.5) inset',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-sidebar-title"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{
            background: 'rgba(11,37,69,0.88)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
            borderBottom: '1px solid rgba(255,255,255,0.14)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          <h2 id="cart-sidebar-title" className="text-base font-semibold text-white flex items-center gap-2.5">
            <FaShoppingCart size={16} className="text-brand-teal-light" />
            Shopping Cart
            {getCartCount() > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(77,219,184,0.2)', color: 'var(--color-brand-teal-light)', border: '1px solid rgba(77,219,184,0.3)' }}>
                {getCartCount()}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 touch-compact"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.8)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            aria-label="Close cart"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Free delivery progress */}
        {cart.length > 0 && (
          <div className="px-5 py-3 flex-shrink-0"
            style={{ background: 'rgba(14,138,110,0.06)', borderBottom: '1px solid rgba(14,138,110,0.12)' }}>
            {amountToFreeDelivery === 0 ? (
              <div className="flex items-center gap-2 text-brand-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                  <rect x="1" y="3" width="15" height="13" rx="1" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span className="text-xs font-semibold">You qualify for free delivery!</span>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--color-text-secondary)]">
                    Add <span className="font-semibold text-brand-teal">৳{amountToFreeDelivery.toLocaleString()}</span> for free delivery
                  </span>
                  <span className="text-brand-teal font-semibold">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline-block align-[-2px] mr-1" aria-hidden="true">
                      <rect x="1" y="3" width="15" height="13" rx="1" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    Free
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(14,138,110,0.15)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${freeDeliveryProgress}%`, background: 'linear-gradient(90deg, var(--color-brand-teal), var(--color-brand-teal-light))' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(14,138,110,0.08)', border: '1px solid rgba(14,138,110,0.15)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-teal)" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">Your cart is empty</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mb-5">Add medical equipment to get started</p>
              <button
                onClick={() => { onClose(); router.push('/products'); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, var(--color-brand-navy), #0d3060)', boxShadow: '0 4px 14px rgba(11,37,69,0.25)' }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            cart.map((item, index) => {
              const id = item.id || item._id || `item-${index}`;
              const imageUrl = getImageUrl(item);
              const itemTotal = (item.price || 0) * item.quantity;

              return (
                <div key={id}
                  className="flex gap-3 p-3 rounded-2xl transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(var(--glass-blur))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur))',
                    border: '1px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 2px 12px rgba(11,37,69,0.06)',
                  }}
                >
                  {/* Image */}
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden relative"
                    style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(229,231,235,0.6)' }}>
                    {imageUrl ? (
                      <Image 
                        src={imageUrl} 
                        alt={`${item.name}${item.brand ? ` — ${item.brand}` : ''} — Price ৳${item.price?.toLocaleString() || ''} Bangladesh — MediportBD`}
                        fill
                        sizes="56px"
                        style={{ objectFit: 'contain', padding: '4px' }}
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7" aria-hidden="true">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[var(--color-text-primary)] line-clamp-2 mb-1.5 leading-snug">{item.name}</h4>
                    <div className="text-sm font-semibold text-brand-navy mb-2">৳{itemTotal.toLocaleString()}</div>

                    <div className="flex items-center justify-between">
                      {/* Qty controls */}
                      <div className="flex items-center rounded-lg overflow-hidden"
                        style={{ border: '1px solid rgba(11,37,69,0.15)', background: 'rgba(255,255,255,0.8)' }}>
                        <button onClick={() => updateQuantity(id, item.quantity - 1)} disabled={item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center text-base font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)] disabled:opacity-30 transition-colors touch-compact">−</button>
                        <span className="w-8 text-center text-xs font-semibold text-[var(--color-text-primary)]"
                          style={{ borderLeft: '1px solid rgba(11,37,69,0.1)', borderRight: '1px solid rgba(11,37,69,0.1)' }}>
                          {item.quantity}
                        </span>
                        <button onClick={() => updateQuantity(id, item.quantity + 1)}
                          disabled={item.stock !== undefined && item.quantity >= item.stock}
                          className="w-7 h-7 flex items-center justify-center text-base font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)] disabled:opacity-30 transition-colors touch-compact">+</button>
                      </div>

                      <button onClick={() => removeFromCart(id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 touch-compact"
                        style={{ color: 'var(--color-status-danger)', background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.15)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(226,75,74,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(226,75,74,0.08)'}
                        aria-label="Remove item">
                        <FaTimes size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="flex-shrink-0 px-4 py-4"
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(var(--glass-blur))',
              WebkitBackdropFilter: 'blur(var(--glass-blur))',
              borderTop: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 -8px 24px rgba(11,37,69,0.06)',
            }}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                Subtotal ({getCartCount()} {getCartCount() === 1 ? 'item' : 'items'})
              </span>
              <span className="text-lg font-semibold text-brand-navy">৳{subtotal.toLocaleString()}</span>
            </div>

            <div className="space-y-2">
              <button onClick={handleCheckout}
                className="w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--color-brand-navy) 0%, #0d3060 100%)',
                  boxShadow: '0 4px 20px rgba(11,37,69,0.30), inset 0 1px 0 rgba(255,255,255,0.12)',
                }}>
                Proceed to Checkout
                <FaArrowRight size={13} />
              </button>
              <button onClick={handleViewCart}
                className="w-full h-10 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: 'rgba(11,37,69,0.06)',
                  border: '1px solid rgba(11,37,69,0.15)',
                  color: 'var(--color-brand-navy)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(11,37,69,0.10)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(11,37,69,0.06)'}>
                View Full Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
