'use client';

import { useEffect } from 'react';

/**
 * Applies the `fonts-loaded` class to <html> AFTER React hydration so the
 * web-font switch (globals.css progressive enhancement) never conflicts with
 * React's SSR HTML — mutating document.documentElement before hydration
 * caused a hydration mismatch (React error #418) logged in console.
 */
export default function FontsLoadedEnhancer() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const webFontsAvailable =
        typeof document.fonts !== 'undefined' &&
        document.fonts.check('1em "Plus Jakarta Sans"') &&
        document.fonts.check('1em Lora');
      root.classList.toggle('fonts-loaded', webFontsAvailable);
    };

    apply();
    if (typeof document.fonts !== 'undefined' && document.fonts.ready) {
      document.fonts.ready.then(apply).catch(() => root.classList.remove('fonts-loaded'));
    }
  }, []);

  return null;
}