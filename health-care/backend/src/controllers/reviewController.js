const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, images } = req.body;
    
    // Validate required fields (orderId is optional — we'll determine verifiedPurchase below)
    if (!productId || !rating || !title || !comment) {
      return errorResponse(res, 'Please provide all required fields', null, 400);
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 'Product not found', null, 404);
    }
    
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id
    });
    
    if (existingReview) {
      return errorResponse(res, 'You have already reviewed this product. You can edit your existing review.', null, 400);
    }

    // Determine verified purchase status
    // If orderId provided, verify the order belongs to this user and is delivered
    let verifiedPurchase = false;
    let resolvedOrderId = null;

    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: req.user._id,
        status: 'delivered',
        'items.product': productId
      }).lean();
      if (order) {
        verifiedPurchase = true;
        resolvedOrderId = order._id;
      }
    }

    // If no orderId given (or not matched), try to find any delivered order for this product
    if (!verifiedPurchase) {
      const anyOrder = await Order.findOne({
        user: req.user._id,
        status: 'delivered',
        'items.product': productId
      }).sort({ createdAt: -1 }).lean();
      if (anyOrder) {
        verifiedPurchase = true;
        resolvedOrderId = anyOrder._id;
      }
    }
    
    // Validate images count
    if (images && images.length > 5) {
      return errorResponse(res, 'Maximum 5 images allowed per review', null, 400);
    }
    
    // Create review — unverified reviews pending approval, verified auto-approved
    const review = await Review.create({
      product: productId,
      user: req.user._id,
      order: resolvedOrderId,
      rating,
      title,
      comment,
      images: images || [],
      verifiedPurchase,
      status: verifiedPurchase ? 'approved' : 'pending'
    });
    
    await review.populate('user', 'name email');
    
    logActivityAsync({
      user: req.user,
      action: ACTIONS.REVIEW.CREATED,
      targetModel: 'Review',
      targetId: review._id,
      targetName: product.name,
      req,
      metadata: { rating, verifiedPurchase }
    });
    
    return successResponse(res, review, 'Review submitted successfully', 201);
  } catch (error) {
    console.error('Create review error:', error);
    return errorResponse(res, 'Failed to create review', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, verified, sort = 'helpful', page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {
      product: productId,
      status: 'approved'
    };
    
    if (rating) {
      query.rating = parseInt(rating);
    }
    
    if (verified === 'true') {
      query.verifiedPurchase = true;
    }
    
    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'helpful':
        sortOption = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'recent':
        sortOption = { createdAt: -1 };
        break;
      case 'rating_high':
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case 'rating_low':
        sortOption = { rating: 1, createdAt: -1 };
        break;
      default:
        sortOption = { helpfulCount: -1, createdAt: -1 };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get reviews
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count
    const total = await Review.countDocuments(query);
    
    // Get rating stats
    const stats = await Review.getProductStats(productId);
    
    return paginatedResponse(res, reviews, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrev: parseInt(page) > 1,
      stats
    });
  } catch (error) {
    logger.error('Get product reviews error:', error);
    return errorResponse(res, 'Failed to fetch reviews', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/user
// @access  Private
exports.getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Review.countDocuments({ user: req.user._id });
    
    return paginatedResponse(res, reviews, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    return errorResponse(res, 'Failed to fetch your reviews', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;
    
    const review = await Review.findById(id);
    
    if (!review) {
      return errorResponse(res, 'Review not found', null, 404);
    }
    
    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'You can only edit your own reviews', null, 403);
    }
    
    // Check if within edit window (30 days)
    const daysSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 30) {
      return errorResponse(res, 'Reviews can only be edited within 30 days of creation', null, 403);
    }
    
    // Validate images count
    if (images && images.length > 5) {
      return errorResponse(res, 'Maximum 5 images allowed per review', null, 400);
    }
    
    // Update fields
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (images !== undefined) review.images = images;
    
    review.isEdited = true;
    review.editedAt = new Date();
    
    await review.save();
    await review.populate('user', 'name email');
    
    return successResponse(res, review, 'Review updated successfully');
  } catch (error) {
    console.error('Update review error:', error);
    return errorResponse(res, 'Failed to update review', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id);
    
    if (!review) {
      return errorResponse(res, 'Review not found', null, 404);
    }
    
    // Check ownership (user can delete own, admin can delete any)
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'You can only delete your own reviews', null, 403);
    }
    
    await review.remove();
    
    // Log review deletion activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.REVIEW.DELETED,
      targetModel: 'Review',
      targetId: review._id,
      targetName: `Review by ${req.user.name}`,
      req,
      metadata: {
        rating: review.rating
      }
    });
    
    return successResponse(res, null, 'Review deleted successfully');
  } catch (error) {
    console.error('Delete review error:', error);
    return errorResponse(res, 'Failed to delete review', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
exports.markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id);
    
    if (!review) {
      return errorResponse(res, 'Review not found', null, 404);
    }
    
    const wasAdded = await review.toggleHelpful(req.user._id);
    
    return successResponse(res, {
      helpfulCount: review.helpfulCount,
      isHelpful: wasAdded
    }, wasAdded ? 'Marked as helpful' : 'Removed helpful mark');
  } catch (error) {
    console.error('Mark helpful error:', error);
    return errorResponse(res, 'Failed to update helpful status', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
exports.reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length < 10) {
      return errorResponse(res, 'Please provide a reason (at least 10 characters)', null, 400);
    }
    
    const review = await Review.findById(id);
    
    if (!review) {
      return errorResponse(res, 'Review not found', null, 404);
    }
    
    // Check daily report limit (3 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reportsToday = await Review.countDocuments({
      'reportedBy.user': req.user._id,
      'reportedBy.reportedAt': { $gte: today }
    });
    
    if (reportsToday >= 3) {
      return errorResponse(res, 'You have reached the daily report limit (3 reports per day)', null, 429);
    }
    
    await review.addReport(req.user._id, reason);
    
    return successResponse(res, null, 'Review reported successfully. Our team will review it.');
  } catch (error) {
    console.error('Report review error:', error);
    return errorResponse(res, 'Failed to report review', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// @desc    Get products eligible for review
// @route   GET /api/reviews/eligible-products
// @access  Private
exports.getEligibleProducts = async (req, res) => {
  try {
    // Get delivered orders from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const orders = await Order.find({
      user: req.user._id,
      status: 'delivered',
      deliveredAt: { $gte: ninetyDaysAgo }
    }).populate('items.product', 'name images sku').lean();
    
    // Get all product IDs from orders
    const productIds = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product && !productIds.includes(item.product._id.toString())) {
          productIds.push(item.product._id.toString());
        }
      });
    });
    
    // Get already reviewed product IDs
    const reviewedProducts = await Review.find({
      user: req.user._id,
      product: { $in: productIds }
    }).distinct('product');
    
    const reviewedIds = reviewedProducts.map(id => id.toString());
    
    // Filter out already reviewed products
    const eligibleProducts = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product && !reviewedIds.includes(item.product._id.toString())) {
          const existing = eligibleProducts.find(p => p._id.toString() === item.product._id.toString());
          if (!existing) {
            eligibleProducts.push({
              ...item.product.toObject(),
              orderId: order._id,
              deliveredAt: order.deliveredAt
            });
          }
        }
      });
    });
    
    return successResponse(res, eligibleProducts);
  } catch (error) {
    console.error('Get eligible products error:', error);
    return errorResponse(res, 'Failed to fetch eligible products', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res) => {
  try {
    const { status, product, user, rating, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (product) query.product = product;
    if (user) query.user = user;
    if (rating) query.rating = parseInt(rating);
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get reviews
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name sku images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Review.countDocuments(query);
    
    // Get stats
    const stats = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusStats = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });
    
    return paginatedResponse(res, reviews, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrev: parseInt(page) > 1,
      stats: statusStats
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    return errorResponse(res, 'Failed to fetch reviews', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// @desc    Update review status (admin)
// @route   PATCH /api/admin/reviews/:id/status
// @access  Private/Admin
exports.updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse, rejectionReason } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return errorResponse(res, 'Invalid status. Must be pending, approved, or rejected', null, 400);
    }
    
    const review = await Review.findById(id);
    
    if (!review) {
      return errorResponse(res, 'Review not found', null, 404);
    }
    
    review.status = status;
    
    if (adminResponse) {
      review.adminResponse = adminResponse;
    }
    
    if (status === 'rejected' && rejectionReason) {
      review.rejectionReason = rejectionReason;
    }
    
    // Clear reported flag if approved
    if (status === 'approved') {
      review.reported = false;
    }
    
    await review.save();
    await review.populate('user', 'name email');
    await review.populate('product', 'name sku');

    // Log review status change activity
    const actionMap = {
      'approved': ACTIONS.REVIEW.APPROVED,
      'rejected': ACTIONS.REVIEW.REJECTED
    };
    
    if (actionMap[status]) {
      logActivityAsync({
        user: req.user,
        action: actionMap[status],
        targetModel: 'Review',
        targetId: review._id,
        targetName: `Review by ${review.user.name}`,
        req,
        metadata: {
          productName: review.product.name,
          rating: review.rating,
          rejectionReason
        }
      });
    }
    
    return successResponse(res, review, `Review ${status} successfully`);
  } catch (error) {
    console.error('Update review status error:', error);
    return errorResponse(res, 'Failed to update review status', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};
