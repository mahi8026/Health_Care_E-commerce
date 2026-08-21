/**
 * Cart Controller Tests
 * Covers: getCart, syncCart, addItem, updateItem, removeItem, clearCart
 */

jest.mock('../../models/Cart');
jest.mock('../../models/Product');
jest.mock('../../services/flashDealPricing', () => ({
  getActiveDealPriceMap: jest.fn().mockResolvedValue(new Map()),
}));
jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));

const {
  getCart,
  syncCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require('../cartController');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const { getActiveDealPriceMap } = require('../../services/flashDealPricing');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Controllers call Product.findById(...).lean(), so the mock must be chainable.
const mockProductFound = product => {
  Product.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(product) });
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  user: { _id: 'user123' },
  ...overrides,
});

// -- getCart -------------------------------------------------------------------
describe('getCart', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates empty cart when none exists', async () => {
    Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const newCart = { items: [], save: jest.fn().mockResolvedValue(true) };
    Cart.create.mockResolvedValue(newCart);
    const req = mockReq();
    const res = mockRes();
    await getCart(req, res);
    expect(Cart.create).toHaveBeenCalledWith({ user: 'user123', items: [] });
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  it('returns existing cart', async () => {
    const fakeCart = {
      items: [{ product: { _id: 'p1', isActive: true }, quantity: 2 }],
      save: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeCart) });
    const req = mockReq();
    const res = mockRes();
    await getCart(req, res);
    expect(res.json.mock.calls[0][0].data).toBe(fakeCart);
  });

  it('filters out inactive products from cart', async () => {
    const fakeCart = {
      items: [
        { product: { _id: 'p1', isActive: true }, quantity: 1 },
        { product: { _id: 'p2', isActive: false }, quantity: 1 },
      ],
      save: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeCart) });
    const req = mockReq();
    const res = mockRes();
    await getCart(req, res);
    expect(fakeCart.save).toHaveBeenCalled();
    expect(fakeCart.items).toHaveLength(1);
  });

  it('returns 500 on database error', async () => {
    Cart.findOne.mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error('DB error')) });
    const req = mockReq();
    const res = mockRes();
    await getCart(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('re-prices cart items to active flash-deal prices', async () => {
    const fakeCart = {
      items: [
        { product: { _id: 'p1', isActive: true, price: 5000, variants: { sizes: [] } }, quantity: 2, price: 5000 },
      ],
      save: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeCart) });
    getActiveDealPriceMap.mockResolvedValue(new Map([['p1', 4000]]));

    const req = mockReq();
    const res = mockRes();
    await getCart(req, res);

    expect(fakeCart.items[0].price).toBe(4000);
    expect(fakeCart.save).toHaveBeenCalled();
  });

  it('reverts to regular price when flash deal expires', async () => {
    const fakeCart = {
      items: [
        { product: { _id: 'p1', isActive: true, price: 5000, variants: { sizes: [] } }, quantity: 2, price: 4000 },
      ],
      save: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeCart) });
    getActiveDealPriceMap.mockResolvedValue(new Map());

    const req = mockReq();
    const res = mockRes();
    await getCart(req, res);

    expect(fakeCart.items[0].price).toBe(5000);
    expect(fakeCart.save).toHaveBeenCalled();
  });
});

