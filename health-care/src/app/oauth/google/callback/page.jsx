"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { setToken, setRefreshToken } from '@/utils/api';
import Spinner from '@/components/ui/Spinner';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const authMode = searchParams.get('auth');
        const error = searchParams.get('error');

        if (error) {
          process.env.NODE_ENV !== "production" && console.error('Google OAuth error:', error);
          setStatus('error');
          setTimeout(() => {
            router.push(`/login?error=${error}`);
          }, 1500);
          return;
        }

        // S-12 cookie-auth mode: the backend sets the httpOnly refresh cookie
        // and redirects with NO tokens in the URL (nothing lands in history or
        // logs). Exchange the cookie for an access token via the cookie-only
        // refresh endpoint.
        if (authMode === 'cookie') {
          const data = await api.refreshToken();
          if (!data || !data.token) {
            throw new Error('No access token returned from cookie refresh');
          }
          setToken(data.token);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user-logged-in'));
          }

          setStatus('success');
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
          return;
        }

        // Legacy URL-token mode (AUTH_COOKIES_ENABLED unset) — unchanged.
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');

        if (token && refreshToken) {
          setToken(token);
          setRefreshToken(refreshToken);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user-logged-in'));
          }

          setStatus('success');
          
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          process.env.NODE_ENV !== "production" && console.error('Missing tokens in callback');
          setStatus('error');
          setTimeout(() => {
            router.push('/login?error=missing_tokens');
          }, 1500);
        }
      } catch (error) {
        process.env.NODE_ENV !== "production" && console.error('Callback error:', error);
        setStatus('error');
        setTimeout(() => {
          router.push('/login?error=callback_failed');
        }, 1500);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="text-center">
        <Spinner size="large" />
        {status === 'processing' && (
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Completing Google sign in...
          </p>
        )}
        {status === 'success' && (
          <p className="mt-4 text-[var(--color-status-success)] font-medium">
            ✓ Login successful! Redirecting...
          </p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-[var(--color-status-danger)] font-medium">
            ✗ Authentication failed. Redirecting...
          </p>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <GoogleCallbackContent />
    </Suspense>
  );
}