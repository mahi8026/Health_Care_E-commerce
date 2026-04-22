const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendShipping,
  sendDelivered,
  sendQuotationReady,
  sendStockAlert
} = require('../controllers/notificationController');

// All notification routes require admin
router.post('/order-confirmation', protect, authorize('admin'), sendOrderConfirmation);
router.post('/payment-receipt', protect, authorize('admin'), sendPaymentReceipt);
router.post('/shipping', protect, authorize('admin'), sendShipping);
router.post('/delivered', protect, authorize('admin'), sendDelivered);
router.post('/quotation-ready', protect, authorize('admin'), sendQuotationReady);
router.post('/stock-alert', protect, authorize('admin'), sendStockAlert);

module.exports = router;
