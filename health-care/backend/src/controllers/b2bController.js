const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * @desc    Get all B2B users/applications
 * @route   GET /api/admin/b2b/users
 * @access  Private/Admin
 */
exports.getB2BUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const status = req.query.status; // pending, approved, rejected
    const search = req.query.search || '';

    const query = { b2bAccount: true };

    if (status) {
      query.b2bApprovalStatus = status;
    }

    if (search) {
      const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { companyName: { $regex: escaped, $options: 'i' } },
        { b2bId: { $regex: escaped, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email companyName institutionType b2bApprovalStatus b2bDiscountEnabled b2bId tradeLicense phone createdAt b2bApprovedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    const pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return paginatedResponse(res, users, pagination);
  } catch (error) {
    logger.error(`[getB2BUsers] ${error.message}`);
    return errorResponse(res, 'Failed to fetch B2B users', null, 500);
  }
};

/**
 * @desc    Approve B2B user application
 * @route   PUT /api/admin/b2b/users/:id/approve
 * @access  Private/Admin
 */
exports.approveB2BUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    if (!user.b2bAccount) {
      return errorResponse(res, 'User is not a B2B applicant', null, 400);
    }

    if (user.b2bApprovalStatus === 'approved') {
      return errorResponse(res, 'User is already approved', null, 400);
    }

    // Generate B2B ID if not exists
    if (!user.b2bId) {
      const count = await User.countDocuments({ b2bAccount: true, b2bApprovalStatus: 'approved' });
      user.b2bId = `B2B${String(count + 1).padStart(6, '0')}`; // B2B000001, B2B000002, etc.
    }

    user.b2bApprovalStatus = 'approved';
    user.b2bApprovedAt = new Date();
    user.b2bApprovedBy = req.user.id;
    user.b2bDiscountEnabled = true; // Enable B2B pricing
    user.role = 'b2b_customer'; // Upgrade role

    await user.save();

    logger.info(`[approveB2BUser] User ${user.email} approved by ${req.user.email}`);

    // Note: B2B approval email implementation deferred to v2.0
    // Enhancement tracked in backlog: Implement sendB2BApprovalEmail(user)

    return successResponse(res, { user }, 'B2B application approved successfully');
  } catch (error) {
    logger.error(`[approveB2BUser] ${error.message}`);
    return errorResponse(res, 'Failed to approve B2B user', null, 500);
  }
};

/**
 * @desc    Reject B2B user application
 * @route   PUT /api/admin/b2b/users/:id/reject
 * @access  Private/Admin
 */
exports.rejectB2BUser = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return errorResponse(res, 'Rejection reason is required (min 10 characters)', null, 400);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    if (!user.b2bAccount) {
      return errorResponse(res, 'User is not a B2B applicant', null, 400);
    }

    user.b2bApprovalStatus = 'rejected';
    user.b2bRejectedAt = new Date();
    user.b2bRejectionReason = reason;
    user.b2bDiscountEnabled = false;

    await user.save();

    logger.info(`[rejectB2BUser] User ${user.email} rejected by ${req.user.email}`);

    // Note: B2B rejection email implementation deferred to v2.0
    // Enhancement tracked in backlog: Implement sendB2BRejectionEmail(user, reason)

    return successResponse(res, { user }, 'B2B application rejected');
  } catch (error) {
    logger.error(`[rejectB2BUser] ${error.message}`);
    return errorResponse(res, 'Failed to reject B2B user', null, 500);
  }
};

/**
 * @desc    Toggle B2B discount for a user
 * @route   PUT /api/admin/b2b/users/:id/toggle-discount
 * @access  Private/Admin
 */
exports.toggleB2BDiscount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    if (!user.b2bAccount || user.b2bApprovalStatus !== 'approved') {
      return errorResponse(res, 'User must be an approved B2B customer', null, 400);
    }

    user.b2bDiscountEnabled = !user.b2bDiscountEnabled;
    await user.save();

    const status = user.b2bDiscountEnabled ? 'enabled' : 'disabled';
    logger.info(`[toggleB2BDiscount] B2B discount ${status} for user ${user.email} by ${req.user.email}`);

    return successResponse(res, { user }, `B2B discount ${status} successfully`);
  } catch (error) {
    logger.error(`[toggleB2BDiscount] ${error.message}`);
    return errorResponse(res, 'Failed to toggle B2B discount', null, 500);
  }
};

/**
 * @desc    Get all category discounts
 * @route   GET /api/admin/b2b/categories/discounts
 * @access  Private/Admin
 */
exports.getCategoryDiscounts = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug b2bDiscountEnabled b2bDiscountPct productCount')
      .sort({ name: 1 })
      .lean();

    return successResponse(res, { categories });
  } catch (error) {
    logger.error(`[getCategoryDiscounts] ${error.message}`);
    return errorResponse(res, 'Failed to fetch category discounts', null, 500);
  }
};

