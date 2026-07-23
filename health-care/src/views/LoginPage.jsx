"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { ButtonLoader, LoadingOverlay } from '@/components/ui/Spinner';

export default function LoginPage({ onSwitchToRegister, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading, user } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
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
    const result = await login(testEmail, testPassword);
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
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Loading Overlay */}
      {loading && (
        <LoadingOverlay 
          message="Signing you in..." 
          variant="medical"
        />
      )}
      
      {/* Full-width form panel */}
      <div className="w-full flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/">
              <span className="font-[family-name:var(--font-lora)] text-3xl font-semibold text-[#0B2545]">
                Mediport<span className="text-[#0E8A6E]">BD</span>
              </span>
            </Link>
            <p className="text-gray-400 text-xs mt-1">Bangladesh&apos;s trusted medical equipment platform</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0B2545] font-[family-name:var(--font-lora)]">
              Sign in to your account
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={handleSwitchToRegister}
                className="text-[#0E8A6E] font-semibold hover:underline"
              >
                Register here
              </button>
            </p>
          </div>

          {/* Error — aria-live ensures screen readers announce login failures */}
          <div role="alert" aria-live="polite" aria-atomic="true">
            {error && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E8A6E]/30 focus:border-[#0E8A6E] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#0E8A6E] hover:underline font-medium"
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E8A6E]/30 focus:border-[#0E8A6E] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0B2545] hover:bg-[#0d2d52] text-white font-semibold rounded-xl text-sm transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
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
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#F8FAFC] text-xs text-gray-400 font-medium uppercase tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google */}
          <GoogleLoginButton fullWidth />

          {/* Dev quick login */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-[#F8FAFC] text-xs text-amber-500 font-semibold uppercase tracking-wider">
                    Dev Quick Login
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'B2B Customer', email: 'shahid@squarehospital.com', pass: 'password123', color: 'from-violet-600 to-violet-700', icon: '🏢' },
                  { label: 'Customer', email: 'kamal@example.com', pass: 'password123', color: 'from-[#0B2545] to-[#0d2d52]', icon: '👤' },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => quickLogin(q.email, q.pass)}
                    className={`w-full py-3 bg-gradient-to-r ${q.color} text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
                  >
                    <span>{q.icon}</span> Login as {q.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Bottom register link (mobile-friendly duplicate) */}
          <p className="mt-8 text-center text-sm text-gray-500">
            New to MediportBD?{' '}
            <button
              type="button"
              onClick={handleSwitchToRegister}
              className="text-[#0E8A6E] font-semibold hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
