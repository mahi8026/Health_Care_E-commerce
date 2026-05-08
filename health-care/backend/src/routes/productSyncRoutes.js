/**
 * Product Sync Routes
 * API endpoints for syncing products from JSON export
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

/**
 * @route   POST /api/product-sync/import
 * @desc    Import products from JSON file (admin only)
 * @access  Private/Admin
 */
router.post('/import', protect, authorize('admin'), async (req, res) => {
  try {
    const jsonPath = path.join(__dirname, '../../exports/all-products.json');
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({
        success: false,
        message: 'Export file not found. Upload all-products.json to backend/exports/ first.'
      });
    }

    console.log('📖 Reading products from JSON...');
    const products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`   Found: ${products.length} products`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];

    for (const product of products) {
      try {
        const result = await Product.updateOne(
          { sku: product.sku },
          { $set: product },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          created++;
        } else if (result.modifiedCount > 0) {
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        failed++;
        errors.push({ sku: product.sku, error: error.message });
      }
    }

    const finalCount = await Product.countDocuments();

    res.json({
      success: true,
      message: 'Product import completed',
      stats: {
        created,
        updated,
        skipped,
        failed,
        total: products.length,
        finalCount
      },
      errors: errors.slice(0, 10) // Only return first 10 errors
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: 'Import failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/product-sync/status
 * @desc    Get product count and sync status
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inStockProducts = await Product.countDocuments({ stock: { $gt: 0 } });
    
    // Count by manufacturer
    const manufacturerCounts = await Product.aggregate([
      {
        $lookup: {
          from: 'manufacturers',
          localField: 'manufacturer',
          foreignField: '_id',
          as: 'manufacturerInfo'
        }
      },
      { $unwind: '$manufacturerInfo' },
      {
        $group: {
          _id: '$manufacturerInfo.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        inStockProducts,
        manufacturerCounts
      }
    });

  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get status',
      error: error.message
    });
  }
});

module.exports = router;
