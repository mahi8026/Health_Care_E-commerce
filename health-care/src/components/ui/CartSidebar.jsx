'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';

export default function CartSidebar({ isOpen, onClose }) {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCart();

  const subtotal = getCartTotal();
  const freeDeliveryThreshold = 50000;
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const handleViewCart = () => {
    onClose();
    router.push('/cart');
  };

  const getImageUrl = (item) => {
    if (!item.images || item.images.length === 0) return null;
    const img = item.images[0];
    const url = typeof img === 'string' ? img : img?.url;
    return url && url.startsWith('http') ? url : null;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[1001] flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-sidebar-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white">
          <h2 id="cart-sidebar-title" className="text-[18px] font-bold flex items-center gap-2">
            <FaShoppingCart size={18} />
            Shopping Cart
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close cart"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Free Delivery Progress */}
        {cart.length > 0 && (
          <div className="px-5 py-4 bg-[#FFF8F5] border-b border-gray-200">
            {amountToFreeDelivery === 0 ? (
              <div className="flex items-center gap-2 text-[#0E8A6E]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                <span className="text-[13px] font-bold">You qualify for free delivery! 🎉</span>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-[12px] mb-2">
                  <span className="text-[#6B7280]">
                    Add <span className="font-bold text-[#FF6B35]">৳{amountToFreeDelivery.toLocaleString()}</span> more to unlock!
                  </span>
                  <span className="text-[#0E8A6E] font-semibold">🚚 Free</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] rounded-full transition-all duration-500"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 mb-2">No items in your cart!</h3>
              <p className="text-[13px] text-gray-500 mb-4">
                Start adding medical equipment to your cart
              </p>
              <button
                onClick={() => {
                  onClose();
                  router.push('/products');
                }}
                className="px-6 py-2.5 bg-[#FF6B35] hover:bg-[#FF5722] text-white rounded-xl text-[13px] font-semibold transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => {
                const id = item.id || item._id || `item-${index}`;
                const imageUrl = getImageUrl(item);
                const itemTotal = (item.price || 0) * item.quantity;

                return (
                  <div key={id} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    {/* Image */}
                    <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = '<div style="font-size:28px">📦</div>';
                          }}
                        />
                      ) : (
                        <div className="text-[28px]">📦</div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-semibold text-gray-900 line-clamp-2 mb-1">
                        {item.name}
                      </h4>
                      <div className="text-[14px] font-bold text-[#FF6B35] mb-2">
                        ৳{itemTotal.toLocaleString()}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-[16px] font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-[13px] font-bold text-gray-900 border-x border-gray-300">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(id, item.quantity + 1)}
                            disabled={item.stock !== undefined && item.quantity >= item.stock}
                            className="w-8 h-8 flex items-center justify-center text-[16px] font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(id)}
                          className="text-[#E24B4A] hover:text-[#C93A39] transition-colors"
                          aria-label="Remove item"
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 bg-white">
            {/* Subtotal */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-[15px] font-semibold text-gray-700">
                Subtotal ({getCartCount()} {getCartCount() === 1 ? 'item' : 'items'})
              </span>
              <span className="text-[20px] font-bold text-gray-900">
                ৳{subtotal.toLocaleString()}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                className="w-full h-12 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:from-[#FF5722] hover:to-[#FF7B2E] text-white rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Proceed to Checkout
              </button>
              <button
                onClick={handleViewCart}
                className="w-full h-11 border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FFF8F5] rounded-xl text-[13px] font-semibold transition-colors"
              >
                View Full Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
