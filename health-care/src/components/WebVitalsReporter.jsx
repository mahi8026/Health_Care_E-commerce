'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { API } from '@/constants/api';
import GA4Tracker from '@/services/GA4Tracker';

/**
 * WebVitalsReporter - Reports Core Web Vitals metrics to analytics services.
 *
 * - Logs metrics to console in development
 * - Sends all metrics to Google Analytics 4 as custom events
 * - POSTs metrics that exceed defined thresholds to /api/analytics/web-vitals
 *
 * Requirements: 10.1, 10.2, 10.3
 */

const THRESHOLDS = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
  FCP: 1800,
  TTFB: 800,
}

export function WebVitalsReporter() {
  // F10 — boot the tracker client-side. It was previously initialized only in
  // tests, so every trackAddToCart/trackPurchase call in the app no-op'd.
  GA4Tracker.initialize(
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  );

  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      // Web vitals metric logged
    }

    // Send to Google Analytics 4 — lazy-load react-ga4 to keep initial bundle small
    import('react-ga4').then(({ default: ReactGA }) => {
      ReactGA.event({
        category: 'Web Vitals',
        action: metric.name,
        value: Math.round(metric.value),
        label: metric.id,
        nonInteraction: true,
      })
    }).catch(() => { if (process.env.NODE_ENV !== 'production') console.warn('Failed to send web vitals to GA4'); })

    // Send to custom analytics endpoint when metric exceeds threshold
    const threshold = THRESHOLDS[metric.name]
    if (threshold !== undefined && metric.value > threshold) {
      fetch(`${API}/analytics/web-vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          path: window.location.pathname,
          timestamp: Date.now(),
        }),
      }).catch(console.error)
    }
  })

  return null
}

export default WebVitalsReporter
