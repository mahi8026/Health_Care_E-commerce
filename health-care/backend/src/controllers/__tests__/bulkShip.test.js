/**
 * Bulk SteadFast Shipping Tests
 * Covers: bulkShipViaSteadfast — batch booking with per-order outcomes,
 * skip reasons, and partial failure isolation.
 */

jest.mock('../../models/Order');
jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));
jest.mock('../../utils/activityLogger', () => ({
  logActivityAsync: jest.fn(),
  ACTIONS: {
    ORDER: { PLACED: 'order.placed', STATUS_CHANGED: 'order.status_changed', CANCELLED: 'order.cancelled' },
  },
}));
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  };
});

const { bulkShipViaSteadfast, checkSteadfastFraud } = require('../orderController');
const Order = require('../../models/Order');
const steadfastService = require('../../services/steadfastService');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { _id: 'admin-id', name: 'Admin', role: 'admin' },
  ...overrides,
});

const makeOrder = (overrides = {}) => {
  const order = {
    _id: 'order-1',
    orderNumber: 'ORD-1001',
    status: 'processing',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    totalAmount: 1200,
    tracking: {},
    deliveryAddress: {
      name: 'Rahim',
      phone: '01711111111',
      street: 'House 5',
      thana: 'Dhanmondi',
      district: 'Dhaka',
    },
    items: [{ name: 'Paracetamol', qty: 2 }],
    trackingNumber: undefined,
    save: jest.fn().mockResolvedValue(true),
    markModified: jest.fn(),
    ...overrides,
  };
  return order;
};

