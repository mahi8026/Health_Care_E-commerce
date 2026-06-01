const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * @desc    Validate coupon code and calculate discount
 * @route   POST /api/coupons/validate
 * @access  Private
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal, cartItems, userId } = req.body;

    // Validation — only reject truly malformed requests with 400
    if (!code || cartTotal === undefined || cartTotal === null || !cartItems || !userId) {
      return errorResponse(res, 'Missing required fields: code, cartTotal, cartItems, userId', null, 400);
    }

    // Find coupon (case-insensitive)
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase() 
    }).populate('applicableProducts applicableCategories');

    if (!coupon) {
      return successResponse(res, { valid: false }, 'Invalid coupon code');
    }

    // Check if active
    if (!coupon.isActive) {
      return successResponse(res, { valid: false }, 'This coupon is no longer active');
    }

    // Check date validity
    const now = new Date();
    if (now < coupon.startDate) {
      return successResponse(res, { valid: false }, `This coupon is not valid yet. Valid from ${coupon.startDate.toLocaleDateString()}`);
    }

    if (now > coupon.endDate) {
      return successResponse(res, { valid: false }, 'This coupon has expired');
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return successResponse(res, { valid: false }, 'This coupon has reached its usage limit');
    }

    // Check if user already used this coupon
    if (coupon.hasBeenUsedBy(userId)) {
      return successResponse(res, { valid: false }, 'You have already used this coupon');
    }

    // Check if first order only
    if (coupon.isFirstOrderOnly) {
      const orderCount = await Order.countDocuments({ 
        user: userId,
        status: { $ne: 'cancelled' }
      });
      
      if (orderCount > 0) {
        return successResponse(res, { valid: false }, 'This coupon is only valid for first-time orders');
      }
    }

    // Check minimum order amount
    if (cartTotal < coupon.minimumOrderAmount) {
      return successResponse(res, { valid: false }, `Minimum order amount of ৳${coupon.minimumOrderAmount.toLocaleString()} required`);
    }

    // Check applicable user roles
    if (coupon.applicableUserRoles && coupon.applicableUserRoles.length > 0) {
      const user = req.user;
      if (!user || !coupon.applicableUserRoles.includes(user.role)) {
        return successResponse(res, { valid: false }, 'This coupon is not applicable to your account type');
      }
    }

    // Check applicable products/categories
    if (coupon.applicableProducts.length > 0 || coupon.applicableCategories.length > 0) {
      const hasMatchingProduct = cartItems.some(item => {
        if (coupon.applicableProducts.some(p => p._id.toString() === item.productId)) {
          return true;
        }
        if (coupon.applicableCategories.some(c => c._id.toString() === item.categoryId)) {
          return true;
        }
        return false;
      });

      if (!hasMatchingProduct) {
        return successResponse(res, { valid: false }, 'This coupon is not applicable to items in your cart');
      }
    }

    // Calculate discount amount based on coupon type
    let discountAmount = 0;

    switch (coupon.type) {
      case 'percentage':
        if (coupon.value < 0 || coupon.value > 100) {
          return res.status(200).json({
            success: false,
            valid: false,
            message: 'Invalid coupon configuration'
          });
        }
        discountAmount = (cartTotal * coupon.value) / 100;
        if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
          discountAmount = coupon.maximumDiscount;
        }
        break;

      case 'fixed':
        discountAmount = coupon.value;
        if (discountAmount > cartTotal) {
          discountAmount = cartTotal;
        }
        break;

      case 'buy_x_get_y': {
        let eligibleItems = cartItems;
        if (coupon.applicableProducts.length > 0) {
          eligibleItems = cartItems.filter(item => 
            coupon.applicableProducts.some(p => p._id.toString() === item.productId)
          );
        } else if (coupon.applicableCategories.length > 0) {
          eligibleItems = cartItems.filter(item => 
            coupon.applicableCategories.some(c => c._id.toString() === item.categoryId)
          );
        }
        eligibleItems.forEach(item => {
          const setsQualified = Math.floor(item.quantity / coupon.buyQuantity);
          const freeItems = setsQualified * coupon.getQuantity;
          discountAmount += freeItems * item.price;
        });
        break;
      }

      default:
        return successResponse(res, { valid: false }, 'Invalid coupon type');
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return successResponse(res, {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      discountAmount,
      description: coupon.description,
      finalAmount: Math.max(0, cartTotal - discountAmount)
    }, 'Coupon applied successfully');

  } catch (error) {
    console.error('Validate coupon error:', error);
    return errorResponse(res, 'Failed to validate coupon', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get all coupons with pagination and filters
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
exports.getCoupons = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      type = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Search by code or description
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
      query.startDate = { $lte: new Date() };
      query.endDate = { $gte: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.endDate = { $lt: new Date() };
    } else if (status === 'scheduled') {
      query.startDate = { $gt: new Date() };
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate('createdBy', 'name email')
        .populate('applicableProducts', 'name sku')
        .populate('applicableCategories', 'name')
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Coupon.countDocuments(query)
    ]);

    return paginatedResponse(res, coupons, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: parseInt(page) < Math.ceil(total / limit),
      hasPrev: parseInt(page) > 1
    });

  } catch (error) {
    console.error('Get coupons error:', error);
    return errorResponse(res, 'Failed to fetch coupons', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get single coupon by ID
 * @route   GET /api/coupons/:id
 * @access  Private/Admin
 */
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'name sku price')
      .populate('applicableCategories', 'name');

    if (!coupon) {
      return errorResponse(res, 'Coupon not found', null, 404);
    }

    return successResponse(res, coupon);

  } catch (error) {
    console.error('Get coupon error:', error);
    return errorResponse(res, 'Failed to fetch coupon', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Create new coupon
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
exports.createCoupon = async (req, res) => {
  try {
    const couponData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Validate percentage value
    if (couponData.type === 'percentage') {
      if (couponData.value < 0 || couponData.value > 100) {
        return errorResponse(res, 'Percentage value must be between 0 and 100', null, 400);
      }
    }

    // Validate buy_x_get_y fields
    if (couponData.type === 'buy_x_get_y') {
      if (!couponData.buyQuantity || !couponData.getQuantity) {
        return errorResponse(res, 'Buy quantity and get quantity are required for buy_x_get_y coupons', null, 400);
      }
    }

    const coupon = await Coupon.create(couponData);

    // Log coupon creation activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.COUPON.CREATED,
      targetModel: 'Coupon',
      targetId: coupon._id,
      targetName: coupon.code,
      req,
      metadata: {
        type: coupon.type,
        value: coupon.value,
        startDate: coupon.startDate,
        endDate: coupon.endDate
      }
    });

    return successResponse(res, coupon, 'Coupon created successfully', 201);

  } catch (error) {
    console.error('Create coupon error:', error);
    
    // Handle duplicate code error
    if (error.code === 11000) {
      return errorResponse(res, 'A coupon with this code already exists', null, 400);
    }

    return errorResponse(res, 'Failed to create coupon', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Update coupon
 * @route   PUT /api/coupons/:id
 * @access  Private/Admin
 */
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return errorResponse(res, 'Coupon not found', null, 404);
    }

    // Validate percentage value if updating
    if (req.body.type === 'percentage' || (coupon.type === 'percentage' && req.body.value)) {
      const value = req.body.value || coupon.value;
      if (value < 0 || value > 100) {
        return errorResponse(res, 'Percentage value must be between 0 and 100', null, 400);
      }
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'createdBy' && key !== 'usageCount' && key !== 'usedBy') {
        coupon[key] = req.body[key];
      }
    });

    await coupon.save();

    // Log coupon update activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.COUPON.UPDATED,
      targetModel: 'Coupon',
      targetId: coupon._id,
      targetName: coupon.code,
      req,
      metadata: {
        updatedFields: Object.keys(req.body)
      }
    });

    return successResponse(res, coupon, 'Coupon updated successfully');

  } catch (error) {
    console.error('Update coupon error:', error);
    
    // Handle duplicate code error
    if (error.code === 11000) {
      return errorResponse(res, 'A coupon with this code already exists', null, 400);
    }

    return errorResponse(res, 'Failed to update coupon', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Delete (deactivate) coupon
 * @route   DELETE /api/coupons/:id
 * @access  Private/Admin
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return errorResponse(res, 'Coupon not found', null, 404);
    }

    // Soft delete - just deactivate
    coupon.isActive = false;
    await coupon.save();

    // Log coupon deletion activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.COUPON.DELETED,
      targetModel: 'Coupon',
      targetId: coupon._id,
      targetName: coupon.code,
      req
    });

    return successResponse(res, null, 'Coupon deactivated successfully');

  } catch (error) {
    console.error('Delete coupon error:', error);
    return errorResponse(res, 'Failed to delete coupon', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get coupon usage statistics
 * @route   GET /api/coupons/stats
 * @access  Private/Admin
 */
exports.getCouponStats = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      scheduledCoupons,
      totalUsage,
      topCoupons
    ] = await Promise.all([
      Coupon.countDocuments(),
      Coupon.countDocuments({ 
        isActive: true, 
        startDate: { $lte: now }, 
        endDate: { $gte: now } 
      }),
      Coupon.countDocuments({ endDate: { $lt: now } }),
      Coupon.countDocuments({ startDate: { $gt: now } }),
      Coupon.aggregate([
        { $group: { _id: null, total: { $sum: '$usageCount' } } }
      ]),
      Coupon.find()
        .sort({ usageCount: -1 })
        .limit(5)
        .select('code type usageCount usageLimit')
        .lean()
    ]);

    return successResponse(res, {
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      scheduledCoupons,
      totalUsage: totalUsage[0]?.total || 0,
      topCoupons
    });

  } catch (error) {
    console.error('Get coupon stats error:', error);
    return errorResponse(res, 'Failed to fetch coupon statistics', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
