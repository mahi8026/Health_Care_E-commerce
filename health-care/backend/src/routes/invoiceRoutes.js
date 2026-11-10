const express = require('express');
const router = express.Router();

const {
  getAdminInvoice,
  updateAdminInvoice,
  resetAdminInvoice,
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');
const { noStore } = require('../middleware/cache');
const {
  validateInvoiceOrderId,
  validateInvoiceUpdate,
} = require('../middleware/validation');

// Every route here is admin-only: invoices are editable by administrators only.
router.use(protect, authorize('admin'), adminLimiter, noStore);

// @route   GET    /api/invoices/order/:orderId  — load the editable invoice
// @route   PUT    /api/invoices/order/:orderId  — save edits (new revision)
// @route   DELETE /api/invoices/order/:orderId  — discard edits, use order data
router.get('/order/:orderId', validateInvoiceOrderId, getAdminInvoice);
router.put('/order/:orderId', validateInvoiceOrderId, validateInvoiceUpdate, updateAdminInvoice);
router.delete('/order/:orderId', validateInvoiceOrderId, resetAdminInvoice);

module.exports = router;
