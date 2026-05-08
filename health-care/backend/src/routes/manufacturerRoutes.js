const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { redisCacheMiddleware } = require('../middleware/cache');
const {
  getManufacturers,
  getManufacturer,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
  uploadManufacturerLogo
} = require('../controllers/manufacturerController');

// Import upload middleware
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
    folder: 'medcore/manufacturers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 400, height: 400, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for logos
});

// Public routes with caching (10 minutes TTL)
router.get('/', redisCacheMiddleware({ ttl: 600, keyPrefix: 'manufacturers:' }), getManufacturers);
router.get('/:slug', redisCacheMiddleware({ ttl: 600, keyPrefix: 'manufacturers:' }), getManufacturer);

// Admin routes
router.post('/', protect, authorize('admin'), createManufacturer);
router.put('/:id', protect, authorize('admin'), updateManufacturer);
router.delete('/:id', protect, authorize('admin'), deleteManufacturer);
router.post('/:id/logo', protect, authorize('admin'), upload.single('image'), uploadManufacturerLogo);

module.exports = router;
