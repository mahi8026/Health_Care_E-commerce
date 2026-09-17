/**
 * Guest cart session id
 *
 * Guests have no account, so their cart lives only in localStorage. To make
 * abandoned-cart recovery possible we need a stable key that ties a server-side
 * cart snapshot back to the browser that abandoned it — this is that key.
 *
 * The format is deliberately constrained to [A-Za-z0-9_-]{8,64} because the
 * backend validates it with the same pattern before using it as a query value.
 */

const SESSION_KEY = 'mediport_guest_cart_session';
const VALID = /^[A-Za-z0-9_-]{8,64}$/;

function generateSessionId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      // 36 chars with dashes -> 32 chars, still inside the allowed set.
      return crypto.randomUUID().replace(/-/g, '');
    }
  } catch {
    /* fall through to the Math.random fallback */
  }
  return `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Read (or lazily create) the per-browser guest cart session id.
 * Returns null when storage is unavailable (private mode, SSR, blocked cookies).
 */
export function getGuestCartSessionId() {
  if (typeof window === 'undefined') return null;
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing && VALID.test(existing)) return existing;

    const created = generateSessionId();
    localStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    // localStorage unavailable — recovery tracking is best-effort, never fatal.
    return null;
  }
}
