const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createQuote,
  getMyQuotes,
  getQuote
} = require('../controllers/quoteController');

// Customer routes
router.post('/', protect, createQuote);
router.get('/', protect, getMyQuotes);
router.get('/:id', protect, getQuote);

module.exports = router;
