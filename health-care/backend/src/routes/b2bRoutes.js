const express = require('express');
const router = express.Router();
const {
  getB2BUsers,
  approveB2BUser,
  rejectB2BUser,
  toggleB2BDiscount,
  getCategoryDiscounts,
  updateCategoryDiscount,
  bulkUpdateCategoryDiscounts,
  getB2BStats
} = require('../controllers/b2bController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect, authorize('admin'));

// B2B User Management
router.get('/users', getB2BUsers);
router.put('/users/:id/approve', approveB2BUser);
router.put('/users/:id/reject', rejectB2BUser);
router.put('/users/:id/toggle-discount', toggleB2BDiscount);

// Category Discount Management
router.get('/categories/discounts', getCategoryDiscounts);
router.put('/categories/:id/discount', updateCategoryDiscount);
router.put('/categories/discounts/bulk', bulkUpdateCategoryDiscounts);

// Statistics
router.get('/stats', getB2BStats);

module.exports = router;
