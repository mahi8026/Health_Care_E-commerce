'use client';
import { useState, useEffect, useCallback } from 'react';

/**
 * usePushNotification — OneSignal-powered hook
 *
 * Uses the global OneSignal object loaded via Script component in OneSignalProvider.
 * Exposes subscribe/unsubscribe API for NotificationBanner and NotificationsPage.
 */
export function usePushNotification() {
  const [permission,   setPermission]   = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSupported,  setIsSupported]  = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supported = 'Notification' in window && 'serviceWorker' in navigator;

    const checkStatus = async () => {
      setIsSupported(supported);
      if (!supported) return;
      setPermission(Notification.permission);

      // Wait for OneSignal to be ready
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            const optedIn = await OneSignal.User.PushSubscription.optedIn;
            setIsSubscribed(!!optedIn);
          } catch {}
        });
      }
    };

    checkStatus();
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return { success: false, reason: 'not_supported' };
    setIsLoading(true);

    try {
      // Request native browser permission first
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setIsLoading(false);
        return { success: false, reason: 'permission_denied' };
      }

      // Wait for OneSignal to be ready and opt in
      return await new Promise((resolve) => {
        if (!window.OneSignalDeferred) {
          setIsLoading(false);
          resolve({ success: false, reason: 'onesignal_not_loaded' });
          return;
        }

        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            await OneSignal.Notifications.requestPermission();
            setIsSubscribed(true);
            setIsLoading(false);
            resolve({ success: true });
          } catch (err) {
            console.error('[OneSignal] subscribe error:', err);
            setIsLoading(false);
            resolve({ success: false, reason: err.message || 'unknown_error' });
          }
        });
      });
    } catch (err) {
      console.error('[usePushNotification] subscribe error:', err);
      setIsLoading(false);
      return { success: false, reason: err.message || 'unknown_error' };
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);

    return await new Promise((resolve) => {
      if (!window.OneSignalDeferred) {
        setIsLoading(false);
        resolve({ success: false, reason: 'onesignal_not_loaded' });
        return;
      }

      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          await OneSignal.User.PushSubscription.optOut();
          setIsSubscribed(false);
          setIsLoading(false);
          resolve({ success: true });
        } catch (err) {
          setIsLoading(false);
          resolve({ success: false, reason: err.message });
        }
      });
    });
  }, []);

  return { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe };
}
