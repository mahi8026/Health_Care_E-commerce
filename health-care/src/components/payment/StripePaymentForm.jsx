"use client";

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Spinner from '@/components/ui/Spinner';

export default function StripePaymentForm({ amount, orderId, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent on backend
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('medcore_token');
      const response = await fetch(`${API_BASE}/api/payments/stripe/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, orderId })
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onError && onError(stripeError);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess && onSuccess(paymentIntent);
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '14px',
        color: '#0B2545',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        '::placeholder': {
          color: '#94A3B8'
        }
      },
      invalid: {
        color: '#EF4444'
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg p-4">
        <label className="block text-[12px] font-medium mb-2 text-[var(--color-text-secondary)]">
          Card Details
        </label>
        <div className="p-3 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[12px]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#635BFF] text-white px-4 py-3 rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#5449E0] transition-colors"
      >
        {loading ? (
          <>
            <Spinner size="small" color="white" />
            Processing...
          </>
        ) : (
          <>
            💳 Pay ${amount}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z" fill="currentColor" />
        </svg>
        Secured by Stripe
      </div>
    </form>
  );
}
