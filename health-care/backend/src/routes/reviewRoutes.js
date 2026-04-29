const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  reportReview,
  getEligibleProducts,
  getAllReviews,
  updateReviewStatus
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { reviewRateLimiter } = require('../middleware/rateLimiter');

// Public: featured reviews for homepage
router.get('/featured', async (req, res) => {
  try {
    const Review = require('../models/Review');
    const reviews = await Review.find({
      status: 'approved',
      verifiedPurchase: true,
      rating: { $gte: 4 },
    })
      .populate('user', 'name companyName')
      .populate('product', 'name category')
      .sort({ rating: -1, helpfulCount: -1, createdAt: -1 })
      .limit(3)
      .lean();
    res.json({ success: true, data: { reviews } });
  } catch (err) {
    res.json({ success: true, data: { reviews: [] } });
  }
});

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.use(protect);

router.post('/', reviewRateLimiter, createReview);
router.get('/user', getUserReviews);
router.get('/eligible-products', getEligibleProducts);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markHelpful);
router.post('/:id/report', reportReview);

// Admin routes
router.get('/admin/all', authorize('admin'), getAllReviews);
router.patch('/admin/:id/status', authorize('admin'), updateReviewStatus);

module.exports = router;
