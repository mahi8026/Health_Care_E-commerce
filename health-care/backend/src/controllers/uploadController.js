/**
 * uploadController.js
 * POST /api/upload/image  — upload a single product image
 * POST /api/upload/images — upload up to 5 product images at once
 * DELETE /api/upload/image/:publicId — delete an image from Cloudinary
 * PATCH /api/upload/reorder — reorder product images
 */

const path = require('path');
const { CLOUDINARY_CONFIGURED } = require('../services/uploadService');
const logger = require('../utils/logger');
const Product = require('../models/Product');

// Configure Cloudinary once
let cloudinary;
if (CLOUDINARY_CONFIGURED) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Helper: upload a buffer to Cloudinary and return the secure URL
function uploadBufferToCloudinary(buffer, originalname) {
  return new Promise((resolve, reject) => {
    const publicId = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExt = path.extname(originalname).toLowerCase();
    
    // For PNG files, preserve the format and alpha channel
    // For other formats, apply standard transformations
    const transformationOptions = {
      folder: 'medcorebd/products',
      public_id: publicId,
      resource_type: 'auto',
      overwrite: false,
    };
    
    // Only apply transformations for non-PNG files or use format-safe settings
    if (fileExt === '.png') {
      // For PNG: preserve transparency, use auto format with quality optimization
      transformationOptions.transformation = [{ 
        width: 1200, 
        height: 1200, 
        crop: 'limit',
        format: 'png',
        quality: 'auto:good'
      }];
    } else {
      // For JPEG/WebP: apply standard transformations
      transformationOptions.transformation = [{ 
        width: 1200, 
        height: 1200, 
        crop: 'limit',
        quality: 'auto'
      }];
    }
    
    const uploadStream = cloudinary.uploader.upload_stream(
      transformationOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

// @desc    Upload a single image
// @route   POST /api/upload/image
// @access  Private/Admin
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let url;

    if (CLOUDINARY_CONFIGURED) {
      // Memory storage: req.file.buffer contains the image bytes
      const result = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
      url = result.secure_url;
    } else {
      // Local fallback
      const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      url = `${baseUrl}/uploads/${req.file.filename}`;
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
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    let urls;

    if (CLOUDINARY_CONFIGURED) {
      const results = await Promise.all(
        req.files.map(f => uploadBufferToCloudinary(f.buffer, f.originalname))
      );
      urls = results.map(r => r.secure_url);
    } else {
      const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      urls = req.files.map(f => `${baseUrl}/uploads/${f.filename}`);
    }

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
