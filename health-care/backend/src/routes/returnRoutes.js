const express = require('express');
const router = express.Router();
const {
  createReturn,
  getMyReturns,
  getAllReturns,
  getReturn,
  updateReturnStatus,
  cancelReturn,
  getReturnStats
} = require('../controllers/returnController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (none)

// Protected routes (authenticated users)
router.post('/', protect, createReturn);
router.get('/my-returns', protect, getMyReturns);
router.get('/:id', protect, getReturn);
router.delete('/:id', protect, cancelReturn);

// Admin routes
router.get('/', protect, authorize('admin'), getAllReturns);
router.get('/stats/summary', protect, authorize('admin'), getReturnStats);
router.patch('/:id/status', protect, authorize('admin'), updateReturnStatus);

module.exports = router;
