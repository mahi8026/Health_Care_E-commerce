const express = require('express');
const router = express.Router();
const {
  getSMSConfig,
  sendTestSMSHandler,
  getSMSLogs,
  getSMSStats
} = require('../controllers/smsController');
const { protect, authorize } = require('../middleware/auth');

// All SMS routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/sms/config
router.get('/config', getSMSConfig);

// @route   POST /api/sms/test
router.post('/test', sendTestSMSHandler);

// @route   GET /api/sms/logs
router.get('/logs', getSMSLogs);

// @route   GET /api/sms/stats
router.get('/stats', getSMSStats);

module.exports = router;
