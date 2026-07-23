/**
 * Product Controller Tests
 * Covers: getProducts, getProduct, createProduct, updateProduct,
 *         deleteProduct, getFeaturedProducts, generateSku
 */

jest.mock('../../models/Product');
jest.mock('../../models/Category');
jest.mock('../../models/Manufacturer');
jest.mock('../../services/cacheService', () => jest.fn().mockImplementation(() => ({})));
jest.mock('../../services/cacheInvalidation', () => ({
  invalidateProductCache: jest.fn(),
  invalidateProductListCache: jest.fn(),
}));
jest.mock('../../middleware/cache', () => ({ invalidateCache: jest.fn().mockResolvedValue(true) }));
jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));
jest.mock('../../utils/activityLogger', () => ({
  logActivityAsync: jest.fn(),
  ACTIONS: {
    PRODUCT: { CREATED: 'product.created', UPDATED: 'product.updated', DELETED: 'product.deleted' },
  },
}));
jest.mock('../../config/constants', () => ({
  PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX_LIMIT: 100 },
}));

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  generateSku,
} = require('../productController');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Manufacturer = require('../../models/Manufacturer');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: null,
  ip: '127.0.0.1',
  headers: {},
  ...overrides,
});

// ── getProducts ───────────────────────────────────────────────────────────────
describe('getProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  const buildProductChain = (products = [], total = 0) => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(products),
    };
    Product.find.mockReturnValue(chain);
    Product.countDocuments.mockResolvedValue(total);
    return chain;
  };

  it('returns active products for public users', async () => {
    buildProductChain([{ _id: 'p1', name: 'ECG Machine', isActive: true }], 1);
    const req = mockReq({ query: {} });
    const res = mockRes();
    await getProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  it('returns empty result when category not found', async () => {
    Category.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const req = mockReq({ query: { category: 'NonExistentCategory' } });
    const res = mockRes();
    await getProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].products).toEqual([]);
    expect(res.json.mock.calls[0][0].total).toBe(0);
  });

  it('applies price range filter', async () => {
    buildProductChain([], 0);
    const req = mockReq({ query: { minPrice: '1000', maxPrice: '5000' } });
    const res = mockRes();
    await getProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith(
      expect.objectContaining({ price: { $gte: 1000, $lte: 5000 } })
    );
  });

  it('applies inStock filter', async () => {
    buildProductChain([], 0);
    const req = mockReq({ query: { inStock: 'true' } });
    const res = mockRes();
    await getProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith(
      expect.objectContaining({ stock: { $gt: 0 } })
    );
  });

  it('applies search filter with $or query', async () => {
    buildProductChain([], 0);
    const req = mockReq({ query: { search: 'ECG' } });
    const res = mockRes();
    await getProducts(req, res);
    const callArg = Product.find.mock.calls[0][0];
    expect(callArg.$or).toBeDefined();
    expect(callArg.$or.length).toBeGreaterThan(0);
  });

  it('applies isFeatured filter', async () => {
    buildProductChain([], 0);
    const req = mockReq({ query: { isFeatured: 'true' } });
    const res = mockRes();
    await getProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith(
      expect.objectContaining({ isFeatured: true })
    );
  });

  it('returns 500 on database error', async () => {
    Product.find.mockImplementation(() => { throw new Error('DB error'); });
    const req = mockReq({ query: {} });
    const res = mockRes();
    await getProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── getProduct ────────────────────────────────────────────────────────────────
describe('getProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  const buildFindOneChain = (result) => {
    // getProduct calls .populate().populate().lean()
    const chain = {
      populate: jest.fn(),
      lean: jest.fn().mockResolvedValue(result),
    };
    chain.populate.mockReturnValue(chain);
    Product.findOne.mockReturnValue(chain);
  };

  it('returns 404 when product not found', async () => {
    buildFindOneChain(null);
    const req = mockReq({ params: { id: 'nonexistent-slug' } });
    const res = mockRes();
    await getProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns product by slug', async () => {
    const fakeProduct = { _id: 'p1', name: 'ECG Machine', slug: 'ecg-machine' };
    buildFindOneChain(fakeProduct);
    const req = mockReq({ params: { id: 'ecg-machine' } });
    const res = mockRes();
    await getProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].product.name).toBe('ECG Machine');
  });

  it('returns shouldRedirect when accessed by MongoDB ObjectId', async () => {
    const fakeProduct = { _id: '507f1f77bcf86cd799439011', name: 'ECG Machine', slug: 'ecg-machine' };
    buildFindOneChain(fakeProduct);
    const req = mockReq({ params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockRes();
    await getProduct(req, res);
    expect(res.json.mock.calls[0][0].shouldRedirect).toBe(true);
    expect(res.json.mock.calls[0][0].slugUrl).toBe('ecg-machine');
  });
});

