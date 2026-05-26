'use client';

import { useState, useEffect } from 'react';
import AccountPageShell from '@/components/account/AccountPageShell';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

const PREFS = [
  {
    group: 'Email Notifications',
    items: [
      { key: 'orderUpdates', label: 'Order updates', description: 'Confirmation, status changes, and cancellations' },
      { key: 'deliveryAlerts', label: 'Delivery alerts', description: 'Dispatch and delivery notifications' },
      { key: 'stockAlerts', label: 'Back-in-stock alerts', description: 'When a wishlisted product is available again' },
      { key: 'promotions', label: 'Promotions & offers', description: 'Discounts, seasonal sales, and special deals' },
      { key: 'newsletter', label: 'Newsletter', description: 'Monthly product updates and industry news' },
    ],
  },
  {
    group: 'SMS Notifications',
    items: [
      { key: 'smsOrderUpdates', label: 'Order updates via SMS', description: 'Key order status changes sent to your phone' },
      { key: 'smsDeliveryAlerts', label: 'Delivery alerts via SMS', description: 'Dispatch and out-for-delivery SMS alerts' },
    ],
  },
];

const DEFAULT_PREFS = {
  orderUpdates: true,
  deliveryAlerts: true,
  promotions: false,
  stockAlerts: true,
  newsletter: false,
  smsOrderUpdates: true,
  smsDeliveryAlerts: true,
};

function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E8A6E] focus-visible:ring-offset-2 ${
        checked ? 'bg-[#0E8A6E]' : 'bg-gray-200'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Load preferences from user object
  useEffect(() => {
    if (user?.notificationPreferences) {
      setPrefs({ ...DEFAULT_PREFS, ...user.notificationPreferences });
    }
  }, [user]);

  const handleToggle = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch('/auth/notification-preferences', prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountPageShell
      title="Notification Preferences"
      description="Choose how and when you want to hear from us."
    >
      <div className="space-y-6">
        {PREFS.map(({ group, items }) => (
          <div key={group} className="bg-white rounded-lg border border-[var(--color-border-tertiary)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--color-border-tertiary)] bg-gray-50">
              <h2 className="text-[13px] font-semibold text-[#0B2545]">{group}</h2>
            </div>
            <ul className="divide-y divide-[var(--color-border-tertiary)]">
              {items.map(({ key, label, description }) => (
                <li key={key} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`pref-${key}`}
                      className="text-[13px] font-medium text-[#0B2545] cursor-pointer"
                    >
                      {label}
                    </label>
                    <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">{description}</p>
                  </div>
                  <Toggle
                    id={`pref-${key}`}
                    checked={!!prefs[key]}
                    onChange={(val) => handleToggle(key, val)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {error && (
          <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#0B2545] hover:bg-[#0d2d52] disabled:opacity-60 text-white text-[13px] font-semibold rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          {saved && (
            <span className="text-[12px] text-[#0E8A6E] font-medium flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved
            </span>
          )}
        </div>
      </div>
    </AccountPageShell>
  );
}
