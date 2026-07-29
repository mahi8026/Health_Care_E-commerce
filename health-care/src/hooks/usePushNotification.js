'use client';
import { useState, useEffect, useCallback } from 'react';

/**
 * usePushNotification — OneSignal-powered hook
 *
 * Wraps OneSignal SDK. Exposes the same API surface as before
 * so all existing consumers (NotificationBanner, NotificationsPage, etc.) work unchanged.
 */
export function usePushNotification() {
  const [permission,   setPermission]   = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSupported,  setIsSupported]  = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supported = 'Notification' in window && 'serviceWorker' in navigator;

    // Defer state updates to avoid cascading renders
    Promise.resolve().then(() => {
      setIsSupported(supported);
      if (!supported) return;
      setPermission(Notification.permission);

      // Check if already subscribed via OneSignal
      import('react-onesignal').then(({ default: OneSignal }) => {
        const optedIn = OneSignal.User?.PushSubscription?.optedIn;
        setIsSubscribed(!!optedIn);
      }).catch(() => {});
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return { success: false, reason: 'not_supported' };
    setIsLoading(true);
    try {
      const OneSignal = (await import('react-onesignal')).default;

      // Request native browser permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        return { success: false, reason: 'permission_denied' };
      }

      // Opt the user into OneSignal push
      await OneSignal.User.PushSubscription.optIn();
      setIsSubscribed(true);
      return { success: true };
    } catch (err) {
      console.error('[OneSignal] subscribe error:', err);
      return { success: false, reason: err.message || 'unknown_error' };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const OneSignal = (await import('react-onesignal')).default;
      await OneSignal.User.PushSubscription.optOut();
      setIsSubscribed(false);
      return { success: true };
    } catch (err) {
      return { success: false, reason: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe };
}
