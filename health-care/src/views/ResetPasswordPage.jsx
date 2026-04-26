"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ResetPasswordPage({ onNavigateToLogin }) {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        if (onNavigateToLogin) onNavigateToLogin();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-[family-name:var(--font-lora)] text-[32px] font-semibold text-[#0B2545] mb-2">
            MedCore<span className="text-[#0E8A6E]">BD</span>
          </div>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Set your new password
          </p>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm border-[0.5px] border-[var(--color-border-tertiary)]">
          {success ? (
            <div className="text-center">
              <div className="text-[40px] mb-4">✅</div>
              <h3 className="text-[16px] font-semibold mb-2 font-[family-name:var(--font-plus-jakarta)]">
                Password reset successfully
              </h3>
              <p className="text-[12px] text-[var(--color-text-secondary)] mb-4">
                Redirecting you to login…
              </p>
              <button
                onClick={onNavigateToLogin}
                className="text-[12px] text-[#0E8A6E] font-medium hover:underline"
              >
                Go to login →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[12px]">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[12px] font-medium mb-1 text-[var(--color-text-primary)] font-[family-name:var(--font-plus-jakarta)]">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full px-3 py-[10px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-[#0E8A6E]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-[12px] font-medium mb-1 text-[var(--color-text-primary)] font-[family-name:var(--font-plus-jakarta)]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  className="w-full px-3 py-[10px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-[#0E8A6E]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold disabled:opacity-50 hover:bg-[#0d2d52] transition-colors"
              >
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-[12px] text-[var(--color-text-secondary)] hover:text-[#0E8A6E]"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
