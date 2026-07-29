'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

export default function OneSignalProvider() {
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!ONESIGNAL_APP_ID) {
      console.warn('[OneSignal] NEXT_PUBLIC_ONESIGNAL_APP_ID is not set');
      return;
    }

    let retries = 0;
    const MAX_RETRIES = 200;

    const initOneSignal = () => {
      if (typeof window.OneSignalDeferred === 'undefined') {
        retries++;
        if (retries >= MAX_RETRIES) return;
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
        } catch {
        }
      });
    };

    initOneSignal();
  }, [retryKey]);

  if (!ONESIGNAL_APP_ID) return null;

  const handleError = () => {
    if (process.env.NODE_ENV === 'development') console.warn('[OneSignal] Script failed to load — retrying...');
    setRetryKey(k => k + 1);
  };

  return (
    <Script
      key={retryKey}
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      onError={handleError}
    />
  );
}
