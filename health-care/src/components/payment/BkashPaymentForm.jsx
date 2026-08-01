"use client";

import { useState } from 'react';
import api from '@/utils/api';
import Spinner from '@/components/ui/Spinner';

export default function BkashPaymentForm({ amount, orderId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('initiate'); // initiate | redirect | verify
  const [paymentID, setPaymentID] = useState('');
  const [bkashURL, setBkashURL] = useState('');
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const handleInitiate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.initiateBkashPayment(amount, orderId);

      // Backend returns BKASH_NOT_CONFIGURED when credentials aren't set
      if (response.code === 'BKASH_NOT_CONFIGURED') {
        setNotConfigured(true);
        return;
      }

      setPaymentID(response.paymentID);
      setBkashURL(response.bkashURL);

      // Open bKash payment page in a new tab
      if (response.bkashURL) {
        window.open(response.bkashURL, '_blank', 'noopener,noreferrer');
      }

      setStep('verify');
    } catch (err) {
      if (err.message?.includes('not configured') || err.message?.includes('BKASH_NOT_CONFIGURED')) {
        setNotConfigured(true);
      } else {
        setError(err.message || 'Failed to initiate bKash payment');
        onError && onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Execute the payment (confirms it on bKash side)
      const response = await api.post('/payments/bkash/execute', { paymentID });
      onSuccess && onSuccess(response);
    } catch (err) {
      setError(err.message || 'Payment verification failed. Please contact support.');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Show clear message when bKash credentials aren't configured yet
  if (notConfigured) {
    return (
      <div className="space-y-3 md:space-y-4">
        <div className="bg-[var(--color-status-warning-tint)] border-[0.5px] border-warning rounded-lg p-3 md:p-4">
          <div className="flex items-start gap-2 md:gap-3">
            <span className="text-xl md:text-2xl">⚠️</span>
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-[var(--color-status-warning)] mb-1">
                bKash Not Available Yet
              </h3>
              <p className="text-xs md:text-xs text-[var(--color-status-warning)]">
                bKash payment integration is pending configuration. Please use Bank Transfer or B2B Credit instead.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onError && onError(new Error('bKash not configured'))}
          className="w-full text-xs md:text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] py-2"
        >
          ← Choose a different payment method
        </button>
      </div>
    );
  }

  // Step 2: User has been redirected to bKash, now verify
  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-3 md:space-y-4">
        <div className="bg-[var(--color-status-danger-tint)] border-[0.5px] border-[#E2136E] rounded-lg p-3 md:p-4 text-center">
          <div className="text-3xl md:text-4xl mb-2">📱</div>
          <h3 className="text-sm md:text-sm font-semibold mb-1 text-[#E2136E]">
            Complete Payment in bKash
          </h3>
          <p className="text-xs md:text-xs text-[var(--color-text-secondary)] mb-2 md:mb-3 px-2">
            Payment ID: <span className="font-mono font-semibold text-xs md:text-xs">{paymentID}</span>
          </p>
          <p className="text-xs md:text-xs text-[var(--color-text-secondary)] px-2">
            1. Complete the payment in the bKash page that opened<br />
            2. Enter your bKash PIN to confirm<br />
            3. Click &ldquo;I&apos;ve Paid&rdquo; below once done
          </p>
          {bkashURL && (
            <a
              href={bkashURL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 md:mt-3 text-xs md:text-xs text-[#E2136E] underline"
            >
              Re-open bKash payment page →
            </a>
          )}
        </div>

        {error && (
          <div className="p-2 md:p-3 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-lg text-xs md:text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E2136E] text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#C91160] transition-colors"
        >
          {loading ? (
            <>
              <Spinner size="small" color="white" />
              Verifying…
            </>
          ) : (
            '✓ I\'ve Paid — Confirm'
          )}
        </button>

        <button
          type="button"
          onClick={() => { setStep('initiate'); setError(null); }}
          className="w-full text-[var(--color-text-secondary)] text-xs md:text-xs hover:text-[var(--color-text-primary)]"
        >
          ← Start over
        </button>
      </form>
    );
  }

  // Step 1: Initiate
  return (
    <form onSubmit={handleInitiate} className="space-y-3 md:space-y-4">
      <div className="bg-[var(--color-status-danger-tint)] rounded-lg p-3 md:p-4 text-center">
        <div className="text-4xl md:text-5xl mb-2">
          <img
            src="https://www.bkash.com/sites/default/files/bkash-logo.png"
            alt="bKash"
            className="h-6 md:h-8 mx-auto"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
          />
          <span style={{ display: 'none' }}>bKash</span>
        </div>
        <p className="text-xs md:text-xs text-[var(--color-text-secondary)] px-2">
          You will be redirected to bKash to complete the payment of{' '}
          <strong>৳{amount.toLocaleString()}</strong>
        </p>
      </div>

      <div className="bg-[var(--color-background-tertiary)] rounded-lg p-2 md:p-3 text-xs md:text-xs text-[var(--color-text-secondary)] space-y-1">
        <div>✓ Secure payment via bKash Tokenized Checkout</div>
        <div>✓ No card details required</div>
        <div>✓ Instant confirmation</div>
      </div>

      {error && (
        <div className="p-2 md:p-3 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-lg text-xs md:text-xs">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#E2136E] text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#C91160] transition-colors"
      >
        {loading ? (
          <>
            <Spinner size="small" color="white" />
            <span className="hidden sm:inline">Connecting to bKash…</span>
            <span className="sm:hidden">Connecting…</span>
          </>
        ) : (
          <>📱 Pay ৳{amount.toLocaleString()} with bKash</>
        )}
      </button>

      <div className="flex items-center justify-center gap-1 text-xs md:text-xs text-[var(--color-text-secondary)]">
        <span>🔒</span>
        <span>Secured by bKash Tokenized Checkout</span>
      </div>
    </form>
  );
}
