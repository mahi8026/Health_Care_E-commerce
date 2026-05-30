const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const loyaltyService = require('../services/loyaltyService');
const logger = require('../utils/logger');

/**
 * @desc    Get current user's loyalty summary
 * @route   GET /api/loyalty/summary
 * @access  Private
 */
exports.getMySummary = async (req, res) => {
  try {
    const summary = await loyaltyService.getUserLoyaltySummary(req.user.id);
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error(`[loyalty] getMySummary: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch loyalty summary' });
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

    res.json({
      success: true,
      data: transactions,
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error(`[loyalty] getMyTransactions: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
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
      return res.status(400).json({ success: false, message: 'points and orderTotal are required' });
    }

    const user = await User.findById(req.user.id).select('loyaltyPoints');
    const currentPoints = user?.loyaltyPoints || 0;
    const { MIN_REDEEM_POINTS, POINTS_TO_TAKA, MAX_REDEEM_PERCENT } = loyaltyService.config;

    if (points < MIN_REDEEM_POINTS) {
      return res.status(400).json({
        success: false,
        message: `Minimum ${MIN_REDEEM_POINTS} points required to redeem`
      });
    }

    if (currentPoints < points) {
      return res.status(400).json({ success: false, message: 'Insufficient loyalty points' });
    }

    const maxPoints = loyaltyService.maxRedeemablePoints(orderTotal);
    if (points > maxPoints) {
      return res.status(400).json({
        success: false,
        message: `Cannot redeem more than ${maxPoints} points (${MAX_REDEEM_PERCENT}% of order total)`
      });
    }

    const discountAmount = loyaltyService.pointsToTaka(points);

    res.json({
      success: true,
      data: {
        pointsToRedeem: points,
        discountAmount,
        remainingPoints: currentPoints - points
      }
    });
  } catch (error) {
    logger.error(`[loyalty] validateRedeem: ${error.message}`);
    res.status(500).json({ success: false, message: 'Validation failed' });
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

    res.json({
      success: true,
      data: members,
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error(`[loyalty] getMembers: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
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
      return res.status(400).json({ success: false, message: 'userId, points, and description are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

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

    res.json({
      success: true,
      message: `Points adjusted successfully`,
      data: { userId, newBalance, adjustment: actualPoints }
    });
  } catch (error) {
    logger.error(`[loyalty] adjustPoints: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to adjust points' });
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

    res.json({
      success: true,
      data: {
        totalMembers,
        totalPointsIssued: totalPointsIssued[0]?.total || 0,
        totalPointsRedeemed: Math.abs(totalPointsRedeemed[0]?.total || 0),
        tierDistribution: tierDist,
        recentTransactions
      }
    });
  } catch (error) {
    logger.error(`[loyalty] getStats: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
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

    res.json({ success: true, data: { user, transactions } });
  } catch (error) {
    logger.error(`[loyalty] getUserTransactions: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};
