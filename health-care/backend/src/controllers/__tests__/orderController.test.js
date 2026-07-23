/**
 * Order Controller Tests
 * Covers: getOrders, getOrder, updateOrderStatus, cancelOrder,
 *         trackOrder, addOrderNote
 * Note: createOrder uses MongoDB transactions which require a real replica set;
 *       it is tested via input validation only.
 */

jest.mock('../../models/Order');
jest.mock('../../models/Product');
jest.mock('../../models/User');
jest.mock('../../services/cacheService', () => jest.fn().mockImplementation(() => ({ invalidateAnalytics: jest.fn() })));
jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));
jest.mock('../../utils/activityLogger', () => ({
  logActivityAsync: jest.fn(),
  ACTIONS: {
    ORDER: { PLACED: 'order.placed', STATUS_CHANGED: 'order.status_changed', CANCELLED: 'order.cancelled' },
  },
}));
jest.mock('../../config/constants', () => ({
  DELIVERY_FEES: { standard: 100, express: 200 },
  PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX_LIMIT: 100 },
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

const {
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  trackOrder,
  addOrderNote,
  createOrder,
} = require('../orderController');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
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
  query: {},
  user: { id: 'user123', role: 'customer' },
  ip: '127.0.0.1',
  headers: {},
  ...overrides,
});

// ── createOrder — input validation only ──────────────────────────────────────
describe('createOrder - input validation', () => {
  it('returns 400 when items array is empty', async () => {
    const req = mockReq({ body: { items: [] } });
    const res = mockRes();
    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/at least one item/i);
  });

  it('returns 400 when items is missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── getOrders ─────────────────────────────────────────────────────────────────
describe('getOrders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated orders for regular user (own orders only)', async () => {
    const fakeOrders = [{ _id: 'o1', orderNumber: 'ORD-001' }];
    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(fakeOrders),
    };
    Order.find.mockReturnValue(mockChain);
    Order.countDocuments.mockResolvedValue(1);

    const req = mockReq({ query: { page: '1', limit: '20' } });
    const res = mockRes();
    await getOrders(req, res);

    expect(Order.find).toHaveBeenCalledWith({ user: 'user123' });
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.orders).toEqual(fakeOrders);
    expect(body.total).toBe(1);
  });

  it('returns all orders for admin', async () => {
    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    Order.find.mockReturnValue(mockChain);
    Order.countDocuments.mockResolvedValue(0);

    const req = mockReq({ user: { id: 'admin1', role: 'admin' }, query: {} });
    const res = mockRes();
    await getOrders(req, res);

    expect(Order.find).toHaveBeenCalledWith({});
  });

  it('clamps page to minimum 1', async () => {
    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    Order.find.mockReturnValue(mockChain);
    Order.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: { page: '-5' } });
    const res = mockRes();
    await getOrders(req, res);
    expect(res.json.mock.calls[0][0].page).toBe(1);
  });
});

