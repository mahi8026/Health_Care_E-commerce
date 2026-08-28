"use client";

import { useState } from 'react';
import api from '@/utils/api';
import Spinner from '@/components/ui/Spinner';

export default function NagadPaymentForm({ amount, orderId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('initiate'); // initiate | redirect | verify
  const [paymentReferenceId, setPaymentReferenceId] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const handleInitiate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.initiateNagadPayment(amount, orderId);

      // Backend returns NAGAD_NOT_CONFIGURED when credentials aren't set
      if (response.code === 'NAGAD_NOT_CONFIGURED') {
        setNotConfigured(true);
        return;
      }

      const data = response.data || response;
      setPaymentReferenceId(data.paymentReferenceId || '');
      setRedirectUrl(data.redirectUrl || '');

      // Open the Nagad hosted payment page in a new tab
      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank', 'noopener,noreferrer');
      }

      setStep('verify');
    } catch (err) {
      if (
        err.message?.includes('not configured') ||
        err.message?.includes('NAGAD_NOT_CONFIGURED') ||
        err.data?.code === 'NAGAD_NOT_CONFIGURED'
      ) {
        setNotConfigured(true);
      } else {
        setError(err.message || 'Failed to initiate Nagad payment');
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
      const response = await api.verifyNagadPayment(paymentReferenceId, orderId);
      onSuccess && onSuccess(response);
    } catch (err) {
      setError(err.message || 'Payment verification failed. Please contact support.');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Show clear message when Nagad credentials aren't configured yet
  if (notConfigured) {
    return (
      <div className="space-y-3 md:space-y-4">
        <div className="bg-[var(--color-status-warning-tint)] border-[0.5px] border-warning rounded-lg p-3 md:p-4">
          <div className="flex items-start gap-2 md:gap-3">
            <span className="text-xl md:text-2xl">⚠️</span>
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-warning-ink mb-1">
                Nagad Not Available Yet
              </h3>
              <p className="text-xs md:text-xs text-warning-ink">
                Nagad payment integration is pending configuration. Please use Bank Transfer or B2B Credit instead.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onError && onError(new Error('Nagad not configured'))}
          className="w-full text-xs md:text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] py-2"
        >
          ← Choose a different payment method
        </button>
      </div>
    );
  }

  // Step 2: User has been redirected to Nagad, now verify
  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-3 md:space-y-4">
        <div className="bg-[var(--color-status-danger-tint)] border-[0.5px] border-[#F26828] rounded-lg p-3 md:p-4 text-center">
          <div className="text-3xl md:text-4xl mb-2">📱</div>
          <h3 className="text-sm md:text-sm font-semibold mb-1 text-[#F26828]">
            Complete Payment in Nagad
          </h3>
          <p className="text-xs md:text-xs text-[var(--color-text-secondary)] mb-2 md:mb-3 px-2">
            Payment Ref: <span className="font-mono font-semibold text-xs md:text-xs">{paymentReferenceId}</span>
          </p>
          <p className="text-xs md:text-xs text-[var(--color-text-secondary)] px-2">
            1. Complete the payment in the Nagad page that opened<br />
            2. Enter your Nagad PIN to confirm<br />
            3. Click &ldquo;I&apos;ve Paid&rdquo; below once done
          </p>
          {redirectUrl && (
            <a
              href={redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 md:mt-3 text-xs md:text-xs text-[#F26828] underline"
            >
              Re-open Nagad payment page →
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
          className="w-full bg-[#F26828] text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#D95820] transition-colors"
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
          <span className="font-extrabold text-[#F26828] tracking-tight">nagad</span>
        </div>
        <p className="text-xs md:text-xs text-[var(--color-text-secondary)] px-2">
          You will be redirected to Nagad to complete the payment of{' '}
          <strong>৳{amount.toLocaleString()}</strong>
        </p>
      </div>

      <div className="bg-[var(--color-background-tertiary)] rounded-lg p-2 md:p-3 text-xs md:text-xs text-[var(--color-text-secondary)] space-y-1">
        <div>✓ Secure payment via Nagad Online Payment</div>
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
        className="w-full bg-[#F26828] text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#D95820] transition-colors"
      >
        {loading ? (
          <>
            <Spinner size="small" color="white" />
            <span className="hidden sm:inline">Connecting to Nagad…</span>
            <span className="sm:hidden">Connecting…</span>
          </>
        ) : (
          <>📱 Pay ৳{amount.toLocaleString()} with Nagad</>
        )}
      </button>

      <div className="flex items-center justify-center gap-1 text-xs md:text-xs text-[var(--color-text-secondary)]">
        <span>🔒</span>
        <span>Secured by Nagad Online Payment</span>
      </div>
    </form>
  );
}