"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const VAT_RATE = 0.05; // 5%

export default function OrderSummary({ items, deliveryMethod = 'standard', appliedCoupon, onCouponApply, userId }) {
  const { isAuthenticated } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Delivery fee based on method
  const deliveryFee = deliveryMethod === 'express' ? 300 : 
                      deliveryMethod === 'nationwide' ? 200 :
                      deliveryMethod === 'cold_chain' ? 500 : 150;

  // Coupon discount
  const couponDiscount = appliedCoupon?.discountAmount || 0;

  // VAT calculation (after discount)
  const taxableAmount = subtotal - couponDiscount + deliveryFee;
  const vatAmount = Math.round(taxableAmount * VAT_RATE * 100) / 100;

  // Total
  const total = Math.round((taxableAmount + vatAmount) * 100) / 100;

  // Clear error when coupon code changes
  useEffect(() => {
    if (couponError) {
      setCouponError('');
    }
  }, [couponCode]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    if (!isAuthenticated()) {
      setCouponError('Please login to apply coupon');
      return;
    }

    if (appliedCoupon) {
      setCouponError('A coupon is already applied. Remove it first.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const token = localStorage.getItem('medcore_token');
      
      // Prepare cart items with category info
      const cartItems = items.map(item => ({
        productId: item.id,
        categoryId: item.categoryId || null,
        quantity: item.quantity,
        price: item.price
      }));

      const res = await fetch(`${API}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          cartTotal: subtotal,
          cartItems,
          userId
        })
      });

      const data = await res.json();

      if (data.success && data.valid) {
        onCouponApply({
          code: data.data.code,
          type: data.data.type,
          discountAmount: data.data.discountAmount
        });
        setCouponCode('');
        setShowCouponInput(false);
      } else {
        setCouponError(data.message || 'Invalid coupon code');
      }
    } catch (error) {
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponApply(null);
    setCouponCode('');
    setCouponError('');
  };

  const getItemIcon = (icon) => {
    const icons = {
      ecg: '📊',
      reagent: '🧪',
      cable: '🔌'
    };
    return icons[icon] || '📦';
  };

  return (
    <div>
      <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
        Order summary
      </h3>

      {/* Cart Items */}
      <div className="space-y-3 mb-4 pb-4 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="w-12 h-12 bg-[var(--color-background-tertiary)] rounded-lg flex items-center justify-center text-xl flex-shrink-0">
              {getItemIcon(item.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium mb-[2px] font-[family-name:var(--font-plus-jakarta)] line-clamp-1">
                {item.name}
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)] mb-1">
                {item.brand}
              </div>
              {item.variant && (
                <div className="text-[10px] text-[var(--color-text-tertiary)]">
                  {item.variant}
                  {item.warranty && ` · ${item.warranty}`}
                </div>
              )}
              {item.note && (
                <div className="text-[10px] text-[#0C447C] bg-[#E6F1FB] inline-block px-2 py-[2px] rounded mt-1">
                  {item.note}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-[var(--color-text-secondary)]">
                  Qty: {item.quantity}
                </span>
                <span className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                  ৳{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Section */}
      <div className="mb-4">
        {!appliedCoupon && !showCouponInput && (
          <button
            onClick={() => setShowCouponInput(true)}
            className="text-[12px] text-[#0E8A6E] font-medium hover:underline cursor-pointer"
          >
            Have a coupon? Click here
          </button>
        )}

        {showCouponInput && !appliedCoupon && (
          <div>
            <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2 font-[family-name:var(--font-plus-jakarta)]">
              Coupon code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                placeholder="Enter code"
                disabled={couponLoading}
                className="flex-1 px-3 py-[9px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-mono uppercase font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-[#0E8A6E] disabled:opacity-50"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-[9px] bg-[#0B2545] text-white rounded-lg text-[12px] font-medium font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0d2e56] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {couponLoading ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Applying...
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            {couponError && (
              <div className="mt-2 text-[11px] text-[#E24B4A] flex items-center gap-1">
                ❌ {couponError}
              </div>
            )}
            <button
              onClick={() => {
                setShowCouponInput(false);
                setCouponCode('');
                setCouponError('');
              }}
              className="mt-2 text-[11px] text-[var(--color-text-secondary)] hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        {appliedCoupon && (
          <div className="bg-[#D1FAE5] border-[0.5px] border-[#0E8A6E] rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-[#065F46] mb-1 flex items-center gap-1">
                  ✅ {appliedCoupon.code} applied
                </div>
                <div className="text-[11px] text-[#065F46]">
                  You saved ৳{appliedCoupon.discountAmount.toLocaleString()}
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-[11px] text-[#065F46] hover:text-[#064E3B] font-medium hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 mb-4 pb-4 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="flex justify-between text-[12px]">
          <span className="text-[var(--color-text-secondary)]">Subtotal</span>
          <span className="font-medium font-[family-name:var(--font-plus-jakarta)]">
            ৳{subtotal.toLocaleString()}
          </span>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-[12px]">
            <span className="text-[#0E8A6E]">Coupon discount</span>
            <span className="text-[#0E8A6E] font-medium font-[family-name:var(--font-plus-jakarta)]">
              −৳{couponDiscount.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex justify-between text-[12px]">
          <span className="text-[var(--color-text-secondary)]">Delivery fee</span>
          <span className="font-medium font-[family-name:var(--font-plus-jakarta)]">
            ৳{deliveryFee.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-[12px]">
          <span className="text-[var(--color-text-secondary)]">VAT (5%)</span>
          <span className="font-medium font-[family-name:var(--font-plus-jakarta)]">
            ৳{vatAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
          Total
        </span>
        <span className="text-[18px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
          ৳{total.toLocaleString()}
        </span>
      </div>

      {/* Info Box */}
      <div className="bg-[#E6F1FB] rounded-lg p-3 text-[11px] text-[#0C447C]">
        <div className="font-medium mb-1">💳 Secure checkout</div>
        <div>Your payment information is encrypted and secure.</div>
      </div>
    </div>
  );
}
