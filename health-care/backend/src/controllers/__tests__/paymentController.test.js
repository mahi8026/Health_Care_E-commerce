/**
 * Payment Controller Tests
 * Covers: initiateBkashPayment, processBankTransfer,
 *         processB2BCreditPayment, initiateNagadPayment, verifyNagadPayment,
 *         handleNagadCallback, submitChequePayment
 */

jest.mock('../../models/Order');
jest.mock('../../models/User');
jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));

const crypto = require('crypto');
const { generateKeyPairSync } = require('crypto');

// Real RSA keypair so the Nagad tests exercise signing/encryption end-to-end
const nagadKeys = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const nagadEncrypt = (text) =>
  crypto.publicEncrypt(
    { key: nagadKeys.publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(text, 'utf8')
  ).toString('base64');
const NAGAD_ENV_KEYS = ['NAGAD_MERCHANT_ID', 'NAGAD_MERCHANT_KEY', 'NAGAD_PUBLIC_KEY', 'NAGAD_BASE_URL'];
const setNagadEnv = () => {
  process.env.NAGAD_MERCHANT_ID = 'MER001';
  process.env.NAGAD_MERCHANT_KEY = nagadKeys.privateKey;
  process.env.NAGAD_PUBLIC_KEY = nagadKeys.publicKey;
  process.env.NAGAD_BASE_URL = 'https://sandbox.mynagad.com:10060/api/dfs/';
};
const clearNagadEnv = () => {
  NAGAD_ENV_KEYS.forEach((k) => delete process.env[k]);
  delete process.env.FRONTEND_URL;
  delete global.fetch;
};

const {
  initiateBkashPayment,
  processBankTransfer,
  processB2BCreditPayment,
  initiateNagadPayment,
  verifyNagadPayment,
  handleNagadCallback,
  submitChequePayment,
} = require('../paymentController');
const Order = require('../../models/Order');
const User = require('../../models/User');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  user: { _id: 'user123', id: 'user123', role: 'customer' },
  ...overrides,
});

// ── initiateBkashPayment ──────────────────────────────────────────────────────
describe('initiateBkashPayment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when amount or orderId missing', async () => {
    const req = mockReq({ body: { amount: 1000 } }); // missing orderId
    const res = mockRes();
    await initiateBkashPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });

  it('returns 404 when order not found', async () => {
    Order.findById.mockResolvedValue(null);
    const req = mockReq({ body: { amount: 1000, orderId: 'order123' } });
    const res = mockRes();
    await initiateBkashPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 503 when bKash credentials not configured', async () => {
    Order.findById.mockResolvedValue({ _id: 'order123', orderNumber: 'ORD-001', user: 'user123', totalAmount: 1000 });
    // Ensure BKASH_APP_KEY is not set
    const savedKey = process.env.BKASH_APP_KEY;
    delete process.env.BKASH_APP_KEY;
    const req = mockReq({ body: { amount: 1000, orderId: 'order123' } });
    const res = mockRes();
    await initiateBkashPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json.mock.calls[0][0].code).toBe('BKASH_NOT_CONFIGURED');
    process.env.BKASH_APP_KEY = savedKey;
  });
});

