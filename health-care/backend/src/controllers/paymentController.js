const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

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
      return errorResponse(res, 'Amount and orderId are required', null, 400);
    }

    const order = await Order.findById(orderId);
    if (!order) return errorResponse(res, 'Order not found', null, 404);

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

    return successResponse(res, {
      paymentID: data.paymentID,
      bkashURL: data.bkashURL,
      callbackURL: data.callbackURL,
      successCallbackURL: data.successCallbackURL,
      failureCallbackURL: data.failureCallbackURL,
      cancelledCallbackURL: data.cancelledCallbackURL,
    }, 'bKash payment initiated successfully');
  } catch (error) {
    logger.error(`[initiateBkashPayment] ${error.message}`);
    // Return a clear message if credentials are not configured
    if (error.message.includes('not configured')) {
      return errorResponse(res, 'bKash payment is not available yet. Please use Bank Transfer or B2B Credit.', { code: 'BKASH_NOT_CONFIGURED' }, 503);
    }
    return errorResponse(res, 'Failed to initiate bKash payment', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── bKash: Execute Payment (called after user completes payment in bKash app) ─
exports.executeBkashPayment = async (req, res) => {
  try {
    const { paymentID } = req.body;
    if (!paymentID) return errorResponse(res, 'paymentID is required', null, 400);

    const data = await bkashRequest('execute', { paymentID });

    if (data.statusCode !== '0000') {
      throw new Error(data.statusMessage || 'bKash payment execution failed');
    }

    // Find order by bKash paymentID stored during initiation
    const order = await Order.findOne({ 'paymentDetails.bkashPaymentId': paymentID });
    if (!order) return errorResponse(res, 'Order not found for this payment', null, 404);

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

    return successResponse(res, { trxID: data.trxID, order }, 'bKash payment successful');
  } catch (error) {
    logger.error(`[executeBkashPayment] ${error.message}`);
    return errorResponse(res, 'Failed to execute bKash payment', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── bKash: Verify Payment ─────────────────────────────────────────────────────
exports.verifyBkashPayment = async (req, res) => {
  try {
    const { paymentID, orderId } = req.body;
    if (!paymentID || !orderId) {
      return errorResponse(res, 'paymentID and orderId are required', null, 400);
    }

    const data = await bkashRequest('query/payment/status', { paymentID });

    if (data.statusCode !== '0000') {
      throw new Error(data.statusMessage || 'bKash verification failed');
    }

    if (data.transactionStatus === 'Completed') {
      const order = await Order.findById(orderId);
      if (!order) return errorResponse(res, 'Order not found', null, 404);

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

      return successResponse(res, { order }, 'bKash payment verified');
    } else {
      return errorResponse(res, `Payment status: ${data.transactionStatus}`, null, 400);
    }
  } catch (error) {
    logger.error(`[verifyBkashPayment] ${error.message}`);
    if (error.message.includes('not configured')) {
      return errorResponse(res, 'bKash not configured', { code: 'BKASH_NOT_CONFIGURED' }, 503);
    }
    return errorResponse(res, 'Failed to verify bKash payment', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Bank Transfer ─────────────────────────────────────────────────────────────
exports.processBankTransfer = async (req, res) => {
  try {
    const { orderId, transactionReference } = req.body;
    if (!orderId || !transactionReference) {
      return errorResponse(res, 'Order ID and transaction reference are required', null, 400);
    }
    const order = await Order.findById(orderId);
    if (!order) return errorResponse(res, 'Order not found', null, 404);
    order.paymentStatus = 'pending';
    order.paymentDetails = { method: 'bank', transactionReference, submittedAt: new Date() };
    await order.save();
    return successResponse(res, { order }, 'Bank transfer details submitted. Payment will be verified within 2-4 hours.');
  } catch (error) {
    logger.error(`[processBankTransfer] ${error.message}`);
    return errorResponse(res, 'Failed to process bank transfer', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── B2B Credit ────────────────────────────────────────────────────────────────
// ✅ Security Fix #5: Atomic credit check and update to prevent race conditions
exports.processB2BCreditPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return errorResponse(res, 'Order ID is required', null, 400);

    const order = await Order.findById(orderId).populate('user');
    if (!order) return errorResponse(res, 'Order not found', null, 404);

    if (order.user.role !== 'b2b_customer') {
      return errorResponse(res, 'B2B credit is only available for B2B accounts', null, 403);
    }

    // Verify order not already paid
    if (order.paymentStatus === 'paid') {
      return errorResponse(res, 'Order already paid', null, 400);
    }

    const totalAmount = order.totalAmount || order.total || 0;

    // ✅ ATOMIC OPERATION: Check and update credit in single database operation
    // This prevents race conditions by using MongoDB's atomic update operators
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: order.user._id,
        role: 'b2b_customer',
        isActive: true,
        // ✅ CRITICAL: Only update if sufficient credit available
        // This check happens atomically inside the database
        $expr: { 
          $gte: [
            { $subtract: ['$creditLimit', '$creditUsed'] },  // availableCredit
            totalAmount                                       // requiredAmount
          ]
        }
      },
      { 
        // ✅ Increment credit used
        $inc: { creditUsed: totalAmount },
        // ✅ Record transaction
        $push: {
          creditTransactions: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            amount: totalAmount,
            type: 'debit',
            timestamp: new Date(),
            previousBalance: order.user.creditUsed,
            newBalance: order.user.creditUsed + totalAmount
          }
        }
      },
      { 
        new: true,  // Return updated document
        runValidators: true
      }
    );

    // ✅ If update returned null, credit limit was exceeded
    if (!updatedUser) {
      // Get current user state to provide accurate error message
      const currentUser = await User.findById(order.user._id);
      
      if (!currentUser) {
        return errorResponse(res, 'User not found', null, 404);
      }
      
      if (!currentUser.isActive) {
        return errorResponse(res, 'Account is inactive', null, 403);
      }
      
      const available = currentUser.creditLimit - currentUser.creditUsed;
      
      logger.warn(`[B2B Credit] Insufficient credit - User: ${currentUser.email}, Required: ৳${totalAmount}, Available: ৳${available}`);
      
      return errorResponse(
        res,
        `Insufficient credit. Available: ৳${available.toLocaleString()}, Required: ৳${totalAmount.toLocaleString()}`,
        {
          creditLimit: currentUser.creditLimit,
          creditUsed: currentUser.creditUsed,
          availableCredit: available,
          requiredAmount: totalAmount
        },
        400
      );
    }

    // ✅ Credit successfully allocated - update order
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.transactionId = `B2B-${Date.now()}-${order.orderNumber}`;
    order.paymentDetails = {
      method: 'b2b_credit',
      creditUsed: totalAmount,
      paidAt: new Date(),
      previousCreditUsed: updatedUser.creditUsed - totalAmount,
      newCreditUsed: updatedUser.creditUsed,
      availableCredit: updatedUser.creditLimit - updatedUser.creditUsed
    };
    await order.save();

    const creditUtilization = (updatedUser.creditUsed / updatedUser.creditLimit) * 100;

    return successResponse(res, {
      order,
      remainingCredit: availableCredit - totalAmount,
      creditInfo: {
        creditLimit: updatedUser.creditLimit,
        creditUsed: updatedUser.creditUsed,
        availableCredit: updatedUser.creditLimit - updatedUser.creditUsed,
        utilizationPercent: creditUtilization.toFixed(2)
      }
    }, 'Payment processed using B2B credit');
  } catch (error) {
    logger.error(`[processB2BCreditPayment] ${error.message}`);
    return errorResponse(res, 'Failed to process B2B credit payment', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Nagad (stub – swap in real credentials when available) ───────────────────
exports.initiateNagadPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const { NAGAD_MERCHANT_ID, NAGAD_MERCHANT_KEY } = process.env;

    if (!NAGAD_MERCHANT_ID || NAGAD_MERCHANT_ID === 'your_nagad_merchant_id') {
      return errorResponse(res, 'Nagad payment is not available yet. Please use Bank Transfer or B2B Credit.', { code: 'NAGAD_NOT_CONFIGURED' }, 503);
    }

    const order = await Order.findById(orderId);
    if (!order) return errorResponse(res, 'Order not found', null, 404);

    return successResponse(res, {
      redirectUrl: `${process.env.FRONTEND_URL}/checkout?payment=nagad&order=${orderId}`,
      merchantOrderId: `NAGAD-${Date.now()}`,
    }, 'Nagad payment initiated (sandbox)');
  } catch (err) {
    logger.error(`[initiateNagadPayment] ${err.message}`);
    return errorResponse(res, 'Failed to initiate Nagad payment', process.env.NODE_ENV === 'development' ? [err.message] : null, 500);
  }
};

// ── Cash on Delivery (COD) ───────────────────────────────────────────────────
exports.processCODPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return errorResponse(res, 'Order ID is required', null, 400);

    const order = await Order.findById(orderId);
    if (!order) return errorResponse(res, 'Order not found', null, 404);

    // Mark as pending payment - will be paid on delivery
    order.paymentMethod = 'cod';
    order.paymentStatus = 'pending';
    order.status = 'confirmed'; // Order is confirmed, just pending payment
    order.paymentDetails = {
      method: 'cod',
      description: 'Cash on Delivery - Payment will be collected upon delivery',
      createdAt: new Date(),
    };
    await order.save();

    return successResponse(
      res,
      { order },
      'Order confirmed with Cash on Delivery. Payment will be collected upon delivery.'
    );
  } catch (error) {
    logger.error(`[processCODPayment] ${error.message}`);
    return errorResponse(
      res,
      'Failed to process COD payment',
      process.env.NODE_ENV === 'development' ? [error.message] : null,
      500
    );
  }
};

// ── Cheque ────────────────────────────────────────────────────────────────────
exports.submitChequePayment = async (req, res) => {
  try {
    const { orderId, chequeNumber, bankName, chequeDate, accountName } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return errorResponse(res, 'Order not found', null, 404);
    order.paymentMethod = 'cheque';
    order.paymentStatus = 'pending';
    order.paymentDetails = { chequeNumber, bankName, chequeDate, accountName, submittedAt: new Date() };
    await order.save();
    return successResponse(res, { order }, 'Cheque payment recorded. Awaiting clearance.');
  } catch (err) {
    logger.error(`[submitChequePayment] ${err.message}`);
    return errorResponse(res, 'Failed to submit cheque payment', process.env.NODE_ENV === 'development' ? [err.message] : null, 500);
  }
};
