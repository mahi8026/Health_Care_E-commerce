/**
 * Test Routes - For debugging and testing functionality
 * @route /api/test
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { sendOrderConfirmation, sendTestEmail, verifyConnection } = require('../services/emailService');
const Order = require('../models/Order');
const logger = require('../utils/logger');

/**
 * Test email sending by order number
 * POST /api/test/email
 * Body: { orderNumber: "MC-260702-8191" }
 */
router.post('/email', protect, authorize('admin'), async (req, res) => {
  try {
    const { orderNumber } = req.body;

    if (!orderNumber) {
      return res.status(400).json({ success: false, message: 'orderNumber is required' });
    }

    const order = await Order.findOne({ orderNumber }).populate('user').populate('items.product');
    if (!order) {
      return res.status(404).json({ success: false, message: `Order ${orderNumber} not found` });
    }

    logger.info(`[testEmail] Sending email for order ${orderNumber} to ${order.user.email}`);

    const result = await sendOrderConfirmation(order, order.user);

    if (result.error) {
      return res.status(500).json({ success: false, message: 'Email failed', error: result.error });
    }

    logger.info(`[testEmail] ✅ Email sent to ${order.user.email} (ID: ${result.messageId})`);
    res.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        orderNumber: order.orderNumber,
        customerEmail: order.user.email,
        customerName: order.user.name,
        messageId: result.messageId,
      }
    });

  } catch (error) {
    logger.error(`[testEmail] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
});

/**
 * Send a plain test email to any address
 * POST /api/test/email/send
 * Body: { email: "someone@example.com" }
 */
router.post('/email/send', protect, authorize('admin'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'email is required' });
    }

    const result = await sendTestEmail(email);

    if (result.error) {
      return res.status(500).json({ success: false, message: 'Test email failed', error: result.error });
    }

    res.json({ success: true, message: `Test email sent to ${email}`, messageId: result.messageId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Check email service configuration
 * GET /api/test/email/status
 */
router.get('/email/status', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await verifyConnection();
    res.json({
      success: true,
      provider: 'Brevo HTTP API',
      configured: result.success,
      BREVO_API_KEY: !!process.env.BREVO_API_KEY,
      BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL || '(not set)',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
