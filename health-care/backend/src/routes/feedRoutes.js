// health-care/backend/src/routes/feedRoutes.js

/**
 * Feed routes — public product feeds for merchant platforms.
 * No authentication required (feeds are fetched by Google/Meta schedulers).
 */

const express = require('express');
const feedController = require('../controllers/feedController');

const router = express.Router();

// Google Merchant Center product feed (XML)
// GET /api/feeds/google-products.xml
router.get('/google-products.xml', feedController.googleProductsFeed);

module.exports = router;