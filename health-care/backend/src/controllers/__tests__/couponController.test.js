const couponController = require('../couponController');

jest.mock('../../models/Coupon');
jest.mock('../../models/Order');
jest.mock('../../utils/activityLogger', () => ({
  logActivityAsync: jest.fn(),
  ACTIONS: {},
}));

const { validateCoupon } = couponController;
const Coupon = require('../../models/Coupon');
const Order = require('../../models/Order');

const USER_ID = '507f1f77bcf86cd799439011';

const baseCoupon = (overrides = {}) => ({
  code: 'SAVE10',
  isActive: true,
  type: 'percentage',
  value: 10,
  startDate: new Date('2020-01-01'),
  endDate: new Date('2099-01-01'),
  usageLimit: 0,
  usageCount: 0,
  minimumOrderAmount: 0,
  isFirstOrderOnly: false,
  applicableUserRoles: [],
  applicableProducts: [],
  applicableCategories: [],
  hasBeenUsedBy: jest.fn().mockReturnValue(false),
  ...overrides,
});

const mockReq = (props = {}) => ({ body: {}, params: {}, ...props });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validateCoupon — guest checkout fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Order.countDocuments.mockResolvedValue(0);
  });

  it('validates a coupon for a GUEST (no req.user) — the sales-blocking bug', async () => {
    // No req.user at all: optionalAuth ran and found no token.
    Coupon.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(baseCoupon()),
    });

    const req = mockReq({
      body: { code: 'SAVE10', cartTotal: 1500, cartItems: [{ productId: 'p1', categoryId: 'c1' }] },
    });
    const res = mockRes();
    await validateCoupon(req, res);

    expect(Coupon.findOne).toHaveBeenCalledWith({ code: 'SAVE10' });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ valid: true }) })
    );
  });

  it('does NOT throw for a guest on a first-order-only coupon — treated as eligible', async () => {
    const coupon = baseCoupon({ isFirstOrderOnly: true });
    Coupon.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(coupon),
    });

    const req = mockReq({
      body: { code: 'FIRST1', cartTotal: 1500, cartItems: [{ productId: 'p1' }] },
    });
    const res = mockRes();
    await expect(validateCoupon(req, res)).resolves.not.toThrow();

    // Per-user rule skipped entirely — no per-user usage query made.
    expect(Order.countDocuments).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ valid: true }) })
    );
  });

  it('rejects a role-restricted coupon for guests (no role to match)', async () => {
    const coupon = baseCoupon({ applicableUserRoles: ['b2b'] });
    Coupon.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(coupon),
    });

    const req = mockReq({
      body: { code: 'B2B10', cartTotal: 1500, cartItems: [{ productId: 'p1' }] },
    });
    const res = mockRes();
    await validateCoupon(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ valid: false }) })
    );
  });

  it('still enforces per-user usage for signed-in callers', async () => {
    const coupon = baseCoupon();
    coupon.hasBeenUsedBy = jest.fn().mockReturnValue(true);
    Coupon.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(coupon),
    });

    const req = mockReq({
      body: { code: 'SAVE10', cartTotal: 1500, cartItems: [{ productId: 'p1' }] },
      user: { id: USER_ID, role: 'customer' },
    });
    const res = mockRes();
    await validateCoupon(req, res);

    expect(coupon.hasBeenUsedBy).toHaveBeenCalledWith(USER_ID);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ valid: false }) })
    );
  });

  it('returns valid:false (not 401/500) for an unknown code from a guest', async () => {
    Coupon.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = mockReq({
      body: { code: 'NOPE', cartTotal: 1500, cartItems: [{ productId: 'p1' }] },
    });
    const res = mockRes();
    await validateCoupon(req, res);

    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ valid: false }) })
    );
  });

  it('rejects malformed requests with 400 before any model call', async () => {
    const req = mockReq({ body: { code: 'SAVE10' } }); // missing cartTotal/cartItems
    const res = mockRes();
    await validateCoupon(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Coupon.findOne).not.toHaveBeenCalled();
  });
});
