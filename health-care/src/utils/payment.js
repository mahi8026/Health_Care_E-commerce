import api from './api';

// Stripe has been removed — not supported in Bangladesh

// bKash Payment
export async function initiateBkashPayment(amount, orderId) {
  try {
    const response = await api.post('/payments/bkash/initiate', {
      amount,
      orderId
    });
    return response;
  } catch (error) {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Failed to initiate bKash payment:', error);
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
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Failed to verify bKash payment:', error);
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
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Failed to initiate SSL Commerz payment:', error);
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
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Failed to submit bank transfer:', error);
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
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Failed to process B2B credit payment:', error);
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

// Cash on Delivery (COD)
export async function processCODPayment(orderId) {
  try {
    const response = await api.post('/payments/cod/process', {
      orderId
    });
    return response;
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error('Failed to process COD payment:', error);
    throw error;
  }
}

// Payment method labels
export const PAYMENT_METHODS = {
  cod: {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay with cash when you receive your order',
    icon: '💵',
    color: '#059669'
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

