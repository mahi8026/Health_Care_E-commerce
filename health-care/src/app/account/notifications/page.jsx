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

  const token = typeof window !== 'undefined' ? localStorage.getItem('medcore_token') : null;

  const SETTINGS = [
    { key: 'orderUpdates',  icon: '📦', label: 'Order Updates',  desc: 'Confirmed, shipped, delivered notifications' },
    { key: 'flashDeals',    icon: '🔥', label: 'Flash Deals',    desc: 'Limited-time offers and discounts' },
    { key: 'stockAlerts',   icon: '📋', label: 'Stock Alerts',   desc: 'When wishlisted items come back in stock' },
    { key: 'refundUpdates', icon: '💚', label: 'Refund Updates', desc: 'Refund approval and processing status' },
    { key: 'quoteUpdates',  icon: '📝', label: 'Quote Updates',  desc: 'B2B quotation approval notifications' },
  ];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 24, fontWeight: 700,
        color: '#0B2545', marginBottom: 6 }}>
        Notification Settings
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
        Control which notifications you receive from MediportBD
      </p>

      {/* Master toggle */}
      <div style={{ background: isSubscribed ? '#E1F5EE' : '#F9FAFB',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        border: `1px solid ${isSubscribed ? '#9FE1CB' : '#E5E7EB'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700,
            color: isSubscribed ? '#065F46' : '#0B2545' }}>
            {isSubscribed ? '🔔 Notifications Enabled' : '🔕 Notifications Disabled'}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            {isSubscribed
              ? 'You are receiving push notifications on this device'
              : 'Enable to receive order updates and deals'}
          </div>
        </div>
        <button
          onClick={() => isSubscribed ? unsubscribe() : subscribe(token)}
          disabled={isLoading || !isSupported}
          style={{
            padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: (isLoading || !isSupported) ? 'not-allowed' : 'pointer',
            border: 'none', fontFamily: 'inherit',
            background: isSubscribed ? '#FCEBEB' : '#0E8A6E',
            color: isSubscribed ? '#791F1F' : '#fff',
            opacity: (isLoading || !isSupported) ? 0.6 : 1,
          }}>
          {isLoading ? '...' : isSubscribed ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Individual preferences */}
      {isSubscribed && (
        <div style={{ background: '#fff', borderRadius: 12,
          border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB', fontSize: 12,
            fontWeight: 700, color: '#6B7280', textTransform: 'uppercase',
            letterSpacing: '0.08em' }}>
            Notification Types
          </div>
          {SETTINGS.map((s, idx) => (
            <div key={s.key}
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center',
                gap: 14, borderBottom: idx < SETTINGS.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>{s.desc}</div>
              </div>
              {/* Toggle switch */}
              <div
                onClick={() => setPrefs(p => ({ ...p, [s.key]: !p[s.key] }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                  background: prefs[s.key] ? '#0E8A6E' : '#D1D5DB',
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
        <div style={{ background: '#FFF7ED', border: '1px solid #FCD34D',
          borderRadius: 10, padding: '12px 16px', marginTop: 16,
          fontSize: 13, color: '#633806' }}>
          ⚠️ Push notifications are not supported in this browser.
          Try Chrome on Android or Safari on iOS 16.4+.
        </div>
      )}

      {permission === 'denied' && (
        <div style={{ background: '#FCEBEB', border: '1px solid #F0797B',
          borderRadius: 10, padding: '12px 16px', marginTop: 16,
          fontSize: 13, color: '#791F1F' }}>
          🚫 Notifications are blocked. To enable:
          Click the 🔒 lock icon in your browser address bar →
          Find &quot;Notifications&quot; → Change to &quot;Allow&quot; → Refresh page.
        </div>
      )}
    </div>
  );
}
