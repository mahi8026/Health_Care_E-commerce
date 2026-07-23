const express = require('express');
const router = express.Router();
const {
  getActivityLogs,
  getActivityStats,
  exportActivityLogs,
  getActivityLog
} = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/activity-logs
router.get('/', getActivityLogs);

// @route   GET /api/activity-logs/stats
router.get('/stats', getActivityStats);

// @route   GET /api/activity-logs/export
router.get('/export', exportActivityLogs);

// @route   GET /api/activity-logs/:id
router.get('/:id', getActivityLog);

module.exports = router;