/**
 * @desc    Update category discount
 * @route   PUT /api/admin/b2b/categories/:id/discount
 * @access  Private/Admin
 */
exports.updateCategoryDiscount = async (req, res) => {
  try {
    const { b2bDiscountEnabled, b2bDiscountPct } = req.body;

    if (b2bDiscountPct !== undefined && (b2bDiscountPct < 0 || b2bDiscountPct > 100)) {
      return errorResponse(res, 'Discount percentage must be between 0 and 100', null, 400);
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return errorResponse(res, 'Category not found', null, 404);
    }

    if (b2bDiscountEnabled !== undefined) {
      category.b2bDiscountEnabled = b2bDiscountEnabled;
    }

    if (b2bDiscountPct !== undefined) {
      category.b2bDiscountPct = b2bDiscountPct;
    }

    await category.save();

    logger.info(`[updateCategoryDiscount] Category ${category.name} discount updated to ${category.b2bDiscountPct}% by ${req.user.email}`);

    return successResponse(res, { category }, 'Category discount updated successfully');
  } catch (error) {
    logger.error(`[updateCategoryDiscount] ${error.message}`);
    return errorResponse(res, 'Failed to update category discount', null, 500);
  }
};

/**
 * @desc    Bulk update category discounts
 * @route   PUT /api/admin/b2b/categories/discounts/bulk
 * @access  Private/Admin
 */
exports.bulkUpdateCategoryDiscounts = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { categoryId, b2bDiscountPct, b2bDiscountEnabled }

    if (!Array.isArray(updates) || updates.length === 0) {
      return errorResponse(res, 'Updates array is required', null, 400);
    }

    const results = [];

    for (const update of updates) {
      const { categoryId, b2bDiscountPct, b2bDiscountEnabled } = update;

      if (b2bDiscountPct !== undefined && (b2bDiscountPct < 0 || b2bDiscountPct > 100)) {
        results.push({ categoryId, success: false, error: 'Invalid discount percentage' });
        continue;
      }

      const category = await Category.findById(categoryId);

      if (!category) {
        results.push({ categoryId, success: false, error: 'Category not found' });
        continue;
      }

      if (b2bDiscountEnabled !== undefined) category.b2bDiscountEnabled = b2bDiscountEnabled;
      if (b2bDiscountPct !== undefined) category.b2bDiscountPct = b2bDiscountPct;

      await category.save();
      results.push({ categoryId, success: true, name: category.name });
    }

    const successCount = results.filter(r => r.success).length;
    logger.info(`[bulkUpdateCategoryDiscounts] Updated ${successCount}/${updates.length} categories by ${req.user.email}`);

    return successResponse(res, { results }, `Updated ${successCount} category discounts`);
  } catch (error) {
    logger.error(`[bulkUpdateCategoryDiscounts] ${error.message}`);
    return errorResponse(res, 'Failed to bulk update discounts', null, 500);
  }
};

/**
 * @desc    Get B2B statistics
 * @route   GET /api/admin/b2b/stats
 * @access  Private/Admin
 */
exports.getB2BStats = async (req, res) => {
  try {
    const [
      totalB2B,
      pendingApplications,
      approvedB2B,
      rejectedB2B,
      activeB2B
    ] = await Promise.all([
      User.countDocuments({ b2bAccount: true }),
      User.countDocuments({ b2bAccount: true, b2bApprovalStatus: 'pending' }),
      User.countDocuments({ b2bAccount: true, b2bApprovalStatus: 'approved' }),
      User.countDocuments({ b2bAccount: true, b2bApprovalStatus: 'rejected' }),
      User.countDocuments({ b2bAccount: true, b2bApprovalStatus: 'approved', b2bDiscountEnabled: true })
    ]);

    return successResponse(res, {
      totalB2B,
      pendingApplications,
      approvedB2B,
      rejectedB2B,
      activeB2B
    });
  } catch (error) {
    logger.error(`[getB2BStats] ${error.message}`);
    return errorResponse(res, 'Failed to fetch B2B stats', null, 500);
  }
};

module.exports = {
  getB2BUsers: exports.getB2BUsers,
  approveB2BUser: exports.approveB2BUser,
  rejectB2BUser: exports.rejectB2BUser,
  toggleB2BDiscount: exports.toggleB2BDiscount,
  getCategoryDiscounts: exports.getCategoryDiscounts,
  updateCategoryDiscount: exports.updateCategoryDiscount,
  bulkUpdateCategoryDiscounts: exports.bulkUpdateCategoryDiscounts,
  getB2BStats: exports.getB2BStats
};
