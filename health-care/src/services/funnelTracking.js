// health-care/src/services/funnelTracking.js
//
// Phase 4.1 (workstreams B/C/D) — the single centralized funnel-event path.
// Every acquisition-funnel event goes through GA4Tracker (init, session id,
// error handling) exactly once per action — no direct window.gtag calls and
// no double firing. Parameters are built from an explicit allowlist inside
// this module; NEVER pass PII (phone, email, person name, organization
// name) into analytics payloads.
//
// Canonical events (see docs/growth/funnel-data-contract.md):
//   whatsapp_click  — every meaningful WhatsApp CTA click
//   rfq_start       — quotation request form opened
//   rfq_complete    — server-confirmed quotation created

import GA4Tracker from './GA4Tracker';
import { getUtmParams } from '@/utils/attribution';

function currentLocation() {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname + window.location.search;
}

/**
 * Common context for every funnel event: page_location + persisted UTM.
 * UTM keys are campaign tags only (allowlisted upstream in attribution.js).
 */
function baseParams(extra = {}) {
  return {
    ...extra,
    ...(getUtmParams() || {}),
    ...(currentLocation() ? { page_location: currentLocation() } : {}),
  };
}

/**
 * Derive a coarse page_type from a pathname (used for whatsapp_click context).
 * Covers the routes that exist under src/app; anything else falls back to
 * 'other' so the event contract stays stable.
 */
export function derivePageType(pathname) {
  const p = (pathname || '').split('?')[0];
  if (!p || p === '/') return 'home';
  if (p === '/products' || p === '/reagent-store') return 'category';
  if (p.startsWith('/products/')) return 'product';
  if (p.startsWith('/guides')) return 'guide';
  if (p.startsWith('/equipment')) return 'equipment';
  if (p.startsWith('/topics')) return 'topic';
  if (p.startsWith('/b2b')) return 'b2b';
  if (p.startsWith('/quotes') || p.startsWith('/account/quotes')) return 'rfq';
  if (p.startsWith('/cart')) return 'cart';
  if (p.startsWith('/checkout')) return 'checkout';
  return 'other';
}

/**
 * Entry point for an RFQ started on the quote page: where the visitor
 * came from within the site (or 'external'/'direct'). Referrer only —
 * no query strings from foreign origins are read.
 */
export function deriveRfqEntryPoint() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return 'direct';
  try {
    if (!document.referrer) return 'direct';
    const ref = new URL(document.referrer);
    if (ref.origin !== window.location.origin) return 'external';
    return derivePageType(ref.pathname);
  } catch {
    return 'direct';
  }
}

/**
 * WhatsApp CTA click (site-wide funnel stage).
 * Fires exactly once per click from the centralized call site.
 *
 * @param {Object} [context]
 * @param {string} [context.pageType]   derivePageType() result or explicit type
 * @param {string} [context.productId]  product id when on a product context
 * @param {string} [context.category]   category when available
 * @param {string} [context.entryPoint] which CTA (floating_button, product_page, …)
 */
export function trackWhatsAppClick(context = {}) {
  try {
    const extra = {
      event_category: 'engagement',
      page_type: context.pageType || 'other',
    };
    if (context.productId) extra.product_id = String(context.productId);
    if (context.category) extra.category = String(context.category);
    if (context.entryPoint) extra.entry_point = String(context.entryPoint);
    GA4Tracker.trackEvent('whatsapp_click', baseParams(extra));
  } catch {
    // Analytics must never break UX.
  }
}

/**
 * Quotation request form opened (funnel: RFQ start).
 * @param {Object} [options]
 * @param {string} [options.entryPoint] where the RFQ started (derived by caller)
 */
export function trackRfqStart(options = {}) {
  try {
    GA4Tracker.trackEvent(
      'rfq_start',
      baseParams({ entry_point: options.entryPoint || 'quote_request_form' })
    );
  } catch {
    // Analytics must never break UX.
  }
}

/**
 * Quotation request confirmed by the server (funnel: RFQ complete).
 * Fired only after server confirmation — never on click/validation/error.
 *
 * @param {Object} [options]
 * @param {string[]} [options.items]       product ids in the RFQ (non-PII)
 * @param {number}   [options.itemCount]   number of lines
 * @param {string}   [options.segment]     buyer segment when known (e.g. 'b2b')
 * @param {string}   [options.quoteNumber] server quote number when known
 */
export function trackRfqComplete(options = {}) {
  try {
    const items = Array.isArray(options.items) ? options.items : [];
    const extra = {
      item_count:
        typeof options.itemCount === 'number' ? options.itemCount : items.length,
    };
    if (items.length) extra.items = items.map((id) => String(id));
    if (options.segment) extra.segment = String(options.segment);
    if (options.quoteNumber) extra.quote_number = String(options.quoteNumber);
    GA4Tracker.trackEvent('rfq_complete', baseParams(extra));
  } catch {
    // Analytics must never break UX.
  }
}

/**
 * Quotation CTA click — engagement only, NEVER a conversion.
 *
 * Fired by QuoteCtaLink whenever a "Request a quotation" control is activated.
 * Deliberately distinct from:
 *   - `quotation_request` (B2B dashboard tile, unchanged),
 *   - `quote_request_submitted` / `rfq_complete` (server-confirmed, unchanged).
 * Nothing in the app counts `quote_cta_click` as a conversion; it records
 * intent and which page type carried the CTA.
 *
 * @param {Object} [context]
 * @param {string} [context.source]   page type that hosts the CTA (home, category, product, brand_hub)
 * @param {string} [context.pageType] coarse page type for reporting
 */
export function trackQuoteCtaClick(context = {}) {
  try {
    const extra = {
      event_category: 'engagement',
      page_type: context.pageType || 'other',
    };
    if (context.source) extra.source = String(context.source);
    GA4Tracker.trackEvent('quote_cta_click', baseParams(extra));
  } catch {
    // Analytics must never break UX.
  }
}
