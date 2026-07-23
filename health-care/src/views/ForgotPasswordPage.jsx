"use client";

import { useState } from 'react';
import { API } from '@/constants/api';
import { ButtonLoader, LoadingOverlay } from '@/components/ui/Spinner';

export default function ForgotPasswordPage({ onNavigateToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      
      // Always show success message to prevent email enumeration
      if (res.ok || res.status === 200) {
        setSuccess(true);
      } else {
        throw new Error(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 sm:p-6">
      {/* Loading Overlay */}
      {loading && (
        <LoadingOverlay 
          message="Sending reset link..." 
          variant="medical"
        />
      )}
      
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="font-[family-name:var(--font-lora)] text-[28px] sm:text-[32px] font-semibold text-[#0B2545] mb-2">
            Mediport<span className="text-[#0E8A6E]">BD</span>
          </div>
          <p className="text-[12px] sm:text-[13px] text-[var(--color-text-secondary)]">
            Reset your password
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 sm:p-8 shadow-sm border-[0.5px] border-[var(--color-border-tertiary)]">
          {success ? (
            <div className="text-center">
              <div className="text-[36px] sm:text-[40px] mb-3 sm:mb-4">📧</div>
              <h3 className="text-[15px] sm:text-[16px] font-semibold mb-2 font-[family-name:var(--font-plus-jakarta)]">
                Check your email
              </h3>
              <p className="text-[11px] sm:text-[12px] text-[var(--color-text-secondary)] mb-4 sm:mb-6 px-2">
                If an account exists with <strong className="break-all">{email}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] mb-3 sm:mb-4">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={onNavigateToLogin}
                className="text-[11px] sm:text-[12px] text-[#0E8A6E] font-medium hover:underline"
              >
                ← Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4 sm:mb-6">
                <p className="text-[12px] sm:text-[13px] text-[var(--color-text-secondary)] mb-3 sm:mb-4">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {/* Error — aria-live ensures screen readers announce failures */}
              <div role="alert" aria-live="polite" aria-atomic="true">
                {error && (
                  <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[11px] sm:text-[12px]">
                    {error}
                  </div>
                )}
              </div>

              <div className="mb-4 sm:mb-6">
                <label htmlFor="forgot-email" className="block text-[11px] sm:text-[12px] font-medium mb-1 text-[var(--color-text-primary)] font-[family-name:var(--font-plus-jakarta)]">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full px-2.5 sm:px-3 py-2.5 sm:py-[10px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] sm:text-[13px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-[#0E8A6E]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3 bg-[#0B2545] text-white rounded-lg text-[12px] sm:text-[13px] font-semibold disabled:opacity-50 hover:bg-[#0d2d52] transition-colors min-h-[48px]"
              >
                {loading ? (
                  <>
                    <ButtonLoader />
                    Sending…
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          <div className="mt-4 sm:mt-6 text-center">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-[11px] sm:text-[12px] text-[var(--color-text-secondary)] hover:text-[#0E8A6E]"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
