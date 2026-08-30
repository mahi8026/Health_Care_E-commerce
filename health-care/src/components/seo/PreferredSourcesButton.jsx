'use client';

import { useEffect, useRef } from 'react';
import { SITE_CONFIG } from '@/config/seo';

// Google "Preferred Sources" deeplink — official format:
// https://www.google.com/preferences/source?q=<publication domain>
// (developers.google.com/search/docs/appearance/preferred-sources)
const PREFERRED_SOURCE_DOMAIN = (() => {
  try {
    return new URL(SITE_CONFIG.url).hostname.replace(/^www\./, '');
  } catch {
    return 'mediportbd.com';
  }
})();

const PREFERRED_SOURCE_DEEPLINK = `https://www.google.com/preferences/source?q=${PREFERRED_SOURCE_DOMAIN}`;

const FALLBACK_CLASS =
  'preferred-source-fallback inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-teal)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-teal)] hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors';

/**
 * Google "Preferred Sources" follow button — official implementation
 * (developers.google.com/search/docs/appearance/preferred-sources).
 *
 * Renders Google's standard, automatically-localized button inside a
 * declarative container. The SDK (`publisher.js`, loaded once in the root
 * layout with `preferred-sources-control="manual"`) is initialized here on
 * every mount so soft client-side navigations re-scan the DOM.
 *
 * If the SDK cannot load (blocked / offline), a static deeplink to Google's
 * source preferences tool is substituted after a short delay, so users always
 * have a working path. The slot reserves space up front to avoid layout shift.
 *
 * @param {'light'|'dark'} theme Matches Google's official `data-theme` values.
 */
export default function PreferredSourcesButton({ theme = 'light' }) {
  const slotRef = useRef(null);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || slot.childElementCount > 0) return undefined;

    let fallbackLink = null;
    let observer = null;
    let timer = null;

    // Official manual-control integration: the loaded SDK drains this queue
    // and (re)initializes every [google-add-preferred-source-btn] element.
    try {
      (self.PREFERRED_SOURCE = self.PREFERRED_SOURCE || []).push(
        (preferredSource) => {
          try {
            preferredSource.init({ theme });
          } catch {
            /* SDK init failures fall through to the deeplink below */
          }
        }
      );
    } catch {
      /* queue push is best-effort */
    }

    // Graceful degradation: if the SDK never rendered into this slot, swap in
    // the official deeplink to the source preferences tool.
    timer = setTimeout(() => {
      if (!slot.isConnected || slot.childElementCount > 0) return;

      fallbackLink = document.createElement('a');
      fallbackLink.href = PREFERRED_SOURCE_DEEPLINK;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      fallbackLink.className = FALLBACK_CLASS;
      fallbackLink.setAttribute(
        'aria-label',
        `Add ${SITE_CONFIG.name} as a preferred source on Google (opens in a new tab)`
      );
      fallbackLink.textContent = `Add ${SITE_CONFIG.name} as a Preferred Source on Google`;
      slot.appendChild(fallbackLink);

      // If the SDK still arrives late and injects its real button, remove the
      // fallback so only Google's widget remains.
      observer = new MutationObserver(() => {
        if (slot.childElementCount > 1 || slot.firstElementChild !== fallbackLink) {
          if (fallbackLink) fallbackLink.remove();
          if (observer) observer.disconnect();
          observer = null;
        }
      });
      observer.observe(slot, { childList: true });
    }, 3000);

    return () => {
      if (timer) clearTimeout(timer);
      if (observer) observer.disconnect();
      if (fallbackLink && fallbackLink.parentNode === slot) fallbackLink.remove();
    };
  }, [theme]);

  return (
    <div
      ref={slotRef}
      google-add-preferred-source-btn=""
      data-theme={theme}
      className="preferred-source-slot"
    />
  );
}
