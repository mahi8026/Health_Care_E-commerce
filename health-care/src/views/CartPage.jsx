"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useT } from '@/hooks/useT';

export default function CartPage({ onCheckout, onContinueShopping }) {
  const router = useRouter();
  const t = useT();
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount, clearCart } = useCart();
  const { isB2BCustomer } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [removingId, setRemovingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  const subtotal = getCartTotal();
  const b2bDiscount = isB2BCustomer() ? Math.round(subtotal * 0.08) : 0;
  const freeDeliveryThreshold = 50000;
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : (cart.length > 0 ? 150 : 0);
  const total = subtotal - b2bDiscount + deliveryFee;
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  const handleCheckout = onCheckout || (() => router.push('/checkout'));
  const handleContinueShopping = onContinueShopping || (() => router.push('/products'));

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleRemove = (itemId) => {
    setRemovingId(itemId);
    setTimeout(() => {
      removeFromCart(itemId);
      setRemovingId(null);
      showToast('Item removed from cart');
    }, 280);
  };

  const handleSaveForLater = async (item) => {
    const id = item.id || item._id;
    setSavingId(id);
    const result = await toggleWishlist(id);
    if (result?.requiresLogin) {
      showToast('Please log in to save items', 'error');
    } else {
      removeFromCart(id);
      showToast('Saved to wishlist');
    }
    setSavingId(null);
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    showToast('Cart cleared');
  };

  const getImageUrl = (item) => {
    if (!item.images || item.images.length === 0) return null;
    const img = item.images[0];
    const url = typeof img === 'string' ? img : img?.url;
    // Only return if it's a valid http/https URL (Cloudinary, etc.)
    return url && url.startsWith('http') ? url : null;
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] bg-page flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-28 h-28 mx-auto mb-6 bg-[#E1F5EE] rounded-full flex items-center justify-center">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#0E8A6E" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
          </div>
          <h2 className="text-[22px] font-bold text-[#0B2545] mb-2">{t('cart.empty')}</h2>
          <p className="text-[13px] text-[#6B7280] mb-6 leading-relaxed">
            {t('cart.emptyDesc')}
          </p>
          <button
            onClick={handleContinueShopping}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B2545] hover:bg-[#0d2e56] text-white rounded-xl text-[14px] font-semibold transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {t('cart.browseProducts')}
          </button>
        </div>
      </div>
    );
  }

  // ── Main cart ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-page py-6 md:py-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2 transition-all ${
          toast.type === 'error' ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#D1FAE5] text-[#065F46]'
        }`}>
          {toast.type === 'error'
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* Clear Cart Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-4 bg-[#FEE2E2] rounded-full flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </div>
            <h3 className="text-[17px] font-bold text-[#0B2545] mb-2 text-center">{t('cart.clearAll')}?</h3>
            <p className="text-[13px] text-[#6B7280] mb-6 text-center">
              All {cart.length} items will be removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 border border-[#E5E7EB] rounded-xl text-[13px] font-semibold hover:bg-surface-subtle transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleClearCart}
                className="flex-1 py-2.5 bg-[#E24B4A] hover:bg-[#C93A39] text-white rounded-xl text-[13px] font-semibold transition-colors">
                {t('cart.clearAll')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] md:text-[26px] font-bold text-[#0B2545]">{t('cart.title')}</h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              {getCartCount()} {getCartCount() === 1 ? t('cart.item') : t('cart.items')}
            </p>
          </div>
          <button onClick={() => setShowClearConfirm(true)}
            className="text-[12px] text-[#E24B4A] hover:underline font-medium">
            {t('cart.clearAll')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,380px)] gap-6 items-start">

          {/* ── Cart items ─────────────────────────────────────────────────── */}
          <div className="space-y-3">
            {cart.map((item, index) => {
              const id = item.id || item._id || `item-${index}`;
              const imageUrl = getImageUrl(item);
              const isRemoving = removingId === id;
              const isSaving = savingId === id;
              const itemTotal = (item.price || 0) * item.quantity;

              return (
                <div key={id}
                  className={`bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden transition-all duration-300 ${
                    isRemoving ? 'opacity-0 -translate-x-4 scale-95' : 'opacity-100 translate-x-0 scale-100'
                  }`}
                >
                  <div className="flex gap-0">
                    {/* Image panel */}
                    <div className="w-28 md:w-36 flex-shrink-0 bg-surface-subtle flex items-center justify-center border-r border-[#E5E7EB] p-3">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={`${item.name}${item.brand ? ` — ${item.brand}` : ''} — Price ৳${item.price?.toLocaleString() || ''} Bangladesh`}
                          className="w-full h-24 md:h-28 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = '<div style="font-size:40px;display:flex;align-items:center;justify-content:center;height:100%">📦</div>';
                          }}
                        />
                      ) : (
                        <div className="text-[44px] flex items-center justify-center h-24 md:h-28">📦</div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 md:p-5 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        {/* Product details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] md:text-[15px] font-bold text-[#0B2545] leading-snug line-clamp-2 mb-1">
                            {item.name}
                          </h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
                            {item.brand && (
                              <span className="text-[11px] text-[#6B7280]">
                                {typeof item.brand === 'object' ? item.brand?.name : item.brand}
                              </span>
                            )}
                            {item.sku && (
                              <span className="text-[10px] text-[#9CA3AF] font-mono">SKU: {item.sku}</span>
                            )}
                          </div>

                          {/* Stock badge */}
                          {item.stock !== undefined && (
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mb-3 ${
                              item.stock === 0
                                ? 'bg-[#FEE2E2] text-[#991B1B]'
                                : item.stock <= 10
                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                : 'bg-[#D1FAE5] text-[#065F46]'
                            }`}>
                              {item.stock === 0 ? '✕ Out of stock' : item.stock <= 10 ? `⚠ Only ${item.stock} left` : '✓ In stock'}
                            </span>
                          )}
                        </div>

                        {/* Price (desktop) */}
                        <div className="hidden md:block text-right flex-shrink-0">
                          <div className="text-[18px] font-bold text-[#0B2545]">
                            ৳{itemTotal.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                            ৳{(item.price || 0).toLocaleString()} each
                          </div>
                        </div>
                      </div>

                      {/* Price (mobile) */}
                      <div className="md:hidden mb-3">
                        <span className="text-[16px] font-bold text-[#0B2545]">৳{itemTotal.toLocaleString()}</span>
                        <span className="text-[11px] text-[#9CA3AF] ml-2">৳{(item.price || 0).toLocaleString()} each</span>
                      </div>

                      {/* Bottom row: qty + actions */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Quantity stepper - 44x44px touch targets */}
                        <div className="flex items-center border border-[#E5E7EB] rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-11 h-11 flex items-center justify-center text-[18px] font-bold text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >−</button>
                          <span className="w-12 text-center text-[14px] font-bold text-[#0B2545] border-x border-[#E5E7EB]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(id, item.quantity + 1)}
                            disabled={item.stock !== undefined && item.quantity >= item.stock}
                            className="w-11 h-11 flex items-center justify-center text-[18px] font-bold text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >+</button>
                        </div>

                        {/* Action links - 44px touch targets */}
                        <div className="flex items-center gap-3 text-[11px] font-medium">
                          <button
                            onClick={() => handleSaveForLater(item)}
                            disabled={isSaving}
                            className="flex items-center gap-1 text-[#0E8A6E] hover:underline disabled:opacity-50 min-h-[44px] py-2"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            {isSaving ? `${t('cart.saveForLater')}…` : t('cart.saveForLater')}
                          </button>
                          <span className="text-[#D1D5DB]">·</span>
                          <button
                            onClick={() => handleRemove(id)}
                            disabled={isRemoving}
                            className="flex items-center gap-1 text-[#E24B4A] hover:underline disabled:opacity-50 min-h-[44px] py-2"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                            {isRemoving ? `${t('cart.remove')}…` : t('cart.remove')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Order summary ──────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">

              {/* Free delivery progress bar */}
              <div className="px-5 pt-5 pb-4 border-b border-[#E5E7EB]">
                {amountToFreeDelivery === 0 ? (
                  <div className="flex items-center gap-2 text-[#0E8A6E]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <span className="text-[13px] font-bold">
                    {t('cart.qualifyFreeDelivery')}
                  </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-[12px] mb-2">
                      <span className="text-[#6B7280]">
                        Add <span className="font-bold text-[#0B2545]">৳{amountToFreeDelivery.toLocaleString()}</span> more for free delivery
                      </span>
                      <span className="text-[#0E8A6E] font-semibold">🚚 Free</span>
                    </div>
                    <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0E8A6E] to-[#10B981] rounded-full transition-all duration-500"
                        style={{ width: `${freeDeliveryProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Summary rows */}
              <div className="px-5 py-4 space-y-3 border-b border-[#E5E7EB]">
                <h3 className="text-[15px] font-bold text-[#0B2545] mb-3">{t('cart.orderSummary')}</h3>

                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6B7280]">{t('cart.subtotal')} ({getCartCount()} {getCartCount() === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold text-[#0B2545]">৳{subtotal.toLocaleString()}</span>
                </div>

                {b2bDiscount > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#0E8A6E] flex items-center gap-1">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
                      </svg>
                      {t('cart.b2bDiscount')}
                    </span>
                    <span className="text-[#0E8A6E] font-semibold">−৳{b2bDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6B7280]">{t('cart.delivery')}</span>
                  {deliveryFee === 0
                    ? <span className="text-[#0E8A6E] font-bold">{t('cart.free')}</span>
                    : <span className="font-semibold text-[#0B2545]">৳{deliveryFee}</span>
                  }
                </div>
              </div>

              {/* Total */}
              <div className="px-5 py-4 border-b border-[#E5E7EB]">
                <div className="flex justify-between items-center">
                  <span className="text-[15px] font-bold text-[#0B2545]">{t('cart.total')}</span>
                  <span className="text-[22px] font-bold text-[#0B2545]">৳{total.toLocaleString()}</span>
                </div>
                {(b2bDiscount > 0 || deliveryFee === 0) && (
                  <div className="mt-2 text-[11px] text-[#0E8A6E] font-medium">
                    {t('cart.youSaved')} ৳{(b2bDiscount + (deliveryFee === 0 && subtotal > 0 ? 150 : 0)).toLocaleString()} {t('cart.onThisOrder')}
                  </div>
                )}
              </div>

              {/* CTA buttons */}
              <div className="px-5 py-4 space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full h-12 bg-[#0B2545] hover:bg-[#0d2e56] text-white rounded-xl text-[14px] font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  {t('cart.proceedCheckout')}
                </button>
                <button
                  onClick={handleContinueShopping}
                  className="w-full h-11 border border-[#E5E7EB] hover:bg-surface-subtle text-[#374151] rounded-xl text-[13px] font-semibold transition-colors"
                >
                  {t('cart.continueShopping')}
                </button>
              </div>

              {/* Trust badges */}
              <div className="px-5 pb-5 grid grid-cols-3 gap-2">
                {[
                  { icon: '🔒', label: t('cart.secureCheckout') },
                  { icon: '↩', label: t('cart.returns') },
                  { icon: '📞', label: t('cart.support') },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 p-2 bg-surface-subtle rounded-xl">
                    <span className="text-[20px]">{icon}</span>
                    <span className="text-[9px] text-[#6B7280] font-medium text-center leading-tight whitespace-pre-line">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* B2B upsell */}
            {!isB2BCustomer() && (
              <div className="mt-3 p-4 bg-[#0B2545] rounded-2xl text-white">
                <div className="text-[12px] font-bold mb-1">🏢 {t('cart.b2bUpsell')}</div>
                <div className="text-[11px] text-[#94A3B8] mb-3">
                  {t('cart.b2bUpsellDesc')}
                </div>
                <button
                  onClick={() => router.push('/b2b')}
                  className="text-[11px] font-bold text-[#0E8A6E] hover:underline"
                >
                  {t('cart.applyB2B')}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
