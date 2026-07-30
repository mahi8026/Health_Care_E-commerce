'use client';

/**
 * ServiceWorkerRegistration
 *
 * Registers the service worker for PWA offline support.
 * Must be a Client Component since it uses browser APIs.
 * Rendered inside RootLayout after the page becomes interactive.
 */

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Register after page load to avoid blocking critical rendering
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Always check for SW updates
        });

        // Check for updates every 60 minutes
        const updateInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);

        // Registration logs are only shown in development

        return () => clearInterval(updateInterval);
      } catch {
        // Service worker registration failed silently — app still works normally
      }
    };

    // Defer registration until after page is interactive
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  // Renders nothing — purely side-effect component
  return null;
}
