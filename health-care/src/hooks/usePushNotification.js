'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function detectDevice() {
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const browser = /Chrome/i.test(ua) ? 'Chrome'
    : /Firefox/i.test(ua) ? 'Firefox'
    : /Safari/i.test(ua) ? 'Safari'
    : /Edge/i.test(ua) ? 'Edge' : 'Other';
  const os = /Android/i.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
    : /Windows/i.test(ua) ? 'Windows'
    : /Mac/i.test(ua) ? 'macOS' : 'Other';
  return { device: isMobile ? 'mobile' : 'desktop', browser, os };
}

export function usePushNotification() {
  const [permission,   setPermission]   = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSupported,  setIsSupported]  = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch (err) {
      // Silently fail
      console.error('Check subscription error:', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initialize support check
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    
    // Defer state updates to avoid cascading renders
    Promise.resolve().then(() => {
      setIsSupported(supported);
      if (supported) {
        setPermission(Notification.permission);
        checkSubscription();
      }
    });
  }, [checkSubscription]);

  const subscribe = useCallback(async (token) => {
    if (!isSupported) return { success: false, reason: 'not_supported' };

    setIsLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        return { success: false, reason: 'permission_denied' };
      }

      // Get service worker registration
      const reg = await navigator.serviceWorker.ready;

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJSON = sub.toJSON();
      const { device, browser, os } = detectDevice();

      // Send to backend
      const res = await fetch(`${API}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subJSON.endpoint,
            keys: {
              p256dh: subJSON.keys.p256dh,
              auth:   subJSON.keys.auth,
            },
          },
          device, browser, os,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSubscribed(true);
        return { success: true };
      }
      return { success: false, reason: 'server_error' };
    
    } catch (err) {
      console.error('[Push] Subscribe error:', err);
      return { success: false, reason: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch(`${API}/push/unsubscribe`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
      }
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
