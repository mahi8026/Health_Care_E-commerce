'use strict';

/**
 * Unit tests for cache middleware
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

const { cacheMiddleware, noStore, staticAssets } = require('../cache');

// Helper to create mock Express req/res/next objects
function createMocks() {
  const req = {};
  const headers = {};
  const res = {
    setHeader: jest.fn((name, value) => {
      headers[name.toLowerCase()] = value;
    }),
    _headers: headers,
  };
  const next = jest.fn();
  return { req, res, next, headers };
}

describe('cacheMiddleware', () => {
  describe('public cache headers for product listing (Requirement 8.2)', () => {
    it('sets Cache-Control: public, s-maxage=60, stale-while-revalidate=300', () => {
      const { req, res, next } = createMocks();
      const middleware = cacheMiddleware({ maxAge: 60, swr: 300 });

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=300'
      );
    });

    it('calls next() after setting public cache headers', () => {
      const { req, res, next } = createMocks();
      const middleware = cacheMiddleware({ maxAge: 60, swr: 300 });

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('public cache headers for product detail (Requirement 8.3)', () => {
    it('sets Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400', () => {
      const { req, res, next } = createMocks();
      const middleware = cacheMiddleware({ maxAge: 3600, swr: 86400 });

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=86400'
      );
    });

    it('calls next() after setting product detail cache headers', () => {
      const { req, res, next } = createMocks();
      const middleware = cacheMiddleware({ maxAge: 3600, swr: 86400 });

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('no-store for authenticated endpoints (Requirement 8.4)', () => {
    it('sets Cache-Control: no-store when private option is true', () => {
      const { req, res, next } = createMocks();
      const middleware = cacheMiddleware({ private: true });

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });

    it('calls next() after setting no-store for private endpoints', () => {
      const { req, res, next } = createMocks();
      const middleware = cacheMiddleware({ private: true });

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache header format', () => {
    it('sets only "public" directive when no maxAge or swr provided', () => {
      const { req, res, next } = createMocks();
      const middleware = cacheMiddleware({});

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public');
    });

    it('sets "public, s-maxage=X" when only maxAge is provided', () => {
      const { req, res, next } = createMocks();
      const middleware = cacheMiddleware({ maxAge: 120 });

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, s-maxage=120'
      );
    });

    it('sets "public, stale-while-revalidate=X" when only swr is provided', () => {
      const { req, res, next } = createMocks();
      const middleware = cacheMiddleware({ swr: 600 });

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, stale-while-revalidate=600'
      );
    });

    it('uses default empty options when called with no arguments', () => {
      const { req, res, next } = createMocks();
      const middleware = cacheMiddleware();

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});

describe('noStore middleware (Requirement 8.4)', () => {
  it('sets Cache-Control: no-store', () => {
    const { req, res, next } = createMocks();

    noStore(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });

  it('calls next()', () => {
    const { req, res, next } = createMocks();

    noStore(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('staticAssets middleware (Requirement 8.1)', () => {
  it('sets Cache-Control: public, max-age=31536000, immutable', () => {
    const { req, res, next } = createMocks();

    staticAssets(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  });

  it('calls next()', () => {
    const { req, res, next } = createMocks();

    staticAssets(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
