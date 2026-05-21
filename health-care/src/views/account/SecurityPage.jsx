'use client';

import { useState } from 'react';
import Link from 'next/link';
import AccountPageShell from '@/components/account/AccountPageShell';
import { useAuth } from '@/context/AuthContext';
import { API } from '@/constants/api';
import Button from '@/components/ui/Button';
import { FaShieldAlt, FaKey } from 'react-icons/fa';

export default function SecurityPage() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleResetEmail = async () => {
    if (!user?.email) return;
    setSending(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          text: 'If your account supports email reset, a link has been sent to your inbox.',
          type: 'success',
        });
      } else {
        setMessage({ text: data.message || 'Could not send reset email', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <AccountPageShell
      title="Privacy & Security"
      description="Manage how you sign in and protect your account."
    >
      {message.text && (
        <div
          role="alert"
          className={`mb-4 px-4 py-3 rounded-lg text-[13px] ${
            message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <section className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F0FBF8] flex items-center justify-center text-[#0E8A6E]">
              <FaKey size={16} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0B2545]">Password</h2>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">
                Reset your password via a secure link sent to <strong>{user?.email}</strong>.
              </p>
            </div>
          </div>
          <Button type="button" onClick={handleResetEmail} disabled={sending}>
            {sending ? 'Sending…' : 'Email me a reset link'}
          </Button>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-3">
            Or use the{' '}
            <Link href="/forgot-password" className="text-[#0E8A6E] font-medium hover:underline">
              forgot password page
            </Link>
            .
          </p>
        </section>

        <section className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EEEDFE] flex items-center justify-center text-[#7C3AED]">
              <FaShieldAlt size={16} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0B2545]">Account security</h2>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                Two-factor authentication and session management are managed by your administrator
                for B2B accounts. Contact{' '}
                <a href="mailto:info@medcorebd.com" className="text-[#0E8A6E] hover:underline">
                  info@medcorebd.com
                </a>{' '}
                for security concerns.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AccountPageShell>
  );
}
