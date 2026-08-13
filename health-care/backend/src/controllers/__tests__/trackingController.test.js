/**
 * SteadFast Webhook Tests
 * Covers: steadfastWebhook — payload extraction, forward-only status
 * advancement, secret verification, and unmatched-payload handling.
 */

jest.mock('../../models/Order');
jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));

const { steadfastWebhook } = require('../trackingController');
const Order = require('../../models/Order');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  headers: {},
  ...overrides,
});

const makeOrder = (overrides = {}) => {
  const order = {
    _id: 'order-1',
    orderNumber: 'ORD-1001',
    status: 'shipped',
    statusTimestamps: { shipped: new Date() },
    tracking: { courier: 'SteadFast', consignmentId: 131822154, trackingNumber: '7DB724A65D4' },
    trackingNumber: '7DB724A65D4',
    deliveredAt: null,
    save: jest.fn().mockResolvedValue(true),
    markModified: jest.fn(),
    ...overrides,
  };
  return order;
};

describe('steadfastWebhook', () => {
  const ORIGINAL_SECRET = process.env.STEADFAST_WEBHOOK_SECRET;

  afterEach(() => {
    jest.clearAllMocks();
    if (ORIGINAL_SECRET === undefined) {
      delete process.env.STEADFAST_WEBHOOK_SECRET;
    } else {
      process.env.STEADFAST_WEBHOOK_SECRET = ORIGINAL_SECRET;
    }
  });

  it('should mark the order delivered when the courier reports delivery', async () => {
    const order = makeOrder();
    Order.findOne.mockResolvedValue(order);

    const res = mockRes();
    await steadfastWebhook(mockReq({ body: { data: { consignment_id: 131822154, delivery_status: 'delivered' } } }), res);

    expect(order.status).toBe('delivered');
    expect(order.deliveredAt).toBeInstanceOf(Date);
    expect(order.statusTimestamps.delivered).toBeInstanceOf(Date);
    expect(order.tracking.steadfastStatus).toBe('delivered');
    expect(order.markModified).toHaveBeenCalledWith('tracking');
    expect(order.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ received: true, orderStatus: 'delivered' })
    }));
  });

  it('should advance to out_for_delivery from shipped', async () => {
    const order = makeOrder();
    Order.findOne.mockResolvedValue(order);

    const res = mockRes();
    await steadfastWebhook(mockReq({ body: { consignment_id: 131822154, delivery_status: 'out_for_delivery' } }), res);

    expect(order.status).toBe('out_for_delivery');
  });

  it('should never move a status backwards', async () => {
    const order = makeOrder({ status: 'delivered', deliveredAt: new Date('2026-01-01') });
    Order.findOne.mockResolvedValue(order);

    const res = mockRes();
    await steadfastWebhook(mockReq({ body: { consignment_id: 131822154, delivery_status: 'in_review' } }), res);

    expect(order.status).toBe('delivered');
    expect(order.deliveredAt.toISOString()).toBe(new Date('2026-01-01').toISOString());
  });

  it('should update tracking status even for unmapped courier statuses', async () => {
    const order = makeOrder();
    Order.findOne.mockResolvedValue(order);

    const res = mockRes();
    await steadfastWebhook(mockReq({ body: { consignment_id: 131822154, delivery_status: 'return_to_company' } }), res);

    expect(order.status).toBe('shipped');
    expect(order.tracking.steadfastStatus).toBe('return_to_company');
  });

  it('should match orders by tracking code when consignment id is missing', async () => {
    const order = makeOrder();
    Order.findOne.mockResolvedValue(order);

    const res = mockRes();
    await steadfastWebhook(mockReq({ body: { tracking_code: '7DB724A65D4', delivery_status: 'delivered' } }), res);

    expect(Order.findOne).toHaveBeenCalledWith({
      $or: expect.arrayContaining([{ trackingNumber: '7DB724A65D4' }])
    });
    expect(order.status).toBe('delivered');
  });

  it('should match orders by invoice number', async () => {
    const order = makeOrder();
    Order.findOne.mockResolvedValue(order);

    const res = mockRes();
    await steadfastWebhook(mockReq({ body: { invoice: 'ORD-1001', delivery_status: 'delivered' } }), res);

    expect(Order.findOne).toHaveBeenCalledWith({
      $or: expect.arrayContaining([{ orderNumber: 'ORD-1001' }])
    });
  });

  it('should return 404 when no order matches', async () => {
    Order.findOne.mockResolvedValue(null);

    const res = mockRes();
    await steadfastWebhook(mockReq({ body: { consignment_id: 999, delivery_status: 'delivered' } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should reject payloads without a status', async () => {
    const res = mockRes();
    await steadfastWebhook(mockReq({ body: { consignment_id: 131822154 } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Order.findOne).not.toHaveBeenCalled();
  });

  it('should require the shared secret when configured', async () => {
    process.env.STEADFAST_WEBHOOK_SECRET = 'super-secret';

    const res = mockRes();
    await steadfastWebhook(mockReq({ body: { consignment_id: 131822154, delivery_status: 'delivered' } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(Order.findOne).not.toHaveBeenCalled();

    const okRes = mockRes();
    const order = makeOrder();
    Order.findOne.mockResolvedValue(order);
    await steadfastWebhook(mockReq({
      headers: { 'x-steadfast-secret': 'super-secret' },
      body: { consignment_id: 131822154, delivery_status: 'delivered' },
    }), okRes);
    expect(okRes.status).toHaveBeenCalledWith(200);
  });
});
