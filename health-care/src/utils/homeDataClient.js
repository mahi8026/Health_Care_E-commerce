const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://health-care-e-commerce-ubyy.onrender.com/api';

/**
 * One-shot shared promise for /home/data.
 * Multiple below-fold sections (new arrivals, testimonials) need different
 * slices of the same aggregated response; they mount independently on scroll,
 * so the first mount triggers the single fetch and everyone else awaits it.
 * If the user never scrolls there, the request is never made.
 */
let homeDataPromise = null;

export default function getHomeDataOnce() {
  if (!homeDataPromise) {
    homeDataPromise = fetch(`${API_BASE}/home/data`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => (json?.success ? json.data : null))
      .catch(() => null);
  }
  return homeDataPromise;
}
