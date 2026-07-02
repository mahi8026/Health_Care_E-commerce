/**
 * Test Routes - For debugging and testing functionality
 * @route /api/test
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../utils/emailService');
const Order = require('../models/Order');
const logger = require('../utils/logger');

/**
 * Test email sending
 * POST /api/test/email
 * Body: { orderNumber: "MC-260702-8191" }
 */
router.post('/email', protect, authorize('admin'), async (req, res) => {
  try {
    const { orderNumber } = req.body;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'orderNumber is required'
      });
    }

    // Find the order
    const order = await Order.findOne({ orderNumber })
      .populate('user')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderNumber} not found`
      });
    }

    logger.info(`[testEmail] Attempting to send email for order ${orderNumber} to ${order.user.email}`);

    // Check SMTP configuration
    const smtpConfigured = !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
    
    if (!smtpConfigured) {
      logger.error('[testEmail] SMTP not configured!');
      return res.status(500).json({
        success: false,
        message: 'SMTP not configured on server',
        debug: {
          SMTP_HOST: !!process.env.SMTP_HOST,
          SMTP_USER: !!process.env.SMTP_USER,
          SMTP_PASS: !!process.env.SMTP_PASS
        }
      });
    }

    // Send email
    await sendOrderConfirmation(order, order.user);

    logger.info(`[testEmail] ✅ Email sent successfully to ${order.user.email}`);

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        orderNumber: order.orderNumber,
        customerEmail: order.user.email,
        customerName: order.user.name
      }
    });

  } catch (error) {
    logger.error(`[testEmail] Error: ${error.message}`);
    logger.error(`[testEmail] Stack: ${error.stack}`);

    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Test SMTP connection
 * GET /api/test/smtp
 */
router.get('/smtp', protect, authorize('admin'), async (req, res) => {
  try {
    const nodemailer = require('nodemailer');

    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    if (!config.host) {
      return res.status(500).json({
        success: false,
        message: 'SMTP not configured',
        config: {
          SMTP_HOST: !!process.env.SMTP_HOST,
          SMTP_PORT: !!process.env.SMTP_PORT,
          SMTP_USER: !!process.env.SMTP_USER,
          SMTP_PASS: !!process.env.SMTP_PASS,
          SMTP_FROM: !!process.env.SMTP_FROM
        }
      });
    }

    const transporter = nodemailer.createTransport(config);

    // Verify connection
    await transporter.verify();

    logger.info('[testSMTP] ✅ SMTP connection successful');

    res.json({
      success: true,
      message: 'SMTP connection successful',
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user,
        from: process.env.SMTP_FROM
      }
    });

  } catch (error) {
    logger.error(`[testSMTP] Error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: 'SMTP connection failed',
      error: error.message,
      code: error.code
    });
  }
});

module.exports = router;
