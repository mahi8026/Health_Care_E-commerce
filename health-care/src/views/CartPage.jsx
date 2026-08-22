"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';

export default function CartPage({ onCheckout, onContinueShopping }) {
  const router = useRouter();
  const t = useT();
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount, clearCart } = useCart();
  const { isB2BCustomer, user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [removingId, setRemovingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const subtotal = getCartTotal();
  // B2B discount only shown if admin has explicitly enabled it for this user
  const b2bDiscount = (isB2BCustomer() && user?.b2bDiscountEnabled && user?.b2bDiscountPct > 0)
    ? Math.round(subtotal * (user.b2bDiscountPct / 100))
    : 0;
  const total = subtotal - b2bDiscount;
  const freeDeliveryThreshold = 50000;
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  const handleCheckout = onCheckout || (() => router.push('/checkout'));
  const handleContinueShopping = onContinueShopping || (() => router.push('/products'));

  const handleRemove = (itemId) => {
    setRemovingId(itemId);
    setTimeout(() => {
      removeFromCart(itemId);
      setRemovingId(null);
      showToast.success('Item removed from cart');
    }, 280);
  };

  const handleSaveForLater = async (item) => {
    const id = item.id || item._id;
    setSavingId(id);
    const result = await toggleWishlist(id);
    if (result?.requiresLogin) {
      showToast.error('Please log in to save items');
    } else {
      removeFromCart(id);
      showToast.success('Saved to wishlist');
    }
    setSavingId(null);
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    showToast.success('Cart cleared');
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
          <div className="w-28 h-28 mx-auto mb-6 bg-brand-teal-tint rounded-full flex items-center justify-center">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-teal)" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-brand-navy mb-2">{t('cart.empty')}</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-5 leading-relaxed">
            {t('cart.emptyDesc')}
          </p>
          <button
            onClick={handleContinueShopping}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white rounded-xl text-sm font-semibold transition-colors"
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
    <div className="min-h-screen bg-page py-4 md:py-6">

      {/* Clear Cart Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title={t('cart.clearAll')}
        size="sm"
        showCloseButton={false}
      >
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-[var(--color-status-danger-tint)] rounded-full flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-status-danger)" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-brand-navy mb-2 text-center">{t('cart.clearAll')}?</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 text-center">
            All {cart.length} items will be removed. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowClearConfirm(false)}
              className="flex-1 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-sm font-semibold hover:bg-surface-subtle transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={handleClearCart}
              className="flex-1 py-2.5 bg-danger hover:bg-[#C93A39] text-white rounded-xl text-sm font-semibold transition-colors">
              {t('cart.clearAll')}
            </button>
          </div>
        </div>
      </Modal>

      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-text-primary">{t('cart.title')}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {getCartCount()} {getCartCount() === 1 ? t('cart.item') : t('cart.items')}
            </p>
          </div>
          <button onClick={() => setShowClearConfirm(true)}
            className="text-xs text-danger hover:underline font-medium">
            {t('cart.clearAll')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,380px)] gap-4 items-start">

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
                  className={`bg-white rounded-2xl border border-[var(--color-border-primary)] overflow-hidden transition-all duration-300 ${
                    isRemoving ? 'opacity-0 -translate-x-4 scale-95' : 'opacity-100 translate-x-0 scale-100'
                  }`}
                >
                  <div className="flex gap-0">
                    {/* Image panel */}
                    <div className="w-24 md:w-32 flex-shrink-0 bg-surface-subtle flex items-center justify-center border-r border-[var(--color-border-primary)] p-2 relative">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`${item.name}${item.brand ? ` — ${item.brand}` : ''} — Price ৳${item.price?.toLocaleString() || ''} Bangladesh — MediportBD`}
                          fill
                          sizes="(max-width: 768px) 96px, 128px"
                          style={{ objectFit: 'contain', padding: '8px' }}
                        />
                      ) : (
                        <div className="text-4xl flex items-center justify-center h-20 md:h-24">📦</div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 md:p-4 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        {/* Product details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-base font-semibold text-brand-navy leading-snug line-clamp-2 mb-1">
                            {item.name}
                            {item.selectedSize && (
                              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-brand-teal/10 text-brand-teal rounded-md text-xs font-semibold">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                                </svg>
                                Size: {item.selectedSize.name}
                              </span>
                            )}
                          </h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
                            {item.brand && (
                              <span className="text-xs text-[var(--color-text-secondary)]">
                                {typeof item.brand === 'object' ? item.brand?.name : item.brand}
                              </span>
                            )}
                            {item.sku && (
                              <span className="text-xs text-[var(--color-text-tertiary)] font-mono">SKU: {item.sku}</span>
                            )}
                          </div>

                          {/* Stock badge */}
                          {item.stock !== undefined && (
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-3 ${
                              item.stock === 0
                                ? 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
                                : item.stock <= 10
                                ? 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]'
                                : 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
                            }`}>
                              {item.stock === 0 ? '✕ Out of stock' : item.stock <= 10 ? `⚠ Only ${item.stock} left` : '✓ In stock'}
                            </span>
                          )}
                        </div>

                        {/* Price (desktop) */}
                        <div className="hidden md:block text-right flex-shrink-0">
                          <div className="text-base font-semibold text-brand-navy">
                            ৳{itemTotal.toLocaleString()}
                          </div>
                          <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                            ৳{(item.price || 0).toLocaleString()} each
                          </div>
                        </div>
                      </div>

                      {/* Price (mobile) */}
                      <div className="md:hidden mb-2">
                        <span className="text-sm font-semibold text-brand-navy">৳{itemTotal.toLocaleString()}</span>
                        <span className="text-xs text-[var(--color-text-tertiary)] ml-2">৳{(item.price || 0).toLocaleString()} each</span>
                      </div>

                      {/* Bottom row: qty + actions */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Quantity stepper - 40px touch targets */}
                        <div>
                          <div className="flex items-center border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                              className="w-10 h-10 flex items-center justify-center text-base font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >−</button>
                            <span className="w-10 text-center text-sm font-semibold text-brand-navy border-x border-[var(--color-border-primary)]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(id, item.quantity + 1)}
                              disabled={item.stock !== undefined && item.stock > 0 && item.quantity >= item.stock}
                              aria-label="Increase quantity"
                              className="w-10 h-10 flex items-center justify-center text-base font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >+</button>
                          </div>
                          {/* FIX-012: Warn when quantity is at stock limit */}
                          {item.stock !== undefined && item.stock > 0 && item.quantity >= item.stock && (
                            <p className="text-xs text-[var(--color-status-warning)] mt-1">
                              Max available: {item.stock}
                            </p>
                          )}
                        </div>

                        {/* Action links - 44px touch targets */}
                        <div className="flex items-center gap-3 text-xs font-medium">
                          <button
                            onClick={() => handleSaveForLater(item)}
                            disabled={isSaving}
                            className="flex items-center gap-1 text-brand-teal hover:underline disabled:opacity-50 min-h-[44px] py-2"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            {isSaving ? `${t('cart.saveForLater')}…` : t('cart.saveForLater')}
                          </button>
                          <span className="text-[var(--color-text-tertiary)]">·</span>
                          <button
                            onClick={() => handleRemove(id)}
                            disabled={isRemoving}
                            className="flex items-center gap-1 text-danger hover:underline disabled:opacity-50 min-h-[44px] py-2"
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
            <div className="bg-white rounded-2xl border border-[var(--color-border-primary)] overflow-hidden shadow-sm">

              {/* Free delivery progress bar */}
              <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border-primary)]">
                {amountToFreeDelivery === 0 ? (
                  <div className="flex items-center gap-2 text-brand-teal">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <span className="text-sm font-semibold">
                    {t('cart.qualifyFreeDelivery')}
                  </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-[var(--color-text-secondary)]">
                        Add <span className="font-semibold text-brand-navy">৳{amountToFreeDelivery.toLocaleString()}</span> more for free delivery
                      </span>
                      <span className="text-brand-teal font-semibold">🚚 Free</span>
                    </div>
                    <div className="h-2 bg-[var(--color-background-muted)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-teal to-[var(--color-brand-teal-hover)] rounded-full transition-all duration-500"
                        style={{ width: `${freeDeliveryProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Summary rows */}
              <div className="px-4 py-3 space-y-2 border-b border-[var(--color-border-primary)]">
                <h3 className="text-sm font-semibold text-brand-navy mb-2">{t('cart.orderSummary')}</h3>

                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">{t('cart.subtotal')} ({getCartCount()} {getCartCount() === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold text-brand-navy">৳{subtotal.toLocaleString()}</span>
                </div>

                {b2bDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-teal flex items-center gap-1">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
                      </svg>
                      {t('cart.b2bDiscount')}
                    </span>
                    <span className="text-brand-teal font-semibold">−৳{b2bDiscount.toLocaleString()}</span>
                  </div>
                )}

                {/* Delivery note */}
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                    🚚 Delivery
                  </span>
                  <span className="text-brand-teal font-semibold text-xs">
                    ৳70 – ৳130 · at checkout
                  </span>
                </div>

              </div>

              {/* Total */}
              <div className="px-4 py-3 border-b border-[var(--color-border-primary)]">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-brand-navy">{t('cart.total')}</span>
                  <span className="text-xl font-semibold text-brand-navy">৳{total.toLocaleString()}</span>
                </div>
                {b2bDiscount > 0 && (
                  <div className="mt-2 text-xs text-brand-teal font-medium">
                    {t('cart.youSaved')} ৳{b2bDiscount.toLocaleString()} {t('cart.onThisOrder')}
                  </div>
                )}
              </div>

              {/* CTA buttons */}
              <div className="px-4 py-3 space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full h-10 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  {t('cart.proceedCheckout')}
                </button>
                <button
                  onClick={handleContinueShopping}
                  className="w-full h-10 border border-[var(--color-border-primary)] hover:bg-surface-subtle text-[var(--color-text-primary)] rounded-xl text-sm font-semibold transition-colors"
                >
                  {t('cart.continueShopping')}
                </button>
              </div>

              {/* Trust badges */}
              <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                {[
                  { icon: '🔒', label: t('cart.secureCheckout') },
                  { icon: '↩', label: t('cart.returns') },
                  { icon: '📞', label: t('cart.support') },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 p-2 bg-surface-subtle rounded-xl">
                    <span className="text-lg">{icon}</span>
                    <span className="text-xs text-[var(--color-text-secondary)] font-medium text-center leading-tight whitespace-pre-line">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* B2B upsell */}
            {!isB2BCustomer() && (
              <div className="mt-3 p-3 bg-brand-navy rounded-2xl text-white">
                <div className="text-xs font-semibold mb-1">🏢 {t('cart.b2bUpsell')}</div>
                <div className="text-xs text-[var(--color-text-tertiary)] mb-3">
                  {t('cart.b2bUpsellDesc')}
                </div>
                <button
                  onClick={() => router.push('/b2b')}
                  className="text-xs font-semibold text-brand-teal hover:underline"
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
