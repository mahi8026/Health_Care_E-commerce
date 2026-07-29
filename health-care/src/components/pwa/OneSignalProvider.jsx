'use client';
import { useEffect } from 'react';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

/**
 * OneSignalProvider
 *
 * Initialises the OneSignal Web SDK once on the client.
 * Renders nothing — purely a side-effect component.
 * Place inside RootLayout, outside any Suspense boundary.
 */
export default function OneSignalProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!ONESIGNAL_APP_ID) {
      console.warn('[OneSignal] NEXT_PUBLIC_ONESIGNAL_APP_ID is not set');
      return;
    }

    const init = async () => {
      try {
        const OneSignal = (await import('react-onesignal')).default;
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          safari_web_id: 'web.onesignal.auto.38b1a4de-a361-440e-ae28-b71c05790af2',
          // Don't auto-prompt — we show our own custom banner
          promptOptions: { autoPrompt: false },
          notifyButton: { enable: false },
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/' },
          // Allow localhost in development
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
        });
        console.log('[OneSignal] Initialised');
      } catch (err) {
        // Non-fatal — app still works without push
        console.error('[OneSignal] Init failed:', err);
      }
    };

    init();
  }, []);

  return null;
}
