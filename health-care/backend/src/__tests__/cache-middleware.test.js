/**
 * Tests for cache.js middleware (cacheMiddleware, redisCacheMiddleware, noStore, staticAssets).
 *
 * Redis interactions are fully mocked — no real Redis connection needed.
 */

// ── Shared mock Redis instance ────────────────────────────────────────────────
const mockRedisInstance = {
  get: jest.fn(),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
  on: jest.fn(),
};

// Mock ioredis before requiring cache middleware
jest.mock('ioredis', () => jest.fn(() => mockRedisInstance));

// ── Import after mock is set up ───────────────────────────────────────────────
const { cacheMiddleware, redisCacheMiddleware, noStore, staticAssets, invalidateCache } = require('../middleware/cache');

// ── Test helpers ─────────────────────────────────────────────────────────────
function mockRes() {
  const res = {
    _headers: {},
    _body: null,
    statusCode: 200,
    setHeader(name, value) {
 this._headers[name] = value; 
},
    getHeader(name) {
 return this._headers[name]; 
},
    status(code) {
 this.statusCode = code; return this; 
},
    json(data) {
 this._body = data; return this; 
},
  };
  return res;
}

function mockReq(overrides = {}) {
  return { method: 'GET', originalUrl: '/api/products', url: '/api/products', ...overrides };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Restore defaults
  mockRedisInstance.get.mockResolvedValue(null);
  mockRedisInstance.setex.mockResolvedValue('OK');
  mockRedisInstance.del.mockResolvedValue(1);
  mockRedisInstance.keys.mockResolvedValue([]);
});

// ── cacheMiddleware ───────────────────────────────────────────────────────────
describe('cacheMiddleware', () => {
  it('sets no-store for private endpoints', () => {
    const middleware = cacheMiddleware({ private: true });
    const res = mockRes();
    const next = jest.fn();

    middleware(mockReq(), res, next);

    expect(res._headers['Cache-Control']).toBe('no-store');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets public Cache-Control with maxAge and swr', () => {
    const middleware = cacheMiddleware({ maxAge: 3600, swr: 60 });
    const res = mockRes();
    const next = jest.fn();

    middleware(mockReq(), res, next);

    expect(res._headers['Cache-Control']).toContain('public');
    expect(res._headers['Cache-Control']).toContain('s-maxage=3600');
    expect(res._headers['Cache-Control']).toContain('stale-while-revalidate=60');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets public without extra directives when no options given', () => {
    const middleware = cacheMiddleware();
    const res = mockRes();
    const next = jest.fn();

    middleware(mockReq(), res, next);

    expect(res._headers['Cache-Control']).toBe('public');
  });
});

// ── noStore ───────────────────────────────────────────────────────────────────
describe('noStore', () => {
  it('sets Cache-Control: no-store and calls next', () => {
    const res = mockRes();
    const next = jest.fn();
    noStore(mockReq(), res, next);
    expect(res._headers['Cache-Control']).toBe('no-store');
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ── staticAssets ──────────────────────────────────────────────────────────────
describe('staticAssets', () => {
  it('sets long-lived immutable Cache-Control header', () => {
    const res = mockRes();
    const next = jest.fn();
    staticAssets(mockReq(), res, next);
    expect(res._headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ── redisCacheMiddleware ──────────────────────────────────────────────────────
describe('redisCacheMiddleware', () => {
  it('skips caching for non-GET requests and calls next', async () => {
    const mw = redisCacheMiddleware({ ttl: 300 });
    const req = mockReq({ method: 'POST' });
    const res = mockRes();
    const next = jest.fn();

    await mw(req, res, next);

    expect(mockRedisInstance.get).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns cached data and sets X-Cache: HIT', async () => {
    const payload = { success: true, products: [{ name: 'ECG' }] };
    mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify(payload));

    const mw = redisCacheMiddleware({ ttl: 300, keyPrefix: 'products:' });
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    await mw(req, res, next);

    expect(res._headers['X-Cache']).toBe('HIT');
    expect(res._body).toEqual(payload);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets X-Cache: MISS and stores response on cache miss', async () => {
    mockRedisInstance.get.mockResolvedValueOnce(null);

    const mw = redisCacheMiddleware({ ttl: 600, keyPrefix: 'products:' });
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn().mockImplementation(() => {
      res.json({ success: true, count: 0, products: [] });
    });

    await mw(req, res, next);

    expect(res._headers['X-Cache']).toBe('MISS');
    expect(mockRedisInstance.setex).toHaveBeenCalledWith(
      expect.stringContaining('/api/products'),
      600,
      expect.any(String)
    );
  });

  it('calls next even when Redis get throws', async () => {
    mockRedisInstance.get.mockRejectedValueOnce(new Error('Redis timeout'));

    const mw = redisCacheMiddleware({ ttl: 300 });
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ── invalidateCache ───────────────────────────────────────────────────────────
describe('invalidateCache', () => {
  it('deletes all matched keys', async () => {
    mockRedisInstance.keys.mockResolvedValueOnce(['products:list:1', 'products:list:2']);

    await invalidateCache('products:list:*');

    expect(mockRedisInstance.del).toHaveBeenCalledWith('products:list:1', 'products:list:2');
  });

  it('does nothing when no keys match', async () => {
    mockRedisInstance.keys.mockResolvedValueOnce([]);

    await invalidateCache('products:list:*');

    expect(mockRedisInstance.del).not.toHaveBeenCalled();
  });
});
