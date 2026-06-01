const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const loyaltyService = require('../services/loyaltyService');
const logger = require('../utils/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * @desc    Get current user's loyalty summary
 * @route   GET /api/loyalty/summary
 * @access  Private
 */
exports.getMySummary = async (req, res) => {
  try {
    const summary = await loyaltyService.getUserLoyaltySummary(req.user.id);
    return successResponse(res, summary);
  } catch (error) {
    logger.error(`[loyalty] getMySummary: ${error.message}`);
    return errorResponse(res, 'Failed to fetch loyalty summary', null, 500);
  }
};

/**
 * @desc    Get current user's transaction history
 * @route   GET /api/loyalty/transactions
 * @access  Private
 */
exports.getMyTransactions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      LoyaltyTransaction.find({ user: req.user.id })
        .populate('order', 'orderNumber totalAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoyaltyTransaction.countDocuments({ user: req.user.id })
    ]);

    const pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return paginatedResponse(res, transactions, pagination);
  } catch (error) {
    logger.error(`[loyalty] getMyTransactions: ${error.message}`);
    return errorResponse(res, 'Failed to fetch transactions', null, 500);
  }
};

/**
 * @desc    Validate points redemption before checkout
 * @route   POST /api/loyalty/validate-redeem
 * @access  Private
 */
exports.validateRedeem = async (req, res) => {
  try {
    const { points, orderTotal } = req.body;

    if (!points || !orderTotal) {
      return errorResponse(res, 'points and orderTotal are required', null, 400);
    }

    const user = await User.findById(req.user.id).select('loyaltyPoints');
    const currentPoints = user?.loyaltyPoints || 0;
    const { MIN_REDEEM_POINTS, POINTS_TO_TAKA, MAX_REDEEM_PERCENT } = loyaltyService.config;

    if (points < MIN_REDEEM_POINTS) {
      return errorResponse(res, `Minimum ${MIN_REDEEM_POINTS} points required to redeem`, null, 400);
    }

    if (currentPoints < points) {
      return errorResponse(res, 'Insufficient loyalty points', null, 400);
    }

    const maxPoints = loyaltyService.maxRedeemablePoints(orderTotal);
    if (points > maxPoints) {
      return errorResponse(res, `Cannot redeem more than ${maxPoints} points (${MAX_REDEEM_PERCENT}% of order total)`, null, 400);
    }

    const discountAmount = loyaltyService.pointsToTaka(points);

    return successResponse(res, {
      pointsToRedeem: points,
      discountAmount,
      remainingPoints: currentPoints - points
    });
  } catch (error) {
    logger.error(`[loyalty] validateRedeem: ${error.message}`);
    return errorResponse(res, 'Validation failed', null, 500);
  }
};

// ── Admin endpoints ──────────────────────────────────────────────────────────

/**
 * @desc    Get all members with loyalty info (admin)
 * @route   GET /api/loyalty/admin/members
 * @access  Private/Admin
 */
exports.getMembers = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const search = req.query.search || '';

    const query = { loyaltyPoints: { $exists: true } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email loyaltyPoints role createdAt')
        .sort({ loyaltyPoints: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Attach tier info
    const members = users.map(u => ({
      ...u,
      tier: loyaltyService.getTier(u.loyaltyPoints || 0)
    }));

    const pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return paginatedResponse(res, members, pagination);
  } catch (error) {
    logger.error(`[loyalty] getMembers: ${error.message}`);
    return errorResponse(res, 'Failed to fetch members', null, 500);
  }
};

/**
 * @desc    Manually adjust user points (admin)
 * @route   POST /api/loyalty/admin/adjust
 * @access  Private/Admin
 */
exports.adjustPoints = async (req, res) => {
  try {
    const { userId, points, description } = req.body;

    if (!userId || points === undefined || !description) {
      return errorResponse(res, 'userId, points, and description are required', null, 400);
    }

    const user = await User.findById(userId);
    if (!user) return errorResponse(res, 'User not found', null, 404);

    const newBalance = Math.max(0, (user.loyaltyPoints || 0) + points);
    const actualPoints = newBalance - (user.loyaltyPoints || 0);

    await User.findByIdAndUpdate(userId, { loyaltyPoints: newBalance });

    await LoyaltyTransaction.create({
      user: userId,
      type: 'adjust',
      points: actualPoints,
      balance: newBalance,
      description,
      createdBy: req.user.id
    });

    return successResponse(res, {
      userId,
      newBalance,
      adjustment: actualPoints
    }, 'Points adjusted successfully');
  } catch (error) {
    logger.error(`[loyalty] adjustPoints: ${error.message}`);
    return errorResponse(res, 'Failed to adjust points', null, 500);
  }
};

/**
 * @desc    Get loyalty program overview stats (admin)
 * @route   GET /api/loyalty/admin/stats
 * @access  Private/Admin
 */
exports.getStats = async (req, res) => {
  try {
    const [
      totalMembers,
      totalPointsIssued,
      totalPointsRedeemed,
      recentTransactions
    ] = await Promise.all([
      User.countDocuments({ loyaltyPoints: { $gt: 0 } }),
      LoyaltyTransaction.aggregate([
        { $match: { type: { $in: ['earn', 'bonus'] } } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]),
      LoyaltyTransaction.aggregate([
        { $match: { type: 'redeem' } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]),
      LoyaltyTransaction.find()
        .populate('user', 'name email')
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    // Tier distribution
    const allUsers = await User.find({ loyaltyPoints: { $gt: 0 } }).select('loyaltyPoints').lean();
    const tierDist = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
    allUsers.forEach(u => {
      const tier = loyaltyService.getTier(u.loyaltyPoints || 0);
      tierDist[tier.label] = (tierDist[tier.label] || 0) + 1;
    });

    return successResponse(res, {
      totalMembers,
      totalPointsIssued: totalPointsIssued[0]?.total || 0,
      totalPointsRedeemed: Math.abs(totalPointsRedeemed[0]?.total || 0),
      tierDistribution: tierDist,
      recentTransactions
    });
  } catch (error) {
    logger.error(`[loyalty] getStats: ${error.message}`);
    return errorResponse(res, 'Failed to fetch stats', null, 500);
  }
};

/**
 * @desc    Get transactions for a specific user (admin)
 * @route   GET /api/loyalty/admin/users/:userId/transactions
 * @access  Private/Admin
 */
exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await LoyaltyTransaction.find({ user: req.params.userId })
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const user = await User.findById(req.params.userId).select('name email loyaltyPoints');

    return successResponse(res, { user, transactions });
  } catch (error) {
    logger.error(`[loyalty] getUserTransactions: ${error.message}`);
    return errorResponse(res, 'Failed to fetch transactions', null, 500);
  }
};
