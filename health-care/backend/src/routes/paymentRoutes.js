const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  initiateBkashPayment,
  executeBkashPayment,
  verifyBkashPayment,
  initiateNagadPayment,
  submitChequePayment,
  processBankTransfer,
  processB2BCreditPayment,
  processCODPayment
} = require('../controllers/paymentController');
const { paymentLimiter } = require('../middleware/rateLimiter');

// bKash Tokenized Checkout routes (with rate limiting)
router.post('/bkash/initiate', protect, paymentLimiter, initiateBkashPayment);
router.post('/bkash/execute', protect, paymentLimiter, executeBkashPayment);
router.post('/bkash/verify', protect, paymentLimiter, verifyBkashPayment);

// Nagad routes (with rate limiting)
router.post('/nagad/initiate', protect, paymentLimiter, initiateNagadPayment);

// Cheque routes (with rate limiting)
router.post('/cheque', protect, paymentLimiter, submitChequePayment);

// Cash on Delivery routes (with rate limiting)
router.post('/cod/process', protect, paymentLimiter, processCODPayment);

// Bank transfer routes (with rate limiting)
router.post('/bank/submit', protect, paymentLimiter, processBankTransfer);

// B2B credit routes (with rate limiting)
router.post('/credit/process', protect, paymentLimiter, processB2BCreditPayment);

module.exports = router;
