"use client";

import BrandLogo from '@/components/ui/BrandLogo';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/constants/api';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { ButtonLoader, LoadingOverlay } from '@/components/ui/Spinner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const { executeRecaptcha } = useRecaptcha(recaptchaSiteKey);

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
      let recaptchaToken = null;
      if (recaptchaSiteKey) {
        recaptchaToken = await executeRecaptcha('password_reset');
        // null is acceptable — don't block password reset
      }

      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          ...(recaptchaToken && { recaptchaToken }),
        }),
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
    <div className="flex items-center justify-center py-8 px-4 sm:px-6 bg-[var(--color-background-secondary)]" style={{ minHeight: 'calc(100vh - var(--site-nav-height))' }}>
      {/* Loading Overlay */}
      {loading && (
        <LoadingOverlay
          message="Sending reset link..."
          variant="medical"
        />
      )}

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <BrandLogo />
          </div>
          <p className="text-[var(--color-text-secondary)] text-xs">
            Reset your password
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-[var(--color-border-primary)]">
          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
                Check your email
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6 px-2">
                If an account exists with <strong className="break-all">{email}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-brand-teal font-medium hover:underline"
              >
                ← Back to login
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-text-primary)] text-center mb-2">
                  Forgot Password?
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] text-center">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {/* Error — aria-live ensures screen readers announce failures */}
              <div role="alert" aria-live="polite" aria-atomic="true">
                {error && (
                  <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="forgot-email" className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
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
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal focus:bg-white transition-all"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white font-semibold rounded-xl text-base transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <ButtonLoader />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-[var(--color-text-secondary)] hover:text-brand-teal transition-colors"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
