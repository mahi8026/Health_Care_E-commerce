/**
 * Guest Cart Recovery Tests
 *
 * Covers POST /api/cart/track (public guest snapshot + checkout email, which is
 * what makes guest carts recoverable at all) and GET /api/cart/recovery-optout.
 */

jest.mock('../../models/Cart');
jest.mock('../../models/Product');
jest.mock('../../services/flashDealPricing', () => ({
  getActiveDealPriceMap: jest.fn().mockResolvedValue(new Map()),
  getActiveDealEntries: jest.fn().mockResolvedValue(new Map()),
}));
jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));

const { trackGuestCart, recoveryOptOut } = require('../cartController');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const { getActiveDealPriceMap } = require('../../services/flashDealPricing');

const P1 = '507f1f77bcf86cd799439011';
const P2 = '507f1f77bcf86cd799439022';
const SESSION = 'guestsession1234';
const EMAIL = 'guest@example.com';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  ...overrides,
});

// Product.find(...).select(...).lean()
const mockProducts = (products) => {
  Product.find.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(products),
  });
};

// `new Cart({...})` must yield an object whose save() we can assert on.
const mockNewCart = () => {
  const instance = { items: [], save: jest.fn().mockResolvedValue(true) };
  Cart.mockImplementation(() => instance);
  return instance;
};

