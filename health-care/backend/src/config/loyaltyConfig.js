/**
 * Loyalty Program Configuration
 * ৳100 spent = 1 point earned
 * 100 points = ৳10 discount (redeemable)
 * Minimum 500 points to redeem
 */

module.exports = {
  // Earning rules
  POINTS_PER_TAKA: 0.01,          // 1 point per ৳100 (0.01 points per ৳1)
  BONUS_FIRST_ORDER: 200,          // Bonus points for first order
  BONUS_REVIEW: 50,                // Bonus points for leaving a review
  BONUS_REFERRAL_REFERRER: 500,    // Points for referring a friend
  BONUS_REFERRAL_REFEREE: 200,     // Points for being referred

  // Redemption rules
  POINTS_TO_TAKA: 0.01,           // 1000 points = ৳10 (0.01 taka per point)
  MIN_REDEEM_POINTS: 500,          // Minimum points to redeem
  MAX_REDEEM_PERCENT: 20,          // Max 20% of order total can be paid with points

  // Tier thresholds (cumulative points earned)
  TIERS: {
    BRONZE:   { min: 0,     max: 999,   label: 'Bronze',   discount: 0,  color: '#CD7F32', icon: '🥉' },
    SILVER:   { min: 1000,  max: 4999,  label: 'Silver',   discount: 5,  color: '#C0C0C0', icon: '🥈' },
    GOLD:     { min: 5000,  max: 9999,  label: 'Gold',     discount: 10, color: '#FFD700', icon: '🥇' },
    PLATINUM: { min: 10000, max: Infinity, label: 'Platinum', discount: 15, color: '#E5E4E2', icon: '💎' },
  },

  // Points expiry
  POINTS_EXPIRY_DAYS: 365,         // Points expire after 1 year
};
