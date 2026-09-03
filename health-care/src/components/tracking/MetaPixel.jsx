// health-care/src/components/tracking/MetaPixel.jsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import MetaPixelTracker from '@/services/MetaPixelTracker';
import GA4Tracker from '@/services/GA4Tracker';

/**
 * MetaPixel — single mount point (added to the root layout) that:
 *  1. Loads & initializes the Meta/Facebook Pixel.
 *  2. Fires PageView on load and on every client-side route change
 *     (Next.js App Router navigations do NOT reload the page, so we must
 *     track them manually).
 *  3. Also forwards GA4 page_view on route change so SPA navigation is
 *     reported correctly to Google Analytics.
 *
 * Renders nothing — all tracking is side-effect based. It is a no-op when
 * NEXT_PUBLIC_META_PIXEL_ID is empty.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const firstRun = useRef(true);

  // Boot the pixel once on mount (fires the initial PageView).
  useEffect(() => {
    if (!pixelId) return;
    MetaPixelTracker.initialize(pixelId);
    MetaPixelTracker.trackPageView();
  }, [pixelId]);

  // Fire PageView on subsequent client-side navigations (skip the initial
  // load — it was already tracked when the pixel booted above).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (typeof window === 'undefined') return;
    MetaPixelTracker.trackPageView();
    GA4Tracker.trackPageView(window.location.pathname, document.title);
  }, [pathname, pixelId]);

  return null;
}