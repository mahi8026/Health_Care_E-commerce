"use client";

import Alert from '@/components/ui/Alert';
import BrandLogo from '@/components/ui/BrandLogo';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API } from '@/constants/api';
import { ButtonLoader, LoadingOverlay } from '@/components/ui/Spinner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validateField = (name, value) => {
    let newErrors = { ...errors };
    if (name === 'password') {
      if (!value) newErrors.password = 'Password is required';
      else if (value.length < 8) newErrors.password = 'Minimum 8 characters';
      else delete newErrors.password;
    } else if (name === 'confirmPassword') {
      if (!value) newErrors.confirmPassword = 'Confirm password is required';
      else if (value !== password) newErrors.confirmPassword = 'Passwords do not match';
      else delete newErrors.confirmPassword;
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
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 sm:p-6">
      {/* Loading Overlay */}
      {loading && (
        <LoadingOverlay 
          message="Resetting your password..." 
          variant="medical"
        />
      )}
      
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-5">
          <BrandLogo size="lg" />
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-2">
            Set your new password
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 sm:p-8 shadow-sm border-[0.5px] border-[var(--color-border-tertiary)]">
          {success ? (
            <div className="text-center">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">âœ…</div>
              <h3 className="text-base sm:text-base font-semibold mb-2 font-[family-name:var(--font-plus-jakarta)]">
                Password reset successfully
              </h3>
              <p className="text-xs sm:text-xs text-[var(--color-text-secondary)] mb-3 sm:mb-4">
                Redirecting you to loginâ€¦
              </p>
              <button
                onClick={() => router.push('/login')}
                className="text-xs sm:text-xs text-brand-teal font-medium hover:underline"
              >
                Go to login â†’
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Error â€” aria-live ensures screen readers announce validation failures */}
              <div aria-live="polite" aria-atomic="true">
                {error && (
                  <Alert className="mb-3 sm:mb-4">{error}</Alert>
                )}
              </div>

              <div className="mb-3 sm:mb-4">
                <label htmlFor="reset-password" className="block text-sm font-medium mb-1 text-[var(--color-text-primary)] font-[family-name:var(--font-plus-jakarta)]">
                  New Password <span className="text-[var(--color-status-danger)]">*</span>
                </label>
                <input
                  id="reset-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full px-2.5 sm:px-3 py-2.5 sm:py-[10px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-base font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-brand-teal"
                />
                {errors.password && <p className="text-[var(--color-status-danger)] text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="mb-4 sm:mb-6">
                <label htmlFor="reset-confirm-password" className="block text-sm font-medium mb-1 text-[var(--color-text-primary)] font-[family-name:var(--font-plus-jakarta)]">
                  Confirm New Password <span className="text-[var(--color-status-danger)]">*</span>
                </label>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Repeat your new password"
                  required
                  autoComplete="new-password"
                  className="w-full px-2.5 sm:px-3 py-2.5 sm:py-[10px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-base font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-brand-teal"
                />
                {errors.confirmPassword && <p className="text-[var(--color-status-danger)] text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-navy text-white rounded-lg text-xs sm:text-sm font-semibold disabled:opacity-50 hover:bg-[var(--color-brand-navy-hover)] transition-colors min-h-[48px]"
              >
                {loading ? (
                  <>
                    <ButtonLoader />
                    Resettingâ€¦
                  </>
                ) : (
                  'Reset Password'
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
              â† Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


