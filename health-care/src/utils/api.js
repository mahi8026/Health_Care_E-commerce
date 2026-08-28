import { API as API_BASE_URL } from '@/constants/api';
import { TIMEOUTS } from '@/constants/config';

// Dev-only logger — silent in production
const devLog = {
  error: (...args) => { if (process.env.NODE_ENV === 'development') process.env.NODE_ENV !== "production" && console.error('[API Error]', ...args); },  
};

// ══════════════════════════════════════════════════════════════════════════════
// REQUEST DEDUPLICATION & CACHING
// ══════════════════════════════════════════════════════════════════════════════

// In-memory cache for GET requests (prevents 429 rate limiting)
const requestCache = new Map();
const pendingRequests = new Map();

// Shared "backend is booting" gate: when the free-tier instance cold-starts
// it answers 503 for a while; all concurrent callers wait on ONE gate instead
// of each stacking its own full retry backoff.
const COLD_START_GATE_MS = 10000;
let coldStartGate = null;
function waitForColdStartGate() {
  if (!coldStartGate) {
    coldStartGate = new Promise((resolve) => {
      setTimeout(() => {
        coldStartGate = null;
        resolve();
      }, COLD_START_GATE_MS);
    });
  }
  return coldStartGate;
}

// Cache configuration
const CACHE_TTL = {
  products: 5 * 60 * 1000,      // 5 minutes
  categories: 30 * 60 * 1000,   // 30 minutes
  settings: 30 * 60 * 1000,     // 30 minutes
  stats: 5 * 60 * 1000,         // 5 minutes
  default: 2 * 60 * 1000,       // 2 minutes
};

function getCacheKey(url, options = {}) {
  const method = options.method || 'GET';
  const body = options.body || '';
  return `${method}:${url}:${body}`;
}

function getCacheTTL(url) {
  if (url.includes('/products')) return CACHE_TTL.products;
  if (url.includes('/categories')) return CACHE_TTL.categories;
  if (url.includes('/settings')) return CACHE_TTL.settings;
  if (url.includes('/stats')) return CACHE_TTL.stats;
  return CACHE_TTL.default;
}

function getCachedResponse(cacheKey) {
  const cached = requestCache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    requestCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

function setCachedResponse(cacheKey, data, ttl) {
  requestCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });
  
  // Clean up old cache entries (simple LRU)
  if (requestCache.size > 100) {
    const oldestKey = requestCache.keys().next().value;
    requestCache.delete(oldestKey);
  }
}

// Clear cache for specific URL patterns
function clearCache(urlPattern) {
  for (const [key] of requestCache.entries()) {
    if (key.includes(urlPattern)) {
      requestCache.delete(key);
    }
  }
}

// Get token from localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('Mediport_token');
  }
  return null;
};

// Get refresh token from localStorage
const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('Mediport_refresh_token');
  }
  return null;
};

// S-12 — cookie auth mode. When NEXT_PUBLIC_AUTH_COOKIES=true the backend
// issues the refresh credential as an httpOnly cookie (/api/auth scope). This
// client must then NEVER persist it to localStore (XS readable). Gated so the
// default deploy behaves exactly as before until the flag is flipped. While in
// cookie-mode, getRefreshToken() still reads a legacy local copy ONLY as a
// one-time transitional fallback (pre-rollout sessions who have no cookie yet);
// the first successful refresh purges it because the backend rotates the cookie.
const cookiesEnabled = () => process.env.NEXT_PUBLIC_AUTH_COOKIES === 'true';

// Set refresh token in localStorage
const setRefreshToken = (refreshToken) => {
  if (typeof window === 'undefined') return;
  if (cookiesEnabled()) {
    // S-12 — the httpOnly cookie owns the refresh credential now. Never write
    // it to localStore; drop any pre-rollout copy on the first write path
    // (login/refresh/OAuth now rotate the cookie and make the stale value moot).
    localStorage.removeItem('Mediport_refresh_token');
    return;
  }
  localStorage.setItem('Mediport_refresh_token', refreshToken);
};

