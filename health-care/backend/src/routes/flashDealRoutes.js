const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllFlashDeals,
  getActiveFlashDeals,
  getFlashDealById,
  createFlashDeal,
  updateFlashDeal,
  deleteFlashDeal,
  toggleFlashDealStatus
} = require('../controllers/flashDealController');

// Public routes
router.get('/active', getActiveFlashDeals);

// Admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllFlashDeals);
router.get('/:id', getFlashDealById);
router.post('/', createFlashDeal);
router.put('/:id', updateFlashDeal);
router.delete('/:id', deleteFlashDeal);
router.patch('/:id/toggle', toggleFlashDealStatus);

module.exports = router;
