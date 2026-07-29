'use client';
import { useEffect } from 'react';
import Script from 'next/script';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

/**
 * OneSignalProvider
 *
 * Initialises the OneSignal Web SDK once on the client using Next.js Script component.
 * Renders the OneSignal script tag with proper loading strategy.
 */
export default function OneSignalProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!ONESIGNAL_APP_ID) {
      console.warn('[OneSignal] NEXT_PUBLIC_ONESIGNAL_APP_ID is not set');
      return;
    }

    // Wait for OneSignal script to load, then initialize
    let retries = 0;
    const MAX_RETRIES = 200;

    const initOneSignal = () => {
      if (typeof window.OneSignalDeferred === 'undefined') {
        retries++;
        if (retries >= MAX_RETRIES) {
          if (process.env.NODE_ENV === 'development') console.warn('[OneSignal] Script failed to load after 5s — giving up');
          return;
        }
        setTimeout(initOneSignal, 100);
        return;
      }

      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            safari_web_id: 'web.onesignal.auto.38b1a4de-a361-440e-ae28-b71c05790af2',
            notifyButton: { enable: false },
            serviceWorkerPath: '/OneSignalSDKWorker.js',
            serviceWorkerParam: { scope: '/' },
            allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
          });
        } catch (err) {
          if (process.env.NODE_ENV === 'development') console.error('[OneSignal] Init failed:', err);
        }
      });
    };

    initOneSignal();
  }, []);

  if (!ONESIGNAL_APP_ID) return null;

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      onLoad={() => console.log('[OneSignal] Script loaded')}
      onError={(e) => console.error('[OneSignal] Script load error:', e)}
    />
  );
}
