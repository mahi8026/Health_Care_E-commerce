const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// ── Security helpers (C2/C3) ─────────────────────────────────────────────────

// Any gateway-confirmed amount within this tolerance (BDT) of the order total is accepted.
const ORDER_AMOUNT_TOLERANCE = 1;

function isStaff(user) {
  return !!user && (user.role === 'admin' || user.role === 'agent');
}

// TEMPORARY: payment methods open to customers. Override via PAYMENT_METHODS_ENABLED
// (comma-separated ids) to re-enable a method without a code change.
function enabledPaymentMethods() {
  const raw = process.env.PAYMENT_METHODS_ENABLED;
  if (raw) {
    return raw.split(',').map((m) => m.trim()).filter(Boolean);
  }
  return ['cod', 'bank_transfer', 'npsb', 'b2b_credit'];
}

// Fail-closed guard: returns false and sends 503 when the method is disabled.
function assertPaymentMethodEnabled(method, res) {
  if (!enabledPaymentMethods().includes(method)) {
    errorResponse(res, `${method} payment is temporarily disabled. Please use Bank Transfer or Cash on Delivery.`, { code: 'PAYMENT_METHOD_DISABLED' }, 503);
    return false;
  }
  return true;
}

/**
 * C3 — Require the authenticated user to own the order (admins/agents pass).
 * Returns false and sends 403 when access is denied.
 */
function assertOrderOwnership(order, user, res) {
  if (isStaff(user)) {
return true;
}
  if (!order || !order.user) {
    errorResponse(res, 'Order not found', null, 404);
    return false;
  }
  const ownerId = typeof order.user === 'object' && order.user._id
    ? String(order.user._id)
    : String(order.user);
  if (ownerId !== String(user._id)) {
    logger.warn(`[payment] IDOR attempt blocked: user ${user._id} tried to pay order of ${ownerId}`);
    errorResponse(res, 'Not authorized to access this order', null, 403);
    return false;
  }
  return true;
}

/**
 * C2 — Verify a gateway-confirmed amount matches the server-side order total.
 * Returns false and sends 400 on mismatch.
 */
function assertPaymentAmountMatches(order, paidAmount, res) {
  const expected = Number(order.totalAmount || order.total || 0);
  const paid = Number(paidAmount);
  if (!Number.isFinite(paid) || Math.abs(paid - expected) > ORDER_AMOUNT_TOLERANCE) {
    logger.warn(`[payment] Amount mismatch rejected: order ${order.orderNumber}, expected ৳${expected}, paid ৳${paid}`);
    errorResponse(res, 'Payment amount does not match order total. Please contact support.', null, 400);
    return false;
  }
  return true;
}

/**
 * S8 — A confirm-COD/cheque/bank-transfer call may only (re)confirm an order
 * that has not already been paid and is still pre-fulfilment. Blocks the
 * "un-pay an already-paid order" / regress-shipment vector.
 * Returns false and sends 409 when the transition is not allowed.
 */
