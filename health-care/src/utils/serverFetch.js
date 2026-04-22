/**
 * Server-side fetch utilities with Next.js ISR cache options.
 *
 * These functions are intended for use in Next.js Server Components only.
 * They leverage Next.js's extended `fetch` API to enable Incremental Static
 * Regeneration (ISR) and stale-while-revalidate caching behaviour.
 *
 * Requirements: 8.6, 8.7
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Ensure we have the /api prefix for server-side fetches
const API_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

/**
 * Default revalidation period in seconds (matches backend s-maxage for product listing).
 */
const DEFAULT_REVALIDATE = 60;

/**
 * Fetch a URL with Next.js ISR cache options.
 *
 * The `next: { revalidate }` option instructs Next.js to:
 *  - Serve a cached response for up to `revalidate` seconds (s-maxage equivalent).
 *  - Revalidate the cache in the background after the period expires, so users
 *    never see a loading state for already-cached content (stale-while-revalidate).
 *
 * @param {string} url - Absolute URL to fetch.
 * @param {number} [revalidate=60] - Revalidation period in seconds.
 * @param {RequestInit} [options={}] - Additional fetch options (merged with cache config).
 * @returns {Promise<Response>} The raw fetch Response.
 */
export async function fetchWithISR(url, revalidate = DEFAULT_REVALIDATE, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout for faster response
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      next: {
        revalidate,
        ...(options.next || {}),
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch products from the backend with ISR caching.
 *
 * Cache policy: revalidate every 60 s (matches `Cache-Control: s-maxage=60,
 * stale-while-revalidate=300` set by the backend cache middleware).
 *
 * @param {Object} [options={}]
 * @param {number} [options.revalidate=60] - Override the revalidation period.
 * @param {Object} [options.filters={}] - Query-string filters forwarded to the API.
 * @returns {Promise<Object[]>} Array of product objects, or an empty array on error.
 */
export async function fetchProducts({ revalidate = DEFAULT_REVALIDATE, filters = {} } = {}) {
  const params = new URLSearchParams(filters);
  const url = `${API_URL}/products${params.toString() ? `?${params}` : ''}`;

  try {
    const res = await fetchWithISR(url, revalidate);

    if (!res.ok) {
      console.error(`[serverFetch] fetchProducts failed: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();

    // The backend wraps results in { success, data } or returns an array directly.
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.products)) return data.products;

    return [];
  } catch (error) {
    // Gracefully degrade — server component will still render with empty initial data.
    console.error('[serverFetch] fetchProducts error:', error.message);
    return [];
  }
}

/**
 * Fetch featured products (first 3 products) with 60 s ISR revalidation.
 *
 * Used by the homepage server component to prefetch initial data for hydration,
 * so the client-side `useProducts` hook can display content immediately without
 * a loading spinner on first paint.
 *
 * @returns {Promise<Object[]>} Array of up to 3 featured product objects.
 */
export async function fetchFeaturedProducts() {
  return fetchProducts({ filters: { limit: 3 }, revalidate: DEFAULT_REVALIDATE });
}
