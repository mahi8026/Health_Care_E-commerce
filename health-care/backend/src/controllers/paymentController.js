const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');

// Lazy Stripe initialization — prevents crash on startup if key is missing
let _stripe = null;
function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = require('stripe')(key);
  }
  return _stripe;
}

// Create Stripe Payment Intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, orderId, currency = 'bdt' } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and orderId are required' });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: { orderId, userId: req.user.id }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    logger.error(`[createPaymentIntent] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to create payment intent' });
  }
};

// Confirm Stripe Payment
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({ success: false, message: 'Payment intent ID and order ID are required' });
    }

    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.paymentStatus = 'paid';
      order.transactionId = paymentIntentId;
      order.paymentDetails = { method: 'stripe', transactionId: paymentIntentId, paidAt: new Date() };
      await order.save();

      res.status(200).json({ success: true, message: 'Payment confirmed', order });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed', status: paymentIntent.status });
    }
  } catch (error) {
    logger.error(`[confirmPayment] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to confirm payment' });
  }
};

// Initiate bKash Payment
exports.initiateBkashPayment = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and orderId are required' });
    }

    const callbackUrl = process.env.BKASH_CALLBACK_URL || `${process.env.FRONTEND_URL}/payment/bkash/callback`;

    const paymentData = {
      success: true,
      paymentId: `BKASH-${Date.now()}`,
      amount,
      orderId,
      redirectUrl: callbackUrl,
      message: 'Please complete payment in bKash app'
    };

    res.status(200).json(paymentData);
  } catch (error) {
    logger.error(`[initiateBkashPayment] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to initiate bKash payment' });
  }
};

// Verify bKash Payment
exports.verifyBkashPayment = async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;

    if (!paymentId || !orderId) {
      return res.status(400).json({ success: false, message: 'Payment ID and order ID are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify the paymentId matches what was stored on initiation
    if (order.paymentDetails?.bkashPaymentId !== paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID mismatch' });
    }

    // Only mark paid if paymentId starts with 'BKASH-' (our own generated prefix)
    if (!paymentId.startsWith('BKASH-')) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID format' });
    }

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.transactionId = paymentId;
    order.paymentDetails = { ...order.paymentDetails, method: 'bkash', transactionId: paymentId, paidAt: new Date() };
    await order.save();

    res.status(200).json({ success: true, message: 'bKash payment verified', order });
  } catch (error) {
    logger.error(`[verifyBkashPayment] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to verify bKash payment' });
  }
};

// Process Bank Transfer
exports.processBankTransfer = async (req, res) => {
  try {
    const { orderId, transactionReference } = req.body;

    if (!orderId || !transactionReference) {
      return res.status(400).json({ success: false, message: 'Order ID and transaction reference are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'pending';
    order.paymentDetails = { method: 'bank', transactionReference, submittedAt: new Date() };
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Bank transfer details submitted. Payment will be verified within 2-4 hours.',
      order
    });
  } catch (error) {
    logger.error(`[processBankTransfer] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to process bank transfer' });
  }
};

// Process B2B Credit Payment
exports.processB2BCreditPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Fix: check b2b_customer role (not 'b2b')
    if (order.user.role !== 'b2b_customer') {
      return res.status(403).json({ success: false, message: 'B2B credit is only available for B2B accounts' });
    }

    const totalAmount = order.totalAmount || order.total || 0;
    const availableCredit = order.user.creditLimit - order.user.creditUsed;

    if (totalAmount > availableCredit) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credit. Available: ৳${availableCredit.toLocaleString()}, Required: ৳${totalAmount.toLocaleString()}`
      });
    }

    // Update credit used
    await User.findByIdAndUpdate(order.user._id, { $inc: { creditUsed: totalAmount } });

    order.paymentStatus = 'paid';
    order.paymentDetails = { method: 'b2b_credit', creditUsed: totalAmount, paidAt: new Date() };
    await order.save();

    const remainingCredit = order.user.creditLimit - order.user.creditUsed - totalAmount;

    res.status(200).json({
      success: true,
      message: 'Payment processed using B2B credit',
      order,
      remainingCredit
    });
  } catch (error) {
    logger.error(`[processB2BCreditPayment] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to process B2B credit payment' });
  }
};

// Initiate Nagad Payment (stub — swap in real credentials when available)
exports.initiateNagadPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({
      success: true,
      message: 'Nagad payment initiated (sandbox)',
      redirectUrl: `${process.env.FRONTEND_URL}/checkout?payment=nagad&order=${orderId}`,
      merchantOrderId: `NAGAD-${Date.now()}`,
    });
  } catch (err) {
    logger.error(`[initiateNagadPayment] ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit Cheque Payment
exports.submitChequePayment = async (req, res) => {
  try {
    const { orderId, chequeNumber, bankName, chequeDate, accountName } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.paymentMethod = 'cheque';
    order.paymentStatus = 'pending';
    order.paymentDetails = { chequeNumber, bankName, chequeDate, accountName, submittedAt: new Date() };
    await order.save();
    res.json({ success: true, message: 'Cheque payment recorded. Awaiting clearance.', order });
  } catch (err) {
    logger.error(`[submitChequePayment] ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Stripe Webhook handler
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('[stripeWebhook] STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error) {
    logger.error(`[stripeWebhook] Signature verification failed: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.transactionId = paymentIntent.id;
        order.paymentDetails = { method: 'stripe', transactionId: paymentIntent.id, paidAt: new Date() };
        await order.save();
        logger.info(`[stripeWebhook] Order ${orderId} marked as paid`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error(`[stripeWebhook] Processing error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};
