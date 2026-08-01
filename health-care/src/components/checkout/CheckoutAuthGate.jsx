"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { FaArrowLeft } from 'react-icons/fa';

export default function CheckoutAuthGate({ onSuccess, onBack }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const { login, register, loading } = useAuth();

  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Register state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    accountType: 'Retail',
    company: '',
  });
  const [registerErrors, setRegisterErrors] = useState({});

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const result = await login(loginData.email, loginData.password);
    if (!result.success) {
      setLoginError(result.error || 'Login failed. Please try again.');
    } else {
      onSuccess();
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const validateRegister = () => {
    const errs = {};
    if (!registerData.name.trim()) errs.name = 'Name is required';
    if (!registerData.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(registerData.email)) errs.email = 'Invalid email format';
    if (!registerData.phone.trim()) errs.phone = 'Phone number is required';
    if (!registerData.password) errs.password = 'Password is required';
    else if (registerData.password.length < 8) errs.password = 'Minimum 8 characters';
    if (registerData.password !== registerData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (registerData.accountType === 'B2B' && !registerData.company.trim()) errs.company = 'Company name is required';
    setRegisterErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    const result = await register(registerData);
    if (!result.success) {
      setRegisterErrors({ submit: result.error || 'Registration failed. Please try again.' });
    } else {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background-tertiary)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Back link */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-brand-teal mb-6 transition-colors"
        >
          <FaArrowLeft size={11} />
          Back to checkout
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 bg-brand-teal-tint rounded-full flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-teal)" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {mode === 'login'
              ? 'Your cart is saved — sign in to place your order.'
              : 'Quick setup — your cart will be waiting.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[var(--color-background-tertiary)] rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'login'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-brand-navy'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'register'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-brand-navy'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--color-border-primary)] p-6 shadow-sm">

          {/* Google login — always visible */}
          <GoogleLoginButton fullWidth className="mb-5" />

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border-primary)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-[var(--color-text-tertiary)]">or continue with email</span>
            </div>
          </div>

          {/* ── Login form ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} noValidate>
              {loginError && (
                <div className="mb-4 px-3 py-2.5 bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-lg text-xs">
                  {loginError}
                </div>
              )}
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="your@email.com"
                required
                className="mb-4"
              />
              <Input
                label="Password"
                type="password"
                name="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Enter your password"
                required
                className="mb-2"
              />
              <div className="text-right mb-5">
                <a
                  href="/forgot-password"
                  className="text-xs text-brand-teal hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Button type="submit" variant="secondary" fullWidth loading={loading} size="lg">
                Sign In &amp; Place Order
              </Button>
            </form>
          )}

          {/* ── Register form ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} noValidate>
              {registerErrors.submit && (
                <div className="mb-4 px-3 py-2.5 bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-lg text-xs">
                  {registerErrors.submit}
                </div>
              )}

              {/* Account type */}
              <div className="flex gap-3 mb-4">
                {['Retail', 'B2B'].map((type) => (
                  <label key={type} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="accountType"
                      value={type}
                      checked={registerData.accountType === type}
                      onChange={(e) => setRegisterData({ ...registerData, accountType: e.target.value })}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-xl text-center transition-colors text-xs font-semibold ${
                      registerData.accountType === type
                        ? type === 'B2B'
                          ? 'border-brand-teal bg-brand-teal-tint text-brand-teal'
                          : 'border-brand-navy bg-brand-navy text-white'
                        : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'
                    }`}>
                      {type === 'Retail' ? '👤 Retail' : '🏢 B2B'}
                    </div>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input
                  label="Full Name"
                  type="text"
                  name="name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  placeholder="Your Full Name"
                  error={registerErrors.name}
                  required
                />
                <Input
                  label="Phone"
                  type="tel"
                  name="phone"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  placeholder="+880 17XX-XXXXXX"
                  error={registerErrors.phone}
                  required
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                placeholder="your@email.com"
                error={registerErrors.email}
                required
                className="mb-3"
              />

              {registerData.accountType === 'B2B' && (
                <Input
                  label="Company / Hospital Name"
                  type="text"
                  name="company"
                  value={registerData.company}
                  onChange={(e) => setRegisterData({ ...registerData, company: e.target.value })}
                  placeholder="Your hospital or clinic name"
                  error={registerErrors.company}
                  required
                  className="mb-3"
                />
              )}

              <div className="grid grid-cols-2 gap-3 mb-5">
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  error={registerErrors.password}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  error={registerErrors.confirmPassword}
                  required
                />
              </div>

              <Button type="submit" variant="secondary" fullWidth loading={loading} size="lg">
                Create Account &amp; Place Order
              </Button>

              <p className="mt-3 text-center text-xs text-[var(--color-text-tertiary)]">
                By registering you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
