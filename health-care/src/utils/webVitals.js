'use client';

/**
 * Web Vitals reporting utility.
 * Captures Core Web Vitals and sends them to Google Analytics 4.
 * Also tracks page load times and API response times.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.9, 13.10
 */

// ── CWV thresholds (ms / unitless) ───────────────────────────────────────────
const THRESHOLDS = {
  LCP:  2500,  // Largest Contentful Paint — good: <2.5s
  FID:  100,   // First Input Delay — good: <100ms
  CLS:  0.1,   // Cumulative Layout Shift — good: <0.1
  INP:  200,   // Interaction to Next Paint — good: <200ms
  TTFB: 800,   // Time to First Byte — good: <800ms
};

/**
 * Send a single metric to Google Analytics 4.
 * Requires window.gtag to be available (loaded via GA4 script in layout.jsx).
 *
 * @param {import('web-vitals').Metric} metric
 */
export function reportWebVitals(metric) {
  // Send to GA4
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', metric.name, {
      value:        Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id:    metric.id,
      metric_delta: Math.round(metric.name === 'CLS' ? metric.delta * 1000 : metric.delta),
      metric_rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    });
  }

  // Warn in console when a threshold is exceeded (Req 13.10)
  const threshold = THRESHOLDS[metric.name];
  if (threshold !== undefined && metric.value > threshold) {
    console.warn(
      `[CWV] ${metric.name} exceeded threshold: ${metric.value.toFixed(2)} > ${threshold}`,
      { id: metric.id, rating: metric.rating }
    );
  }
}

/**
 * Register all Core Web Vitals observers.
 * Call this once from a client component (e.g. root layout or _app).
 *
 * Requirements: 13.2, 13.3
 */
export async function initWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    const { onCLS, onFID, onLCP, onTTFB, onINP } = await import('web-vitals');
    onCLS(reportWebVitals);
    onFID(reportWebVitals);
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);
    onINP(reportWebVitals);
  } catch {
    // web-vitals not available — silently skip
  }
}

/**
 * Track page load time using the Navigation Timing API.
 * Sends a custom GA4 event with the full page load duration.
 *
 * Requirements: 13.3, 13.4
 */
export function trackPageLoad() {
  if (typeof window === 'undefined' || !window.performance) return;

  // Wait for the load event to complete before reading timing
  const reportTiming = () => {
    const [nav] = performance.getEntriesByType('navigation');
    if (!nav) return;

    const loadTime = Math.round(nav.loadEventEnd - nav.startTime);
    const ttfb     = Math.round(nav.responseStart - nav.requestStart);
    const domReady = Math.round(nav.domContentLoadedEventEnd - nav.startTime);

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_load_time', {
        load_time_ms:  loadTime,
        ttfb_ms:       ttfb,
        dom_ready_ms:  domReady,
        page_path:     window.location.pathname,
      });
    }

    if (loadTime > 3800) {
      console.warn(`[Perf] Slow page load: ${loadTime}ms on ${window.location.pathname}`);
    }
  };

  if (document.readyState === 'complete') {
    reportTiming();
  } else {
    window.addEventListener('load', reportTiming, { once: true });
  }
}

/**
 * Mark the start of an API call for client-side timing.
 * Pair with measureApiCall() after the response arrives.
 *
 * @param {string} markName - Unique name for this measurement (e.g. 'api:getProducts')
 *
 * Requirements: 13.4, 13.5
 */
export function markApiStart(markName) {
  if (typeof window === 'undefined' || !window.performance) return;
  try {
    performance.mark(`${markName}:start`);
  } catch {
    // Ignore — PerformanceObserver not available
  }
}

/**
 * Measure the duration of an API call and send to GA4.
 *
 * @param {string} markName  - Same name used in markApiStart()
 * @param {string} [endpoint] - Optional endpoint label for GA4
 *
 * Requirements: 13.4, 13.5
 */
export function measureApiCall(markName, endpoint = markName) {
  if (typeof window === 'undefined' || !window.performance) return;
  try {
    performance.mark(`${markName}:end`);
    performance.measure(markName, `${markName}:start`, `${markName}:end`);

    const [entry] = performance.getEntriesByName(markName, 'measure');
    if (!entry) return;

    const duration = Math.round(entry.duration);

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'api_response_time', {
        endpoint,
        duration_ms: duration,
      });
    }

    if (duration > 2000) {
      console.warn(`[Perf] Slow API call: ${endpoint} took ${duration}ms`);
    }

    // Clean up marks/measures to avoid memory leaks
    performance.clearMarks(`${markName}:start`);
    performance.clearMarks(`${markName}:end`);
    performance.clearMeasures(markName);
  } catch {
    // Ignore — PerformanceObserver not available
  }
}
