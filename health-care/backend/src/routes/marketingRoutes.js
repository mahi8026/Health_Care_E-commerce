// health-care/backend/src/routes/marketingRoutes.js

/**
 * Marketing routes — channel analytics for the admin dashboard.
 *
 * Public:
 *   POST /api/marketing/events          — lightweight beacon (no auth)
 *
 * Admin:
 *   GET  /api/marketing/overview        — aggregated channel KPIs
 */

const express = require('express');
const { trackEvent, getOverview } = require('../controllers/marketingController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public marketing beacon — accepts only allowlisted event types; failures
// return 204 so the storefront is never affected.
router.post('/events', trackEvent);

// Admin dashboard data
router.get('/overview', protect, adminOnly, getOverview);

module.exports = router;