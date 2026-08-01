'use client';

import { FaStar } from 'react-icons/fa';

/**
 * Loyalty Points display card for Account Dashboard.
 * Shows points balance and redemption info.
 */
export default function LoyaltyPointsCard({ points = 0 }) {
  return (
    <div className="bg-gradient-to-br from-brand-teal to-[var(--color-brand-teal-hover)] rounded-lg p-4 sm:p-5 text-white shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FaStar className="text-[#FFD700]" size={16} />
            <span className="text-xs sm:text-xs font-semibold opacity-90">Loyalty Points</span>
          </div>
          <div className="text-3xl sm:text-4xl font-semibold leading-none">
            {points.toLocaleString()}
          </div>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
          <FaStar className="text-[#FFD700]" size={24} />
        </div>
      </div>
      
      <div className="space-y-1.5 text-xs sm:text-xs opacity-90">
        <div className="flex items-center gap-2">
          <span>💰</span>
          <span>1 point = ৳1 discount</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🎁</span>
          <span>Earn points on every purchase</span>
        </div>
        <div className="flex items-center gap-2">
          <span>✨</span>
          <span>Redeem at checkout</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/20">
        <p className="text-xs sm:text-xs opacity-75">
          Your points never expire. Use them anytime to save on your next order.
        </p>
      </div>
    </div>
  );
}

