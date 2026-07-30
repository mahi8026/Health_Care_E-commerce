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
    <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Back link */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] hover:text-[#0E8A6E] mb-6 transition-colors"
        >
          <FaArrowLeft size={11} />
          Back to checkout
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 bg-[#E1F5EE] rounded-full flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0E8A6E" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-[22px] font-bold text-[#0B2545] font-[family-name:var(--font-lora)]">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            {mode === 'login'
              ? 'Your cart is saved — sign in to place your order.'
              : 'Quick setup — your cart will be waiting.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#F3F4F6] rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              mode === 'login'
                ? 'bg-white text-[#0B2545] shadow-sm'
                : 'text-[#6B7280] hover:text-[#0B2545]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              mode === 'register'
                ? 'bg-white text-[#0B2545] shadow-sm'
                : 'text-[#6B7280] hover:text-[#0B2545]'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">

          {/* Google login — always visible */}
          <GoogleLoginButton fullWidth className="mb-5" />

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[12px] text-[#9CA3AF]">or continue with email</span>
            </div>
          </div>

          {/* ── Login form ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} noValidate>
              {loginError && (
                <div className="mb-4 px-3 py-2.5 bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] rounded-lg text-[12px]">
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
                  className="text-[12px] text-[#0E8A6E] hover:underline"
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
                <div className="mb-4 px-3 py-2.5 bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] rounded-lg text-[12px]">
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
                    <div className={`p-3 border rounded-xl text-center transition-colors text-[12px] font-semibold ${
                      registerData.accountType === type
                        ? type === 'B2B'
                          ? 'border-[#0E8A6E] bg-[#E1F5EE] text-[#0E8A6E]'
                          : 'border-[#0B2545] bg-[#0B2545] text-white'
                        : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
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

              <p className="mt-3 text-center text-[10px] text-[#9CA3AF]">
                By registering you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