function assertConfirmable(order, res) {
  const paid = order.paymentStatus === 'paid';
  const liveStages = ['placed', 'pending', 'confirmed'];
  if (paid || !liveStages.includes(order.status)) {
    logger.warn(`[payment] Confirm blocked: order ${order.orderNumber} status=${order.status} paymentStatus=${order.paymentStatus}`);
    errorResponse(res, `This order cannot be re-confirmed because it is ${order.paymentStatus === 'paid' ? 'already paid' : `in '${order.status}' status`}.`, { code: 'ORDER_NOT_CONFIRMABLE' }, 409);
    return false;
  }
  return true;
}

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
    if (!assertPaymentMethodEnabled('bkash', res)) {
      return;
    }
    const { orderId } = req.body;
    if (!orderId) {
      return errorResponse(res, 'Order ID is required', null, 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
return errorResponse(res, 'Order not found', null, 404);
}
    if (!assertOrderOwnership(order, req.user, res)) {
return;
}

    // C2 — amount always comes from the server-side order total, never the client
    const amount = Number(order.totalAmount || order.total || 0);

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
    return errorResponse(res, 'Failed to initiate bKash payment', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── bKash: Execute Payment (called after user completes payment in bKash app) ─
exports.executeBkashPayment = async (req, res) => {
  try {
    if (!assertPaymentMethodEnabled('bkash', res)) {
      return;
    }
    const { paymentID } = req.body;
    if (!paymentID) {
return errorResponse(res, 'paymentID is required', null, 400);
}

    const data = await bkashRequest('execute', { paymentID });

    if (data.statusCode !== '0000') {
      throw new Error(data.statusMessage || 'bKash payment execution failed');
    }

    // Find order by bKash paymentID stored during initiation
    const order = await Order.findOne({ 'paymentDetails.bkashPaymentId': paymentID });
    if (!order) {
return errorResponse(res, 'Order not found for this payment', null, 404);
}

    // C3 — only the order owner (or staff) may execute this payment
    if (!assertOrderOwnership(order, req.user, res)) {
return;
}

    // C2 — amount confirmed by bKash must match the server-side order total
    if (!assertPaymentAmountMatches(order, data.amount, res)) {
return;
}

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
    return errorResponse(res, 'Failed to execute bKash payment', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── bKash: Verify Payment ─────────────────────────────────────────────────────
exports.verifyBkashPayment = async (req, res) => {
  try {
    if (!assertPaymentMethodEnabled('bkash', res)) {
      return;
    }
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
      if (!order) {
return errorResponse(res, 'Order not found', null, 404);
}

      // C3 — only the order owner (or staff) may verify this payment
      if (!assertOrderOwnership(order, req.user, res)) {
return;
}

      // C2 — verified amount must match the server-side order total
      if (!assertPaymentAmountMatches(order, data.amount, res)) {
return;
}

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
    return errorResponse(res, 'Failed to verify bKash payment', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
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
    if (!order) {
return errorResponse(res, 'Order not found', null, 404);
}
    // C3 — only the order owner (or staff) may submit bank transfer details
    if (!assertOrderOwnership(order, req.user, res)) {
return;
}
    // S8 — never clobber a paid/fulfilled order's state
    if (!assertConfirmable(order, res)) {
return;
}
    order.paymentStatus = 'pending';
    order.paymentDetails = { method: 'bank', transactionReference, submittedAt: new Date() };
    await order.save();
    return successResponse(res, { order }, 'Bank transfer details submitted. Payment will be verified within 2-4 hours.');
  } catch (error) {
    logger.error(`[processBankTransfer] ${error.message}`);
    return errorResponse(res, 'Failed to process bank transfer', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── B2B Credit ────────────────────────────────────────────────────────────────
// ✅ Security Fix #5: Atomic credit check and update to prevent race conditions
exports.processB2BCreditPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
return errorResponse(res, 'Order ID is required', null, 400);
}

    const order = await Order.findById(orderId).populate('user');
    if (!order) {
return errorResponse(res, 'Order not found', null, 404);
}

    // C3 — only the order owner (or staff) may draw on this order's credit
    if (!assertOrderOwnership(order, req.user, res)) {
return;
}

    if (order.user.role !== 'b2b_customer') {
      return errorResponse(res, 'B2B credit is only available for B2B accounts', null, 403);
    }

    // S5 — unapproved B2B accounts cannot draw credit
    if (order.user.b2bApprovalStatus !== 'approved') {
      return errorResponse(res, 'B2B account is not approved for credit payments', null, 403);
    }

    // D5 — atomically claim the order BEFORE debiting credit.
    // Only one concurrent request can flip paymentStatus away from 'paid',
    // so the credit debit below can never be double-applied for this order.
    const claim = await Order.updateOne(
      { _id: order._id, paymentStatus: { $ne: 'paid' } },
      { $set: { paymentStatus: 'paid', status: 'confirmed' } }
    );
    if (claim.matchedCount === 0) {
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
      // D5 — compensate: release the order claim so the customer can retry
      await Order.updateOne(
        { _id: order._id, paymentStatus: 'paid', status: 'confirmed' },
        { $set: { paymentStatus: order.paymentStatus || 'pending', status: order.status || 'placed' } }
      );

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
      remainingCredit: updatedUser.creditLimit - updatedUser.creditUsed,
      creditInfo: {
        creditLimit: updatedUser.creditLimit,
        creditUsed: updatedUser.creditUsed,
        availableCredit: updatedUser.creditLimit - updatedUser.creditUsed,
        utilizationPercent: creditUtilization.toFixed(2)
      }
    }, 'Payment processed using B2B credit');
  } catch (error) {
    logger.error(`[processB2BCreditPayment] ${error.message}`);
    return errorResponse(res, 'Failed to process B2B credit payment', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── Nagad (v3.x RSA flow: initialize → complete → verify) ────────────────────
// Reference: Nagad Online Payment API Integration Guide v3.3 (KONA / Third Wave
// Technologies). The merchant private key is used to sign payloads and decrypt
// gateway responses; the Nagad public key encrypts the sensitiveData payloads.
const NAGAD_API_VERSION = 'v-0.2.0';

function nagadDateTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function nagadChallenge() {
  return crypto.randomBytes(20).toString('hex');
}

function rsaEncrypt(plainText, publicKeyPem) {
  return crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(plainText, 'utf8')
  ).toString('base64');
}

function rsaDecrypt(cipherText, privateKeyPem) {
  return crypto.privateDecrypt(
    { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(cipherText, 'base64')
  ).toString('utf8');
}

function rsaSign(plainText, privateKeyPem) {
  return crypto.createSign('RSA-SHA256').update(plainText).sign(privateKeyPem, 'base64');
}

function getNagadConfig() {
  const { NAGAD_MERCHANT_ID, NAGAD_MERCHANT_KEY, NAGAD_PUBLIC_KEY, NAGAD_BASE_URL } = process.env;
  const notConfigured =
    !NAGAD_MERCHANT_ID || NAGAD_MERCHANT_ID === 'your_nagad_merchant_id' ||
    !NAGAD_MERCHANT_KEY || NAGAD_MERCHANT_KEY === 'your_nagad_merchant_key' ||
    !NAGAD_PUBLIC_KEY || NAGAD_PUBLIC_KEY === 'your_nagad_public_key' ||
    !NAGAD_BASE_URL;
  if (notConfigured) {
    throw new Error('Nagad credentials not configured. Please set NAGAD_MERCHANT_ID, NAGAD_MERCHANT_KEY, NAGAD_PUBLIC_KEY, NAGAD_BASE_URL in .env');
  }
  return { NAGAD_MERCHANT_ID, NAGAD_MERCHANT_KEY, NAGAD_PUBLIC_KEY, NAGAD_BASE_URL };
}

async function nagadRequest(baseUrl, path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-KM-Api-Version': NAGAD_API_VERSION,
      'X-KM-IP-Version': 'v1',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`Nagad API ${path} failed: HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Extract the gateway-confirmed amount (C2) from a Nagad status response.
function nagadConfirmedAmount(data, privateKeyPem) {
  if (data && typeof data.sensitiveData === 'string') {
    try {
      const decrypted = JSON.parse(rsaDecrypt(data.sensitiveData, privateKeyPem));
      if (decrypted && decrypted.amount !== undefined) {
        return Number(decrypted.amount);
      }
    } catch (e) {
      logger.warn(`[nagad] sensitiveData decrypt failed: ${e.message}`);
    }
  }
  if (data && data.amount !== undefined) {
    return Number(data.amount);
  }
  return NaN;
}

// ── Nagad: Initiate Payment ───────────────────────────────────────────────────
exports.initiateNagadPayment = async (req, res) => {
  try {
    if (!assertPaymentMethodEnabled('nagad', res)) {
      return;
    }
    const { NAGAD_MERCHANT_ID, NAGAD_MERCHANT_KEY, NAGAD_PUBLIC_KEY, NAGAD_BASE_URL } = getNagadConfig();

    const { orderId } = req.body;
    if (!orderId) {
      return errorResponse(res, 'Order ID is required', null, 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    // C3 — only the order owner (or staff) may initiate payment for this order
    if (!assertOrderOwnership(order, req.user, res)) {
      return;
    }

    // C2 — amount derived server-side from the order, never from the client
    const amount = Number(order.totalAmount || order.total || 0);
    const invoiceNo = String(order.orderNumber || orderId).slice(0, 20);
    const datetime = nagadDateTime();
    const clientChallenge = nagadChallenge();
    const callbackUrl = process.env.NAGAD_CALLBACK_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/nagad/callback`;

    // Step 1 — initialize the payment session
    const initSensitive = JSON.stringify({
      merchantId: NAGAD_MERCHANT_ID,
      datetime,
      orderId: invoiceNo,
      challenge: clientChallenge,
    });
    const initResponse = await nagadRequest(NAGAD_BASE_URL, `check-out/initialize/${NAGAD_MERCHANT_ID}/${invoiceNo}`, {
      body: {
        accountNumber: NAGAD_MERCHANT_ID,
        dateTime: datetime,
        sensitiveData: rsaEncrypt(initSensitive, NAGAD_PUBLIC_KEY),
        signature: rsaSign(initSensitive, NAGAD_MERCHANT_KEY),
      },
    });

    const initData = initResponse.sensitiveData
      ? JSON.parse(rsaDecrypt(initResponse.sensitiveData, NAGAD_MERCHANT_KEY))
      : initResponse;
    let paymentReferenceId = initData.paymentReferenceId || initResponse.paymentReferenceId;
    const gatewayChallenge = initData.challenge || clientChallenge;
    if (!paymentReferenceId) {
      throw new Error(`Nagad initialize returned no paymentReferenceId: ${JSON.stringify(initResponse)}`);
    }

    // Step 2 — place the order at the gateway to obtain the hosted payment URL
    const completeSensitive = JSON.stringify({
      merchantId: NAGAD_MERCHANT_ID,
      orderId: invoiceNo,
      currencyCode: '050',
      amount: String(amount),
      challenge: gatewayChallenge,
    });
    const completeResponse = await nagadRequest(NAGAD_BASE_URL, `check-out/complete/${paymentReferenceId}`, {
      body: {
        sensitiveData: rsaEncrypt(completeSensitive, NAGAD_PUBLIC_KEY),
        signature: rsaSign(completeSensitive, NAGAD_MERCHANT_KEY),
        merchantCallbackURL: callbackUrl,
      },
    });

    let callBackUrl = completeResponse.callBackUrl || completeResponse.callbackURL || completeResponse.callbackUrl;
    if (completeResponse.sensitiveData) {
      const completeData = JSON.parse(rsaDecrypt(completeResponse.sensitiveData, NAGAD_MERCHANT_KEY));
      paymentReferenceId = completeData.paymentReferenceId || paymentReferenceId;
      callBackUrl = completeData.callBackUrl || completeData.callbackURL || completeData.callbackUrl || callBackUrl;
    }
    if (!callBackUrl) {
      throw new Error(`Nagad complete returned no callBackUrl: ${JSON.stringify(completeResponse)}`);
    }

    // Persist the gateway session so the callback/verify can reconcile this order
    order.paymentDetails = {
      ...order.paymentDetails,
      method: 'nagad',
      nagadPaymentReference: paymentReferenceId,
      nagadChallenge: gatewayChallenge,
      nagadOrderId: invoiceNo,
      initiatedAt: new Date(),
    };
    await order.save();

    return successResponse(res, {
      redirectUrl: callBackUrl,
      paymentReferenceId,
      merchantOrderId: invoiceNo,
      amount: `Tk ${amount.toFixed(2)}`,
    }, 'Nagad payment initiated successfully');
  } catch (error) {
    logger.error(`[initiateNagadPayment] ${error.message}`);
    if (error.message.includes('not configured')) {
      return errorResponse(res, 'Nagad payment is not available yet. Please use Bank Transfer or B2B Credit.', { code: 'NAGAD_NOT_CONFIGURED' }, 503);
    }
    return errorResponse(res, 'Failed to initiate Nagad payment', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── Nagad: Verify Payment (client-side poll after redirect back) ──────────────
exports.verifyNagadPayment = async (req, res) => {
  try {
    if (!assertPaymentMethodEnabled('nagad', res)) {
      return;
    }
    const { NAGAD_MERCHANT_KEY, NAGAD_BASE_URL } = getNagadConfig();

    const { paymentReferenceId, orderId } = req.body;
    if (!paymentReferenceId || !orderId) {
      return errorResponse(res, 'paymentReferenceId and orderId are required', null, 400);
    }

    const data = await nagadRequest(NAGAD_BASE_URL, `check-out/payment/status/${paymentReferenceId}`, { method: 'GET' });

    if (!data || (data.status !== 'Success' && data.status !== 'Completed')) {
      return errorResponse(res, `Payment status: ${data ? data.status : 'Unknown'}`, null, 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    // C3 — only the order owner (or staff) may verify this payment
    if (!assertOrderOwnership(order, req.user, res)) {
      return;
    }

    // C2 — gateway-confirmed amount must match the server-side order total
    const confirmedAmount = nagadConfirmedAmount(data, NAGAD_MERCHANT_KEY);
    if (!Number.isFinite(confirmedAmount)) {
      return errorResponse(res, 'Could not verify the Nagad payment amount. Please contact support.', null, 502);
    }
    if (!assertPaymentAmountMatches(order, confirmedAmount, res)) {
      return;
    }

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.transactionId = data.issuerPaymentRefNo || `NAGAD-${paymentReferenceId}`;
    order.paymentDetails = {
      ...order.paymentDetails,
      method: 'nagad',
      nagadPaymentReference: paymentReferenceId,
      paidAt: new Date(),
    };
    await order.save();

    return successResponse(res, { order }, 'Nagad payment verified');
  } catch (error) {
    logger.error(`[verifyNagadPayment] ${error.message}`);
    if (error.message.includes('not configured')) {
      return errorResponse(res, 'Nagad not configured', { code: 'NAGAD_NOT_CONFIGURED' }, 503);
    }
    return errorResponse(res, 'Failed to verify Nagad payment', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── Nagad: Gateway callback (server-to-server POST / browser GET fallback) ────
exports.handleNagadCallback = async (req, res) => {
  try {
    if (!assertPaymentMethodEnabled('nagad', res)) {
      return;
    }
    const paymentReferenceId = req.body?.paymentReferenceId || req.query?.paymentReferenceId;
    if (!paymentReferenceId) {
      return errorResponse(res, 'paymentReferenceId is required', null, 400);
    }

    const order = await Order.findOne({ 'paymentDetails.nagadPaymentReference': paymentReferenceId });
    if (!order) {
      return errorResponse(res, 'Order not found for this payment', null, 404);
    }

    const { NAGAD_MERCHANT_KEY, NAGAD_BASE_URL } = getNagadConfig();
    const data = await nagadRequest(NAGAD_BASE_URL, `check-out/payment/status/${paymentReferenceId}`, { method: 'GET' });

    if (!data || (data.status !== 'Success' && data.status !== 'Completed')) {
      return errorResponse(res, `Payment not successful: ${data ? data.status : 'Unknown'}`, null, 400);
    }

    // C2 — gateway-confirmed amount must match the server-side order total
    const confirmedAmount = nagadConfirmedAmount(data, NAGAD_MERCHANT_KEY);
    if (!Number.isFinite(confirmedAmount)) {
      return errorResponse(res, 'Could not verify the Nagad payment amount. Please contact support.', null, 502);
    }
    if (!assertPaymentAmountMatches(order, confirmedAmount, res)) {
      return;
    }

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.transactionId = data.issuerPaymentRefNo || `NAGAD-${paymentReferenceId}`;
    order.paymentDetails = {
      ...order.paymentDetails,
      method: 'nagad',
      nagadPaymentReference: paymentReferenceId,
      verifiedAt: new Date(),
      paidAt: new Date(),
    };
    await order.save();

    if (req.method === 'GET') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout?payment=nagad&status=success&order=${order._id}`);
    }
    // Nagad expects a plain acknowledgement on its server-to-server callback
    return res.status(200).json({ success: true, message: 'ACK' });
  } catch (error) {
    logger.error(`[handleNagadCallback] ${error.message}`);
    if (error.message.includes('not configured')) {
      return errorResponse(res, 'Nagad not configured', { code: 'NAGAD_NOT_CONFIGURED' }, 503);
    }
    return errorResponse(res, 'Failed to process Nagad callback', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── Cash on Delivery (COD) ───────────────────────────────────────────────────
exports.processCODPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
return errorResponse(res, 'Order ID is required', null, 400);
}

    const order = await Order.findById(orderId);
    if (!order) {
return errorResponse(res, 'Order not found', null, 404);
}

    // C3 — only the order owner (or staff) may confirm the order for COD
    if (!assertOrderOwnership(order, req.user, res)) {
return;
}

    // S8 — never clobber a paid/fulfilled order's state
    if (!assertConfirmable(order, res)) {
return;
}

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
      process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null,
      500
    );
  }
};

// ── Cheque ────────────────────────────────────────────────────────────────────
exports.submitChequePayment = async (req, res) => {
  try {
    if (!assertPaymentMethodEnabled('cheque', res)) {
      return;
    }
    const { orderId, chequeNumber, bankName, chequeDate, accountName } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
return errorResponse(res, 'Order not found', null, 404);
}
    // C3 — only the order owner (or staff) may submit cheque details
    if (!assertOrderOwnership(order, req.user, res)) {
return;
}
    // S8 — never clobber a paid/fulfilled order's state
    if (!assertConfirmable(order, res)) {
return;
}
    order.paymentMethod = 'cheque';
    order.paymentStatus = 'pending';
    order.paymentDetails = { chequeNumber, bankName, chequeDate, accountName, submittedAt: new Date() };
    await order.save();
    return successResponse(res, { order }, 'Cheque payment recorded. Awaiting clearance.');
  } catch (err) {
    logger.error(`[submitChequePayment] ${err.message}`);
    return errorResponse(res, 'Failed to submit cheque payment', process.env.ERROR_DETAIL_ENABLED === 'true' ? [err.message] : null, 500);
  }
};
