/**
 * Tests for src/utils/serverFetch.js
 *
 * Validates: Requirements 8.6, 8.7
 */

import { fetchWithISR, fetchProducts, fetchFeaturedProducts } from '../serverFetch';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Response-like object that satisfies the fetch contract used
 * by serverFetch.js.
 */
function makeResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => body,
  };
}

// ---------------------------------------------------------------------------
// fetchWithISR
// ---------------------------------------------------------------------------

describe('fetchWithISR', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls fetch with next: { revalidate } option', async () => {
    global.fetch.mockResolvedValue(makeResponse({}));

    await fetchWithISR('http://example.com/api/test', 60);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://example.com/api/test',
      expect.objectContaining({
        next: expect.objectContaining({ revalidate: 60 }),
      })
    );
  });

  it('uses 60 s as the default revalidation period', async () => {
    global.fetch.mockResolvedValue(makeResponse({}));

    await fetchWithISR('http://example.com/api/test');

    const [, options] = global.fetch.mock.calls[0];
    expect(options.next.revalidate).toBe(60);
  });

  it('merges caller-supplied options without overwriting next.revalidate', async () => {
    global.fetch.mockResolvedValue(makeResponse({}));

    await fetchWithISR('http://example.com/api/test', 120, {
      headers: { 'X-Custom': 'header' },
    });

    const [, options] = global.fetch.mock.calls[0];
    expect(options.next.revalidate).toBe(120);
    expect(options.headers).toEqual({ 'X-Custom': 'header' });
  });

  it('returns the raw Response object', async () => {
    const mockRes = makeResponse({ data: 'ok' });
    global.fetch.mockResolvedValue(mockRes);

    const result = await fetchWithISR('http://example.com/api/test');
    expect(result).toBe(mockRes);
  });
});

// ---------------------------------------------------------------------------
// fetchProducts
// ---------------------------------------------------------------------------

describe('fetchProducts', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an array of products on success (array response)', async () => {
    const products = [{ _id: '1', name: 'Product A' }];
    global.fetch.mockResolvedValue(makeResponse(products));

    const result = await fetchProducts();
    expect(result).toEqual(products);
  });

  it('returns products from { data: [...] } wrapper', async () => {
    const products = [{ _id: '2', name: 'Product B' }];
    global.fetch.mockResolvedValue(makeResponse({ data: products }));

    const result = await fetchProducts();
    expect(result).toEqual(products);
  });

  it('returns products from { products: [...] } wrapper', async () => {
    const products = [{ _id: '3', name: 'Product C' }];
    global.fetch.mockResolvedValue(makeResponse({ products }));

    const result = await fetchProducts();
    expect(result).toEqual(products);
  });

  it('returns empty array when API responds with non-ok status', async () => {
    global.fetch.mockResolvedValue(makeResponse({}, { ok: false, status: 500 }));

    const result = await fetchProducts();
    expect(result).toEqual([]);
  });

  it('returns empty array when fetch throws a network error', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    const result = await fetchProducts();
    expect(result).toEqual([]);
  });

  it('passes filters as query-string parameters', async () => {
    global.fetch.mockResolvedValue(makeResponse([]));

    await fetchProducts({ filters: { limit: 3 } });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('limit=3');
  });

  it('uses 60 s revalidation by default', async () => {
    global.fetch.mockResolvedValue(makeResponse([]));

    await fetchProducts();

    const [, options] = global.fetch.mock.calls[0];
    expect(options.next.revalidate).toBe(60);
  });

  it('respects a custom revalidation period', async () => {
    global.fetch.mockResolvedValue(makeResponse([]));

    await fetchProducts({ revalidate: 300 });

    const [, options] = global.fetch.mock.calls[0];
    expect(options.next.revalidate).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// fetchFeaturedProducts
// ---------------------------------------------------------------------------

describe('fetchFeaturedProducts', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches with limit=3 filter', async () => {
    global.fetch.mockResolvedValue(makeResponse([]));

    await fetchFeaturedProducts();

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('limit=3');
  });

  it('uses 60 s revalidation', async () => {
    global.fetch.mockResolvedValue(makeResponse([]));

    await fetchFeaturedProducts();

    const [, options] = global.fetch.mock.calls[0];
    expect(options.next.revalidate).toBe(60);
  });

  it('returns an empty array on network failure', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    const result = await fetchFeaturedProducts();
    expect(result).toEqual([]);
  });
});
