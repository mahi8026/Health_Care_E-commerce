"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

export default function RegisterPage({ onSwitchToLogin, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    accountType: 'Retail'
  });
  const [errors, setErrors] = useState({});
  const { register, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.accountType === 'B2B' && !formData.company.trim()) {
      newErrors.company = 'Company name is required for B2B accounts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const result = await register(formData);
    
    if (!result.success) {
      setErrors({ submit: result.error || 'Registration failed. Please try again.' });
    } else if (onSuccess) {
      onSuccess();
    } else {
      const redirect = searchParams?.get('redirect');
      router.push(redirect || '/');
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-6 md:p-6">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-[family-name:var(--font-lora)] text-[32px] font-semibold text-[#0B2545] mb-2">
            MedCore<span className="text-[#0E8A6E]">BD</span>
          </div>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Create your account
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-lg p-8 shadow-sm border-[0.5px] border-[var(--color-border-tertiary)]">
          <form onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="mb-4 p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[12px]">
                {errors.submit}
              </div>
            )}

            {/* Account Type */}
            <div className="mb-6">
              <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2 font-[family-name:var(--font-plus-jakarta)]">
                Account Type
              </label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="Retail"
                    checked={formData.accountType === 'Retail'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`p-4 border-[0.5px] rounded-lg text-center transition-colors ${
                    formData.accountType === 'Retail'
                      ? 'border-[#0B2545] bg-[#0B2545] text-white'
                      : 'border-[var(--color-border-secondary)] hover:bg-[var(--color-background-tertiary)]'
                  }`}>
                    <div className="text-[20px] mb-1">👤</div>
                    <div className="text-[12px] font-medium">Retail Customer</div>
                    <div className="text-[10px] opacity-80 mt-1">Individual purchases</div>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="B2B"
                    checked={formData.accountType === 'B2B'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`p-4 border-[0.5px] rounded-lg text-center transition-colors ${
                    formData.accountType === 'B2B'
                      ? 'border-[#0E8A6E] bg-[#0E8A6E] text-white'
                      : 'border-[var(--color-border-secondary)] hover:bg-[var(--color-background-tertiary)]'
                  }`}>
                    <div className="text-[20px] mb-1">🏢</div>
                    <div className="text-[12px] font-medium">B2B Account</div>
                    <div className="text-[10px] opacity-80 mt-1">Bulk orders, credit terms</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Dr. John Doe"
                error={errors.name}
                required
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                error={errors.email}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                error={errors.password}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                error={errors.confirmPassword}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+880 1712-345678"
                error={errors.phone}
                required
              />

              {formData.accountType === 'B2B' && (
                <Input
                  label="Company Name"
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Your Hospital/Clinic"
                  error={errors.company}
                  required
                />
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mb-4"
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border-tertiary)]"></div>
            </div>
            <div className="relative flex justify-center text-[13px]">
              <span className="px-4 bg-white text-[var(--color-text-secondary)]">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Google Signup Button */}
          <GoogleLoginButton fullWidth className="mb-4" />

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#0E8A6E] font-medium hover:underline"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-[11px] text-[var(--color-text-secondary)]">
          <p>By registering, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
