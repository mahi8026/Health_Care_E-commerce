'use client';

/**
 * CODPromoBanner — Cash on Delivery Promotional Banner
 * 
 * Displays prominently across the site to promote COD as the most
 * popular and convenient payment method in Bangladesh.
 * 
 * Usage:
 * - Cart page (above total)
 * - Product detail pages (below Add to Cart)
 * - Checkout page (if other payment selected)
 */

import { FaCheckCircle, FaShieldAlt } from 'react-icons/fa';

export default function CODPromoBanner({ variant = 'default', className = '' }) {
  if (variant === 'compact') {
    return (
      <div className={`p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xl shadow-sm">
            💵
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-900 mb-0.5">Cash on Delivery Available</h4>
            <p className="text-xs text-emerald-700">Pay when you receive • Most popular in Bangladesh</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'mini') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 ${className}`}>
        <span className="text-lg">💵</span>
        <span className="text-xs font-semibold text-emerald-800">Cash on Delivery Available</span>
      </div>
    );
  }

  // Default full banner
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 relative overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <text x="10" y="50" fontSize="60" fill="currentColor">💵</text>
        </svg>
      </div>

      {/* Popular Badge */}
      <div className="absolute top-2 right-2">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-[9px] font-bold shadow-sm">
          ⭐ MOST POPULAR
        </span>
      </div>

      <div className="relative">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-2xl shadow-lg">
            💵
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-emerald-900 mb-1">
              Cash on Delivery Available
            </h3>
            <p className="text-sm text-emerald-800 leading-relaxed">
              Bangladesh&apos;s most trusted payment method. Pay with cash when you receive your order.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center gap-2 text-xs text-emerald-900 bg-white/60 rounded-lg px-3 py-2">
            <FaCheckCircle className="text-emerald-600 flex-shrink-0" size={14} />
            <span className="font-semibold">No online payment needed</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-900 bg-white/60 rounded-lg px-3 py-2">
            <FaCheckCircle className="text-emerald-600 flex-shrink-0" size={14} />
            <span className="font-semibold">Inspect before paying</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-900 bg-white/60 rounded-lg px-3 py-2">
            <FaShieldAlt className="text-emerald-600 flex-shrink-0" size={14} />
            <span className="font-semibold">100% Safe & Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CODTrustBadge — Small trust badge to show COD availability
 */
export function CODTrustBadge({ className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 ${className}`}>
      <span className="text-base">💵</span>
      <span className="text-xs font-bold text-emerald-800">COD Available</span>
    </div>
  );
}

/**
 * CODFloatingBanner — Sticky/floating banner for mobile
 */
export function CODFloatingBanner({ onClose, className = '' }) {
  return (
    <div className={`p-3 rounded-t-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">💵</span>
          <div>
            <p className="text-white text-xs font-bold leading-tight">Cash on Delivery Available</p>
            <p className="text-emerald-100 text-[10px] leading-tight">Pay when you receive your order</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * CODInfoStrip — Horizontal info strip for headers
 */
export function CODInfoStrip({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-4 px-4 py-2 bg-emerald-50 border-b border-emerald-100 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">💵</span>
        <span className="text-xs font-semibold text-emerald-800">Cash on Delivery Available</span>
      </div>
      <span className="hidden sm:inline text-xs text-emerald-600">•</span>
      <span className="hidden sm:inline text-xs text-emerald-700">Most popular payment method in Bangladesh</span>
    </div>
  );
}
