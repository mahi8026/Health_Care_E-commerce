/**
 * Server-side fetch helper with a hard deadline.
 *
 * WHY: every statically-generated route (and every ISR revalidation) runs its
 * data fetches inside `next build`. A bare `fetch()` has no timeout, so when
 * the API is unreachable or cold-starting (Render free tier can take ~50s to
 * wake) the request hangs until Next's 60s page timeout fires. That made
 * `/topics/[slug]` fail the entire build with
 * "Failed to build ... took more than 60 seconds (attempt 1,2,3 of 3)".
 *
 * With a deadline the build is deterministic: a slow dependency yields `null`
 * (the page renders its empty/SEO state) instead of blocking, and ISR refills
 * the data on the next revalidation once the API is warm.
 *
 * Server-only — this must never be imported from a client component, because
 * `next: { revalidate }` is a Next.js server fetch option.
 */

/** Default deadline for build/ISR data fetches. */
export const SERVER_FETCH_TIMEOUT_MS = 8000;

/**
 * @param {string} url - absolute API URL
 * @param {{ revalidate?: number, timeout?: number, tags?: string[], headers?: Record<string,string> }} [options]
 * @returns {Promise<any|null>} parsed JSON, or null on timeout / non-2xx / parse error
 */
export async function serverFetchJson(url, options = {}) {
  const { revalidate = 60, timeout = SERVER_FETCH_TIMEOUT_MS, tags, headers } = options;

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate, ...(tags ? { tags } : {}) },
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    // AbortError (deadline) or network failure — callers treat null as "no data"
    return null;
  }
}

/**
 * Extracts a nested list from an API envelope.
 * Handles the shapes the backend actually returns:
 *   { data: { categories: [...] } }, { data: [...] }, { categories: [...] }
 *
 * @param {any} payload - response from serverFetchJson
 * @param {string} key - collection name, e.g. 'manufacturers'
 * @returns {any[]} always an array
 */
export function extractList(payload, key) {
  if (!payload) return [];
  const nested = payload.data?.[key];
  if (Array.isArray(nested)) return nested;
  if (Array.isArray(payload[key])) return payload[key];
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}