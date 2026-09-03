// health-care/src/services/GA4Tracker.js

import MetaPixelTracker from './MetaPixelTracker';

let reactGAPromise = null;

/**
 * Lazily load react-ga4 — keeps ~40KB out of the main bundle until the first
 * tracking call. The SDK is fetched exactly once and reused for the page's
 * lifetime.
 */
function getReactGA() {
  if (!reactGAPromise) {
    reactGAPromise = import('react-ga4').then((mod) => mod.default);
  }
  return reactGAPromise;
}

/**
 * GA4Tracker - Singleton class for Google Analytics 4 tracking
 *
 * This class provides a centralized wrapper for all GA4 tracking calls.
 * It ensures consistent event tracking with session IDs and proper error handling.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 *
 * Because react-ga4 is now loaded lazily (dynamic import), all tracking calls
 * queue behind the initialization promise instead of bailing out — so events
 * fired immediately after initialize() are no longer dropped.
 */
class GA4Tracker {
  static isInitialized = false;
  static sessionId = null;
  static _initPromise = null;

  /**
   * Initialize GA4 with measurement ID
   * @param {string} measurementId - GA4 measurement ID (e.g., G-XXXXXXXXXX)
   */
  static initialize(measurementId) {
    if (!measurementId || this.isInitialized) {
      return;
    }

    this._initPromise = getReactGA()
      .then((ReactGA) => {
        ReactGA.initialize(measurementId, {
          gaOptions: {
            send_page_view: false // Manual page view tracking
          }
        });

        this.isInitialized = true;
        this.sessionId = this.generateSessionId();
        return ReactGA;
      })
      .catch((error) => {
        this._initPromise = null;
        if (process.env.NODE_ENV !== 'production') console.error('GA4 Initialization Error:', error);
      });
  }

  /**
   * Returns the init promise (which resolves to ReactGA) or null when
   * initialize() was never called.
   */
  static _whenReady() {
    return this._initPromise || null;
  }

