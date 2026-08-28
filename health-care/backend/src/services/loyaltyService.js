const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const config = require('../config/loyaltyConfig');
const logger = require('../utils/logger');

/**
 * Get user's loyalty tier based on total points earned
 */
function getTier(totalPointsEarned) {
  const { TIERS } = config;
  if (totalPointsEarned >= TIERS.PLATINUM.min) {
return TIERS.PLATINUM;
}
  if (totalPointsEarned >= TIERS.GOLD.min) {
return TIERS.GOLD;
}
  if (totalPointsEarned >= TIERS.SILVER.min) {
return TIERS.SILVER;
}
  return TIERS.BRONZE;
}

/**
 * Calculate points earned for an order
 */
function calculateEarnedPoints(orderTotal) {
  return Math.floor(orderTotal * config.POINTS_PER_TAKA);
}

/**
 * Calculate taka value of points
 */
function pointsToTaka(points) {
  return Math.floor(points * config.POINTS_TO_TAKA * 100) / 100;
}

/**
 * Calculate max redeemable points for an order
 */
function maxRedeemablePoints(orderTotal) {
  const maxTaka = orderTotal * (config.MAX_REDEEM_PERCENT / 100);
  return Math.floor(maxTaka / config.POINTS_TO_TAKA);
}

/**
 * Award points to a user after order
 */
async function awardOrderPoints(userId, orderId, orderTotal, isFirstOrder = false, session = null) {
  try {
    const earnedPoints = calculateEarnedPoints(orderTotal);
    const bonusPoints = isFirstOrder ? config.BONUS_FIRST_ORDER : 0;
    const totalPoints = earnedPoints + bonusPoints;

    if (totalPoints <= 0) {
return null;
}

    const user = await User.findById(userId).session(session);
    if (!user) {
return null;
}

    const newBalance = (user.loyaltyPoints || 0) + totalPoints;

    // Update user points
    await User.findByIdAndUpdate(
      userId,
      { $inc: { loyaltyPoints: totalPoints } },
      { session }
    );

    // Record transaction
    const txData = {
      user: userId,
      type: 'earn',
      points: totalPoints,
      balance: newBalance,
      description: isFirstOrder
        ? `Earned ${earnedPoints} pts for order + ${bonusPoints} first order bonus`
        : `Earned ${earnedPoints} pts for order`,
      order: orderId,
      expiresAt: new Date(Date.now() + config.POINTS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };

    if (session) {
      await LoyaltyTransaction.create([txData], { session });
    } else {
      await LoyaltyTransaction.create(txData);
    }

    logger.info(`[Loyalty] Awarded ${totalPoints} points to user ${userId} for order ${orderId}`);
    return { earnedPoints, bonusPoints, totalPoints, newBalance };
  } catch (error) {
    logger.error(`[Loyalty] awardOrderPoints error: ${error.message}`);
    return null;
  }
}

/**
 * Redeem points for an order (validate and deduct)
 */
async function redeemPoints(userId, pointsToRedeem, orderId, orderTotal, session = null) {
  try {
    if (pointsToRedeem < config.MIN_REDEEM_POINTS) {
      throw new Error(`Minimum ${config.MIN_REDEEM_POINTS} points required to redeem`);
    }

    // D3 — atomic, balance-guarded deduction. The previous read-then-`$inc`
    // raced when called without a session: two concurrent redemptions could
    // both pass the balance check and drive the balance negative.
    const guardedUser = await User.findOneAndUpdate(
      { _id: userId, loyaltyPoints: { $gte: pointsToRedeem } },
      { $inc: { loyaltyPoints: -pointsToRedeem } },
      { session, new: true }
    );
    if (!guardedUser) {
      throw new Error('Insufficient loyalty points');
    }

    const maxPoints = maxRedeemablePoints(orderTotal);
    if (pointsToRedeem > maxPoints) {
      throw new Error(`Cannot redeem more than ${maxPoints} points for this order`);
    }

    const discountAmount = pointsToTaka(pointsToRedeem);
    const newBalance = guardedUser.loyaltyPoints;

    // Record transaction
    const txData = {
      user: userId,
      type: 'redeem',
      points: -pointsToRedeem,
      balance: newBalance,
      description: `Redeemed ${pointsToRedeem} pts for ৳${discountAmount} discount`,
      order: orderId
    };

    if (session) {
      await LoyaltyTransaction.create([txData], { session });
    } else {
      await LoyaltyTransaction.create(txData);
    }

    logger.info(`[Loyalty] Redeemed ${pointsToRedeem} points for user ${userId}`);
    return { pointsRedeemed: pointsToRedeem, discountAmount, newBalance };
  } catch (error) {
    logger.error(`[Loyalty] redeemPoints error: ${error.message}`);
    throw error;
  }
}

/**
 * Award bonus points (review, referral, etc.)
 */
async function awardBonusPoints(userId, points, description, type = 'bonus') {
  try {
    const user = await User.findById(userId);
    if (!user) {
return null;
}

    const newBalance = (user.loyaltyPoints || 0) + points;

    await User.findByIdAndUpdate(userId, { $inc: { loyaltyPoints: points } });

    await LoyaltyTransaction.create({
      user: userId,
      type,
      points,
      balance: newBalance,
      description,
      expiresAt: new Date(Date.now() + config.POINTS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    });

    return { points, newBalance };
  } catch (error) {
    logger.error(`[Loyalty] awardBonusPoints error: ${error.message}`);
    return null;
  }
}

/**
 * Get user loyalty summary
 */
async function getUserLoyaltySummary(userId) {
  const user = await User.findById(userId).select('loyaltyPoints name email');
  if (!user) {
throw new Error('User not found');
}

  const currentPoints = user.loyaltyPoints || 0;

  // Calculate total earned (sum of all earn transactions)
  const earnAgg = await LoyaltyTransaction.aggregate([
    { $match: { user: user._id, type: { $in: ['earn', 'bonus'] } } },
    { $group: { _id: null, total: { $sum: '$points' } } }
  ]);
  const totalEarned = earnAgg[0]?.total || 0;

  const tier = getTier(totalEarned);
  const nextTierKey = Object.keys(config.TIERS).find(
    k => config.TIERS[k].min > totalEarned
  );
  const nextTier = nextTierKey ? config.TIERS[nextTierKey] : null;
  const pointsToNextTier = nextTier ? nextTier.min - totalEarned : 0;

  return {
    currentPoints,
    totalEarned,
    tier,
    nextTier,
    pointsToNextTier,
    redeemableValue: pointsToTaka(currentPoints),
    canRedeem: currentPoints >= config.MIN_REDEEM_POINTS,
    minRedeemPoints: config.MIN_REDEEM_POINTS,
    pointsToTakaRate: config.POINTS_TO_TAKA
  };
}

module.exports = {
  getTier,
  calculateEarnedPoints,
  pointsToTaka,
  maxRedeemablePoints,
  awardOrderPoints,
  redeemPoints,
  awardBonusPoints,
  getUserLoyaltySummary,
  config
};
