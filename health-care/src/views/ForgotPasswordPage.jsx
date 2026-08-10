"use client";

import Alert from '@/components/ui/Alert';
import BrandLogo from '@/components/ui/BrandLogo';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/constants/api';
import { ButtonLoader, LoadingOverlay } from '@/components/ui/Spinner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validateField = (name, value) => {
    let newErrors = { ...errors };
    if (!value || !value.trim()) {
      newErrors[name] = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(value)) {
      newErrors[name] = 'Invalid email format';
    } else {
      delete newErrors[name];
    }
    setErrors(newErrors);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

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
        <div className="text-center mb-5">
          <BrandLogo size="lg" />
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-2">
            Reset your password
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 sm:p-8 shadow-sm border-[0.5px] border-[var(--color-border-tertiary)]">
          {success ? (
            <div className="text-center">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">&#128231;</div>
              <h3 className="text-base sm:text-base font-semibold mb-2 font-[family-name:var(--font-plus-jakarta)]">
                Check your email
              </h3>
              <p className="text-xs sm:text-xs text-[var(--color-text-secondary)] mb-4 sm:mb-6 px-2">
                If an account exists with <strong className="break-all">{email}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="text-xs sm:text-xs text-[var(--color-text-secondary)] mb-3 sm:mb-4">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="text-xs sm:text-xs text-brand-teal font-medium hover:underline"
              >
                &larr; Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-3 sm:mb-4">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {/* Error — aria-live ensures screen readers announce failures */}
              <div aria-live="polite" aria-atomic="true">
                {error && (
                  <Alert className="mb-3 sm:mb-4">{error}</Alert>
                )}
              </div>

              <div className="mb-4 sm:mb-6">
                <label htmlFor="forgot-email" className="block text-sm font-medium mb-1 text-[var(--color-text-primary)] font-[family-name:var(--font-plus-jakarta)]">
                  Email Address <span className="text-[var(--color-status-danger)]">*</span>
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full px-2.5 sm:px-3 py-2.5 sm:py-[10px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-base font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-brand-teal"
                />
                {errors.email && <p className="text-[var(--color-status-danger)] text-xs mt-1">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3 bg-brand-navy text-white rounded-lg text-xs sm:text-sm font-semibold disabled:opacity-50 hover:bg-[var(--color-brand-navy-hover)] transition-colors min-h-[48px]"
              >
                {loading ? (
                  <>
                    <ButtonLoader />
                    Sending&hellip;
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
              onClick={() => router.push('/login')}
              className="text-xs sm:text-xs text-[var(--color-text-secondary)] hover:text-brand-teal"
            >
              &larr; Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
