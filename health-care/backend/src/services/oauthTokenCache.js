/**
 * OAuth Token Cache — short-lived in-memory store for OAuth state codes.
 *
 * After Google OAuth succeeds the backend generates an access + refresh token
 * pair and stores them here against a random 32-byte hex state code (TTL: 2 min).
 * The backend redirects the browser to the frontend with ONLY the state code in
 * the URL. The frontend then calls GET /api/auth/google/tokens?state=... to
 * exchange the code for the real tokens, which are immediately removed from the
 * cache (one-time use).
 *
 * This avoids putting JWTs in the redirect URL, which:
 *   - Get stripped by www-redirects (the original bug)
 *   - Leak into browser history and server access logs
 *   - Can be stolen by referrer headers
 */

const store = new Map();

const TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Store a token pair against a state code.
 * @param {string} state  - Random hex state code
 * @param {{ token: string, refreshToken: string }} tokens
 */
function set(state, tokens) {
  const expiresAt = Date.now() + TTL_MS;
  store.set(state, { ...tokens, expiresAt });
  // Auto-cleanup after TTL
  setTimeout(() => store.delete(state), TTL_MS);
}

/**
 * Retrieve and consume a token pair (one-time use).
 * Returns null if the code is unknown or expired.
 * @param {string} state
 * @returns {{ token: string, refreshToken: string } | null}
 */
function consume(state) {
  const entry = store.get(state);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(state);
    return null;
  }
  store.delete(state); // one-time use
  const { token, refreshToken } = entry;
  return { token, refreshToken };
}

module.exports = { set, consume };
