const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { redisCacheMiddleware, cacheMiddleware } = require('../middleware/cache');
const { CACHE_KEYS, CACHE_TTL } = require('../services/redisCache');
const { etagMiddleware } = require('../middleware/etag');
const {
  getCategories,
  getCategoryTree,
  getCategory,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage
} = require('../controllers/categoryController');

// Import upload middleware (reuse existing upload setup)
const multer = require('multer');
const CloudinaryStorage = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer storage for Cloudinary
const storage = CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'medcore/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Public routes with caching (categories verified working correctly)
router.get('/', redisCacheMiddleware({ ttl: 3600, keyPrefix: 'categories:' }), getCategories); // Cache for 1 hour
router.get('/tree', redisCacheMiddleware({ ttl: 3600, keyPrefix: 'categories:tree:' }), getCategoryTree); // Cache for 1 hour

// Admin routes (must come before /:slug to avoid route conflicts)
router.get('/by-id/:id', protect, authorize('admin'), getCategoryById);
router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);
router.post('/:id/image', protect, authorize('admin'), upload.single('image'), uploadCategoryImage);

// Public slug route (must be last to avoid conflicts with specific routes)
// Temporarily without caching
router.get('/:slug', getCategory);

module.exports = router;
