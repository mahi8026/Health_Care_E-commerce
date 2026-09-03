// health-care/src/utils/marketingBeacon.js

import { API } from '@/constants/api';

/**
 * Server-side marketing beacon — fire-and-forget POST to /api/marketing/events.
 *
 * GA4 + Meta remain the primary ad platforms; this beacon gives the admin
 * Marketing Dashboard first-party numbers that don't depend on third-party
 * dashboards. Failures are silently ignored (beacon must never break UX).
 *
 * @param {string} type  — allowlisted type (see backend marketingController)
 * @param {object} [payload] — { productId?, value?, currency?, path? }
 */
export function trackMarketingEvent(type, payload = {}) {
  if (typeof window === 'undefined' || !type) return;
  try {
    const body = JSON.stringify({
      type,
      productId: payload.productId || undefined,
      value: typeof payload.value === 'number' ? payload.value : undefined,
      currency: payload.currency || undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });

    // keepalive lets the request survive page unload (e.g. exit popup).
    fetch(`${API}/marketing/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never surface beacon errors to users.
  }
}