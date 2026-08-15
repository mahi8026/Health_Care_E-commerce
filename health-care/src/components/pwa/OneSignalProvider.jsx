'use client';
import { useCallback, useEffect, useState } from 'react';
import Script from 'next/script';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
// OneSignal is only needed when the user interacts (subscribe bell, admin
// login tags). Load the SDK on the first user interaction, or after this
// fallback delay for sessions with no interaction — keeping ~200KB of
// third-party JS out of the page-load/TBT window entirely.
const FALLBACK_LOAD_MS = 30000;
const LOAD_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

export default function OneSignalProvider() {
  const [retryKey, setRetryKey] = useState(0);
  const [canLoad, setCanLoad] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let loaded = false;
    let timer;
    const load = () => {
      if (loaded) return;
      loaded = true;
      LOAD_EVENTS.forEach((ev) => window.removeEventListener(ev, load, { capture: true }));
      clearTimeout(timer);
      setCanLoad(true);
    };

    LOAD_EVENTS.forEach((ev) =>
      window.addEventListener(ev, load, { passive: true, capture: true })
    );
    timer = setTimeout(load, FALLBACK_LOAD_MS);

    return () => {
      LOAD_EVENTS.forEach((ev) => window.removeEventListener(ev, load, { capture: true }));
      clearTimeout(timer);
    };
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