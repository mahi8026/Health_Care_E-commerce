const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponStats
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');
const Coupon = require('../models/Coupon');

// Public: active promo banner
router.get('/active-promo', async (req, res) => {
  try {
    const now = new Date();
    const coupon = await Coupon.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ value: -1 })
      .select('code type value description endDate minimumPurchase')
      .lean();
    res.json({ success: true, data: { coupon: coupon || null } });
  } catch (err) {
    res.json({ success: true, data: { coupon: null } });
  }
});

// Public/User routes
router.post('/validate', protect, validateCoupon);

// Admin routes
router.get('/stats', protect, authorize('admin'), getCouponStats);
router.get('/', protect, authorize('admin'), getCoupons);
router.get('/:id', protect, authorize('admin'), getCouponById);
router.post('/', protect, authorize('admin'), createCoupon);
router.put('/:id', protect, authorize('admin'), updateCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

module.exports = router;
