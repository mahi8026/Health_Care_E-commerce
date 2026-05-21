'use client';

import { useState, useEffect } from 'react';
import AccountPageShell from '@/components/account/AccountPageShell';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const PHONE_REGEX = /^(\+880|880|0)?1[3-9]\d{8}$/;

export default function ProfilePage() {
  const { user, updateProfile, isB2BCustomer } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', companyName: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        companyName: user.companyName || user.company || '',
      });
    }
  }, [user]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();

    if (name.length < 2) {
      showMessage('Name must be at least 2 characters', 'error');
      return;
    }
    if (phone && !PHONE_REGEX.test(phone.replace(/[\s\-+]/g, ''))) {
      showMessage('Enter a valid Bangladesh phone number', 'error');
      return;
    }

    setSaving(true);
    const payload = { name, phone };
    if (isB2BCustomer()) {
      payload.companyName = form.companyName.trim();
    }

    const result = await updateProfile(payload);
    setSaving(false);

    if (result.success) {
      showMessage('Profile updated successfully', 'success');
    } else {
      showMessage(result.error || 'Failed to update profile', 'error');
    }
  };

  return (
    <AccountPageShell
      title="Profile Information"
      description="Update your personal details. Email cannot be changed here."
    >
      {message.text && (
        <div
          role="alert"
          className={`mb-4 px-4 py-3 rounded-lg text-[13px] ${
            message.type === 'success'
              ? 'bg-[#D1FAE5] text-[#065F46]'
              : 'bg-[#FEE2E2] text-[#991B1B]'
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5 sm:p-6 space-y-5"
      >
        <div>
          <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-[13px] bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] cursor-not-allowed"
          />
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
            Contact support to change your email address.
          </p>
        </div>

        <Input
          label="Full name"
          name="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          autoComplete="name"
        />

        <Input
          label="Phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="01XXXXXXXXX"
          autoComplete="tel"
        />

        {isB2BCustomer() && (
          <Input
            label="Company / institution"
            name="companyName"
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            autoComplete="organization"
          />
        )}

        {user?.b2bId && (
          <div className="text-[12px] text-[var(--color-text-secondary)] bg-[#F0FBF8] border border-[#C6EDE4] rounded-lg px-3 py-2">
            B2B ID: <span className="font-semibold text-[#0B2545]">{user.b2bId}</span>
            {user.b2bTier && (
              <span className="ml-2 text-[#0E8A6E] font-medium">· {user.b2bTier}</span>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </AccountPageShell>
  );
}
