/**
 * uploadService.js
 * Handles image uploads via Cloudinary (primary) or local disk fallback.
 *
 * Cloudinary setup:
 *   1. Create a free account at https://cloudinary.com
 *   2. Copy Cloud Name, API Key, API Secret from the dashboard
 *   3. Add to backend/.env:
 *        CLOUDINARY_CLOUD_NAME=your_cloud_name
 *        CLOUDINARY_API_KEY=your_api_key
 *        CLOUDINARY_API_SECRET=your_api_secret
 *
 * If Cloudinary env vars are not set, uploads are stored in /tmp/uploads
 * and served as static files (dev only — not suitable for production).
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const CLOUDINARY_CONFIGURED =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let upload;

if (CLOUDINARY_CONFIGURED) {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'medcorebd/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      public_id: (req, file) => `product-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp/;
      const ext = allowed.test(path.extname(file.originalname).toLowerCase());
      const mime = allowed.test(file.mimetype);
      if (ext && mime) return cb(null, true);
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    },
  });
} else {
  // Local disk fallback (dev only)
  const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp/;
      const ext = allowed.test(path.extname(file.originalname).toLowerCase());
      const mime = allowed.test(file.mimetype);
      if (ext && mime) return cb(null, true);
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    },
  });
}

module.exports = { upload, CLOUDINARY_CONFIGURED };
