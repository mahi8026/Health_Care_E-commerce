'use client';

import { useState } from 'react';
import Link from 'next/link';
import AccountPageShell from '@/components/account/AccountPageShell';
import { useAuth } from '@/context/AuthContext';
import { API } from '@/constants/api';
import api from '@/utils/api';
import Button from '@/components/ui/Button';
import { FaShieldAlt, FaKey } from 'react-icons/fa';

export default function SecurityPage() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage({ text: 'All fields are required', type: 'error' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ text: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (response.success) {
        setPasswordMessage({ text: 'Password updated successfully.', type: 'success' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage({ text: response.message || 'Failed to update password', type: 'error' });
      }
    } catch (error) {
      setPasswordMessage({ 
        text: error.message || 'Failed to update password. Please try again.', 
        type: 'error' 
      });
    } finally {
      setChangingPassword(false);
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
        {/* In-Page Password Change Form */}
        <section className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F0FBF8] flex items-center justify-center text-[#0E8A6E]">
              <FaKey size={16} />
            </div>
            <div className="flex-1">
              <h2 className="text-[15px] font-semibold text-[#0B2545]">Change Password</h2>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">
                Update your password directly without leaving this page.
              </p>
            </div>
          </div>

          {passwordMessage.text && (
            <div
              role="alert"
              className={`mb-4 px-4 py-3 rounded-lg text-[13px] ${
                passwordMessage.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-[13px] font-medium text-[#0B2545] mb-1.5">
                Current password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10"
                placeholder="Enter current password"
                disabled={changingPassword}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-[13px] font-medium text-[#0B2545] mb-1.5">
                New password
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10"
                placeholder="Enter new password (min 8 characters)"
                disabled={changingPassword}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-[#0B2545] mb-1.5">
                Confirm new password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10"
                placeholder="Re-enter new password"
                disabled={changingPassword}
              />
            </div>

            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </section>

        {/* Email Reset Link (Alternative Method) */}
        <section className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F0FBF8] flex items-center justify-center text-[#0E8A6E]">
              <FaKey size={16} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0B2545]">Reset via Email</h2>
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
