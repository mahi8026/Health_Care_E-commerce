// health-care/backend/src/controllers/feedController.js

/**
 * feedController — Public product feed endpoints for merchant platforms.
 *
 * Currently supported:
 *  - Google Merchant Center XML feed (Google Shopping / free listings):
 *      GET /api/feeds/google-products.xml
 *
 * The pure XML-building logic lives in src/utils/feedXmlBuilder.js (testable
 * without a database).
 */

const Product = require('../models/Product');
const logger = require('../utils/logger');
const { buildGoogleFeedXml } = require('../utils/feedXmlBuilder');

// Google allows feeds up to millions of items; cap generously at 10k so the
// response stays fast. Raise this if the catalog grows beyond 10k SKUs.
const FEED_LIMIT = 10000;

/**
 * GET /api/feeds/google-products.xml
 * Public Google Merchant Center product feed (RSS 2.0 + g: namespace).
 */
exports.googleProductsFeed = async (req, res) => {
  try {
    const baseUrl = (
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://www.mediportbd.com'
    ).replace(/\/+$/, '');

    const products = await Product.find({ isActive: true })
      .populate({ path: 'brand', select: 'name' })
      .populate({ path: 'category', select: 'name' })
      .limit(FEED_LIMIT)
      .lean();

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=21600'); // 6h
    res.send(buildGoogleFeedXml(products, baseUrl));
  } catch (error) {
    logger.error('Google feed generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate product feed' });
  }
};