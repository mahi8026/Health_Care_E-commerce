// health-care/src/services/MetaPixelTracker.js

/**
 * MetaPixelTracker — lightweight, SSR-safe wrapper around the Facebook/Meta
 * Pixel ("fbq") used for conversion tracking on MediportBD.
 *
 * Design notes:
 * - Safe to import on the server or in Jest (every method guards `window`).
 * - Events are no-ops until `initialize()` is called with a pixel ID, so the
 *   site works normally when NEXT_PUBLIC_META_PIXEL_ID is not configured.
 * - Mirrors GA4 events 1:1 so ads can optimize on the same purchase funnel.
 */

const FBEVENTS_URL = 'https://connect.facebook.net/en_US/fbevents.js';

const MetaPixelTracker = {
  _pixelId: null,
  _baseScriptInjected: false,

  /** Readable state — used by the tracking component. */
  isEnabled() {
    return Boolean(this._pixelId);
  },

  /**
   * Initialize the Meta Pixel:
   *  1. Creates the official fbq() stub + queue (events queue safely before
   *     the network script arrives).
   *  2. Injects the fbevents.js base script exactly once.
   *  3. Calls fbq('init', pixelId).
   *
   * Safe to call multiple times; only the first call with a real ID wins.
   */
  initialize(pixelId) {
    if (typeof window === 'undefined' || !pixelId) return;
    if (this._pixelId) return; // already initialized
    this._pixelId = pixelId;

    const w = window;

    // Official fbq() stub — creates the command queue.
    if (typeof w.fbq !== 'function') {
      w.fbq = function () {
        if (w.fbq.callMethod) {
          w.fbq.callMethod.apply(w.fbq, arguments);
        } else {
          w.fbq.queue.push(arguments);
        }
      };
      if (!w._fbq) w._fbq = w.fbq;
      w.fbq.push = w.fbq;
      w.fbq.loaded = true;
      w.fbq.version = '2.0';
      w.fbq.queue = [];
    }

    // Base script — load exactly once.
    if (!this._baseScriptInjected) {
      this._baseScriptInjected = true;
      const script = w.document.createElement('script');
      script.async = true;
      script.src = FBEVENTS_URL;
      const firstScript = w.document && w.document.getElementsByTagName ? w.document.getElementsByTagName('script')[0] : null;
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        w.document.head.appendChild(script);
      }
    }

    this._push('init', pixelId);
  },

  /** Low-level fbq() call — no-ops until the pixel is initialized. */
  _push(...args) {
    if (typeof window === 'undefined' || !this.isEnabled()) return false;
    try {
      if (typeof window.fbq === 'function') {
        window.fbq(...args);
        return true;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[MetaPixel] fbq() failed:', err);
      }
    }
    return false;
  },

  // ── Standard events ──────────────────────────────────────────────────────────

  /** PageView — fired on every page load and client-side route change. */
  trackPageView() {
    this._push('track', 'PageView');
  },

  /** ViewContent — fired when a product detail page is viewed. */
  trackViewContent({ contentIds = [], value, currency = 'BDT', contentName, contentType = 'product' } = {}) {
    this._push('track', 'ViewContent', {
      content_type: contentType,
      content_ids: contentIds,
      content_name: contentName,
      value,
      currency,
    });
  },

  /** Search — fired when a user searches products. */
  trackSearch({ searchString, contentIds = [] } = {}) {
    this._push('track', 'Search', { search_string: searchString, content_ids: contentIds });
  },

  /** AddToCart — fired when an item is added to the cart. */
  trackAddToCart({ contentIds = [], value, currency = 'BDT', contentName, numItems = 1 } = {}) {
    this._push('track', 'AddToCart', {
      content_type: 'product',
      content_ids: contentIds,
      content_name: contentName,
      num_items: numItems,
      value,
      currency,
    });
  },

  /** InitiateCheckout — fired when the checkout page loads with items. */
  trackInitiateCheckout({ contentIds = [], value, currency = 'BDT', numItems = 0 } = {}) {
    this._push('track', 'InitiateCheckout', {
      content_type: 'product',
      content_ids: contentIds,
      num_items: numItems,
      value,
      currency,
    });
  },

  /** AddPaymentInfo — fired when a payment method is selected. */
  trackAddPaymentInfo({ method, currency = 'BDT' } = {}) {
    this._push('track', 'AddPaymentInfo', { payment_method: method, currency });
  },

  /** Purchase — fired when an order is successfully placed (ads optimize on this). */
  trackPurchase({ value, currency = 'BDT', contentIds = [] } = {}) {
    this._push('track', 'Purchase', {
      content_type: 'product',
      content_ids: contentIds,
      value,
      currency,
    });
  },

  /** Lead — fired on B2B quote requests (a high-value sales lead). */
  trackLead({ value, currency = 'BDT' } = {}) {
    this._push('track', 'Lead', { value, currency });
  },

  /** Custom events — e.g. remove_from_cart, quote_request, etc. */
  trackCustomEvent(eventName, params = {}) {
    if (!eventName) return;
    this._push('trackCustom', eventName, params);
  },

  /** Consistent content_ids extraction for cart/order item arrays. */
  toContentIds(items = []) {
    return items
      .map((item) => item?.product?._id || item?.product?.id || item?.product || item?.sku || item?._id)
      .filter(Boolean);
  },
};

export default MetaPixelTracker;