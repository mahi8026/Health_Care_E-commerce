"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthData } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        // Handle error
        console.error('Google OAuth error:', error);
        router.push(`/login?error=${error}`);
        return;
      }

      if (token && refreshToken) {
        // Store tokens
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        // Update auth context
        if (setAuthData) {
          setAuthData({ token, refreshToken });
        }

        // Redirect to home page
        router.push('/');
      } else {
        // Missing tokens
        router.push('/login?error=missing_tokens');
      }
    };

    handleCallback();
  }, [searchParams, router, setAuthData]);

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)] flex items-center justify-center">
      <div className="text-center">
        <Spinner size="large" />
        <p className="mt-4 text-[var(--color-text-secondary)]">
          Completing Google sign in...
        </p>
      </div>
    </div>
  );
}
