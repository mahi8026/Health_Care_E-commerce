/**
 * uploadController.js
 * POST /api/upload/image  — upload a single product image
 * POST /api/upload/images — upload up to 5 product images at once
 * DELETE /api/upload/image/:publicId — delete an image from Cloudinary
 * PATCH /api/upload/reorder — reorder product images
 */

const { CLOUDINARY_CONFIGURED } = require('../services/uploadService');
const logger = require('../utils/logger');
const Product = require('../models/Product');

// Import cloudinary for delete operations
let cloudinary;
if (CLOUDINARY_CONFIGURED) {
  cloudinary = require('cloudinary').v2;
}

// @desc    Upload a single image
// @route   POST /api/upload/image
// @access  Private/Admin
exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let url;
    if (CLOUDINARY_CONFIGURED) {
      // Cloudinary: multer-storage-cloudinary puts the URL in req.file.path
      url = req.file.path;
    } else {
      // Local fallback: build a URL pointing to the static /uploads route
      const filename = req.file.filename;
      const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      url = `${baseUrl}/uploads/${filename}`;
    }

    logger.info(`[uploadImage] Uploaded: ${url}`);
    res.status(200).json({ success: true, url });
  } catch (error) {
    logger.error(`[uploadImage] ${error.message}`);
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};

// @desc    Upload multiple images (max 5)
// @route   POST /api/upload/images
// @access  Private/Admin
exports.uploadImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const urls = req.files.map(file => {
      if (CLOUDINARY_CONFIGURED) return file.path;
      const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      return `${baseUrl}/uploads/${file.filename}`;
    });

    logger.info(`[uploadImages] Uploaded ${urls.length} images`);
    res.status(200).json({ success: true, urls });
  } catch (error) {
    logger.error(`[uploadImages] ${error.message}`);
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};

// @desc    Delete an image from Cloudinary
// @route   DELETE /api/upload/image/:publicId
// @access  Private/Admin
exports.deleteProductImage = async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);

    if (CLOUDINARY_CONFIGURED && publicId && publicId !== 'undefined' && publicId !== '') {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`[deleteProductImage] Deleted from Cloudinary: ${publicId}`);
    }

    // Remove from product if productId provided
    if (req.body.productId) {
      await Product.findByIdAndUpdate(req.body.productId, {
        $pull: { images: { publicId } },
      });
      logger.info(`[deleteProductImage] Removed from product: ${req.body.productId}`);
    }

    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    logger.error(`[deleteProductImage] ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reorder product images
// @route   PATCH /api/upload/reorder
// @access  Private/Admin
exports.reorderProductImages = async (req, res) => {
  try {
    const { productId, imageOrder } = req.body;
    // imageOrder = array of publicIds in new desired order
    
    if (!productId || !imageOrder || !Array.isArray(imageOrder)) {
      return res.status(400).json({ 
        success: false, 
        message: 'productId and imageOrder array are required' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reordered = imageOrder.map((pubId, idx) => {
      const img = product.images.find(i => i.publicId === pubId);
      if (!img) return null;
      return { 
        url: img.url,
        publicId: img.publicId,
        isPrimary: idx === 0,
        alt: img.alt
      };
    }).filter(Boolean);

    product.images = reordered;
    await product.save();
    
    logger.info(`[reorderProductImages] Reordered images for product: ${productId}`);
    res.json({ success: true, data: { images: product.images } });
  } catch (err) {
    logger.error(`[reorderProductImages] ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};
