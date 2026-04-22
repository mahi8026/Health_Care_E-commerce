"use client";

import { useState } from 'react';
import { initiateBkashPayment, verifyBkashPayment } from '@/utils/payment';
import Spinner from '@/components/ui/Spinner';

export default function BkashPaymentForm({ amount, orderId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('initiate'); // initiate, verify
  const [paymentId, setPaymentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);

  const handleInitiate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await initiateBkashPayment(amount, orderId);
      setPaymentId(response.paymentId);
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Failed to initiate bKash payment');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await verifyBkashPayment(paymentId, orderId);
      onSuccess && onSuccess(response);
    } catch (err) {
      setError(err.message || 'Failed to verify payment');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="bg-[#FBEAF0] border-[0.5px] border-[#E2136E] rounded-lg p-4 text-center">
          <div className="text-[32px] mb-2">📱</div>
          <h3 className="text-[14px] font-semibold mb-1 text-[#E2136E]">
            Complete Payment in bKash App
          </h3>
          <p className="text-[12px] text-[var(--color-text-secondary)] mb-3">
            Payment ID: <span className="font-mono font-semibold">{paymentId}</span>
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            1. Open bKash app on your phone<br />
            2. Enter your PIN to confirm payment<br />
            3. Click verify below once completed
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[12px]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E2136E] text-white px-4 py-3 rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#C91160] transition-colors"
        >
          {loading ? (
            <>
              <Spinner size="small" color="white" />
              Verifying...
            </>
          ) : (
            <>
              ✓ Verify Payment
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setStep('initiate')}
          className="w-full text-[var(--color-text-secondary)] text-[12px] hover:text-[var(--color-text-primary)]"
        >
          ← Back
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleInitiate} className="space-y-4">
      <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg p-4">
        <label className="block text-[12px] font-medium mb-2 text-[var(--color-text-secondary)]">
          bKash Account Number
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="01XXXXXXXXX"
          required
          className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#E2136E]"
        />
      </div>

      <div className="bg-[#FBEAF0] rounded-lg p-3 text-[11px] text-[var(--color-text-secondary)]">
        <div className="flex items-start gap-2">
          <span className="text-[#E2136E]">ℹ️</span>
          <div>
            You will receive a payment request on your bKash app. 
            Enter your PIN to complete the payment.
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[12px]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !phoneNumber}
        className="w-full bg-[#E2136E] text-white px-4 py-3 rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#C91160] transition-colors"
      >
        {loading ? (
          <>
            <Spinner size="small" color="white" />
            Initiating...
          </>
        ) : (
          <>
            📱 Pay ৳{amount.toLocaleString()} with bKash
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z" fill="currentColor" />
        </svg>
        Secured by bKash
      </div>
    </form>
  );
}
