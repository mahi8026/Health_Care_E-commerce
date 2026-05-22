"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API } from '@/constants/api';
import { FaLock, FaTag } from 'react-icons/fa';

export function getDeliveryFee(method) {
  const fees = {
    express: 500,
    nationwide: 1200,
    coldchain: 1800,
    cold_chain: 1800,
    standard: 150,
  };
  return fees[method] ?? 150;
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
  appliedCoupon,
  onCouponApply,
  userId,
  total,
  onPlaceOrder,
  loading,
  showPlaceOrder = false,
}) {
  const { isAuthenticated } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = getDeliveryFee(deliveryMethod);
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const computedTotal = Math.round((subtotal - couponDiscount + deliveryFee) * 100) / 100;
  const displayTotal = total ?? computedTotal;

  useEffect(() => {
    if (couponError) setCouponError('');
  }, [couponCode, couponError]);

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

    setCouponLoading(true);
    setCouponError('');

    try {
      const token = localStorage.getItem('medcore_token');
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
          userId,
        }),
      });
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
        setCouponError(data.message || 'Invalid code');
      }
    } catch {
      setCouponError('Could not validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="lg:sticky lg:top-[calc(var(--site-nav-height)+1rem)]">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-4 py-4 sm:px-5 border-b border-[#F3F4F6] bg-[#F8FAFC]">
          <h2 className="text-[15px] font-bold text-[#0B2545] m-0">Order summary</h2>
          <p className="text-[12px] text-[#6B7280] m-0 mt-0.5">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="px-4 py-4 sm:px-5 max-h-[240px] overflow-y-auto space-y-3">
          {items.map((item) => {
            const img = getItemImage(item);
            return (
              <div key={item.id} className="flex gap-3">
                <div className="w-12 h-12 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-center shrink-0 overflow-hidden">
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <span className="text-lg">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0B2545] line-clamp-2 m-0 leading-snug">
                    {item.name}
                  </p>
                  {item.brand && (
                    <p className="text-[11px] text-[#9CA3AF] m-0 mt-0.5">{item.brand}</p>
                  )}
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[11px] text-[#6B7280]">×{item.quantity}</span>
                    <span className="text-[13px] font-bold text-[#0B2545]">
                      ৳{(item.price * item.quantity).toLocaleString()}
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
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0E8A6E] hover:underline"
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
                className="flex-1 px-3 py-2 text-xs font-mono uppercase border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/15"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                className="px-3 py-2 text-xs font-semibold bg-[#0E8A6E] text-white rounded-lg hover:bg-[#0a7560] disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}
          {couponError && <p className="text-[11px] text-[#E24B4A] mt-1">{couponError}</p>}
          {appliedCoupon && (
            <div className="flex justify-between items-center mt-2 p-2.5 rounded-lg bg-[#ECFDF5] border border-[#0E8A6E]/20">
              <span className="text-[12px] font-semibold text-[#065F46]">{appliedCoupon.code}</span>
              <button
                type="button"
                onClick={() => onCouponApply(null)}
                className="text-[11px] text-[#0E8A6E] font-semibold hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-[#F3F4F6] space-y-2 text-[13px]">
          <div className="flex justify-between text-[#6B7280]">
            <span>Subtotal</span>
            <span className="font-medium text-[#0B2545]">৳{subtotal.toLocaleString()}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-[#0E8A6E]">
              <span>Discount</span>
              <span className="font-medium">−৳{couponDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-[#6B7280]">
            <span>Delivery</span>
            <span className="font-medium text-[#0B2545]">৳{deliveryFee.toLocaleString()}</span>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-4 border-t-2 border-[#0B2545]/10 flex justify-between items-center">
          <span className="text-sm font-semibold text-[#6B7280]">Total</span>
          <span className="text-xl font-bold text-[#0B2545] font-[family-name:var(--font-lora)]">
            ৳{displayTotal.toLocaleString()}
          </span>
        </div>

        {showPlaceOrder && onPlaceOrder && (
          <div className="hidden lg:block px-4 sm:px-5 pb-5">
            <button
              type="button"
              onClick={onPlaceOrder}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#0E8A6E] hover:bg-[#0a7560] text-white text-sm font-bold shadow-lg shadow-[#0E8A6E]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing…' : `Place order · ৳${displayTotal.toLocaleString()}`}
            </button>
          </div>
        )}

        <div className="px-4 sm:px-5 pb-4 flex items-start gap-2 text-[11px] text-[#6B7280]">
          <FaLock className="text-[#0E8A6E] mt-0.5 shrink-0" size={12} />
          <span>Secure, encrypted checkout. Your data is never shared.</span>
        </div>
      </div>
    </div>
  );
}
