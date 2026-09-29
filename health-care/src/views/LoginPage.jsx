"use client";

// Fixed: Professional card styling with proper navbar integration - v2.0
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { ButtonLoader, LoadingOverlay } from '@/components/ui/Spinner';

export default function LoginPage({ onSwitchToRegister, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  // isSubmitting tracks the actual login action — separate from AuthContext's
  // background auth-check loading (which would otherwise show the overlay on mount)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loading, user } = useAuth();
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const { executeRecaptcha } = useRecaptcha(recaptchaSiteKey);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for OAuth errors in URL
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      const errorMessages = {
        authentication_failed: 'Google authentication failed. Please try again.',
        google_auth_failed: 'Unable to sign in with Google. Please try again.',
        server_error: 'Server error occurred. Please try again later.',
        missing_tokens: 'Authentication incomplete. Please try again.',
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(errorMessages[errorParam] || 'An error occurred. Please try again.');
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirect = searchParams?.get('redirect');
      if (user.role === 'admin') router.push('/admin');
      else if (redirect) router.push(redirect);
      else router.push('/');
    }
  }, [user, router, searchParams]);

  const getRedirectPath = (userData) => {
    const redirect = searchParams?.get('redirect');
    if (userData?.role === 'admin') return '/admin';
    if (redirect) return redirect;
    return '/';
  };

  const validateField = (name, value) => {
    let newErrors = { ...errors };
    if (!value || !value.trim()) {
      newErrors[name] = `${name === 'email' ? 'Email' : 'Password'} is required`;
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
    setIsSubmitting(true);

    // Attempt reCAPTCHA but don't block login if it fails — the token
    // is a soft signal for the backend, not a hard client-side gate.
    // Ad blockers, slow connections, and domain mismatches can all cause
    // executeRecaptcha to return null; blocking login in those cases just
    // prevents legitimate users from signing in.
    let recaptchaToken = null;
    if (recaptchaSiteKey) {
      recaptchaToken = await executeRecaptcha('login');
      // null is acceptable — backend will score the request without it
    }

    const result = await login(email, password, recaptchaToken);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.');
    } else {
      if (onSuccess) onSuccess();
      else router.push(getRedirectPath(result.user || result.data?.user));
    }
  };

  const quickLogin = async (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setError('');
    setIsSubmitting(true);

    let recaptchaToken = null;
    if (recaptchaSiteKey) {
      recaptchaToken = await executeRecaptcha('login');
      // null is acceptable — don't block dev quick-login
    }

    const result = await login(testEmail, testPassword, recaptchaToken);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.');
    } else {
      if (onSuccess) onSuccess();
      else router.push(getRedirectPath(result.user || result.data?.user));
    }
  };

  const handleSwitchToRegister = () => {
    if (onSwitchToRegister) {
      onSwitchToRegister();
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="flex items-center justify-center py-8 px-4 sm:px-6 bg-[var(--color-background-secondary)]" style={{ minHeight: 'calc(100vh - var(--site-nav-height))' }}>
      {/* Loading Overlay — only shown during active login submission, not on initial page load */}
      {isSubmitting && (
        <LoadingOverlay 
          message="Signing you in..." 
          variant="medical"
        />
      )}
      
      {/* Form container with professional card styling */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-[var(--color-border-primary)]">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <BrandLogo />
            </div>
            <p className="text-[var(--color-text-secondary)] text-xs">Bangladesh&apos;s trusted medical equipment platform</p>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-text-primary)] text-center mb-2">
              Sign in to your account
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm text-center">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={handleSwitchToRegister}
                className="text-brand-teal font-semibold hover:underline"
              >
                Register here
              </button>
            </p>
          </div>

          {/* Error — aria-live ensures screen readers announce login failures */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal focus:bg-white transition-all"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-[var(--color-text-primary)]">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-teal hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-3 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white font-semibold rounded-xl text-base transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <ButtonLoader />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border-primary)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google */}
          <GoogleLoginButton fullWidth />

          {/* Dev quick login */}
          {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-[var(--color-border-primary)]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-xs text-orange-600 font-semibold uppercase tracking-wider">
                    Dev Quick Login
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => quickLogin(process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL, process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD)}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-brand-navy to-[var(--color-brand-navy-hover)] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                Login as Dev User
              </button>
            </>
          )}

          {/* Bottom register link */}
          <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
            New to MediportBD?{' '}
            <button
              type="button"
              onClick={handleSwitchToRegister}
              className="text-brand-teal font-semibold hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
