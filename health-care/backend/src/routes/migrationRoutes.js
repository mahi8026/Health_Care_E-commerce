const express = require('express');
const router = express.Router();
const migrationController = require('../controllers/migrationController');
const { protect, authorize } = require('../middleware/auth');

/**
 * Migration Routes
 * One-time administrative endpoints for data migrations
 * Should be disabled after use or protected with additional authentication
 */

// Backfill legacy B2B users with missing b2bApprovalStatus
router.post(
  '/backfill-b2b-status',
  protect,
  authorize('admin'),
  migrationController.backfillB2BStatus
);

module.exports = router;
