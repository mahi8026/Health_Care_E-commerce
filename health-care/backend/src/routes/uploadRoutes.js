const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../services/uploadService');
const { 
  uploadImage, 
  uploadImages, 
  deleteProductImage, 
  reorderProductImages 
} = require('../controllers/uploadController');
const { uploadLimiter } = require('../middleware/enhancedRateLimiter');

// Multer error handler wrapper
const handleUpload = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// All upload routes require admin + rate limiting
router.use(protect, authorize('admin'), uploadLimiter);

// POST /api/upload/image  — single image
router.post(
  '/image',
  handleUpload(upload.single('image')),
  uploadImage
);

// POST /api/upload/images — up to 5 images
router.post(
  '/images',
  handleUpload(upload.array('images', 5)),
  uploadImages
);

// DELETE /api/upload/image/:publicId — delete image
router.delete(
  '/image/:publicId',
  deleteProductImage
);

// PATCH /api/upload/reorder — reorder images
router.patch(
  '/reorder',
  reorderProductImages
);

module.exports = router;