// ── createProduct ─────────────────────────────────────────────────────────────
describe('createProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when price is invalid', async () => {
    const req = mockReq({ body: { price: 'not-a-number' }, user: { id: 'admin1', role: 'admin' } });
    const res = mockRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/invalid price/i);
  });

  it('returns 400 when stock is invalid', async () => {
    const req = mockReq({ body: { stock: 'abc' }, user: { id: 'admin1', role: 'admin' } });
    const res = mockRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates product and returns 201', async () => {
    const fakeProduct = { _id: 'p1', name: 'New Product', price: 5000, sku: 'MC-DX-SIE-0001' };
    Product.create.mockResolvedValue(fakeProduct);
    const req = mockReq({ body: { name: 'New Product', price: 5000 }, user: { id: 'admin1', role: 'admin' } });
    const res = mockRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].product.name).toBe('New Product');
  });

  it('returns 500 on database error', async () => {
    Product.create.mockRejectedValue(new Error('DB error'));
    const req = mockReq({ body: { name: 'Product', price: 1000 }, user: { id: 'admin1', role: 'admin' } });
    const res = mockRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── updateProduct ─────────────────────────────────────────────────────────────
describe('updateProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when product not found', async () => {
    Product.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const req = mockReq({ body: { name: 'Updated' }, params: { id: 'nonexistent' }, user: { id: 'admin1' } });
    const res = mockRes();
    await updateProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when price is invalid', async () => {
    Product.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'p1' }) });
    const req = mockReq({ body: { price: 'bad' }, params: { id: 'p1' }, user: { id: 'admin1' } });
    const res = mockRes();
    await updateProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updates product and returns 200', async () => {
    Product.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'p1', name: 'Old', price: 1000 }) });
    const fakeUpdated = { _id: 'p1', name: 'Updated', price: 2000, sku: 'MC-DX-SIE-0001' };
    Product.findByIdAndUpdate.mockResolvedValue(fakeUpdated);
    const req = mockReq({ body: { name: 'Updated', price: 2000 }, params: { id: 'p1' }, user: { id: 'admin1' } });
    const res = mockRes();
    await updateProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].product.name).toBe('Updated');
  });
});

// ── deleteProduct ─────────────────────────────────────────────────────────────
describe('deleteProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when product not found', async () => {
    Product.findByIdAndDelete.mockResolvedValue(null);
    const req = mockReq({ params: { id: 'nonexistent' }, user: { id: 'admin1' } });
    const res = mockRes();
    await deleteProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deletes product and returns 200', async () => {
    const fakeProduct = { _id: 'p1', name: 'Old Product', sku: 'MC-DX-SIE-0001', price: 1000 };
    Product.findByIdAndDelete.mockResolvedValue(fakeProduct);
    const req = mockReq({ params: { id: 'p1' }, user: { id: 'admin1' } });
    const res = mockRes();
    await deleteProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].message).toMatch(/deleted/i);
  });
});

// ── getFeaturedProducts ───────────────────────────────────────────────────────
describe('getFeaturedProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns featured products', async () => {
    const fakeProducts = [{ _id: 'p1', name: 'Featured', isFeatured: true }];
    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(fakeProducts),
    };
    Product.find.mockReturnValue(chain);
    const req = mockReq();
    const res = mockRes();
    await getFeaturedProducts(req, res);
    expect(Product.find).toHaveBeenCalledWith({ isFeatured: true, isActive: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].products).toEqual(fakeProducts);
  });
});

// ── generateSku ───────────────────────────────────────────────────────────────
describe('generateSku', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when categoryId or brandId missing', async () => {
    const req = mockReq({ query: { categoryId: 'cat1' } }); // missing brandId
    const res = mockRes();
    await generateSku(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when category not found', async () => {
    Category.findById.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) });
    Manufacturer.findById.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ name: 'Siemens' }) });
    const req = mockReq({ query: { categoryId: 'cat1', brandId: 'brand1' } });
    const res = mockRes();
    await generateSku(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('generates SKU with correct format', async () => {
    Category.findById.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ name: 'Diagnostic Equipment' }) });
    Manufacturer.findById.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ name: 'Siemens' }) });
    Product.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    const req = mockReq({ query: { categoryId: 'cat1', brandId: 'brand1' } });
    const res = mockRes();
    await generateSku(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.sku).toMatch(/^MC-DX-SIE-\d{4}$/);
    expect(body.sequence).toBe(1);
  });

  it('increments sequence when SKUs already exist', async () => {
    Category.findById.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ name: 'Diagnostic Equipment' }) });
    Manufacturer.findById.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ name: 'Siemens' }) });
    Product.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ sku: 'MC-DX-SIE-0003' }, { sku: 'MC-DX-SIE-0001' }]) });
    const req = mockReq({ query: { categoryId: 'cat1', brandId: 'brand1' } });
    const res = mockRes();
    await generateSku(req, res);
    expect(res.json.mock.calls[0][0].sequence).toBe(4);
    expect(res.json.mock.calls[0][0].sku).toBe('MC-DX-SIE-0004');
  });
});