describe('trackGuestCart — guest cart recovery capture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveDealPriceMap.mockResolvedValue(new Map());
  });

  it('rejects a malformed sessionId without touching the DB', async () => {
    const req = mockReq({ body: { sessionId: 'bad id!', email: EMAIL, items: [] } });
    const res = mockRes();

    await trackGuestCart(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Cart.findOne).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    const req = mockReq({ body: { sessionId: SESSION, email: 'not-an-email', items: [] } });
    const res = mockRes();

    await trackGuestCart(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Cart.findOne).not.toHaveBeenCalled();
  });

  it('creates a guest cart, stores the email and re-prices items from the DB', async () => {
    Cart.findOne.mockResolvedValue(null);
    const instance = mockNewCart();
    mockProducts([{ _id: P1, price: 900, variants: {} }]);

    const req = mockReq({
      body: {
        sessionId: SESSION,
        email: '  Guest@Example.COM  ',
        // Client claims ৳1 — must be ignored in favour of the DB price.
        items: [{ id: P1, quantity: 2, price: 1 }],
      },
    });
    const res = mockRes();

    await trackGuestCart(req, res);

    // Guests are keyed by sessionId only — never a user's cart.
    expect(Cart.findOne).toHaveBeenCalledWith({ sessionId: SESSION, user: null });
    expect(instance.items).toHaveLength(1);
    expect(instance.items[0].price).toBe(900);
    expect(instance.items[0].quantity).toBe(2);
    expect(instance.items[0].product).toBe(P1);
    expect(instance.contactEmail).toBe('guest@example.com'); // trimmed + lowercased
    expect(instance.lastActivity).toBeInstanceOf(Date);
    expect(instance.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
it('skips products that are deleted or inactive', async () => {
    Cart.findOne.mockResolvedValue(null);
    const instance = mockNewCart();
    mockProducts([]); // nothing active matched

    const req = mockReq({
      body: { sessionId: SESSION, email: EMAIL, items: [{ id: P1, quantity: 1 }] },
    });
    const res = mockRes();

    await trackGuestCart(req, res);

    expect(instance.items).toEqual([]);
    expect(instance.save).toHaveBeenCalled();
  });

  it('drops a stale size the product does not offer, and prices a valid one', async () => {
    Cart.findOne.mockResolvedValue(null);
    const instance = mockNewCart();
    mockProducts([
      { _id: P1, price: 500, variants: { sizes: [{ name: 'Medium', priceAdjustment: 50 }] } },
    ]);

    const req = mockReq({
      body: {
        sessionId: SESSION,
        email: EMAIL,
        items: [
          { id: P1, quantity: 1, selectedSize: { name: 'Gigantic' } },
          { id: P1, quantity: 1, selectedSize: { name: 'Medium' } },
        ],
      },
    });
    const res = mockRes();

    await trackGuestCart(req, res);

    expect(instance.items).toHaveLength(1); // the invalid size was dropped
    expect(instance.items[0].price).toBe(550); // 500 + 50 size adjustment
    expect(instance.items[0].selectedSize).toEqual({ name: 'Medium', priceAdjustment: 50 });
  });

  it('updates the existing guest cart instead of creating a second one', async () => {
    const existing = {
      _id: 'cart1',
      items: [{ product: P2, quantity: 5, price: 100 }],
      save: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(existing);
    mockProducts([{ _id: P1, price: 700, variants: {} }]);

    const req = mockReq({
      body: { sessionId: SESSION, email: EMAIL, items: [{ id: P1, quantity: 1 }] },
    });
    const res = mockRes();

    await trackGuestCart(req, res);

    expect(Cart).not.toHaveBeenCalled(); // reused, not recreated
    expect(existing.items).toHaveLength(1);
    expect(existing.items[0].product).toBe(P1);
    expect(existing.contactEmail).toBe(EMAIL);
  });

  it('does not clear the email when tracking without one', async () => {
    const existing = { items: [], contactEmail: EMAIL, save: jest.fn().mockResolvedValue(true) };
    Cart.findOne.mockResolvedValue(existing);
    mockProducts([]);

    const req = mockReq({ body: { sessionId: SESSION, items: [] } });
    const res = mockRes();

    await trackGuestCart(req, res);
    expect(existing.contactEmail).toBe(EMAIL);
  });
});

describe('recoveryOptOut — unsubscribe link target', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks the cart as opted out for a valid token', async () => {
    const cart = {
      recoveryOptOut: false,
      recoveryEmailSent: false,
      save: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(cart);

    const req = mockReq({ query: { token: 'tok-123' } });
    const res = mockRes();

    await recoveryOptOut(req, res);

    expect(Cart.findOne).toHaveBeenCalledWith({ recoveryOptOutToken: 'tok-123' });
    expect(cart.recoveryOptOut).toBe(true);
    expect(cart.recoveryEmailSent).toBe(true); // ensures the sweep skips it
    expect(cart.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
  });

  it('returns 400 for a missing token and 404 for an unknown one', async () => {
    const res400 = mockRes();
    await recoveryOptOut(mockReq({ query: {} }), res400);
    expect(res400.status).toHaveBeenCalledWith(400);

    Cart.findOne.mockResolvedValue(null);
    const res404 = mockRes();
    await recoveryOptOut(mockReq({ query: { token: 'nope' } }), res404);
    expect(res404.status).toHaveBeenCalledWith(404);
  });
});

// The first track call for a brand-new sessionId is a find-then-create, which
// two concurrent calls can race. The unique index on sessionId rejects the loser
// with E11000; the loser must apply its snapshot to the winner's cart instead of
// failing the request or leaving a duplicate guest cart behind.
describe('trackGuestCart — concurrent first-track race', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveDealPriceMap.mockResolvedValue(new Map());
  });

  it('re-applies the snapshot to the winning cart on E11000', async () => {
    Cart.findOne
      .mockResolvedValueOnce(null) // we saw no cart, so we created one...
      .mockResolvedValueOnce({ items: [], save: jest.fn().mockResolvedValue(true) }); // ...and lost

    const duplicate = Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
    Cart.mockImplementation(() => ({ items: [], save: jest.fn().mockRejectedValue(duplicate) }));
    mockProducts([{ _id: P1, price: 900, variants: {} }]);

    const req = mockReq({
      body: { sessionId: SESSION, email: EMAIL, items: [{ id: P1, quantity: 2 }] },
    });
    const res = mockRes();

    await trackGuestCart(req, res);

    const winner = await Cart.findOne.mock.results[1].value;
    expect(winner.items).toHaveLength(1);
    expect(winner.items[0].price).toBe(900);
    expect(winner.contactEmail).toBe(EMAIL);
    expect(winner.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('surfaces a non-duplicate save failure as a 500', async () => {
    Cart.findOne.mockResolvedValue(null);
    Cart.mockImplementation(() => ({
      items: [],
      save: jest.fn().mockRejectedValue(new Error('connection lost')),
    }));
    mockProducts([]);

    const req = mockReq({ body: { sessionId: SESSION, email: EMAIL, items: [] } });
    const res = mockRes();

    await trackGuestCart(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('does not retry a duplicate error on an existing cart', async () => {
    // An already-loaded cart can only collide if two requests updated the same
    // document, which is not the race this handles — so it must not be swallowed.
    const duplicate = Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
    Cart.findOne.mockResolvedValue({ items: [], save: jest.fn().mockRejectedValue(duplicate) });
    mockProducts([]);

    const req = mockReq({ body: { sessionId: SESSION, items: [] } });
    const res = mockRes();

    await trackGuestCart(req, res);

    expect(Cart.findOne).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