// Set token in localStorage
const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('Mediport_token', token);
  }
};

// Remove token from localStorage
const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('Mediport_token');
    localStorage.removeItem('Mediport_refresh_token');
  }
};

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

// Subscribe to token refresh completion
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// Notify all subscribers when token is refreshed
function onTokenRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// ── CSRF token shim (plan §2.8, pairs with backend CSRF_ENFORCED gate) ──────
// Fetched once per session and attached to every state-changing request.
// While the backend gate is off this header is simply ignored; flipping
// CSRF_ENFORCED=true then activates protection with no frontend deploy.
let csrfToken = null;
async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch(`${API_BASE_URL}/csrf-token`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrfToken || null;
    }
  } catch {
    // Non-fatal: backend may not be enforcing yet, or endpoint unreachable.
  }
  return csrfToken;
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  
  // Check if response is JSON
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        // Only log unexpected errors (not 400-level client errors)
        if (response.status >= 500) {
          devLog.error('[API] Server error:', data);
        }
        throw new ApiError(
          data.message || `HTTP Error ${response.status}`,
          response.status,
          data
        );
      }
      
      return data;
    } catch (error) {
      // If JSON parsing fails
      if (error instanceof ApiError) throw error;
      
      devLog.error('[API] handleResponse - JSON parse error:', error);
      throw new ApiError(
        `Failed to parse response: ${error.message}`,
        response.status,
        {}
      );
    }
  } else {
    // Handle non-JSON responses (HTML error pages, plain text, etc.)
    const text = await response.text();
    
    if (!response.ok) {
      devLog.error('[API] handleResponse - Non-JSON error:', text.substring(0, 200));
      throw new ApiError(
        text || `HTTP Error ${response.status}`,
        response.status,
        { text }
      );
    }
    
    // Try to parse as JSON anyway (some APIs don't set correct content-type)
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }
}

// Cold-start aware fetch: retries on 503/429/network errors with backoff.
// Render free tier spins down after ~15 min of inactivity; the first request
// after idle returns 503 while the server boots (30-60s), so retry generously.
// GET requests use the shared cache + dedup layer so concurrent/duplicate
// calls (e.g. /settings from TopBar + HomePage + banners) hit the network once.
export async function fetchWithRetry(
  url,
  options = {},
  { maxRetries = 3, baseDelay = 2000, timeout = TIMEOUTS.API_REQUEST, cache = true } = {}
) {
  const externalSignal = options.signal;

  const method = options.method || 'GET';
  const cacheKey = getCacheKey(url, options);

  // Serve from cache first (GET only)
  if (cache && method === 'GET') {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // Deduplicate concurrent identical GET requests. The pending entry may
    // have been created by fetchWithRetry (Response), fetchCached (parsed
    // JSON) or fetchWithAuth (Response) — normalize to this function's
    // contract and fall through to our own retry loop if it failed.
    if (pendingRequests.has(cacheKey)) {
      try {
        const value = await pendingRequests.get(cacheKey);
        if (value instanceof Response) return value;
        return new Response(JSON.stringify(value), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch {
        // Pending request failed — fall through and make our own request.
      }
    }
  }

  const sleep = (ms) =>
    new Promise((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timer);
        const err = new Error('Aborted');
        err.name = 'AbortError';
        reject(err);
      };
      const timer = setTimeout(() => {
        if (externalSignal) externalSignal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      if (externalSignal) {
        if (externalSignal.aborted) return onAbort();
        externalSignal.addEventListener('abort', onAbort, { once: true });
      }
    });

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    // Link the caller's signal to the internal controller so timeouts and
    // caller-initiated aborts both cancel the request.
    const onAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        throw err;
      }
      externalSignal.addEventListener('abort', onAbort, { once: true });
    }
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (externalSignal) externalSignal.removeEventListener('abort', onAbort);

      const retriable = response.status === 503 || response.status === 429;
      if (!retriable || attempt >= maxRetries) {
        // Cache successful GET responses
        if (cache && method === 'GET' && response.ok) {
          const clone = response.clone();
          const data = await clone.json();
          const ttl = getCacheTTL(url);
          setCachedResponse(cacheKey, data, ttl);
        }
        return response;
      }

      // During a cold start every concurrent request sees 503 — share ONE
      // wait so they all retry together instead of stacking backoffs.
      if (response.status === 503) {
        await waitForColdStartGate();
        continue;
      }

      // Prefer the server's retry hint (Retry-After header or the retryAfter
      // field the backend puts in the JSON body), fall back to local backoff.
      let delay = baseDelay * (attempt + 1);
      try {
        const header = response.headers.get('Retry-After');
        if (header && !Number.isNaN(parseInt(header, 10))) {
          delay = parseInt(header, 10) * 1000;
        } else {
          const body = await response.json();
          if (body && typeof body.retryAfter === 'number') {
            delay = body.retryAfter * 1000;
          }
        }
      } catch { /* non-JSON body — use local backoff */ }
      await sleep(delay);
    } catch (error) {
      clearTimeout(timeoutId);
      if (externalSignal) externalSignal.removeEventListener('abort', onAbort);

      // Stop retrying if the caller unmounted or cancelled
      if (externalSignal?.aborted) throw error;
      if (attempt >= maxRetries) throw error;

      await sleep(baseDelay * (attempt + 1));
    }
  }
}

