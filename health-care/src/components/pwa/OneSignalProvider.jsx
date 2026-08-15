'use client';
import { useCallback, useEffect, useState } from 'react';
import Script from 'next/script';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const IDLE_TIMEOUT_MS = 3000;

export default function OneSignalProvider() {
  const [retryKey, setRetryKey] = useState(0);
  const [canLoad, setCanLoad] = useState(false);

  // Hold the SDK out of the hydration window: load only after the browser is
  // idle (or 3s at the latest) so ~200KB of third-party JS never competes with
  // React hydration for main-thread time.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setCanLoad(true), { timeout: IDLE_TIMEOUT_MS });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setCanLoad(true), IDLE_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  // Called directly from the Script tag's onLoad — no polling needed.
  // The previous implementation spun a 100ms setTimeout loop (up to 200
  // retries = 20s of timer churn) waiting for the SDK to appear.
  const handleLoad = useCallback(() => {
    if (typeof window === 'undefined' || !ONESIGNAL_APP_ID) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          safari_web_id: 'web.onesignal.auto.38b1a4de-a361-440e-ae28-b71c05790af2',
          notifyButton: { enable: false },
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/' },
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
        });
      } catch {
      }
    });
  }, []);

  if (!ONESIGNAL_APP_ID || !canLoad) return null;

  const handleError = () => {
    if (process.env.NODE_ENV === 'development') console.warn('[OneSignal] Script failed to load — retrying...');
    setRetryKey(k => k + 1);
  };

  return (
    <Script
      key={retryKey}
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}