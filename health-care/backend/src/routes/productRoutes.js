const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getCategoryCounts,
  generateSku
} = require('../controllers/productController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { cacheMiddleware, redisCacheMiddleware } = require('../middleware/cache');

// Use optionalAuth for getProducts so admin filters work
// Disable cache for admin to ensure filters work properly
router.get('/', optionalAuth, getProducts);
router.get('/featured', redisCacheMiddleware({ ttl: 300, keyPrefix: 'products:' }), getFeaturedProducts);
router.get('/category-counts', redisCacheMiddleware({ ttl: 600, keyPrefix: 'products:' }), getCategoryCounts);
router.get('/generate-sku', protect, authorize('admin'), generateSku);
router.get('/:id', redisCacheMiddleware({ ttl: 300, keyPrefix: 'products:' }), getProduct);

// Admin only routes
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
