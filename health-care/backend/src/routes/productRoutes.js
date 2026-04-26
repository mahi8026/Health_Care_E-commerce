const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getCategoryCounts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/', cacheMiddleware({ maxAge: 60, swr: 300 }), getProducts);
router.get('/featured', cacheMiddleware({ maxAge: 60, swr: 300 }), getFeaturedProducts);
router.get('/category-counts', cacheMiddleware({ maxAge: 600, swr: 1800 }), getCategoryCounts);
router.get('/:id', cacheMiddleware({ maxAge: 3600, swr: 86400 }), getProduct);

// Admin only routes
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
