'use client';
import { confirmAction } from '@/components/ui/ConfirmDialog';

import { useState } from 'react';
import Link from 'next/link';
import AccountPageShell from '@/components/account/AccountPageShell';
import { useAuth } from '@/context/AuthContext';
import { API } from '@/constants/api';
import api from '@/utils/api';
import Button from '@/components/ui/Button';
import { FaShieldAlt, FaKey, FaMobileAlt } from 'react-icons/fa';

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

  // 2FA state
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupStep, setSetupStep] = useState('idle'); // idle, setup, verify, complete
  const [twoFactorMessage, setTwoFactorMessage] = useState({ text: '', type: '' });

  // Load 2FA status on mount
  useState(() => {
    const load = async () => {
      try {
        const data = await api.get('/auth/2fa/status');
        if (data.success) {
          setTwoFactorStatus(data.data);
          setSetupStep(data.data?.isEnabled ? 'complete' : 'idle');
        }
      } catch {
        // 2FA status unavailable — silently ignore
      }
    };
    load();
  });

  const handleSetup2FA = async () => {
    setTwoFactorLoading(true);
    setTwoFactorMessage({ text: '', type: '' });
    try {
      const data = await api.post('/auth/2fa/setup', {});
      if (data.success) {
        setQrCode(data.data.qrCode);
        setSecret(data.data.secret);
        setSetupStep('verify');
      } else {
        setTwoFactorMessage({ text: data.message || 'Failed to setup 2FA', type: 'error' });
      }
    } catch (err) {
      setTwoFactorMessage({ text: err.message || 'Failed to setup 2FA', type: 'error' });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleEnable2FA = async (e) => {
    e.preventDefault();
    setTwoFactorLoading(true);
    setTwoFactorMessage({ text: '', type: '' });
    try {
      const data = await api.post('/auth/2fa/enable', { token: verificationCode });
      if (data.success) {
        setTwoFactorMessage({ text: 'Two-factor authentication enabled!', type: 'success' });
        setSetupStep('complete');
        setVerificationCode('');
        setTwoFactorStatus(prev => ({ ...prev, isEnabled: true, enabledAt: new Date() }));
      } else {
        setTwoFactorMessage({ text: data.message || 'Invalid verification code', type: 'error' });
      }
    } catch (err) {
      setTwoFactorMessage({ text: err.message || 'Failed to enable 2FA', type: 'error' });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!await confirmAction('Disable two-factor authentication? This will make your account less secure.')) return;
    setTwoFactorLoading(true);
    try {
      const data = await api.post('/auth/2fa/disable', {});
      if (data.success) {
        setTwoFactorMessage({ text: 'Two-factor authentication disabled.', type: 'success' });
        setSetupStep('idle');
        setQrCode(null);
        setSecret(null);
        setTwoFactorStatus(prev => ({ ...prev, isEnabled: false }));
      } else {
        setTwoFactorMessage({ text: data.message || 'Failed to disable 2FA', type: 'error' });
      }
    } catch (err) {
      setTwoFactorMessage({ text: err.message || 'Failed to disable 2FA', type: 'error' });
    } finally {
      setTwoFactorLoading(false);
    }
  };

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
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* In-Page Password Change Form */}
        <section className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-brand-teal-tint flex items-center justify-center text-brand-teal">
              <FaKey size={16} />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-brand-navy">Change Password</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Update your password directly without leaving this page.
              </p>
            </div>
          </div>

          {passwordMessage.text && (
            <div
              role="alert"
              className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                passwordMessage.type === 'success' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-brand-navy mb-1.5">
                Current password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-sm focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"
                placeholder="Enter current password"
                disabled={changingPassword}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-brand-navy mb-1.5">
                New password
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-sm focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"
                placeholder="Enter new password (min 8 characters)"
                disabled={changingPassword}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-navy mb-1.5">
                Confirm new password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-sm focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"
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
            <div className="w-10 h-10 rounded-lg bg-brand-teal-tint flex items-center justify-center text-brand-teal">
              <FaKey size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-brand-navy">Reset via Email</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Reset your password via a secure link sent to <strong>{user?.email}</strong>.
              </p>
            </div>
          </div>
          <Button type="button" onClick={handleResetEmail} disabled={sending}>
            {sending ? 'Sending…' : 'Email me a reset link'}
          </Button>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-3">
            Or use the{' '}
            <Link href="/forgot-password" className="text-brand-teal font-medium hover:underline">
              forgot password page
            </Link>
            .
          </p>
        </section>

        <section className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#EEEDFE] flex items-center justify-center text-[#7C3AED]">
              <FaMobileAlt size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-brand-navy">Two-Factor Authentication</h2>
                {setupStep === 'complete' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]">✓ Enabled</span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Add an extra layer of security — require a code from your authenticator app at login.
              </p>
            </div>
          </div>

          {twoFactorMessage.text && (
            <div role="alert" className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              twoFactorMessage.type === 'success' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
            }`}>
              {twoFactorMessage.text}
            </div>
          )}

          {/* Idle — not yet set up */}
          {setupStep === 'idle' && (
            <div>
              <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-[#5B21B6] mb-2">You&apos;ll need:</p>
                <ul className="space-y-1 text-xs text-[#6D28D9]">
                  <li>• An authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>• Your smartphone — takes about 2 minutes</li>
                </ul>
              </div>
              <Button type="button" onClick={handleSetup2FA} disabled={twoFactorLoading}>
                {twoFactorLoading ? 'Setting up…' : 'Enable Two-Factor Authentication'}
              </Button>
            </div>
          )}

          {/* Verify — scan QR and enter code */}
          {setupStep === 'verify' && qrCode && (
            <div>
              <p className="text-sm font-semibold text-brand-navy mb-3">Step 1 — Scan this QR code with your authenticator app:</p>
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl border-2 border-[#DDD6FE]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" loading="lazy" />
                </div>
              </div>
              {secret && (
                <div className="bg-[var(--color-background-secondary)] border border-[var(--color-border-primary)] rounded-lg p-3 mb-4">
                  <p className="text-xs text-[var(--color-text-secondary)] mb-1">Can&apos;t scan? Enter this code manually:</p>
                  <code className="block text-center font-mono text-xs text-brand-navy break-all">{secret}</code>
                </div>
              )}
              <form onSubmit={handleEnable2FA}>
                <p className="text-sm font-semibold text-brand-navy mb-2">Step 2 — Enter the 6-digit code from your app:</p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-[var(--color-border-secondary)] rounded-lg text-center text-2xl font-mono indent-[0.4em] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 mb-4"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setSetupStep('idle'); setQrCode(null); setSecret(null); setVerificationCode(''); }}
                    className="px-4 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={twoFactorLoading || verificationCode.length !== 6}>
                    {twoFactorLoading ? 'Verifying…' : 'Verify & Enable'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Complete — 2FA is active */}
          {setupStep === 'complete' && (
            <div>
              <div className="bg-[var(--color-status-success-tint)] border border-[#6EE7B7] rounded-lg p-4 mb-4 flex items-start gap-3">
                <span className="text-lg">🛡️</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-status-success)]">Two-factor authentication is active</p>
                  <p className="text-xs text-[var(--color-status-success)] mt-0.5">
                    You&apos;ll need your authenticator app code each time you log in.
                    {twoFactorStatus?.enabledAt && (
                      <> Enabled on {new Date(twoFactorStatus.enabledAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}.</>
                    )}
                  </p>
                </div>
              </div>
              <div className="bg-[var(--color-status-warning-tint)] border border-[var(--color-status-warning-tint)] rounded-lg p-3 mb-4">
                <p className="text-xs text-[var(--color-status-warning)]">
                  ⚠️ If you lose access to your authenticator app, contact{' '}
                  <a href="mailto:mahimrahman07@gmail.com" className="font-semibold underline">mahimrahman07@gmail.com</a>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDisable2FA}
                disabled={twoFactorLoading}
                className="px-4 py-2.5 border border-[var(--color-status-danger)] text-[var(--color-status-danger)] rounded-lg text-sm font-medium hover:bg-[var(--color-status-danger-tint)] disabled:opacity-50"
              >
                {twoFactorLoading ? 'Disabling…' : 'Disable Two-Factor Authentication'}
              </button>
            </div>
          )}
        </section>
      </div>
    </AccountPageShell>
  );
}
