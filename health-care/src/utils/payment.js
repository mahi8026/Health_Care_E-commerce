import api from './api';

// Stripe Payment
export async function createStripePaymentIntent(amount, orderId) {
  try {
    const response = await api.post('/payments/stripe/create-intent', {
      amount,
      orderId,
      currency: 'usd'
    });
    return response;
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error('Failed to create payment intent:', error);
    throw error;
  }
}

export async function confirmStripePayment(paymentIntentId, orderId) {
  try {
    const response = await api.post('/payments/stripe/confirm', {
      paymentIntentId,
      orderId
    });
    return response;
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error('Failed to confirm payment:', error);
    throw error;
  }
}

// bKash Payment
export async function initiateBkashPayment(amount, orderId) {
  try {
    const response = await api.post('/payments/bkash/initiate', {
      amount,
      orderId
    });
    return response;
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error('Failed to initiate bKash payment:', error);
    throw error;
  }
}

export async function verifyBkashPayment(paymentId, orderId) {
  try {
    const response = await api.post('/payments/bkash/verify', {
      paymentId,
      orderId
    });
    return response;
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error('Failed to verify bKash payment:', error);
    throw error;
  }
}

// SSL Commerz Payment
export async function initiateSSLCommerzPayment(amount, orderId) {
  try {
    const response = await api.post('/payments/sslcommerz/initiate', {
      amount,
      orderId
    });
    return response;
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error('Failed to initiate SSL Commerz payment:', error);
    throw error;
  }
}

// Bank Transfer
export async function submitBankTransfer(orderId, transactionReference) {
  try {
    const response = await api.post('/payments/bank/submit', {
      orderId,
      transactionReference
    });
    return response;
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error('Failed to submit bank transfer:', error);
    throw error;
  }
}

// B2B Credit Payment
export async function processB2BCreditPayment(orderId) {
  try {
    const response = await api.post('/payments/credit/process', {
      orderId
    });
    return response;
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error('Failed to process B2B credit payment:', error);
    throw error;
  }
}

// Format currency
export function formatCurrency(amount, currency = 'BDT') {
  if (currency === 'BDT') {
    return `৳${amount.toLocaleString()}`;
  } else if (currency === 'USD') {
    return `$${amount.toLocaleString()}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

// Convert BDT to USD (approximate rate)
export function convertBDTtoUSD(amountBDT) {
  const exchangeRate = 110; // 1 USD = 110 BDT (approximate)
  return (amountBDT / exchangeRate).toFixed(2);
}

// Payment method labels
export const PAYMENT_METHODS = {
  stripe: {
    id: 'stripe',
    label: 'Credit/Debit Card',
    description: 'Pay securely with Visa, Mastercard, or American Express',
    icon: '💳',
    color: '#635BFF'
  },
  bkash: {
    id: 'bkash',
    label: 'bKash',
    description: 'Pay with bKash mobile wallet',
    icon: '📱',
    color: '#E2136E'
  },
  nagad: {
    id: 'nagad',
    label: 'Nagad',
    description: 'Pay with Nagad mobile wallet',
    icon: '📱',
    color: '#F15D22'
  },
  bank: {
    id: 'bank',
    label: 'Bank Transfer',
    description: 'Direct bank transfer (BEFTN/NPSB)',
    icon: '🏦',
    color: '#185FA5'
  },
  credit: {
    id: 'credit',
    label: 'B2B Credit Line',
    description: 'Use your B2B credit limit',
    icon: '💼',
    color: '#0E8A6E'
  },
  cheque: {
    id: 'cheque',
    label: 'Cheque',
    description: 'Pay by company cheque',
    icon: '📝',
    color: '#534AB7'
  }
};