// ── processBankTransfer ───────────────────────────────────────────────────────
describe('processBankTransfer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when orderId or transactionReference missing', async () => {
    const req = mockReq({ body: { orderId: 'order123' } }); // missing transactionReference
    const res = mockRes();
    await processBankTransfer(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when order not found', async () => {
    Order.findById.mockResolvedValue(null);
    const req = mockReq({ body: { orderId: 'order123', transactionReference: 'TXN-001' } });
    const res = mockRes();
    await processBankTransfer(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('saves payment details and returns 200', async () => {
    const fakeOrder = {
      _id: 'order123',
      user: 'user123',
      paymentStatus: null,
      paymentDetails: null,
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findById.mockResolvedValue(fakeOrder);
    const req = mockReq({ body: { orderId: 'order123', transactionReference: 'TXN-001' } });
    const res = mockRes();
    await processBankTransfer(req, res);
    expect(fakeOrder.paymentStatus).toBe('pending');
    expect(fakeOrder.paymentDetails.transactionReference).toBe('TXN-001');
    expect(fakeOrder.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  it('returns 500 on database error', async () => {
    Order.findById.mockRejectedValue(new Error('DB error'));
    const req = mockReq({ body: { orderId: 'order123', transactionReference: 'TXN-001' } });
    const res = mockRes();
    await processBankTransfer(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── processB2BCreditPayment ───────────────────────────────────────────────────
describe('processB2BCreditPayment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when orderId missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await processB2BCreditPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when order not found', async () => {
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const req = mockReq({ body: { orderId: 'order123' } });
    const res = mockRes();
    await processB2BCreditPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when user is not b2b_customer', async () => {
    const fakeOrder = {
      _id: 'order123',
      user: { _id: 'user123', role: 'customer', creditLimit: 100000, creditUsed: 0 },
      totalAmount: 5000,
    };
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeOrder) });
    const req = mockReq({ body: { orderId: 'order123' } });
    const res = mockRes();
    await processB2BCreditPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 400 when insufficient credit', async () => {
    const fakeOrder = {
      _id: 'order123',
      user: { _id: 'user123', role: 'b2b_customer', b2bApprovalStatus: 'approved', creditLimit: 5000, creditUsed: 4000 },
      totalAmount: 2000,
    };
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeOrder) });
    // Atomic order claim succeeds
    Order.updateOne.mockResolvedValue({ matchedCount: 1 });
    // Atomic credit check fails (findOneAndUpdate returns null) → insufficient credit path
    User.findOneAndUpdate.mockResolvedValue(null);
    User.findById.mockResolvedValue({
      _id: 'user123',
      email: 'b2b@test.com',
      role: 'b2b_customer',
      isActive: true,
      creditLimit: 5000,
      creditUsed: 4000,
    });
    const req = mockReq({ body: { orderId: 'order123' } });
    const res = mockRes();
    await processB2BCreditPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/insufficient credit/i);
  });

  it('processes payment and returns 200 when credit is sufficient', async () => {
    const fakeOrder = {
      _id: 'order123',
      user: { _id: 'user123', role: 'b2b_customer', b2bApprovalStatus: 'approved', creditLimit: 100000, creditUsed: 0 },
      totalAmount: 5000,
      paymentStatus: null,
      status: null,
      paymentDetails: null,
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeOrder) });
    // Atomic order claim succeeds, then credit is debited atomically
    Order.updateOne.mockResolvedValue({ matchedCount: 1 });
    User.findOneAndUpdate.mockResolvedValue({
      _id: 'user123',
      creditLimit: 100000,
      creditUsed: 5000,
    });
    const req = mockReq({ body: { orderId: 'order123' } });
    const res = mockRes();
    await processB2BCreditPayment(req, res);
    expect(fakeOrder.paymentStatus).toBe('paid');
    expect(fakeOrder.status).toBe('confirmed');
    expect(fakeOrder.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.remainingCredit).toBe(95000);
  });
});

// ── initiateNagadPayment ──────────────────────────────────────────────────────
describe('initiateNagadPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setNagadEnv();
  });

  afterEach(clearNagadEnv);

  it('returns 503 when Nagad credentials not configured', async () => {
    delete process.env.NAGAD_MERCHANT_ID;
    const req = mockReq({ body: { orderId: 'order123', amount: 1000 } });
    const res = mockRes();
    await initiateNagadPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json.mock.calls[0][0].code).toBe('NAGAD_NOT_CONFIGURED');
  });

  it('returns 503 when the merchant key is still a placeholder', async () => {
    process.env.NAGAD_MERCHANT_KEY = 'your_nagad_merchant_key';
    const req = mockReq({ body: { orderId: 'order123' } });
    const res = mockRes();
    await initiateNagadPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json.mock.calls[0][0].code).toBe('NAGAD_NOT_CONFIGURED');
  });

  it('returns 400 when orderId missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await initiateNagadPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when order not found', async () => {
    Order.findById.mockResolvedValue(null);
    const req = mockReq({ body: { orderId: 'order123' } });
    const res = mockRes();
    await initiateNagadPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when a different user tries to pay for the order', async () => {
    Order.findById.mockResolvedValue({ _id: 'order123', orderNumber: 'ORD-001', user: 'another-user', totalAmount: 1000 });
    const req = mockReq({ body: { orderId: 'order123' } });
    const res = mockRes();
    await initiateNagadPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('initiates payment and returns the hosted checkout URL', async () => {
    const fakeOrder = {
      _id: 'order123',
      orderNumber: 'ORD-001',
      user: 'user123',
      totalAmount: 1000,
      paymentDetails: null,
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findById.mockResolvedValue(fakeOrder);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sensitiveData: nagadEncrypt(JSON.stringify({ paymentReferenceId: 'PR-1', challenge: 'ch0123456789012345678901234567890123456789' })) }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ callBackUrl: 'https://sandbox.mynagad.com:10060/check-out/REDIRECT_TOKEN' }) });

    const req = mockReq({ body: { orderId: 'order123' } });
    const res = mockRes();
    await initiateNagadPayment(req, res);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.redirectUrl).toBe('https://sandbox.mynagad.com:10060/check-out/REDIRECT_TOKEN');
    expect(body.data.paymentReferenceId).toBe('PR-1');
    expect(fakeOrder.paymentDetails.method).toBe('nagad');
    expect(fakeOrder.paymentDetails.nagadPaymentReference).toBe('PR-1');
    expect(fakeOrder.save).toHaveBeenCalled();
  });
});

