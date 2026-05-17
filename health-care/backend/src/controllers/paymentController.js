const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');

// Stripe has been removed as it doesn't work in Bangladesh
// Available payment methods: bKash, Nagad, Bank Transfer, B2B Credit, Cheque

// ── bKash Tokenized Checkout helpers ──────────────────────────────────────────
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

// ── bKash: Initiate Payment ───────────────────────────────────────────────────
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

// ── bKash: Execute Payment (called after user completes payment in bKash app) ─
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

// ── bKash: Verify Payment ─────────────────────────────────────────────────────
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

// ── Bank Transfer ─────────────────────────────────────────────────────────────
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

// ── B2B Credit ────────────────────────────────────────────────────────────────
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
        message: `Insufficient credit. Available: ৳${availableCredit.toLocaleString()}, Required: ৳${totalAmount.toLocaleString()}`
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

// ── Nagad (stub – swap in real credentials when available) ───────────────────
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

// ── Cheque ────────────────────────────────────────────────────────────────────
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
