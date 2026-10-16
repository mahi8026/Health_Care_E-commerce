const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @desc    Backfill legacy B2B users with missing b2bApprovalStatus
 * @route   POST /api/admin/migrations/backfill-b2b-status
 * @access  Private/Admin
 * @security One-time migration endpoint - should be disabled after use
 */
exports.backfillB2BStatus = async (req, res) => {
  try {
    // Find all B2B users without b2bApprovalStatus
    const legacyB2BUsers = await User.find({
      $or: [
        { b2bAccount: true },
        { role: 'b2b_customer' },
        { accountType: 'B2B' }
      ],
      b2bApprovalStatus: null
    });

    logger.info(`[backfillB2BStatus] Found ${legacyB2BUsers.length} legacy B2B users`);

    const results = {
      total: legacyB2BUsers.length,
      updated: 0,
      failed: 0,
      users: []
    };

    for (const user of legacyB2BUsers) {
      try {
        // Determine status based on existing data
        let status = 'pending'; // Default to pending
        
        // If user has b2bId or was clearly approved before, mark as approved
        if (user.b2bId || user.b2bDiscountEnabled) {
          status = 'approved';
          if (!user.b2bApprovedAt) {
            user.b2bApprovedAt = user.createdAt; // Use creation date as fallback
          }
        }

        // Update the user
        user.b2bApprovalStatus = status;
        user.b2bAccount = true;
        user.accountType = 'B2B';
        user.role = 'b2b_customer';
        
        await user.save();

        results.updated++;
        results.users.push({
          email: user.email,
          status,
          b2bId: user.b2bId || 'none'
        });

        logger.info(`[backfillB2BStatus] Updated ${user.email} to status: ${status}`);
      } catch (error) {
        results.failed++;
        logger.error(`[backfillB2BStatus] Failed to update ${user.email}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Backfilled ${results.updated} legacy B2B users`,
      results
    });
  } catch (error) {
    logger.error(`[backfillB2BStatus] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to backfill B2B users',
      error: process.env.ERROR_DETAIL_ENABLED === 'true' ? error.message : undefined
    });
  }
};

module.exports = {
  backfillB2BStatus: exports.backfillB2BStatus
};
