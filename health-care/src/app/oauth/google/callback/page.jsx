"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken, setRefreshToken } from '@/utils/api';
import { API } from '@/constants/api';
import Spinner from '@/components/ui/Spinner';

/**
 * Google OAuth Callback Page
 *
 * The backend redirects here with ?state=<32-byte-hex-code> after OAuth succeeds.
 * We exchange that state code for the real token pair via GET /api/auth/google/tokens,
 * which consumes the code (one-time use, 2-min TTL) and returns the JWT pair.
 *
 * This avoids putting tokens in the URL — they were previously getting stripped
 * by the www-redirect (mediportbd.com → www.mediportbd.com) or leaking into logs.
 */
function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Backend may pass an error param directly
        const error = searchParams.get('error');
        if (error) {
          setStatus('error');
          setTimeout(() => router.push(`/login?error=${error}`), 1500);
          return;
        }

        // New state-code flow — exchange the code for tokens server-side
        const state = searchParams.get('state');
        if (state) {
          const res = await fetch(`${API}/auth/google/tokens?state=${encodeURIComponent(state)}`, {
            credentials: 'include',
          });
          const data = await res.json();

          if (!res.ok || !data.token || !data.refreshToken) {
            throw new Error(data.message || 'Token exchange failed');
          }

          setToken(data.token);
          setRefreshToken(data.refreshToken);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user-logged-in'));
          }

          setStatus('success');
          setTimeout(() => { window.location.href = '/'; }, 800);
          return;
        }

        // Fallback: legacy URL-token mode (token/refreshToken in query params)
        // Kept for backward compatibility — can be removed once state-code is stable
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');

        if (token && refreshToken) {
          setToken(token);
          setRefreshToken(refreshToken);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user-logged-in'));
          }

          setStatus('success');
          setTimeout(() => { window.location.href = '/'; }, 800);
          return;
        }

        // Nothing usable in the URL
        setStatus('error');
        setTimeout(() => router.push('/login?error=missing_tokens'), 1500);

      } catch (err) {
        console.error('[OAuth Callback] Error:', err?.message, err);
        setStatus('error');
        setTimeout(() => router.push('/login?error=callback_failed'), 1500);
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
