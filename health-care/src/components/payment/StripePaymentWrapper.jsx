"use client";

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';

// loadStripe is called here so the Stripe SDK is only loaded when this
// wrapper is dynamically imported (i.e. when the user selects Stripe).
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
);

export default function StripePaymentWrapper({ amount, orderId, onSuccess, onError }) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm
        amount={amount}
        orderId={orderId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
