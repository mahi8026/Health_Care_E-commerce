"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

export default function LoginPage({ onSwitchToRegister, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for OAuth errors in URL
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      const errorMessages = {
        'authentication_failed': 'Google authentication failed. Please try again.',
        'google_auth_failed': 'Unable to sign in with Google. Please try again.',
        'server_error': 'Server error occurred. Please try again later.',
        'missing_tokens': 'Authentication incomplete. Please try again.'
      };
      setError(errorMessages[errorParam] || 'An error occurred. Please try again.');
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.');
    } else {
      // Call onSuccess if provided (for modal usage)
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect based on user role
        const userData = result.user || result.data?.user;
        if (userData?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    }
  };

  // Quick login buttons for testing
  const quickLogin = async (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setError('');
    const result = await login(testEmail, testPassword);
    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.');
    } else {
      if (onSuccess) {
        onSuccess();
      } else {
        const userData = result.user || result.data?.user;
        if (userData?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)] flex items-center justify-center p-4 md:p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6 md:mb-8">
          <div className="font-[family-name:var(--font-lora)] text-[28px] md:text-[32px] font-semibold text-[#0B2545] mb-2">
            MedCore<span className="text-[#0E8A6E]">BD</span>
          </div>
          <p className="text-[12px] md:text-[13px] text-[var(--color-text-secondary)]">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg p-5 md:p-8 shadow-sm border-[0.5px] md:border border-[var(--color-border-tertiary)]">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[12px]">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="mb-4"
              style={{ minHeight: '48px', fontSize: '16px' }}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="mb-2"
              style={{ minHeight: '48px', fontSize: '16px' }}
            />

            {/* Forgot password link */}
            <div className="text-right mb-4">
              <button
                type="button"
                onClick={() => {
                  // Navigate to reset password — works in both SPA and Next.js routing
                  if (typeof window !== 'undefined') {
                    window.location.href = '/reset-password';
                  }
                }}
                className="text-[12px] text-[#0E8A6E] hover:underline min-h-[44px] inline-flex items-center"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mb-4 min-h-[52px]"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border-tertiary)]"></div>
            </div>
            <div className="relative flex justify-center text-[13px]">
              <span className="px-4 bg-white text-[var(--color-text-secondary)]">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <GoogleLoginButton fullWidth className="mb-4" />

          {/* Divider */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-border-tertiary)]"></div>
                </div>
                <div className="relative flex justify-center text-[13px]">
                  <span className="px-4 bg-white text-[var(--color-text-secondary)] font-medium">
                    Quick Login (Testing)
                  </span>
                </div>
              </div>

              {/* Quick Login Buttons - Enhanced Design */}
              <div className="space-y-2 md:space-y-3">
                {/* B2B Customer Button */}
                <button
                  type="button"
                  onClick={() => quickLogin('shahid@squarehospital.com', 'password123')}
                  className="group w-full px-4 md:px-5 py-3 md:py-4 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white rounded-xl text-[13px] md:text-[14px] font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2 md:gap-3 min-h-[48px]"
                >
                  <span className="text-[20px] md:text-[24px] group-hover:scale-110 transition-transform duration-300">🏢</span>
                  <span>Login as B2B Customer</span>
                </button>

                {/* Admin Button */}
                <button
                  type="button"
                  onClick={() => quickLogin('admin@medcorebd.com', 'admin123')}
                  className="group w-full px-4 md:px-5 py-3 md:py-4 bg-gradient-to-r from-[#0E8A6E] to-[#0c7a61] hover:from-[#0c7a61] hover:to-[#0a6a51] text-white rounded-xl text-[13px] md:text-[14px] font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2 md:gap-3 min-h-[48px]"
                >
                  <span className="text-[20px] md:text-[24px] group-hover:scale-110 transition-transform duration-300">👨‍💼</span>
                  <span>Login as Admin</span>
                </button>

                {/* Customer Button */}
                <button
                  type="button"
                  onClick={() => quickLogin('kamal@example.com', 'password123')}
                  className="group w-full px-4 md:px-5 py-3 md:py-4 bg-gradient-to-r from-[#0B2545] to-[#0d2d52] hover:from-[#0d2d52] hover:to-[#0f3560] text-white rounded-xl text-[13px] md:text-[14px] font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2 md:gap-3 min-h-[48px]"
                >
                  <span className="text-[20px] md:text-[24px] group-hover:scale-110 transition-transform duration-300">👤</span>
                  <span>Login as Customer</span>
                </button>
              </div>
            </>
          )}

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-[#0E8A6E] font-medium hover:underline min-h-[44px] inline-flex items-center"
              >
                Register here
              </button>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 md:mt-6 text-center text-[10px] md:text-[11px] text-[var(--color-text-secondary)]">
          <p>Secure login with JWT authentication</p>
        </div>
      </div>
    </div>
  );
}
