const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// Public route
router.get('/', getSettings);

// Admin only route
router.put('/', protect, authorize('admin'), updateSettings);

module.exports = router;