// ── getOrder ──────────────────────────────────────────────────────────────────
describe('getOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when order not found', async () => {
    const mockChain = {
      populate: jest.fn().mockReturnThis(),
    };
    // Last populate resolves to null
    mockChain.populate.mockReturnValueOnce(mockChain).mockReturnValueOnce(mockChain).mockResolvedValueOnce(null);
    Order.findById.mockReturnValue(mockChain);

    const req = mockReq({ params: { id: 'nonexistent' } });
    const res = mockRes();
    await getOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when user tries to access another user order', async () => {
    const fakeOrder = {
      _id: 'order123',
      user: { _id: { toString: () => 'otheruser' } },
    };
    const mockChain = { populate: jest.fn().mockReturnThis() };
    mockChain.populate
      .mockReturnValueOnce(mockChain)
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce(fakeOrder);
    Order.findById.mockReturnValue(mockChain);

    const req = mockReq({ params: { id: 'order123' }, user: { id: 'user123', role: 'customer' } });
    const res = mockRes();
    await getOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 200 when user accesses own order', async () => {
    const fakeOrder = {
      _id: 'order123',
      user: { _id: { toString: () => 'user123' } },
    };
    const mockChain = { populate: jest.fn().mockReturnThis() };
    mockChain.populate
      .mockReturnValueOnce(mockChain)
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce(fakeOrder);
    Order.findById.mockReturnValue(mockChain);

    const req = mockReq({ params: { id: 'order123' } });
    const res = mockRes();
    await getOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── updateOrderStatus ─────────────────────────────────────────────────────────
describe('updateOrderStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when status is missing', async () => {
    const req = mockReq({ body: {}, params: { id: 'order123' } });
    const res = mockRes();
    await updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/status is required/i);
  });

  it('returns 400 when status is invalid', async () => {
    const req = mockReq({ body: { status: 'flying' }, params: { id: 'order123' } });
    const res = mockRes();
    await updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/invalid status/i);
  });

  it('returns 404 when order not found', async () => {
    Order.findById.mockResolvedValue(null);
    const req = mockReq({ body: { status: 'confirmed' }, params: { id: 'nonexistent' } });
    const res = mockRes();
    await updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates status and returns 200', async () => {
    const fakeOrder = {
      _id: 'order123',
      orderNumber: 'ORD-001',
      status: 'placed',
      statusTimestamps: {},
      tracking: {},
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
      user: null,
    };
    Order.findById.mockResolvedValue(fakeOrder);

    const req = mockReq({ body: { status: 'confirmed' }, params: { id: 'order123' }, user: { id: 'admin1', role: 'admin' } });
    const res = mockRes();
    await updateOrderStatus(req, res);

    expect(fakeOrder.status).toBe('confirmed');
    expect(fakeOrder.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('sets deliveredAt when status is delivered', async () => {
    const fakeOrder = {
      _id: 'order123',
      orderNumber: 'ORD-001',
      status: 'shipped',
      statusTimestamps: {},
      tracking: {},
      deliveredAt: null,
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
      user: null,
    };
    Order.findById.mockResolvedValue(fakeOrder);

    const req = mockReq({ body: { status: 'delivered' }, params: { id: 'order123' }, user: { id: 'admin1', role: 'admin' } });
    const res = mockRes();
    await updateOrderStatus(req, res);

    expect(fakeOrder.deliveredAt).toBeInstanceOf(Date);
  });
});

// ── cancelOrder ───────────────────────────────────────────────────────────────
describe('cancelOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when order not found', async () => {
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const req = mockReq({ params: { id: 'nonexistent' } });
    const res = mockRes();
    await cancelOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when user tries to cancel another user order', async () => {
    const fakeOrder = {
      user: { _id: { toString: () => 'otheruser' } },
      status: 'placed',
    };
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeOrder) });
    const req = mockReq({ params: { id: 'order123' }, user: { id: 'user123', role: 'customer' } });
    const res = mockRes();
    await cancelOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 400 when order cannot be cancelled (already shipped)', async () => {
    const fakeOrder = {
      user: { _id: { toString: () => 'user123' } },
      status: 'shipped',
      items: [],
    };
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeOrder) });
    const req = mockReq({ params: { id: 'order123' } });
    const res = mockRes();
    await cancelOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/cannot cancel/i);
  });

  it('cancels order and restores stock', async () => {
    const fakeOrder = {
      _id: 'order123',
      orderNumber: 'ORD-001',
      user: { _id: { toString: () => 'user123' } },
      status: 'placed',
      paymentMethod: 'bkash',
      paymentStatus: 'pending',
      items: [{ product: 'prod1', qty: 2 }],
      statusTimestamps: {},
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeOrder) });
    Product.findByIdAndUpdate.mockResolvedValue(true);

    const req = mockReq({ params: { id: 'order123' } });
    const res = mockRes();
    await cancelOrder(req, res);

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod1', { $inc: { stock: 2 } });
    expect(fakeOrder.status).toBe('cancelled');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rolls back B2B credit when b2b_credit payment was paid', async () => {
    const fakeOrder = {
      _id: 'order123',
      orderNumber: 'ORD-001',
      user: { _id: 'user123', toString: () => 'user123' },
      status: 'confirmed',
      paymentMethod: 'b2b_credit',
      paymentStatus: 'paid',
      totalAmount: 5000,
      items: [],
      statusTimestamps: {},
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
    };
    // Make user._id.toString() work
    fakeOrder.user._id = { toString: () => 'user123' };
    Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeOrder) });
    User.findByIdAndUpdate.mockResolvedValue(true);

    const req = mockReq({ params: { id: 'order123' } });
    const res = mockRes();
    await cancelOrder(req, res);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      fakeOrder.user._id,
      { $inc: { creditUsed: -5000 } }
    );
  });
});

// ── trackOrder ────────────────────────────────────────────────────────────────
describe('trackOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when order not found', async () => {
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    };
    Order.findOne.mockReturnValue(mockChain);
    const req = mockReq({ params: { orderNumber: 'ORD-NOTFOUND' } });
    const res = mockRes();
    await trackOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns order tracking info for valid order number', async () => {
    const fakeOrder = { orderNumber: 'ORD-001', status: 'shipped' };
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(fakeOrder),
    };
    Order.findOne.mockReturnValue(mockChain);
    const req = mockReq({ params: { orderNumber: 'ORD-001' } });
    const res = mockRes();
    await trackOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.order.orderNumber).toBe('ORD-001');
  });
});

// ── addOrderNote ──────────────────────────────────────────────────────────────
describe('addOrderNote', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when note is empty', async () => {
    const req = mockReq({ body: { note: '   ' }, params: { id: 'order123' } });
    const res = mockRes();
    await addOrderNote(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when order not found', async () => {
    Order.findById.mockResolvedValue(null);
    const req = mockReq({ body: { note: 'Test note' }, params: { id: 'nonexistent' } });
    const res = mockRes();
    await addOrderNote(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('adds note and returns 200', async () => {
    const fakeOrder = {
      _id: 'order123',
      notesHistory: [],
      notes: null,
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Order.findById.mockResolvedValue(fakeOrder);
    const req = mockReq({ body: { note: 'Urgent delivery' }, params: { id: 'order123' } });
    const res = mockRes();
    await addOrderNote(req, res);
    expect(fakeOrder.notesHistory).toHaveLength(1);
    expect(fakeOrder.notesHistory[0].note).toBe('Urgent delivery');
    expect(fakeOrder.notes).toBe('Urgent delivery');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