// ── verifyNagadPayment ────────────────────────────────────────────────────────
describe('verifyNagadPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setNagadEnv();
  });

  afterEach(clearNagadEnv);

  it('returns 400 when paymentReferenceId or orderId missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await verifyNagadPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when order not found', async () => {
    Order.findById.mockResolvedValue(null);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'Success', sensitiveData: nagadEncrypt(JSON.stringify({ amount: '1000' })) }) });
    const req = mockReq({ body: { paymentReferenceId: 'PR-1', orderId: 'order123' } });
    const res = mockRes();
    await verifyNagadPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('marks the order paid when Nagad confirms Success', async () => {
    const fakeOrder = {
      _id: 'order123',
      user: 'user123',
      totalAmount: 1000,
      paymentStatus: null,
      status: null,
      transactionId: null,
      paymentDetails: null,
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findById.mockResolvedValue(fakeOrder);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'Success',
        issuerPaymentRefNo: 'ISSUER-1',
        sensitiveData: nagadEncrypt(JSON.stringify({ amount: '1000' })),
      }),
    });
    const req = mockReq({ body: { paymentReferenceId: 'PR-1', orderId: 'order123' } });
    const res = mockRes();
    await verifyNagadPayment(req, res);
    expect(fakeOrder.paymentStatus).toBe('paid');
    expect(fakeOrder.status).toBe('confirmed');
    expect(fakeOrder.transactionId).toBe('ISSUER-1');
    expect(fakeOrder.save).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  it('rejects when the gateway amount does not match the order total', async () => {
    const fakeOrder = { _id: 'order123', user: 'user123', totalAmount: 1000, save: jest.fn() };
    Order.findById.mockResolvedValue(fakeOrder);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'Success', sensitiveData: nagadEncrypt(JSON.stringify({ amount: '998' })) }),
    });
    const req = mockReq({ body: { paymentReferenceId: 'PR-1', orderId: 'order123' } });
    const res = mockRes();
    await verifyNagadPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(fakeOrder.save).not.toHaveBeenCalled();
  });

  it('returns 400 when the payment is not successful', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'Pending' }) });
    const req = mockReq({ body: { paymentReferenceId: 'PR-1', orderId: 'order123' } });
    const res = mockRes();
    await verifyNagadPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/Pending/);
  });
});

// ── handleNagadCallback ───────────────────────────────────────────────────────
describe('handleNagadCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setNagadEnv();
  });

  afterEach(clearNagadEnv);

  it('returns 400 when paymentReferenceId missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await handleNagadCallback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when no order holds that payment reference', async () => {
    Order.findOne.mockResolvedValue(null);
    const req = mockReq({ body: { paymentReferenceId: 'PR-1' } });
    const res = mockRes();
    await handleNagadCallback(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('acknowledges the server-to-server callback and marks the order paid', async () => {
    const fakeOrder = {
      _id: 'order123',
      user: 'user123',
      totalAmount: 1000,
      paymentStatus: null,
      status: null,
      transactionId: null,
      paymentDetails: null,
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findOne.mockResolvedValue(fakeOrder);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'Success', sensitiveData: nagadEncrypt(JSON.stringify({ amount: '1000' })) }),
    });
    const req = mockReq({ body: { paymentReferenceId: 'PR-1' } });
    const res = mockRes();
    await handleNagadCallback(req, res);
    expect(fakeOrder.paymentStatus).toBe('paid');
    expect(fakeOrder.transactionId).toBe('NAGAD-PR-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'ACK' });
  });

  it('redirects the browser to the frontend on GET after success', async () => {
    process.env.FRONTEND_URL = 'https://app.example.com';
    const fakeOrder = {
      _id: 'order123',
      user: 'user123',
      totalAmount: 1000,
      paymentDetails: {},
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findOne.mockResolvedValue(fakeOrder);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'Success', sensitiveData: nagadEncrypt(JSON.stringify({ amount: '1000' })) }),
    });
    const req = mockReq({ body: { paymentReferenceId: 'PR-1' }, method: 'GET' });
    const res = mockRes();
    await handleNagadCallback(req, res);
    expect(res.redirect).toHaveBeenCalledWith('https://app.example.com/checkout?payment=nagad&status=success&order=order123');
  });
});

// ── submitChequePayment ───────────────────────────────────────────────────────
describe('submitChequePayment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when order not found', async () => {
    Order.findById.mockResolvedValue(null);
    const req = mockReq({ body: { orderId: 'order123', chequeNumber: 'CHQ001', bankName: 'DBBL', chequeDate: '2026-01-01', accountName: 'Test' } });
    const res = mockRes();
    await submitChequePayment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('records cheque details and returns 200', async () => {
    const fakeOrder = {
      _id: 'order123',
      user: 'user123',
      paymentMethod: null,
      paymentStatus: null,
      paymentDetails: null,
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findById.mockResolvedValue(fakeOrder);
    const req = mockReq({
      body: { orderId: 'order123', chequeNumber: 'CHQ001', bankName: 'DBBL', chequeDate: '2026-01-01', accountName: 'Test Corp' },
    });
    const res = mockRes();
    await submitChequePayment(req, res);
    expect(fakeOrder.paymentMethod).toBe('cheque');
    expect(fakeOrder.paymentStatus).toBe('pending');
    expect(fakeOrder.paymentDetails.chequeNumber).toBe('CHQ001');
    expect(fakeOrder.save).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });
});
