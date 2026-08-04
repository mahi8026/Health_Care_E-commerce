"use client";

import { showToast } from '@/components/ui/Toast';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { API } from '@/constants/api';
import { FaLock, FaTag, FaShieldAlt } from 'react-icons/fa';
import { calculateCartItemPrice, isEligibleForB2BPricing } from '@/utils/pricing';

import { getDeliveryZone, DELIVERY_ZONE_INFO } from './DeliveryOptions';

// Returns Steadfast Courier fee based on delivery district
export function getDeliveryFee(district = '') {
  const zone = getDeliveryZone(district);
  return DELIVERY_ZONE_INFO[zone].fee;
}

function getItemImage(item) {
  if (item.imageUrl) return item.imageUrl;
  if (!item.images?.length) return null;
  const img = item.images[0];
  const url = typeof img === 'string' ? img : img?.url;
  return url?.startsWith('http') ? url : null;
}

export default function OrderSummary({
  items,
  deliveryMethod = 'standard',
  district = '',
  appliedCoupon,
  onCouponApply,
  userId,
  total,
  onPlaceOrder,
  loading,
  showPlaceOrder = false,
  loyaltyPoints = 0,
  redeemedPoints = 0,
  onRedeemPoints,
}) {
  const { isAuthenticated, user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [pointsInput, setPointsInput] = useState('');
  const [showPointsInput, setShowPointsInput] = useState(false);

  const availablePoints = loyaltyPoints || user?.loyaltyPoints || 0;

  // Calculate B2B pricing for cart items
  const {subtotal, b2bSavings, itemsWithPricing} = useMemo(() => {
    const isB2BEligible = isEligibleForB2BPricing(user);
    
    const pricedItems = items.map((item) => {
      const regularTotal = item.price * item.quantity;
      
      if (isB2BEligible && item.category) {
        // Calculate B2B price for this item
        const b2bPricing = calculateCartItemPrice(item, user, item.category);
        
        return {
          ...item,
          displayPrice: b2bPricing.unitPrice,
          isB2BPrice: b2bPricing.isB2BPrice,
          b2bSavings: b2bPricing.savings,
          regularTotal,
        };
      }
      
      return {
        ...item,
        displayPrice: item.price,
        isB2BPrice: false,
        b2bSavings: 0,
        regularTotal,
      };
    });
    
    // Calculate totals using reduce (no mutation)
    const regularSubtotalCalc = pricedItems.reduce((sum, item) => sum + item.regularTotal, 0);
    const b2bSubtotalCalc = pricedItems.reduce((sum, item) => sum + item.displayPrice * item.quantity, 0);
    
    return {
      subtotal: b2bSubtotalCalc,
      b2bSavings: regularSubtotalCalc - b2bSubtotalCalc,
      itemsWithPricing: pricedItems,
    };
  }, [items, user]);

  const deliveryFee = getDeliveryFee(district);
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const pointsDiscount = redeemedPoints || 0;
  const computedTotal = Math.round((subtotal - couponDiscount - pointsDiscount + deliveryFee) * 100) / 100;
  const displayTotal = total ?? computedTotal;

  // Clear coupon error when coupon code changes (intentionally direct for UX)
   
  useEffect(() => {
    if (couponError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCouponError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Enter a coupon code');
      return;
    }
    if (!isAuthenticated()) {
      setCouponError('Login required');
      return;
    }
    if (appliedCoupon) {
      setCouponError('Remove current coupon first');
      return;
    }

    // Get userId from props or user context
    const currentUserId = userId || user?.id || user?._id;
    if (!currentUserId) {
      setCouponError('User ID not found. Please refresh and try again.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          cartTotal: subtotal,
          cartItems: items.map((item) => ({
            productId: item.id,
            categoryId: item.categoryId || null,
            quantity: item.quantity,
            price: item.price,
          })),
          userId: currentUserId,
        }),
      });

      // Always parse JSON regardless of status code
      const data = await res.json();

      if (data.success && data.valid) {
        onCouponApply({
          code: data.data.code,
          type: data.data.type,
          discountAmount: data.data.discountAmount,
        });
        setCouponCode('');
        setShowCouponInput(false);
      } else {
        // Show the actual error message from the server
        setCouponError(data.message || 'Invalid coupon code');
      }
    } catch (err) {
      console.error('Coupon validation error:', err);
      setCouponError('Could not validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="lg:sticky lg:top-[calc(var(--site-nav-height)+1rem)]">
      <div className="bg-white rounded-2xl border border-[var(--color-border-primary)] shadow-sm overflow-hidden">
        <div className="px-4 py-3 sm:px-5 border-b border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
          <h2 className="text-base font-semibold text-brand-navy m-0">Order summary</h2>
          <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="px-4 py-3 sm:px-5 max-h-[220px] overflow-y-auto space-y-2.5">
          {itemsWithPricing.map((item) => {
            const img = getItemImage(item);
            return (
              <div key={item.id} className="flex gap-3">
                <div className="w-12 h-12 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] flex items-center justify-center shrink-0 overflow-hidden">
                  {img ? (
                    <Image src={img} alt={`${item.name}${item.brand ? ` â€” ${item.brand}` : ''} â€” Price à§³${item.displayPrice?.toLocaleString() || ''} Bangladesh`} width={48} height={48} className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <span className="text-lg">ðŸ“¦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-navy line-clamp-2 m-0 leading-snug">
                    {item.name}
                  </p>
                  {item.brand && (
                    <p className="text-xs text-[var(--color-text-tertiary)] m-0 mt-0.5">{item.brand}</p>
                  )}
                  {item.isB2BPrice && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#7C3AED] font-semibold bg-purple-50 px-1.5 py-0.5 rounded-full mt-1">
                      <FaShieldAlt size={7} />
                      B2B
                    </span>
                  )}
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs text-[var(--color-text-secondary)]">Ã—{item.quantity}</span>
                    <span className="text-sm font-semibold text-brand-navy">
                      à§³{(item.displayPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 sm:px-5 pb-3">
          {!appliedCoupon && !showCouponInput && (
            <button
              type="button"
              onClick={() => setShowCouponInput(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-teal hover:underline"
            >
              <FaTag size={11} />
              Add coupon
            </button>
          )}
          {showCouponInput && !appliedCoupon && (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                placeholder="CODE"
                className="flex-1 px-3 py-2 min-h-[40px] text-base sm:text-xs font-mono uppercase border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                className="px-4 py-2 min-h-[40px] text-xs font-semibold bg-brand-teal text-white rounded-lg hover:bg-[var(--color-brand-teal-hover)] disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}
          {couponError && <p className="text-xs text-danger mt-1" role="alert" aria-live="polite">{couponError}</p>}
          {appliedCoupon && (
            <div className="flex justify-between items-center mt-2 p-2.5 rounded-lg bg-[var(--color-status-success-tint)] border border-brand-teal/20">
              <span className="text-xs font-semibold text-[var(--color-status-success)]">{appliedCoupon.code}</span>
              <button
                type="button"
                onClick={() => onCouponApply(null)}
                className="text-xs text-brand-teal font-semibold hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {/* Loyalty Points Redemption */}
          {availablePoints > 0 && onRedeemPoints && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border-tertiary)]">
              {pointsDiscount > 0 ? (
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--color-status-warning-tint)] border border-warning/30">
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-status-warning)]">â­ {pointsDiscount} pts redeemed</span>
                    <p className="text-xs text-[var(--color-status-warning)] mt-0.5">âˆ’à§³{(pointsDiscount * 0.1).toFixed(2)} discount</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { onRedeemPoints(0); setPointsInput(''); setShowPointsInput(false); }}
                    className="text-xs text-warning font-semibold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : !showPointsInput ? (
                <button
                  type="button"
                  onClick={() => setShowPointsInput(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-warning hover:underline"
                >
                  â­ Redeem loyalty points ({availablePoints} available)
                </button>
              ) : (
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-1.5">
                    You have <strong>{availablePoints} points</strong> = à§³{(availablePoints * 0.1).toFixed(2)} discount value
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
                    100 points = à§³10 â€¢ Minimum 50 points to redeem â€¢ Max 20% of order
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={pointsInput}
                      onChange={(e) => setPointsInput(e.target.value)}
                      placeholder={`Min 50, Max ${Math.min(availablePoints, Math.floor(subtotal * 0.2 / 0.1))}`}
                      min="50"
                      max={Math.min(availablePoints, Math.floor(subtotal * 0.2 / 0.1))}
                      className="flex-1 px-3 py-2 min-h-[44px] text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-warning focus:ring-2 focus:ring-warning/15"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const pts = parseInt(pointsInput) || 0;
                        const maxPoints = Math.min(availablePoints, Math.floor(subtotal * 0.2 / 0.1));
                        if (pts < 50) {
                          showToast.warning('Minimum 50 points required to redeem');
                          return;
                        }
                        if (pts > maxPoints) {
                          showToast.warning(`Maximum ${maxPoints} points can be redeemed for this order`);
                          return;
                        }
                        if (pts > 0) { onRedeemPoints(pts); setShowPointsInput(false); }
                      }}
                      className="px-4 py-2 min-h-[44px] text-xs font-semibold bg-warning text-white rounded-lg hover:bg-[#D97706]"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPointsInput(false); setPointsInput(''); }}
                      className="px-3 py-2 min-h-[44px] text-xs text-[var(--color-text-secondary)] border border-[var(--color-border-primary)] rounded-lg hover:bg-[var(--color-background-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border-tertiary)] space-y-2 text-sm">
          <div className="flex justify-between text-[var(--color-text-secondary)]">
            <span>Subtotal</span>
            <span className="font-medium text-brand-navy">à§³{subtotal.toLocaleString()}</span>
          </div>
          {b2bSavings > 0 && (
            <div className="flex justify-between text-[#7C3AED]">
              <div className="flex items-center gap-1">
                <FaShieldAlt size={11} />
                <span>B2B discount</span>
              </div>
              <span className="font-medium">âˆ’à§³{b2bSavings.toLocaleString()}</span>
            </div>
          )}
          {couponDiscount > 0 && (
            <div className="flex justify-between text-brand-teal">
              <span>Coupon discount</span>
              <span className="font-medium">âˆ’à§³{couponDiscount.toLocaleString()}</span>
            </div>
          )}
          {pointsDiscount > 0 && (
            <div className="flex justify-between text-warning">
              <span>â­ Points discount</span>
              <span className="font-medium">âˆ’à§³{(pointsDiscount * 0.1).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-[var(--color-text-secondary)]">
            <span>Delivery <span className="text-xs text-[var(--color-text-tertiary)]">(Steadfast Courier)</span></span>
            <span className="font-medium text-brand-navy">à§³{deliveryFee.toLocaleString()}</span>
          </div>
        </div>

    <div className="px-4 sm:px-5 py-3 border-t-2 border-brand-navy/10 flex justify-between items-center">
          <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Total</span>
          <span className="text-xl font-semibold text-brand-navy font-[family-name:var(--font-lora)]">
            à§³{displayTotal.toLocaleString()}
          </span>
        </div>

        {showPlaceOrder && onPlaceOrder && (
    <div className="hidden lg:block px-4 sm:px-5 pb-4">
            <button
              type="button"
              onClick={onPlaceOrder}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white text-sm font-semibold shadow-lg shadow-brand-teal/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processingâ€¦' : `Place order Â· à§³${displayTotal.toLocaleString()}`}
            </button>
          </div>
        )}

    <div className="px-4 sm:px-5 pb-3 flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
          <FaLock className="text-brand-teal mt-0.5 shrink-0" size={12} />
          <span>Secure, encrypted checkout. Your data is never shared.</span>
        </div>
      </div>
    </div>
  );
}
