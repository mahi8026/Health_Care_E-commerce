'use client';
import { useState } from 'react';
import { usePushNotification } from '@/hooks/usePushNotification';

export default function NotificationSettingsPage() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotification();
  const [prefs, setPrefs] = useState({
    orderUpdates:  true,
    flashDeals:    true,
    stockAlerts:   true,
    refundUpdates: true,
    quoteUpdates:  true,
  });

  // Read lazily inside the click handler — avoids localStorage (a synchronous
  // blocking call) during render and keeps the page SSR-hydration safe.
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('medcore_token') : null);

  const SETTINGS = [
    { key: 'orderUpdates',  icon: '📦', label: 'Order Updates',  desc: 'Confirmed, shipped, delivered notifications' },
    { key: 'flashDeals',    icon: '🔥', label: 'Flash Deals',    desc: 'Limited-time offers and discounts' },
    { key: 'stockAlerts',   icon: '📋', label: 'Stock Alerts',   desc: 'When wishlisted items come back in stock' },
    { key: 'refundUpdates', icon: '💚', label: 'Refund Updates', desc: 'Refund approval and processing status' },
    { key: 'quoteUpdates',  icon: '📝', label: 'Quote Updates',  desc: 'B2B quotation approval notifications' },
  ];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 'var(--text-2xl)', fontWeight: 600,
        color: 'var(--color-brand-navy)', marginBottom: 6 }}>
        Notification Settings
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        Control which notifications you receive from MediportBD
      </p>

      {/* Master toggle */}
      <div style={{ background: isSubscribed ? 'var(--color-brand-teal-tint)' : 'var(--color-background-secondary)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        border: `1px solid ${isSubscribed ? 'var(--color-brand-teal-tint)' : 'var(--color-border-primary)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 600,
            color: isSubscribed ? 'var(--color-status-success)' : 'var(--color-brand-navy)' }}>
            {isSubscribed ? '🔔 Notifications Enabled' : '🔕 Notifications Disabled'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {isSubscribed
              ? 'You are receiving push notifications on this device'
              : 'Enable to receive order updates and deals'}
          </div>
        </div>
        <button
          onClick={() => isSubscribed ? unsubscribe() : subscribe(getToken())}
          disabled={isLoading || !isSupported}
          style={{
            padding: '9px 18px', borderRadius: 8, fontSize: 'var(--text-sm)', fontWeight: 600,
            cursor: (isLoading || !isSupported) ? 'not-allowed' : 'pointer',
            border: 'none', fontFamily: 'inherit',
            background: isSubscribed ? 'var(--color-status-danger-tint)' : 'var(--color-brand-teal)',
            color: isSubscribed ? 'var(--color-status-danger)' : '#fff',
            opacity: (isLoading || !isSupported) ? 0.6 : 1,
          }}>
          {isLoading ? '...' : isSubscribed ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Individual preferences */}
      {isSubscribed && (
        <div style={{ background: '#fff', borderRadius: 12,
          border: '1px solid var(--color-border-primary)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: 'var(--color-background-secondary)',
            borderBottom: '1px solid var(--color-border-primary)', fontSize: 'var(--text-xs)',
            fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase',
            letterSpacing: '0.08em' }}>
            Notification Types
          </div>
          {SETTINGS.map((s, idx) => (
            <div key={s.key}
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center',
                gap: 14, borderBottom: idx < SETTINGS.length - 1 ? '1px solid var(--color-background-tertiary)' : 'none' }}>
              <span style={{ fontSize: 'var(--text-2xl)', flexShrink: 0 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 1 }}>{s.desc}</div>
              </div>
              {/* Toggle switch */}
              <div
                onClick={() => setPrefs(p => ({ ...p, [s.key]: !p[s.key] }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                  background: prefs[s.key] ? 'var(--color-brand-teal)' : 'var(--color-background-muted)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: prefs[s.key] ? 23 : 3, transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSupported && (
        <div style={{ background: 'var(--color-status-warning-tint)', border: '1px solid #FCD34D',
          borderRadius: 10, padding: '12px 16px', marginTop: 16,
          fontSize: 'var(--text-sm)', color: 'var(--color-status-warning)' }}>
          ⚠️ Push notifications are not supported in this browser.
          Try Chrome on Android or Safari on iOS 16.4+.
        </div>
      )}

      {permission === 'denied' && (
        <div style={{ background: 'var(--color-status-danger-tint)', border: '1px solid #F0797B',
          borderRadius: 10, padding: '12px 16px', marginTop: 16,
          fontSize: 'var(--text-sm)', color: 'var(--color-status-danger)' }}>
          🚫 Notifications are blocked. To enable:
          Click the 🔒 lock icon in your browser address bar →
          Find &quot;Notifications&quot; → Change to &quot;Allow&quot; → Refresh page.
        </div>
      )}
    </div>
  );
}
