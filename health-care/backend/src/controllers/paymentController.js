const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');

// â”€â”€ Stripe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _stripe = null;
function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    _stripe = require('stripe')(key);
  }
  return _stripe;
}

// â”€â”€ bKash Tokenized Checkout helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _bkashToken = null;
let _bkashTokenExpiry = 0;

async function getBkashToken() {
  // Return cached token if still valid (with 60s buffer)
  if (_bkashToken && Date.now() < _bkashTokenExpiry - 60000) {
    return _bkashToken;
  }

  const { BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD, BKASH_BASE_URL } = process.env;

  if (!BKASH_APP_KEY || BKASH_APP_KEY === 'REPLACE_WITH_REAL_KEY') {
    throw new Error('bKash credentials not configured. Please set BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD in .env');
  }

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'username': BKASH_USERNAME,
      'password': BKASH_PASSWORD,
    },
    body: JSON.stringify({
      app_key: BKASH_APP_KEY,
      app_secret: BKASH_APP_SECRET,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`bKash token grant failed: ${err}`);
  }

  const data = await res.json();
  if (data.statusCode !== '0000') {
    throw new Error(`bKash token error: ${data.statusMessage}`);
  }

  _bkashToken = data.id_token;
  // expires_in is in seconds; convert to ms
  _bkashTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return _bkashToken;
}

async function bkashRequest(endpoint, body) {
  const token = await getBkashToken();
  const { BKASH_APP_KEY, BKASH_BASE_URL } = process.env;

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
      'X-APP-Key': BKASH_APP_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data;
}

// â”€â”€ Stripe: Create Payment Intent â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Stripe: Confirm Payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    if (!paymentIntentId || !orderId) {
      return res.status(400).json({ success: false, message: 'Payment intent ID and order ID are required' });
    }
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status === 'succeeded') {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
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

// â”€â”€ Stripe: Webhook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret === 'whsec_REPLACE_WITH_REAL_KEY') {
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
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const order = await Order.findById(pi.metadata.orderId);
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.status = 'confirmed';
          order.transactionId = pi.id;
          order.paymentDetails = { method: 'stripe', transactionId: pi.id, paidAt: new Date() };
          await order.save();
          logger.info(`[stripeWebhook] Order ${pi.metadata.orderId} marked as paid via webhook`);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const order = await Order.findById(pi.metadata.orderId);
        if (order) {
          order.paymentStatus = 'failed';
          await order.save();
          logger.info(`[stripeWebhook] Order ${pi.metadata.orderId} payment failed`);
        }
        break;
      }
      default:
        logger.info(`[stripeWebhook] Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    logger.error(`[stripeWebhook] Processing error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// â”€â”€ bKash: Initiate Payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.initiateBkashPayment = async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and orderId are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const callbackUrl = process.env.BKASH_CALLBACK_URL || `${process.env.FRONTEND_URL}/payment/bkash/callback`;

    const data = await bkashRequest('create', {
      mode: '0011',
      payerReference: req.user.id,
      callbackURL: callbackUrl,
      amount: String(amount),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: order.orderNumber || orderId,
    });

    if (data.statusCode !== '0000') {
      throw new Error(data.statusMessage || 'bKash payment creation failed');
    }

    // Store bKash paymentID on the order for verification later
    order.paymentDetails = {
      ...order.paymentDetails,
      bkashPaymentId: data.paymentID,
      bkashCreateTime: data.createTime,
    };
    await order.save();

    res.status(200).json({
      success: true,
      paymentID: data.paymentID,
      bkashURL: data.bkashURL,
      callbackURL: data.callbackURL,
      successCallbackURL: data.successCallbackURL,
      failureCallbackURL: data.failureCallbackURL,
      cancelledCallbackURL: data.cancelledCallbackURL,
    });
  } catch (error) {
    logger.error(`[initiateBkashPayment] ${error.message}`);
    // Return a clear message if credentials are not configured
    if (error.message.includes('not configured')) {
      return res.status(503).json({
        success: false,
        message: 'bKash payment is not available yet. Please use Bank Transfer or B2B Credit.',
        code: 'BKASH_NOT_CONFIGURED'
      });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to initiate bKash payment' });
  }
};