// Enhanced fetch with auto-retry on 401, 503, 429, and timeout
// Includes request deduplication and caching to prevent rate limiting
async function fetchWithAuth(url, options = {}, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  const COLD_START_DELAY = 5000; // Render free tier needs 30-60s to boot
  const method = options.method || 'GET';
  const externalSignal = options.signal;

  // 2.8 — attach the CSRF token to state-changing requests (no-op header
  // until the backend gate flips on; see ensureCsrfToken above).
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await ensureCsrfToken();
    if (token) {
      options.headers = { ...(options.headers || {}), 'X-CSRF-Token': token };
    }
  }
  
  // ── Request Deduplication ──────────────────────────────────────────────────
  // For GET requests, check cache first
  if (method === 'GET') {
    const cacheKey = getCacheKey(url, options);
    
    // Check cache
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if request is already pending (deduplication). The pending entry
    // may come from fetchWithRetry/fetchWithAuth (Response) or fetchCached
    // (parsed JSON) — normalize to a Response and fall through on failure.
    if (pendingRequests.has(cacheKey)) {
      try {
        const value = await pendingRequests.get(cacheKey);
        if (value instanceof Response) return value;
        return new Response(JSON.stringify(value), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch {
        // Pending request failed — fall through and make our own request.
      }
    }
  }
  
  const cacheKey = getCacheKey(url, options);

  // Create the fetch promise. Retries run as an in-loop retry so the promise
  // never re-enters the dedup gate above (recursing previously made the
  // promise await itself and hang forever on 503/429 responses).
  const fetchPromise = (async () => {
    let attempts = retryCount;
    let response;

    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST);
      // Link the caller's signal so caller-initiated aborts cancel the request
      // (previously the internal controller silently replaced it).
      const onExternalAbort = () => controller.abort();
      if (externalSignal) {
        if (externalSignal.aborted) {
          clearTimeout(timeoutId);
          const err = new Error('Aborted');
          err.name = 'AbortError';
          throw err;
        }
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }

      try {
        response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);

        // Handle 429 (Too Many Requests - Rate Limited) and 503 (Service
        // Unavailable - Backend sleeping or DB reconnecting)
        const retriable = response.status === 429 || response.status === 503;
        if (retriable && attempts < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : response.status === 503
              ? COLD_START_DELAY * (attempts + 1)
              : RETRY_DELAY * Math.pow(2, attempts);
          devLog.error(`[API] ${response.status} for ${url}. Retrying after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempts += 1;
          continue;
        }
        break;
      } catch (error) {
        clearTimeout(timeoutId);
        if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
        // Network error or timeout - retry if not max retries
        if (error.name === 'AbortError' || error.message.includes('fetch')) {
          if (attempts < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            attempts += 1;
            continue;
          }
          devLog.error('[API] Request failed after retries:', url);
          throw new ApiError(
            'Unable to connect to server. Please check your connection.',
            0,
            { originalError: error.message }
          );
        }
        throw error;
      }
    }

    // Cache successful GET responses
    if (method === 'GET' && response.ok) {
      const clone = response.clone();
      const data = await clone.json();
      const ttl = getCacheTTL(url);
      setCachedResponse(cacheKey, data, ttl);
    }
    
    // If 401 and we have a refresh token (or cookie-auth mode may hold one in
    // the httpOnly cookie), try to refresh.
    if (response.status === 401 && (getRefreshToken() || cookiesEnabled())) {
    if (!isRefreshing) {
      isRefreshing = true;
      
      try {
        // Attempt to refresh the token (body token optional: with cookie auth
        // enabled the backend prefers the httpOnly cookie when present).
        const refreshToken = getRefreshToken();
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(refreshToken ? { refreshToken } : {}),
          credentials: 'include'
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data.token) {
            setToken(data.token);
            if (data.refreshToken) {
              setRefreshToken(data.refreshToken);
            }
            isRefreshing = false;
            onTokenRefreshed(data.token);
            
            // Retry original request with new token
            const newOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${data.token}`
              }
            };
            return fetch(url, newOptions);
          }
        }
        
        // Refresh failed, clear tokens and redirect to login (only in browser)
        isRefreshing = false;
        // F7 — flush queued waiters with null so their promises settle;
        // previously they hung forever, leaving account pages stuck loading.
        onTokenRefreshed(null);
        removeToken();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return response;
      } catch (error) {
        isRefreshing = false;
        // F7 — same flush guarantee on the exception path
        onTokenRefreshed(null);
        removeToken();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return response;
      }
    } else {
      // Wait for the refresh to complete
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          // F7 — null token = refresh failed and we were logged out.
          // Settle with the original 401 response instead of re-fetching.
          if (!token) {
            resolve(response);
            return;
          }
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${token}`
            }
          };
          resolve(fetch(url, newOptions));
        });
      });
    }
  }
  
  return response;
  })();
  
  // Store pending request for deduplication (only if not already pending)
  if (method === 'GET' && !pendingRequests.has(cacheKey)) {
    pendingRequests.set(cacheKey, fetchPromise);
  }

  // Clean up pending request tracking once the promise settles
  if (method === 'GET') {
    const settle = () => pendingRequests.delete(cacheKey);
    fetchPromise.then(settle, settle);
  }
  
  return fetchPromise;
}

// Get auth headers
function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export const api = {
  // Cache management
  clearCache,
  
  // Products
  async getProducts(filters = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST);
    
    try {
      const params = new URLSearchParams();
      
      // Set default limit to 20 per page if not specified
      const filtersWithLimit = {
        limit: 20,
        ...filters
      };
      
      // Only add non-empty filter values
      Object.entries(filtersWithLimit).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // FIX-005: Normalize sortBy → sort to match backend validateProductQuery.
          // ProductsPage/SearchPage pass { sortBy: 'price-low' } but the backend
          // validator only accepts the 'sort' query param name.
          params.append(key === 'sortBy' ? 'sort' : key, value);
        }
      });
      
      const url = `${API_BASE_URL}/products?${params}`;
      
      const response = await fetchWithAuth(url, {
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await handleResponse(response);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      devLog.error('[API] getProducts error:', error);
      throw error;
    }
  },

  async getProduct(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // FIX-015: No /products/search route exists on the backend.
  // Search is handled by GET /products?search=... — use that instead.
  async searchProducts(query) {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/products?search=${encodeURIComponent(query)}&limit=20`,
      { credentials: 'include' }
    );
    return handleResponse(response);
  },

  // Orders
  async getOrders(filters = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetchWithAuth(`${API_BASE_URL}/orders?${params}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  async getOrder(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async createOrder(orderData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
      credentials: 'include'
    });
    // Clear orders cache after creating new order
    clearCache('/orders');
    return handleResponse(response);
  },

  // FIX-016: No PATCH /orders/:id route exists on the backend.
  // Use api.updateOrderStatus(id, status) for status changes,
  // or api.cancelOrder(id) for cancellations.
  async updateOrder(id, updates) {
    throw new Error(
      '[api.updateOrder] No PATCH /orders/:id handler exists on the backend. ' +
      'Use api.updateOrderStatus(id, status) or api.cancelOrder(id) instead.'
    );
  },

  async cancelOrder(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    // Clear orders cache after cancellation
    clearCache('/orders');
    return handleResponse(response);
  },

  async updateOrderStatus(id, status, trackingNumber) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, trackingNumber }),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Order Tracking (Public)
  async trackOrder(orderNumber) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/track/${orderNumber}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async sendOrderConfirmation(orderId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/notify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type: 'confirmation' }),
    });
    return handleResponse(response);
  },

  async sendPaymentReceipt(orderId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/notify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type: 'payment' }),
    });
    return handleResponse(response);
  },

  async sendShippingNotification(orderId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/notify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type: 'shipping' }),
    });
    return handleResponse(response);
  },

  async sendDeliveryConfirmation(orderId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/notify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type: 'delivery' }),
    });
    return handleResponse(response);
  },

  // Authentication
  async login(email, password, recaptchaToken) {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password, ...(recaptchaToken && { recaptchaToken }) }),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    if (data.token) {
      setToken(data.token);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  async register(userData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    if (data.token) {
      setToken(data.token);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  async refreshToken() {
    const refreshToken = getRefreshToken();
    const body = refreshToken ? { refreshToken } : {};
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    if (data.token) {
      setToken(data.token);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  async logout() {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    removeToken();
    return handleResponse(response);
  },

  async getMe() {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async updateProfile(updates) {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async changePassword(currentPassword, newPassword) {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/change-password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Quotations (B2B)
  async getQuotations() {
    const response = await fetchWithAuth(`${API_BASE_URL}/quotes`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getQuotation(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/quotes/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async createQuotation(quotationData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(quotationData),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Analytics
  async getAnalytics(period = 'month') {
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics?period=${period}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getSalesAnalytics(startDate, endDate, groupBy = 'day') {
    const params = new URLSearchParams({ startDate, endDate, groupBy });
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/sales?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getOrderAnalytics(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/orders?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getCustomerAnalytics(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/customers?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getProductAnalytics(startDate, endDate, limit = 10) {
    const params = new URLSearchParams({ startDate, endDate, limit: limit.toString() });
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/products?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getPaymentAnalytics(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/payments?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Customers
  async getCustomers(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/customers?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getCustomer(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/customers/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async updateCustomer(id, updates) {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/customers/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Admin Dashboard
  async getAdminDashboard() {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getAdminAnalytics(period = 'month') {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/analytics?period=${period}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async manualStockCheck() {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/stock-check`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Admin Quote Management
  async getAllQuotes(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/quotes?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async updateQuote(id, updates) {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/quotes/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async convertQuoteToOrder(id, orderData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/quotes/${id}/convert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Invoices
  async downloadInvoice(orderId) {
    const token = getToken();
    if (!token) {
      throw new ApiError('Not authenticated. Please log in and try again.', 401);
    }

    const response = await fetch(`${API_BASE_URL}/invoices/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      let message = 'Failed to download invoice';
      try {
        const error = await response.json();
        message = error.message || message;
      } catch { /* ignore parse error */ }
      throw new ApiError(message, response.status);
    }

    return response.blob();
  },

  // Notifications (Admin)
  // NOTE: sendOrderConfirmation/sendPaymentReceipt/sendShippingNotification/sendDeliveryConfirmation
  // are defined earlier in this file and call POST /orders/:id/notify — do not redefine here.

  async sendQuotationReady(quoteId) {
    try {
      return await this.post('/notifications/quotation-ready', { quoteId });
    } catch (error) {
      devLog.error('[API] Send quotation ready failed:', error.message);
      throw error;
    }
  },

  async sendStockAlert() {
    try {
      return await this.post('/notifications/stock-alert', {});
    } catch (error) {
      devLog.error('[API] Send stock alert failed:', error.message);
      throw error;
    }
  },

  // Generic HTTP methods
  async get(endpoint) {
    const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async post(endpoint, data) {
    const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async put(endpoint, data) {
    const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async patch(endpoint, data) {
    const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async delete(endpoint) {
    const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Payments
  async initiateBkashPayment(amount, orderId) {
    return this.post('/payments/bkash/initiate', { amount, orderId });
  },

  async executeBkashPayment(paymentID) {
    return this.post('/payments/bkash/execute', { paymentID });
  },

  async verifyBkashPayment(paymentId, orderId) {
    return this.post('/payments/bkash/verify', { paymentId, orderId });
  },

  async submitBankTransfer(orderId, transactionReference) {
    return this.post('/payments/bank/submit', { orderId, transactionReference });
  },

  async processB2BCreditPayment(orderId) {
    return this.post('/payments/credit/process', { orderId });
  },

  async submitChequePayment(orderId, chequeData) {
    return this.post('/payments/cheque', { orderId, ...chequeData });
  },

  async initiateNagadPayment(amount, orderId) {
    return this.post('/payments/nagad/initiate', { amount, orderId });
  },

  async verifyNagadPayment(paymentReferenceId, orderId) {
    return this.post('/payments/nagad/verify', { paymentReferenceId, orderId });
  }
};

export { setToken, getToken, removeToken, getRefreshToken, setRefreshToken };

/**
 * fetchCached — cache + dedup aware fetch for GET requests, returning parsed
 * JSON. Use this instead of raw `fetch()` for frequently-read public endpoints
 * (settings, categories, banners) so identical requests from multiple
 * components hit the network once and are served from memory afterwards.
 * Returns the raw JSON body (same shape the backend returns).
 */
export async function fetchCached(url, options = {}) {
  const method = options.method || 'GET';
  const cacheKey = getCacheKey(url, options);

  if (method === 'GET') {
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    // Pending entry may be a Response (from fetchWithRetry/fetchWithAuth) or
    // parsed JSON (from fetchCached) — normalize and fall through on failure.
    if (pendingRequests.has(cacheKey)) {
      try {
        const value = await pendingRequests.get(cacheKey);
        return value instanceof Response ? await value.json() : value;
      } catch {
        // Pending request failed — fall through and make our own request.
      }
    }
  }

  const promise = (async () => {
    const res = await fetch(url, options);
    if (method === 'GET' && res.ok) {
      try {
        const clone = res.clone();
        const data = await clone.json();
        setCachedResponse(cacheKey, data, getCacheTTL(url));
        return data;
      } catch {
        // Non-JSON response — fall through to normal handling
      }
    }
    return res.json();
  })();

  if (method === 'GET') {
    pendingRequests.set(cacheKey, promise);
    const settle = () => pendingRequests.delete(cacheKey);
    promise.then(settle, settle);
  }

  return promise;
}

/** Clear the in-memory request cache (e.g. after admin mutations). */
export function clearRequestCache(urlPattern) {
  clearCache(urlPattern);
}
export default api;
