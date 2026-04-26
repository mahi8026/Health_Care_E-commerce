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

// Stripe routes
router.post('/stripe/create-intent', protect, createPaymentIntent);
router.post('/stripe/intent', protect, createPaymentIntent); // alias used by frontend
router.post('/stripe/confirm', protect, confirmPayment);
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// bKash Tokenized Checkout routes
router.post('/bkash/initiate', protect, initiateBkashPayment);
router.post('/bkash/execute', protect, executeBkashPayment); // called after user completes in bKash app
router.post('/bkash/verify', protect, verifyBkashPayment);

// Nagad routes
router.post('/nagad/initiate', protect, initiateNagadPayment);

// Cheque routes
router.post('/cheque', protect, submitChequePayment);

// Bank transfer routes
router.post('/bank/submit', protect, processBankTransfer);

// B2B credit routes
router.post('/credit/process', protect, processB2BCreditPayment);

module.exports = router;
