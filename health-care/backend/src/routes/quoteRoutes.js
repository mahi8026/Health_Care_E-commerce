const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createQuote,
  getMyQuotes,
  getQuote,
  acceptQuote,
  rejectQuote
} = require('../controllers/quoteController');

// Customer routes
router.post('/', protect, createQuote);
router.get('/', protect, getMyQuotes);
router.get('/:id', protect, getQuote);
router.post('/:id/accept', protect, acceptQuote);
router.post('/:id/reject', protect, rejectQuote);

module.exports = router;