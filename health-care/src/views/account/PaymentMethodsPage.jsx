'use client';

import { useState } from 'react';
import AccountPageShell from '@/components/account/AccountPageShell';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

const PAYMENT_ICONS = {
  bkash: (
    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#E2136E]/10 text-[#E2136E] font-semibold text-sm">
      bK
    </span>
  ),
  bank: (
    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="10" width="18" height="11" rx="1" />
        <path d="M3 10l9-7 9 7" />
        <line x1="12" y1="10" x2="12" y2="21" />
        <line x1="7" y1="14" x2="7" y2="21" />
        <line x1="17" y1="14" x2="17" y2="21" />
      </svg>
    </span>
  ),
};

function BkashForm({ phone, onSave, onCancel }) {
  const [value, setValue] = useState(phone || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = value.replace(/\s/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleaned)) {
      setError('Enter a valid Bangladeshi mobile number (e.g. 01XXXXXXXXX)');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.patch('/auth/profile', { bkashPhone: cleaned });
      onSave(cleaned);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="bkash-phone" className="block text-sm font-medium text-brand-navy mb-1">
          bKash mobile number
        </label>
        <input
          id="bkash-phone"
          type="tel"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          placeholder="01XXXXXXXXX"
          maxLength={11}
          className="w-full max-w-xs px-3 py-2 text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
        />
        {error && <p className="text-xs text-[var(--color-status-danger)] mt-1" role="alert" aria-live="polite">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-[#E2136E] hover:bg-[#c91060] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save number'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-[var(--color-border-primary)] text-xs font-medium text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-background-secondary)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function PaymentMethodsPage() {
  const { user, updateProfile } = useAuth();
  const [editingBkash, setEditingBkash] = useState(false);
  const [bkashPhone, setBkashPhone] = useState(user?.bkashPhone || '');
  const [saved, setSaved] = useState(false);

  const handleBkashSave = (phone) => {
    setBkashPhone(phone);
    setEditingBkash(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // Refresh user context
    updateProfile({});
  };

  return (
    <AccountPageShell
      title="Payment Methods"
      description="Manage your saved payment details for faster checkout."
    >
      <div className="space-y-4">
        {/* bKash */}
        <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5">
          <div className="flex items-start gap-3">
            {PAYMENT_ICONS.bkash}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-brand-navy">bKash</p>
                  {bkashPhone ? (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {bkashPhone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">No number saved</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBkash(v => !v)}
                  className="text-xs font-medium text-brand-teal hover:underline flex-shrink-0"
                >
                  {bkashPhone ? 'Edit' : 'Add'}
                </button>
              </div>
              {editingBkash && (
                <BkashForm
                  phone={bkashPhone}
                  onSave={handleBkashSave}
                  onCancel={() => setEditingBkash(false)}
                />
              )}
              {saved && !editingBkash && (
                <p className="text-xs text-brand-teal font-medium mt-2 flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bank Transfer */}
        <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5">
          <div className="flex items-start gap-3">
            {PAYMENT_ICONS.bank}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-navy">Bank Transfer</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Pay via NPSB, BEFTN, or direct bank transfer. Reference details provided at checkout.
              </p>
              <div className="mt-3 p-3 bg-[var(--color-background-secondary)] rounded-lg text-xs text-[var(--color-text-secondary)] space-y-1">
                <p><span className="font-medium text-brand-navy">Bank:</span> Dutch-Bangla Bank Ltd</p>
                <p><span className="font-medium text-brand-navy">Account:</span> MediportBD Ltd — 1234567890</p>
                <p><span className="font-medium text-brand-navy">Branch:</span> Nawabpur Road, Dhaka</p>
              </div>
            </div>
          </div>
        </div>

        {/* B2B Credit — only for B2B customers */}
        {user?.role === 'b2b_customer' && (
          <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-navy/10 text-brand-navy">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                  <line x1="10" y1="14" x2="14" y2="14" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-navy">B2B Credit Line</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Available credit: ৳{((user.creditLimit || 0) - (user.creditUsed || 0)).toLocaleString()}
                  {' '}of ৳{(user.creditLimit || 0).toLocaleString()}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Payment terms: {user.paymentTerms || 30} days. Contact your account manager to increase your credit limit.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--color-text-secondary)] px-1">
          Card payments are not currently available. We accept bKash, bank transfer, and B2B credit.
        </p>
      </div>
    </AccountPageShell>
  );
}
