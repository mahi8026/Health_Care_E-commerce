const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  initiateBkashPayment,
  executeBkashPayment,
  verifyBkashPayment,
  initiateNagadPayment,
  submitChequePayment,
  processBankTransfer,
  processB2BCreditPayment,
  stripeWebhook
} = require('../controllers/paymentController');
const { paymentLimiter } = require('../middleware/enhancedRateLimiter');

// Stripe routes (with rate limiting)
router.post('/stripe/create-intent', protect, paymentLimiter, createPaymentIntent);
router.post('/stripe/intent', protect, paymentLimiter, createPaymentIntent); // alias used by frontend
router.post('/stripe/confirm', protect, paymentLimiter, confirmPayment);
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// bKash Tokenized Checkout routes (with rate limiting)
router.post('/bkash/initiate', protect, paymentLimiter, initiateBkashPayment);
router.post('/bkash/execute', protect, paymentLimiter, executeBkashPayment); // called after user completes in bKash app
router.post('/bkash/verify', protect, paymentLimiter, verifyBkashPayment);

// Nagad routes (with rate limiting)
router.post('/nagad/initiate', protect, paymentLimiter, initiateNagadPayment);

// Cheque routes (with rate limiting)
router.post('/cheque', protect, paymentLimiter, submitChequePayment);

// Bank transfer routes (with rate limiting)
router.post('/bank/submit', protect, paymentLimiter, processBankTransfer);

// B2B credit routes (with rate limiting)
router.post('/credit/process', protect, paymentLimiter, processB2BCreditPayment);

module.exports = router;
