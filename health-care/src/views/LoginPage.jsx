"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function LoginPage({ onSwitchToRegister, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.');
    } else if (onSuccess) {
      onSuccess();
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
    } else if (onSuccess) {
      onSuccess();
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
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg p-8 shadow-sm border-[0.5px] border-[var(--color-border-tertiary)]">
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
                className="text-[12px] text-[#0E8A6E] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mb-4"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-border-tertiary)]"></div>
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="px-2 bg-white text-[var(--color-text-secondary)]">
                    Quick Login (Testing)
                  </span>
                </div>
              </div>

              {/* Quick Login Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => quickLogin('shahid@example.com', 'password123')}
                  className="w-full px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] hover:bg-[var(--color-background-tertiary)] transition-colors"
                >
                  🏢 Login as B2B Customer
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('admin@medcorebd.com', 'admin123')}
                  className="w-full px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] hover:bg-[var(--color-background-tertiary)] transition-colors"
                >
                  👨‍💼 Login as Admin
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('customer@example.com', 'password123')}
                  className="w-full px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] hover:bg-[var(--color-background-tertiary)] transition-colors"
                >
                  👤 Login as Customer
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
                className="text-[#0E8A6E] font-medium hover:underline"
              >
                Register here
              </button>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-[11px] text-[var(--color-text-secondary)]">
          <p>Secure login with JWT authentication</p>
        </div>
      </div>
    </div>
  );
}
