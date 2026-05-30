const express = require('express');
const router  = express.Router();
const {
  getMySummary,
  getMyTransactions,
  validateRedeem,
  getMembers,
  adjustPoints,
  getStats,
  getUserTransactions
} = require('../controllers/loyaltyController');
const { protect, authorize } = require('../middleware/auth');

// ── Customer routes ──────────────────────────────────────────────────────────
router.get('/summary',           protect, getMySummary);
router.get('/transactions',      protect, getMyTransactions);
router.post('/validate-redeem',  protect, validateRedeem);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/stats',                          protect, authorize('admin'), getStats);
router.get('/admin/members',                        protect, authorize('admin'), getMembers);
router.post('/admin/adjust',                        protect, authorize('admin'), adjustPoints);
router.get('/admin/users/:userId/transactions',     protect, authorize('admin'), getUserTransactions);

module.exports = router;
