const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, images } = req.body;
    
    // Validate required fields
    if (!productId || !orderId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Verify user purchased this product
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      status: 'delivered',
      'items.product': productId
    });
    
    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased and received'
      });
    }
    
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product. You can edit your existing review.'
      });
    }
    
    // Validate images count
    if (images && images.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 images allowed per review'
      });
    }
    
    // Create review
    const review = await Review.create({
      product: productId,
      user: req.user._id,
      order: orderId,
      rating,
      title,
      comment,
      images: images || [],
      verifiedPurchase: true,
      status: 'approved' // Auto-approve verified purchases
    });
    
    await review.populate('user', 'name email');
    
    // Log review creation activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.REVIEW.CREATED,
      targetModel: 'Review',
      targetId: review._id,
      targetName: product.name,
      req,
      metadata: {
        rating,
        verifiedPurchase: true
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create review'
    });
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
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Review.countDocuments(query);
    
    // Get rating stats
    const stats = await Review.getProductStats(productId);
    
    res.json({
      success: true,
      data: reviews,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
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
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ user: req.user._id });
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your reviews'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews'
      });
    }
    
    // Check if within edit window (30 days)
    const daysSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 30) {
      return res.status(403).json({
        success: false,
        message: 'Reviews can only be edited within 30 days of creation'
      });
    }
    
    // Validate images count
    if (images && images.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 images allowed per review'
      });
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
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update review'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check ownership (user can delete own, admin can delete any)
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
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
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    const wasAdded = await review.toggleHelpful(req.user._id);
    
    res.json({
      success: true,
      message: wasAdded ? 'Marked as helpful' : 'Removed helpful mark',
      data: {
        helpfulCount: review.helpfulCount,
        isHelpful: wasAdded
      }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update helpful status'
    });
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
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason (at least 10 characters)'
      });
    }
    
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check daily report limit (3 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reportsToday = await Review.countDocuments({
      'reportedBy.user': req.user._id,
      'reportedBy.reportedAt': { $gte: today }
    });
    
    if (reportsToday >= 3) {
      return res.status(429).json({
        success: false,
        message: 'You have reached the daily report limit (3 reports per day)'
      });
    }
    
    await review.addReport(req.user._id, reason);
    
    res.json({
      success: true,
      message: 'Review reported successfully. Our team will review it.'
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to report review'
    });
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
    }).populate('items.product', 'name images sku');
    
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
    
    res.json({
      success: true,
      data: eligibleProducts
    });
  } catch (error) {
    console.error('Get eligible products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible products'
    });
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
      .limit(parseInt(limit));
    
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
    
    res.json({
      success: true,
      data: reviews,
      stats: statusStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
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
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }
    
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
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
    
    res.json({
      success: true,
      message: `Review ${status} successfully`,
      data: review
    });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status'
    });
  }
};
