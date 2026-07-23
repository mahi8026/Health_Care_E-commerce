/**
 * Product Sync Routes - Import/Export products between environments
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// @desc    Import products from JSON
// @route   POST /api/product-sync/import
// @access  Private/Admin
router.post('/import', protect, authorize('admin'), async (req, res) => {
  try {
    const { manufacturer, products } = req.body;

    if (!manufacturer || !products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import data. Expected { manufacturer, products }'
      });
    }

    logger.info(`[ProductSync] Starting import of ${products.length} products`);

    // Step 1: Ensure manufacturer exists
    let mfr = await Manufacturer.findOne({ 
      name: { $regex: new RegExp(`^${manufacturer.name}$`, 'i') }
    });

    if (!mfr) {
      logger.info(`[ProductSync] Creating manufacturer: ${manufacturer.name}`);
      const mfrData = { ...manufacturer };
      delete mfrData._id;
      mfr = await Manufacturer.create(mfrData);
      logger.info(`[ProductSync] Created manufacturer: ${mfr._id}`);
    } else {
      logger.info(`[ProductSync] Manufacturer exists: ${mfr._id}`);
    }

    // Step 2: Import products
    let created = 0;
    let updated = 0;
    let errors = [];

    for (const productData of products) {
      try {
        const existingProduct = await Product.findOne({ sku: productData.sku });

        if (existingProduct) {
          // Update existing
          const updateData = { ...productData };
          delete updateData._id;
          updateData.brand = mfr._id;
          
          await Product.findByIdAndUpdate(existingProduct._id, updateData);
          updated++;
          logger.info(`[ProductSync] Updated: ${productData.sku}`);
        } else {
          // Create new
          const newProductData = { ...productData };
          delete newProductData._id;
          newProductData.brand = mfr._id;
          
          await Product.create(newProductData);
          created++;
          logger.info(`[ProductSync] Created: ${productData.sku}`);
        }
      } catch (error) {
        errors.push({ sku: productData.sku, error: error.message });
        logger.error(`[ProductSync] Error importing ${productData.sku}: ${error.message}`);
      }
    }

    // Clear cache
    const { invalidateCache } = require('../middleware/cache');
    await invalidateCache('products:*');

    res.status(200).json({
      success: true,
      message: 'Import completed',
      summary: {
        total: products.length,
        created,
        updated,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error(`[ProductSync] Import failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Import failed',
      error: error.message
    });
  }
});

// @desc    Export products by brand
// @route   GET /api/product-sync/export/:brandName
// @access  Private/Admin
router.get('/export/:brandName', protect, authorize('admin'), async (req, res) => {
  try {
    const { brandName } = req.params;

    // Find manufacturer
    const manufacturer = await Manufacturer.findOne({
      name: { $regex: new RegExp(`^${brandName}$`, 'i') }
    }).lean();

    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: `Manufacturer "${brandName}" not found`
      });
    }

    // Find products
    const products = await Product.find({ brand: manufacturer._id }).lean();

    res.status(200).json({
      success: true,
      manufacturer,
      products,
      totalProducts: products.length,
      exportDate: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[ProductSync] Export failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Export failed',
      error: error.message
    });
  }
});

module.exports = router;
