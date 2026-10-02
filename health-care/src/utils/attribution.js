// health-care/src/utils/attribution.js
//
// Phase 4.1 (workstream B/F) — first-party UTM capture.
// Captures the four campaign parameters from the landing URL once per
// session and replays them on funnel events (whatsapp_click, rfq_start,
// rfq_complete) so every lead-touch carries channel context into GA4.
// Campaign tags only — NO PII (phone, email, names) is ever stored here.

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
const STORAGE_KEY = 'mediport_utm';
const MAX_VALUE_LEN = 64;

function sanitize(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().slice(0, MAX_VALUE_LEN);
  return v || null;
}

function parseUtmFromSearch(search) {
  if (!search) return null;
  try {
    const params = new URLSearchParams(search);
    const out = {};
    for (const key of UTM_KEYS) {
      const val = sanitize(params.get(key));
      if (val) out[key] = val;
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

/**
 * Capture UTM context: URL first (landing/first-touch of this session),
 * then the persisted sessionStorage copy. SSR-safe — returns null without
 * a window. Never throws.
 */
export function captureUtm() {
  if (typeof window === 'undefined') return null;

  const fromUrl = parseUtmFromSearch(window.location.search);
  if (fromUrl) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      // Storage may be full/blocked — event still proceeds without persistence.
    }
    return fromUrl;
  }

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * UTM params to merge into an event payload ({} when unknown).
 */
export function getUtmParams() {
  return captureUtm() || {};
}

// Exported for tests only — not part of the public contract.
export const __internals = { UTM_KEYS, STORAGE_KEY, MAX_VALUE_LEN, parseUtmFromSearch };