// -- syncCart ------------------------------------------------------------------
describe('syncCart', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when items is not an array', async () => {
    const req = mockReq({ body: { items: 'not-an-array' } });
    const res = mockRes();
    await syncCart(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when items is missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await syncCart(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('merges localStorage items with existing cart', async () => {
    const existingCart = {
      items: [{ product: { toString: () => 'p1' }, quantity: 1, price: 1000 }],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(existingCart);
    const activeProduct = { _id: 'p2', isActive: true, price: 2000 };
    mockProductFound(activeProduct);

    const req = mockReq({ body: { items: [{ id: 'p2', quantity: 3 }] } });
    const res = mockRes();
    await syncCart(req, res);

    expect(existingCart.save).toHaveBeenCalled();
    expect(existingCart.items).toHaveLength(2);
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  it('uses higher quantity when item already in cart', async () => {
    const existingCart = {
      items: [{ product: { toString: () => 'p1' }, quantity: 5, price: 1000 }],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(existingCart);
    const activeProduct = { _id: 'p1', isActive: true, price: 1000 };
    mockProductFound(activeProduct);

    const req = mockReq({ body: { items: [{ id: 'p1', quantity: 3 }] } });
    const res = mockRes();
    await syncCart(req, res);

    // Should keep quantity 5 (higher of 5 and 3)
    expect(existingCart.items[0].quantity).toBe(5);
  });

  it('skips inactive products during sync', async () => {
    const existingCart = {
      items: [],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(existingCart);
    mockProductFound({ _id: 'p1', isActive: false, price: 1000 });

    const req = mockReq({ body: { items: [{ id: 'p1', quantity: 1 }] } });
    const res = mockRes();
    await syncCart(req, res);

    expect(existingCart.items).toHaveLength(0);
  });

  it('applies active flash-deal price when syncing new items', async () => {
    const existingCart = {
      items: [],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(existingCart);
    mockProductFound({ _id: 'p2', isActive: true, price: 2000 });
    getActiveDealPriceMap.mockResolvedValue(new Map([['p2', 1500]]));

    const req = mockReq({ body: { items: [{ id: 'p2', quantity: 1 }] } });
    const res = mockRes();
    await syncCart(req, res);

    expect(existingCart.items).toHaveLength(1);
    expect(existingCart.items[0].price).toBe(1500);
  });
});

// -- addItem -------------------------------------------------------------------
describe('addItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when productId missing', async () => {
    const req = mockReq({ body: { quantity: 1 } });
    const res = mockRes();
    await addItem(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when product not found or inactive', async () => {
    mockProductFound(null);
    const req = mockReq({ body: { productId: 'p1', quantity: 1 } });
    const res = mockRes();
    await addItem(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
  });

  it('adds new item to empty cart', async () => {
    const fakeProduct = { _id: 'p1', isActive: true, price: 5000 };
    mockProductFound(fakeProduct);
    const fakeCart = {
      items: [],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(fakeCart);

    const req = mockReq({ body: { productId: 'p1', quantity: 2 } });
    const res = mockRes();
    await addItem(req, res);

    expect(fakeCart.items).toHaveLength(1);
    expect(fakeCart.items[0].quantity).toBe(2);
    expect(fakeCart.items[0].price).toBe(5000);
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  it('increments quantity when item already in cart', async () => {
    const fakeProduct = { _id: 'p1', isActive: true, price: 5000 };
    mockProductFound(fakeProduct);
    const fakeCart = {
      items: [{ product: { toString: () => 'p1' }, quantity: 3, price: 5000 }],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(fakeCart);

    const req = mockReq({ body: { productId: 'p1', quantity: 2 } });
    const res = mockRes();
    await addItem(req, res);

    expect(fakeCart.items[0].quantity).toBe(5); // 3 + 2
  });

  it('creates new cart when none exists', async () => {
    const fakeProduct = { _id: 'p1', isActive: true, price: 5000 };
    mockProductFound(fakeProduct);
    Cart.findOne.mockResolvedValue(null);

    const newCart = {
      items: [],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    // Mock Cart constructor
    Cart.mockImplementation(() => newCart);

    const req = mockReq({ body: { productId: 'p1', quantity: 1 } });
    const res = mockRes();
    await addItem(req, res);

    expect(newCart.save).toHaveBeenCalled();
  });

  it('applies active flash-deal price instead of regular price', async () => {
    const fakeProduct = { _id: 'p1', isActive: true, price: 5000 };
    mockProductFound(fakeProduct);
    const fakeCart = {
      items: [],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(fakeCart);
    getActiveDealPriceMap.mockResolvedValue(new Map([['p1', 4000]]));

    const req = mockReq({ body: { productId: 'p1', quantity: 1 } });
    const res = mockRes();
    await addItem(req, res);

    expect(fakeCart.items[0].price).toBe(4000);
  });

  it('uses server-side size adjustment with deal price for sized products', async () => {
    const fakeProduct = {
      _id: 'p1',
      isActive: true,
      price: 5000,
      variants: { sizes: [{ name: 'Large', priceAdjustment: 200, stock: 10, isAvailable: true }] },
    };
    mockProductFound(fakeProduct);
    const fakeCart = {
      items: [],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(fakeCart);
    getActiveDealPriceMap.mockResolvedValue(new Map([['p1', 4000]]));

    const req = mockReq({ body: { productId: 'p1', quantity: 1, selectedSize: { name: 'Large' } } });
    const res = mockRes();
    await addItem(req, res);

    expect(fakeCart.items[0].price).toBe(4200); // 4000 deal + 200 size
  });
});

// -- updateItem ----------------------------------------------------------------
describe('updateItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when quantity is less than 1', async () => {
    const req = mockReq({ body: { quantity: 0 }, params: { productId: 'p1' } });
    const res = mockRes();
    await updateItem(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when cart not found', async () => {
    Cart.findOne.mockResolvedValue(null);
    const req = mockReq({ body: { quantity: 2 }, params: { productId: 'p1' } });
    const res = mockRes();
    await updateItem(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when item not in cart', async () => {
    const fakeCart = { items: [{ product: { toString: () => 'p2' }, quantity: 1 }] };
    Cart.findOne.mockResolvedValue(fakeCart);
    const req = mockReq({ body: { quantity: 2 }, params: { productId: 'p1' } });
    const res = mockRes();
    await updateItem(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates quantity and returns 200', async () => {
    const fakeCart = {
      items: [{ product: { toString: () => 'p1' }, quantity: 1 }],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(fakeCart);
    const req = mockReq({ body: { quantity: 5 }, params: { productId: 'p1' } });
    const res = mockRes();
    await updateItem(req, res);
    expect(fakeCart.items[0].quantity).toBe(5);
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });
});

// -- removeItem ----------------------------------------------------------------
describe('removeItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when cart not found', async () => {
    Cart.findOne.mockResolvedValue(null);
    const req = mockReq({ params: { productId: 'p1' } });
    const res = mockRes();
    await removeItem(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('removes item from cart', async () => {
    const fakeCart = {
      items: [
        { product: { toString: () => 'p1' }, quantity: 1 },
        { product: { toString: () => 'p2' }, quantity: 2 },
      ],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(fakeCart);
    const req = mockReq({ params: { productId: 'p1' } });
    const res = mockRes();
    await removeItem(req, res);
    expect(fakeCart.items).toHaveLength(1);
    expect(fakeCart.items[0].product.toString()).toBe('p2');
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });
});

// -- clearCart -----------------------------------------------------------------
describe('clearCart', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns success when cart already empty', async () => {
    Cart.findOne.mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await clearCart(req, res);
    expect(res.json.mock.calls[0][0].success).toBe(true);
    expect(res.json.mock.calls[0][0].message).toMatch(/already empty/i);
  });

  it('clears all items from cart', async () => {
    const fakeCart = {
      items: [{ product: 'p1', quantity: 2 }],
      save: jest.fn().mockResolvedValue(true),
    };
    Cart.findOne.mockResolvedValue(fakeCart);
    const req = mockReq();
    const res = mockRes();
    await clearCart(req, res);
    expect(fakeCart.items).toHaveLength(0);
    expect(fakeCart.save).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].message).toMatch(/cleared/i);
  });

  it('returns 500 on database error', async () => {
    Cart.findOne.mockRejectedValue(new Error('DB error'));
    const req = mockReq();
    const res = mockRes();
    await clearCart(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
