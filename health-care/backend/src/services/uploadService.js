/**
 * uploadService.js
 * Uses multer memory storage + direct Cloudinary SDK upload.
 * Avoids multer-storage-cloudinary entirely (version conflicts).
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const CLOUDINARY_CONFIGURED =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

// File filter — only images
const fileFilter = (_req, file, cb) => {
  // Validate file extension
  const extAllowed = /\.(jpeg|jpg|png|webp)$/i;
  const ext = extAllowed.test(path.extname(file.originalname));
  
  // Validate MIME type — check against known image MIME types
  const mimeAllowed = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/x-png', // Some older systems send this
    'image/webp'
  ];
  const mime = mimeAllowed.includes(file.mimetype);
  
  if (ext && mime) return cb(null, true);
  cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
};

let upload;

if (CLOUDINARY_CONFIGURED) {
  // Use memory storage — we'll stream the buffer to Cloudinary in the controller
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter,
  });
} else {
  // Local disk fallback (dev only)
  const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
  });
}

module.exports = { upload, CLOUDINARY_CONFIGURED };