  /**
   * Generate a unique session ID
   * @returns {string} Session ID in format: timestamp-randomstring
   */
  static generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track page view event
   * @param {string} path - Page path (e.g., /products)
   * @param {string} title - Page title
   * Requirements: 1.1, 1.2, 1.4, 1.5
   */
  static trackPageView(path, title) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.send({
        hitType: 'pageview',
        page: path,
        title: title,
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Page View Error:', error);
    });
  }

  /**
   * Track product view event
   * @param {Object} product - Product object with id, name, price, category
   * Requirements: 2.1
   */
  static trackViewItem(product) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('view_item', {
        currency: 'BDT',
        value: product.price,
        items: [{
          item_id: product._id || product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price
        }],
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 View Item Error:', error);
    });

    // Mirror to Meta Pixel — same funnel event for paid-ads optimization.
    MetaPixelTracker.trackViewContent({
      contentIds: [product._id || product.id || product.sku],
      value: product.price,
      contentName: product.name,
    });
  }

  /**
   * Track add to cart event
   * @param {Object} product - Product object
   * @param {number} quantity - Quantity added
   * Requirements: 2.2, 2.6
   */
  static trackAddToCart(product, quantity) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('add_to_cart', {
        currency: 'BDT',
        value: product.price * quantity,
        items: [{
          item_id: product._id || product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: quantity
        }],
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Add to Cart Error:', error);
    });

    // Mirror to Meta Pixel.
    MetaPixelTracker.trackAddToCart({
      contentIds: [product._id || product.id || product.sku],
      value: product.price * quantity,
      numItems: quantity,
      contentName: product.name,
    });
  }

  /**
   * Track remove from cart event
   * @param {Object} product - Product object
   * @param {number} quantity - Quantity removed
   * Requirements: 2.5, 2.6
   */
  static trackRemoveFromCart(product, quantity) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('remove_from_cart', {
        currency: 'BDT',
        value: product.price * quantity,
        items: [{
          item_id: product._id || product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: quantity
        }],
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Remove from Cart Error:', error);
    });

    // Mirror to Meta Pixel (custom event — Meta has no standard RemoveFromCart).
    MetaPixelTracker.trackCustomEvent('RemoveFromCart', {
      content_ids: [product._id || product.id || product.sku],
      value: product.price * quantity,
      currency: 'BDT',
    });
  }

  /**
   * Track begin checkout event
   * @param {Array} cart - Array of cart items
   * @param {number} value - Total cart value
   * Requirements: 2.3, 2.6
   */
  static trackBeginCheckout(cart, value) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('begin_checkout', {
        currency: 'BDT',
        value: value,
        items: cart.map(item => ({
          item_id: item.product._id || item.product.id,
          item_name: item.product.name,
          item_category: item.product.category,
          price: item.product.price,
          quantity: item.quantity
        })),
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Begin Checkout Error:', error);
    });

    // Mirror to Meta Pixel.
    const checkoutItems = cart?.items || cart || [];
    MetaPixelTracker.trackInitiateCheckout({
      contentIds: MetaPixelTracker.toContentIds(checkoutItems),
      value,
      numItems: checkoutItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    });
  }

  /**
   * Track purchase event
   * @param {Object} order - Order object with orderId, total, items, paymentMethod
   * Requirements: 2.4, 2.6
   */
  static trackPurchase(order) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('purchase', {
        transaction_id: order.orderId,
        currency: 'BDT',
        value: order.total,
        shipping: order.deliveryFee,
        items: order.items.map(item => ({
          item_id: item.product._id || item.product,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        payment_method: order.paymentMethod,
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Purchase Error:', error);
    });

    // Mirror to Meta Pixel — `Purchase` is the conversion event ads optimize for.
    MetaPixelTracker.trackPurchase({
      value: order.total,
      contentIds: MetaPixelTracker.toContentIds(order.items || []),
    });
  }

  /**
   * Track search event
   * @param {string} searchTerm - Search query
   * @param {number} resultCount - Number of results
   * Requirements: 3.1
   */
  static trackSearch(searchTerm, resultCount) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('search', {
        search_term: searchTerm,
        result_count: resultCount,
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Search Error:', error);
    });

    // Mirror to Meta Pixel.
    MetaPixelTracker.trackSearch({ searchString: searchTerm });
  }

  /**
   * Track filter applied event
   * @param {string} filterType - Type of filter (e.g., category, price)
   * @param {string} filterValue - Filter value
   * Requirements: 3.2
   */
  static trackFilterApplied(filterType, filterValue) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('filter_applied', {
        filter_type: filterType,
        filter_value: filterValue,
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Filter Applied Error:', error);
    });
  }

  /**
   * Track sort applied event
   * @param {string} sortMethod - Sort method (e.g., price_asc, name_desc)
   * Requirements: 3.3
   */
  static trackSortApplied(sortMethod) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('sort_applied', {
        sort_method: sortMethod,
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Sort Applied Error:', error);
    });
  }

  /**
   * Track payment method selected event
   * @param {string} method - Payment method (e.g., card, cash, bkash)
   * Requirements: 3.4
   */
  static trackPaymentMethodSelected(method) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('payment_method_selected', {
        payment_method: method,
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Payment Method Selected Error:', error);
    });

    // Mirror to Meta Pixel.
    MetaPixelTracker.trackAddPaymentInfo({ method });
  }

  /**
   * Track quotation request event (B2B)
   * @param {Object} quotation - Quotation object with id, total, items
   * Requirements: 3.5
   */
  static trackQuotationRequest(quotation) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('quotation_request', {
        quotation_id: quotation.id,
        value: quotation.total,
        item_count: quotation.items.length,
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Quotation Request Error:', error);
    });

    // Mirror to Meta Pixel — quote requests are B2B sales leads.
    MetaPixelTracker.trackLead({ value: quotation.total });
  }

  /**
   * Track credit usage event (B2B)
   * @param {number} amount - Amount of credit used
   * @param {number} remaining - Remaining credit balance
   * Requirements: 3.5
   */
  static trackCreditUsage(amount, remaining) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event('credit_usage', {
        amount: amount,
        remaining: remaining,
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Credit Usage Error:', error);
    });
  }

  /**
   * Track generic custom event
   * @param {string} eventName - Event name (e.g., 'cart_sidebar_open', 'scroll_to_top_click')
   * @param {Object} params - Event parameters
   * Requirements: Generic event tracking for UI interactions
   */
  static trackEvent(eventName, params = {}) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.event(eventName, {
        ...params,
        session_id: this.sessionId
      });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Track Event Error:', error);
    });
  }

  /**
   * Set user ID for authenticated users
   * @param {string} userId - User ID
   * Requirements: 1.3
   */
  static setUserId(userId) {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.set({ user_id: userId });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Set User ID Error:', error);
    });
  }

  /**
   * Clear user ID on logout
   * Requirements: 1.3
   */
  static clearUserId() {
    const p = this._whenReady();
    if (!p) return;

    p.then((ReactGA) => {
      ReactGA.set({ user_id: null });
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') console.error('GA4 Clear User ID Error:', error);
    });
  }
}

export default GA4Tracker;