// â”€â”€ bKash: Execute Payment (called after user completes payment in bKash app) â”€
exports.executeBkashPayment = async (req, res) => {
  try {
    const { paymentID } = req.body;
    if (!paymentID) return res.status(400).json({ success: false, message: 'paymentID is required' });

    const data = await bkashRequest('execute', { paymentID });

    if (data.statusCode !== '0000') {
      throw new Error(data.statusMessage || 'bKash payment execution failed');
    }

    // Find order by bKash paymentID stored during initiation
    const order = await Order.findOne({ 'paymentDetails.bkashPaymentId': paymentID });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found for this payment' });

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.transactionId = data.trxID;
    order.paymentDetails = {
      ...order.paymentDetails,
      method: 'bkash',
      trxID: data.trxID,
      paymentID: data.paymentID,
      paidAt: new Date(),
    };
    await order.save();

    res.status(200).json({ success: true, message: 'bKash payment successful', trxID: data.trxID, order });
  } catch (error) {
    logger.error(`[executeBkashPayment] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to execute bKash payment' });
  }
};

// â”€â”€ bKash: Verify Payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.verifyBkashPayment = async (req, res) => {
  try {
    const { paymentID, orderId } = req.body;
    if (!paymentID || !orderId) {
      return res.status(400).json({ success: false, message: 'paymentID and orderId are required' });
    }

    const data = await bkashRequest('query/payment/status', { paymentID });

    if (data.statusCode !== '0000') {
      throw new Error(data.statusMessage || 'bKash verification failed');
    }

    if (data.transactionStatus === 'Completed') {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.transactionId = data.trxID;
      order.paymentDetails = {
        ...order.paymentDetails,
        method: 'bkash',
        trxID: data.trxID,
        verifiedAt: new Date(),
      };
      await order.save();

      res.status(200).json({ success: true, message: 'bKash payment verified', order });
    } else {
      res.status(400).json({ success: false, message: `Payment status: ${data.transactionStatus}` });
    }
  } catch (error) {
    logger.error(`[verifyBkashPayment] ${error.message}`);
    if (error.message.includes('not configured')) {
      return res.status(503).json({ success: false, message: 'bKash not configured', code: 'BKASH_NOT_CONFIGURED' });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to verify bKash payment' });
  }
};

// â”€â”€ Bank Transfer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.processBankTransfer = async (req, res) => {
  try {
    const { orderId, transactionReference } = req.body;
    if (!orderId || !transactionReference) {
      return res.status(400).json({ success: false, message: 'Order ID and transaction reference are required' });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
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

// â”€â”€ B2B Credit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.processB2BCreditPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'Order ID is required' });

    const order = await Order.findById(orderId).populate('user');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.user.role !== 'b2b_customer') {
      return res.status(403).json({ success: false, message: 'B2B credit is only available for B2B accounts' });
    }

    const totalAmount = order.totalAmount || order.total || 0;
    const availableCredit = order.user.creditLimit - order.user.creditUsed;

    if (totalAmount > availableCredit) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credit. Available: à§³${availableCredit.toLocaleString()}, Required: à§³${totalAmount.toLocaleString()}`
      });
    }

    await User.findByIdAndUpdate(order.user._id, { $inc: { creditUsed: totalAmount } });
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paymentDetails = { method: 'b2b_credit', creditUsed: totalAmount, paidAt: new Date() };
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment processed using B2B credit',
      order,
      remainingCredit: availableCredit - totalAmount
    });
  } catch (error) {
    logger.error(`[processB2BCreditPayment] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to process B2B credit payment' });
  }
};

// â”€â”€ Nagad (stub â€” swap in real credentials when available) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.initiateNagadPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const { NAGAD_MERCHANT_ID, NAGAD_MERCHANT_KEY } = process.env;

    if (!NAGAD_MERCHANT_ID || NAGAD_MERCHANT_ID === 'your_nagad_merchant_id') {
      return res.status(503).json({
        success: false,
        message: 'Nagad payment is not available yet. Please use Bank Transfer or B2B Credit.',
        code: 'NAGAD_NOT_CONFIGURED'
      });
    }

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

// â”€â”€ Cheque â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
