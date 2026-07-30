/**
 * Data Synchronization Routes
 * Endpoints for manual data sync and integrity verification
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { syncData, verifyDataIntegrity } = require('../services/dataSync');
const logger = require('../utils/logger');

/**
 * @route   POST /api/data-sync/sync
 * @desc    Manually trigger data synchronization
 * @access  Admin only
 */
router.post('/sync', protect, authorize('admin'), async (req, res) => {
  try {
    logger.info(`[DataSync] Manual sync triggered by admin: ${req.user.email}`);
    
    const stats = await syncData();
    
    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Data synchronization failed. Check server logs for details.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data synchronization completed successfully',
      stats
    });
  } catch (error) {
    logger.error('[DataSync] Manual sync error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Data synchronization failed',
      error: process.env.ERROR_DETAIL_ENABLED === 'true' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/data-sync/verify
 * @desc    Verify data integrity
 * @access  Admin only
 */
router.get('/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const report = await verifyDataIntegrity();
    
    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('[DataSync] Verification error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Data integrity verification failed',
      error: process.env.ERROR_DETAIL_ENABLED === 'true' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/data-sync/status
 * @desc    Get data sync status and statistics
 * @access  Admin only
 */
router.get('/status', protect, authorize('admin'), async (req, res) => {
  try {
    const Product = require('../models/Product');
    const Manufacturer = require('../models/Manufacturer');
    const Category = require('../models/Category');

    const [
      totalProducts,
      activeProducts,
      totalManufacturers,
      activeManufacturers,
      totalCategories,
      activeCategories,
      productsWithoutBrand,
      productsWithoutCategory
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Manufacturer.countDocuments(),
      Manufacturer.countDocuments({ isActive: true }),
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Product.countDocuments({ brand: null }),
      Product.countDocuments({ category: null })
    ]);

    const integrity = await verifyDataIntegrity();

    res.status(200).json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          withoutBrand: productsWithoutBrand,
          withoutCategory: productsWithoutCategory
        },
        manufacturers: {
          total: totalManufacturers,
          active: activeManufacturers
        },
        categories: {
          total: totalCategories,
          active: activeCategories
        },
        integrity
      }
    });
  } catch (error) {
    logger.error('[DataSync] Status error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get data sync status',
      error: process.env.ERROR_DETAIL_ENABLED === 'true' ? error.message : undefined
    });
  }
});

module.exports = router;
