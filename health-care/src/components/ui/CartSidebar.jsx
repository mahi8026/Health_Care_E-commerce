'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';

export default function CartSidebar({ isOpen, onClose }) {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCart();

  const subtotal = getCartTotal();
  const freeDeliveryThreshold = 50000;
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCheckout = () => { onClose(); router.push('/checkout'); };
  const handleViewCart = () => { onClose(); router.push('/cart'); };

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
        className={`fixed inset-0 z-[1000] transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backdropFilter: isOpen ? 'blur(8px) saturate(160%)' : 'none', background: 'rgba(11,37,69,0.35)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[400px] z-[1001] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(40px) saturate(200%) brightness(1.04)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(1.04)',
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
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderBottom: '1px solid rgba(255,255,255,0.14)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          <h2 id="cart-sidebar-title" className="text-[17px] font-bold text-white flex items-center gap-2.5">
            <FaShoppingCart size={16} className="text-[#4ddbb8]" />
            Shopping Cart
            {getCartCount() > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(77,219,184,0.2)', color: '#4ddbb8', border: '1px solid rgba(77,219,184,0.3)' }}>
                {getCartCount()}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
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
              <div className="flex items-center gap-2 text-[#0E8A6E]">
                <span className="text-base">🚚</span>
                <span className="text-[12px] font-bold">You qualify for free delivery!</span>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-gray-500">
                    Add <span className="font-bold text-[#0E8A6E]">৳{amountToFreeDelivery.toLocaleString()}</span> for free delivery
                  </span>
                  <span className="text-[#0E8A6E] font-semibold">🚚 Free</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(14,138,110,0.15)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${freeDeliveryProgress}%`, background: 'linear-gradient(90deg, #0E8A6E, #4ddbb8)' }}
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
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0E8A6E" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-gray-800 mb-1">Your cart is empty</h3>
              <p className="text-[12px] text-gray-400 mb-5">Add medical equipment to get started</p>
              <button
                onClick={() => { onClose(); router.push('/products'); }}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #0B2545, #0d3060)', boxShadow: '0 4px 14px rgba(11,37,69,0.25)' }}
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
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 2px 12px rgba(11,37,69,0.06)',
                  }}
                >
                  {/* Image */}
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(229,231,235,0.6)' }}>
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt={item.name} className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.innerHTML = '<div style="font-size:24px">📦</div>'; }} />
                    ) : (
                      <div className="text-2xl">📦</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[12px] font-semibold text-gray-800 line-clamp-2 mb-1.5 leading-snug">{item.name}</h4>
                    <div className="text-[14px] font-bold text-[#0B2545] mb-2">৳{itemTotal.toLocaleString()}</div>

                    <div className="flex items-center justify-between">
                      {/* Qty controls */}
                      <div className="flex items-center rounded-lg overflow-hidden"
                        style={{ border: '1px solid rgba(11,37,69,0.15)', background: 'rgba(255,255,255,0.8)' }}>
                        <button onClick={() => updateQuantity(id, item.quantity - 1)} disabled={item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center text-[15px] font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">−</button>
                        <span className="w-8 text-center text-[12px] font-bold text-gray-800"
                          style={{ borderLeft: '1px solid rgba(11,37,69,0.1)', borderRight: '1px solid rgba(11,37,69,0.1)' }}>
                          {item.quantity}
                        </span>
                        <button onClick={() => updateQuantity(id, item.quantity + 1)}
                          disabled={item.stock !== undefined && item.quantity >= item.stock}
                          className="w-7 h-7 flex items-center justify-center text-[15px] font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">+</button>
                      </div>

                      <button onClick={() => removeFromCart(id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200"
                        style={{ color: '#E24B4A', background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.15)' }}
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
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 -8px 24px rgba(11,37,69,0.06)',
            }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[13px] font-medium text-gray-500">
                Subtotal ({getCartCount()} {getCartCount() === 1 ? 'item' : 'items'})
              </span>
              <span className="text-[20px] font-bold text-[#0B2545]">৳{subtotal.toLocaleString()}</span>
            </div>

            <div className="space-y-2">
              <button onClick={handleCheckout}
                className="w-full h-12 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #0B2545 0%, #0d3060 100%)',
                  boxShadow: '0 4px 20px rgba(11,37,69,0.30), inset 0 1px 0 rgba(255,255,255,0.12)',
                }}>
                Proceed to Checkout
                <FaArrowRight size={13} />
              </button>
              <button onClick={handleViewCart}
                className="w-full h-10 rounded-xl text-[13px] font-semibold transition-all duration-200"
                style={{
                  background: 'rgba(11,37,69,0.06)',
                  border: '1px solid rgba(11,37,69,0.15)',
                  color: '#0B2545',
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
