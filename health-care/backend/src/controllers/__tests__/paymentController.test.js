/**
 * Payment Controller Tests
 * Covers: initiateBkashPayment, processBankTransfer,
 *         processB2BCreditPayment, initiateNagadPayment, submitChequePayment
 */

jest.mock('../../models/Order');
jest.mock('../../models/User');
jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));

const {
  initiateBkashPayment,
  processBankTransfer,
  processB2BCreditPayment,
  initiateNagadPayment,
  submitChequePayment,
} = require('../paymentController');
const Order = require('../../models/Order');
const User = require('../../models/User');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  user: { id: 'user123' },
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
    Order.findById.mockResolvedValue({ _id: 'order123', orderNumber: 'ORD-001' });
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
      user: { _id: 'user123', role: 'b2b_customer', creditLimit: 5000, creditUsed: 4000 },
      totalAmount: 2000,
    };
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeOrder) });
    const req = mockReq({ body: { orderId: 'order123' } });
    const res = mockRes();
    await processB2BCreditPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/insufficient credit/i);
  });

  it('processes payment and returns 200 when credit is sufficient', async () => {
    const fakeOrder = {
      _id: 'order123',
      user: { _id: 'user123', role: 'b2b_customer', creditLimit: 100000, creditUsed: 0 },
      totalAmount: 5000,
      paymentStatus: null,
      status: null,
      paymentDetails: null,
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeOrder) });
    User.findByIdAndUpdate.mockResolvedValue(true);
    const req = mockReq({ body: { orderId: 'order123' } });
    const res = mockRes();
    await processB2BCreditPayment(req, res);
    expect(fakeOrder.paymentStatus).toBe('paid');
    expect(fakeOrder.status).toBe('confirmed');
    expect(fakeOrder.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.remainingCredit).toBe(95000);
  });
});

// ── initiateNagadPayment ──────────────────────────────────────────────────────
describe('initiateNagadPayment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 503 when Nagad credentials not configured', async () => {
    const savedId = process.env.NAGAD_MERCHANT_ID;
    delete process.env.NAGAD_MERCHANT_ID;
    const req = mockReq({ body: { orderId: 'order123', amount: 1000 } });
    const res = mockRes();
    await initiateNagadPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json.mock.calls[0][0].code).toBe('NAGAD_NOT_CONFIGURED');
    process.env.NAGAD_MERCHANT_ID = savedId;
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
