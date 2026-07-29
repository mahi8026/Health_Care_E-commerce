'use client';
import { useState, useEffect } from 'react';
import { usePushNotification } from '@/hooks/usePushNotification';
import { useAuth } from '@/context/AuthContext';

export default function NotificationBanner() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe } = usePushNotification();
  const { user, isAuthenticated } = useAuth();
  const [show, setShow]       = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!isSupported) return;
    if (permission === 'granted') return;
    if (permission === 'denied') return;
    const dismissed = localStorage.getItem('push-banner-dismissed-v2');
    if (dismissed) return;
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, [isSupported, permission]);

  if (!show || isSubscribed || subscribed) return null;

  const handleEnable = async () => {
    setError('');
    const result = await subscribe();

    if (result.success || result.reason === 'onesignal_not_loaded') {
      if (isAuthenticated?.() && user?._id) {
        try {
          const OneSignal = (await import('react-onesignal')).default;
          await OneSignal.login(String(user._id));
        } catch {
        }
      }
      setSubscribed(true);
      setShow(false);
    } else {
      switch (result.reason) {
        case 'permission_denied': setShow(false); break;
        case 'not_supported':     setError('Your browser does not support notifications.'); break;
        default:                  setError('Something went wrong. Please try again.'); break;
      }
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('push-banner-dismissed-v2', 'true');
  };

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 9998,
      background: '#0B2545', borderRadius: 16, padding: 16,
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      animation: 'slideUp 0.3s ease', maxWidth: 480, margin: '0 auto',
    }}>
      <style>{'@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}'}</style>

      <button onClick={handleDismiss} style={{
        position: 'absolute', top: 10, right: 12,
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
        fontSize: 18, cursor: 'pointer',
      }}>×</button>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 32, flexShrink: 0 }}>🔔</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            Stay updated with MediportBD
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Get instant alerts for order updates, flash deals, and stock
            notifications — even when your browser is closed.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {['📦 Order updates', '🔥 Flash deals', '📋 Stock alerts'].map(feat => (
          <span key={feat} style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 20,
            background: 'rgba(14,138,110,0.2)', border: '1px solid rgba(77,219,184,0.2)',
            color: '#4DDBB8',
          }}>{feat}</span>
        ))}
      </div>

      {error && (
        <div style={{
          marginBottom: 10, padding: '8px 12px', borderRadius: 8,
          background: 'rgba(226,75,74,0.15)', border: '1px solid rgba(226,75,74,0.3)',
          color: '#FCA5A5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>⚠️</span><span>{error}</span>
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(252,165,165,0.6)', cursor: 'pointer', fontSize: 14, padding: 0 }}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleDismiss} style={{
          flex: 1, padding: '10px', background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
          color: 'rgba(255,255,255,0.65)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Not now
        </button>
        <button onClick={handleEnable} disabled={isLoading} style={{
          flex: 2, padding: '10px', background: isLoading ? 'rgba(14,138,110,0.6)' : '#0E8A6E',
          border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: isLoading ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {isLoading ? (
            <>
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff', borderRadius: '50%',
                display: 'inline-block', animation: 'spin 0.7s linear infinite',
              }} />
              Enabling...
            </>
          ) : '🔔 Enable Notifications'}
        </button>
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
