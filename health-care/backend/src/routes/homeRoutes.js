/**
 * Home Routes - Aggregated Homepage Data Endpoints
 * 
 * Provides optimized aggregated endpoints to reduce API calls from 15+ to 1-2.
 */

const express = require('express');
const router = express.Router();
const { getHomeData, getCategoryProducts } = require('../controllers/homeController');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * @route GET /api/home/data
 * @desc Get aggregated homepage data (replaces 10+ separate calls)
 * @access Public
 */
router.get('/data', apiLimiter, getHomeData);

/**
 * @route GET /api/home/category-products
 * @desc Get products for specific categories
 * @query category - Category names (comma-separated)
 * @query limit - Products per category (default: 10)
 * @access Public
 */
router.get('/category-products', apiLimiter, getCategoryProducts);

module.exports = router;