describe('bulkShipViaSteadfast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(steadfastService, 'isConfigured').mockReturnValue(true);
    // Default: fraud checks come back clean
    jest.spyOn(steadfastService, 'checkFraud').mockResolvedValue({ phone: '01711111111', status: 'OK', fraud: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should book shipments for all eligible orders', async () => {
    const orders = [makeOrder(), makeOrder({ _id: 'order-2', orderNumber: 'ORD-1002' })];
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue(orders) });
    jest.spyOn(steadfastService, 'createShipment').mockResolvedValue({
      consignment_id: 131822154,
      invoice: 'ORD-1001',
      tracking_code: '7DB724A65D4',
      status: 'in_review'
    });

    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({ body: { status: 'processing' } }), res);

    expect(Order.find).toHaveBeenCalledWith(expect.objectContaining({
      status: 'processing',
      'tracking.courier': { $ne: 'SteadFast' },
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        booked: 2,
        skipped: 0,
        failed: 0,
        results: expect.arrayContaining([
          expect.objectContaining({
            orderNumber: 'ORD-1001',
            shipment: expect.objectContaining({ consignmentId: 131822154, trackingCode: '7DB724A65D4' })
          })
        ])
      })
    }));

    for (const order of orders) {
      expect(order.tracking.courier).toBe('SteadFast');
      expect(order.markModified).toHaveBeenCalledWith('tracking');
      expect(order.save).toHaveBeenCalled();
    }
  });

  it('should skip orders with incomplete addresses without calling SteadFast', async () => {
    const orders = [
      makeOrder({ _id: 'order-1', orderNumber: 'ORD-1001', deliveryAddress: { name: 'Rahim', phone: '01711111111' } }),
      makeOrder({ _id: 'order-2', orderNumber: 'ORD-1002', deliveryAddress: { name: 'Karim', phone: '01711111112' } }),
    ];
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue(orders) });
    const createShipment = jest.spyOn(steadfastService, 'createShipment').mockResolvedValue({});

    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({}), res);

    expect(createShipment).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ booked: 0, skipped: 2, failed: 0 })
    }));
  });

  it('should skip orders that already have a SteadFast booking', async () => {
    const orders = [
      makeOrder({ _id: 'order-1', orderNumber: 'ORD-1001', tracking: { courier: 'SteadFast', consignmentId: 555 } }),
      makeOrder({ _id: 'order-2', orderNumber: 'ORD-1002' }),
    ];
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue(orders) });
    const createShipment = jest.spyOn(steadfastService, 'createShipment').mockResolvedValue({
      consignment_id: 999,
      invoice: 'ORD-1002',
      tracking_code: 'ABC123',
      status: 'in_review'
    });

    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({}), res);

    expect(createShipment).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        booked: 1,
        skipped: 1,
        results: expect.arrayContaining([
          expect.objectContaining({ orderNumber: 'ORD-1001', skipReason: 'already_booked' })
        ])
      })
    }));
  });

  it('should isolate per-order failures and still book the rest', async () => {
    const orders = [makeOrder(), makeOrder({ _id: 'order-2', orderNumber: 'ORD-1002' })];
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue(orders) });
    const createShipment = jest.spyOn(steadfastService, 'createShipment')
      .mockRejectedValueOnce({ name: 'SteadfastError', message: 'INSUFFICIENT_BALANCE', status: 422 })
      .mockResolvedValueOnce({ consignment_id: 123, invoice: 'ORD-1002', tracking_code: 'XYZ', status: 'in_review' });

    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({}), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        booked: 1,
        failed: 1,
        results: expect.arrayContaining([
          expect.objectContaining({ orderNumber: 'ORD-1001', error: 'INSUFFICIENT_BALANCE' }),
          expect.objectContaining({ orderNumber: 'ORD-1002', shipment: expect.anything() })
        ])
      })
    }));
    expect(createShipment).toHaveBeenCalledTimes(2);
  });

  it('should filter by explicit order ids when provided', async () => {
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue([]) });
    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({ body: { ids: ['order-1', 'order-2'] } }), res);

    expect(Order.find).toHaveBeenCalledWith(expect.objectContaining({
      _id: { $in: ['order-1', 'order-2'] }
    }));
  });

  it('should exclude terminal statuses by default when no status filter is given', async () => {
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue([]) });
    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({}), res);

    expect(Order.find).toHaveBeenCalledWith(expect.objectContaining({
      status: { $nin: ['cancelled', 'delivered', 'refunded'] },
      'tracking.courier': { $ne: 'SteadFast' },
    }));
  });

  it('should return a clean empty summary when no orders are eligible', async () => {
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue([]) });
    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({}), res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ booked: 0, skipped: 0, failed: 0, results: [] })
    }));
  });

  it('should return 503 when SteadFast is not configured', async () => {
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue([makeOrder()]) });
    jest.spyOn(steadfastService, 'isConfigured').mockReturnValue(false);

    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({}), res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should skip COD orders whose phone is fraud-flagged and report the reason', async () => {
    const orders = [
      makeOrder({ _id: 'order-1', orderNumber: 'ORD-1001', paymentStatus: 'pending' }),
      makeOrder({ _id: 'order-2', orderNumber: 'ORD-1002', paymentStatus: 'pending' }),
    ];
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue(orders) });
    jest.spyOn(steadfastService, 'checkFraud')
      .mockResolvedValueOnce({ phone: '01711111111', status: 'Fraud', fraud: 'This number is reported as fraud' })
      .mockResolvedValueOnce({ phone: '01711111111', status: 'OK', fraud: null });
    const createShipment = jest.spyOn(steadfastService, 'createShipment').mockResolvedValue({
      consignment_id: 999,
      invoice: 'ORD-1002',
      tracking_code: 'ABC123',
      status: 'in_review'
    });

    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({}), res);

    expect(createShipment).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        booked: 1,
        skipped: 1,
        fraudFlagged: 1,
        results: expect.arrayContaining([
          expect.objectContaining({
            orderNumber: 'ORD-1001',
            skipReason: 'fraud_flagged',
            fraudReason: 'This number is reported as fraud',
          })
        ])
      })
    }));
  });

  it('should not fraud-check prepaid orders', async () => {
    const orders = [makeOrder({ _id: 'order-1', orderNumber: 'ORD-1001', paymentStatus: 'paid' })];
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue(orders) });
    const checkFraud = jest.spyOn(steadfastService, 'checkFraud');
    jest.spyOn(steadfastService, 'createShipment').mockResolvedValue({ consignment_id: 1, invoice: 'ORD-1001', tracking_code: 'T1', status: 'in_review' });

    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({}), res);

    expect(checkFraud).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ booked: 1 })
    }));
  });

  it('should still book orders when the fraud lookup itself fails (best-effort)', async () => {
    const orders = [makeOrder({ _id: 'order-1', orderNumber: 'ORD-1001', paymentStatus: 'pending' })];
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue(orders) });
    jest.spyOn(steadfastService, 'checkFraud').mockRejectedValue({ name: 'SteadfastError', message: 'timeout' });
    const createShipment = jest.spyOn(steadfastService, 'createShipment').mockResolvedValue({
      consignment_id: 1,
      invoice: 'ORD-1001',
      tracking_code: 'T1',
      status: 'in_review'
    });

    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({}), res);

    expect(createShipment).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ booked: 1, failed: 0 })
    }));
  });

  it('should skip the fraud check entirely when checkFraud is false', async () => {
    const orders = [makeOrder({ _id: 'order-1', orderNumber: 'ORD-1001', paymentStatus: 'pending' })];
    Order.find.mockReturnValue({ limit: jest.fn().mockResolvedValue(orders) });
    const checkFraud = jest.spyOn(steadfastService, 'checkFraud');
    jest.spyOn(steadfastService, 'createShipment').mockResolvedValue({ consignment_id: 1, invoice: 'ORD-1001', tracking_code: 'T1', status: 'in_review' });

    const res = mockRes();
    await bulkShipViaSteadfast(mockReq({ body: { checkFraud: false } }), res);

    expect(checkFraud).not.toHaveBeenCalled();
  });
});

describe('checkSteadfastFraud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(steadfastService, 'isConfigured').mockReturnValue(true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return flagged:true with the reason for a flagged number', async () => {
    jest.spyOn(steadfastService, 'checkFraud').mockResolvedValue({
      phone: '01711111111', status: 'Fraud', fraud: 'This number is reported as fraud'
    });

    const res = mockRes();
    await checkSteadfastFraud(mockReq({ params: { phone: '01711111111' } }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ flagged: true, reason: 'This number is reported as fraud' })
    }));
  });

  it('should return flagged:false for a clean number', async () => {
    jest.spyOn(steadfastService, 'checkFraud').mockResolvedValue({ phone: '01722222222', status: 'OK', fraud: null });

    const res = mockRes();
    await checkSteadfastFraud(mockReq({ params: { phone: '01722222222' } }), res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ flagged: false })
    }));
  });

  it('should return 502 when SteadFast is unreachable', async () => {
    jest.spyOn(steadfastService, 'checkFraud').mockRejectedValue({ name: 'SteadfastError', message: 'timeout', status: 0 });

    const res = mockRes();
    await checkSteadfastFraud(mockReq({ params: { phone: '01711111111' } }), res);

    expect(res.status).toHaveBeenCalledWith(502);
  });
});
