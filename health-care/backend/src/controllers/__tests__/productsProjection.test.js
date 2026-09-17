/**
 * Regression tests — products list API field projection (sitemap lastmod).
 *
 * Root cause (SEO): getProducts() projected createdAt but NOT updatedAt, so
 * sitemap consumers could never read a real lastmod — every generator
 * (route handlers + build script) fell back to "generation time", producing
 * 600+ identical <lastmod> values in the live sitemap. The `fields=` filter
 * compounded it by silently dropping any non-whitelisted key.
 */

jest.mock('../../models/Product');
jest.mock('../../models/Category');
jest.mock('../../models/Manufacturer');
jest.mock('../../services/cacheInvalidation', () => ({
  invalidateProductCache: jest.fn(),
  invalidateProductListCache: jest.fn(),
}));
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../utils/activityLogger', () => ({
  logActivityAsync: jest.fn(),
  ACTIONS: { PRODUCT: { CREATED: 'product.created', UPDATED: 'product.updated', DELETED: 'product.deleted' } },
}));
jest.mock('../../config/constants', () => ({
  PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX_LIMIT: 100 },
}));

const { getProducts } = require('../productController');
const Product = require('../../models/Product');

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

/** Mock Product.aggregate to resolve a $facet-shaped result. */
const buildAgg = (docs) => {
  const result = Promise.resolve([{ metadata: [{ total: docs.length }], data: docs }]);
  const agg = jest.fn(() => result);
  Product.aggregate.mockImplementation(agg);
  return agg;
};

const makeDocs = () => [
  {
    _id: 'aaaaaaaaaaaaaaaaaaaaaaa1',
    name: 'Yamasu 500CE',
    slug: 'yamasu-aneroid-sphygmomanometer-manual-blood-pressure-machine-500ce-made-in-japan',
    price: 2200,
    stock: 50,
    createdAt: new Date('2026-08-10T04:20:00.000Z'),
    updatedAt: new Date('2026-08-15T10:30:00.000Z'),
    category: { _id: 'ccccccccccccccccccccccc1', name: 'Diagnostic Equipment', slug: 'diagnostic-equipment' },
    rating: { average: 0, count: 0, distribution: {} },
  },
  {
    _id: 'aaaaaaaaaaaaaaaaaaaaaaa2',
    name: 'Legacy Product',
    slug: 'legacy-product',
    price: 500,
    stock: 3,
    createdAt: new Date('2026-08-20T08:00:00.000Z'),
    // legacy document: updatedAt never set
    category: { _id: 'ccccccccccccccccccccccc1', name: 'Diagnostic Equipment', slug: 'diagnostic-equipment' },
    rating: { average: 0, count: 0, distribution: {} },
  },
];

const extractProducts = (res) => {
  const body = (res.json.mock.calls[0] && res.json.mock.calls[0][0]) || {};
  if (Array.isArray(body.data)) {
    return body.data;
  }
  if (Array.isArray(body.products)) {
    return body.products;
  }
  return [];
};

describe('products list API exposes sitemap timestamps', () => {
  beforeEach(() => jest.clearAllMocks());

  it('default projection includes updatedAt (source for sitemap lastmod)', async () => {
    const docs = makeDocs();
    const agg = buildAgg(docs);
    const res = mockRes();

    await getProducts(mockReq({ query: {} }), res);

    const project = agg.mock.calls[0][0].find(stage => stage.$project);
    expect(project.$project.updatedAt).toBe(1);
    expect(project.$project.createdAt).toBe(1);

    const products = extractProducts(res);
    expect(products[0].updatedAt).toEqual(new Date('2026-08-15T10:30:00.000Z'));
    // legacy doc has no updatedAt but must still carry createdAt (fallback)
    expect(products[1]).toHaveProperty('createdAt');
    expect(products[1]).not.toHaveProperty('updatedAt');
  });

  it('fields= filter still exposes updatedAt for sitemap consumers', async () => {
    const docs = makeDocs();
    const agg = buildAgg(docs);
    const res = mockRes();

    await getProducts(mockReq({ query: { fields: 'slug,stock,category' } }), res);

    const project = agg.mock.calls[0][0].find(stage => stage.$project);
    // previously stripped -> caused the uniform lastmod bug
    expect(project.$project.updatedAt).toBe(1);
    expect(project.$project.createdAt).toBe(1);
    // requested fields are still honored
    expect(project.$project.slug).toBe(1);
    expect(project.$project.price).toBeUndefined();

    const products = extractProducts(res);
    expect(products[0].updatedAt).toEqual(new Date('2026-08-15T10:30:00.000Z'));
  });

  it('updatedAt is never stripped from the final response documents', async () => {
    const docs = makeDocs();
    buildAgg(docs);
    const res = mockRes();

    await getProducts(mockReq({ query: {} }), res);

    const products = extractProducts(res);
    expect(products).toHaveLength(2);
    expect(products.every(p => p.updatedAt || p.createdAt)).toBe(true);
    expect(products[0]).toHaveProperty('slug');
  });
});
