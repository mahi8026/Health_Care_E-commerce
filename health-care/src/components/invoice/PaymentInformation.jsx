'use client';

import { FaCreditCard } from 'react-icons/fa';
import { getPaymentMethodLabel } from '@/utils/invoiceHelpers';

const PAYMENT_STATUS_TONE = {
  paid: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-200 text-gray-700',
};

/**
 * PaymentInformation Component
 * Displays payment information section
 */
export default function PaymentInformation({ paymentInfo }) {
  const { accountName, paymentMethod, paymentStatus, bankInfo, transactionRef } = paymentInfo;

  const statusLabel = String(paymentStatus || '—')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const statusClass = PAYMENT_STATUS_TONE[String(paymentStatus || '').toLowerCase()] || 'bg-gray-100 text-gray-700';

  return (
    <div className="payment-information rounded-lg bg-blue-50 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-white">
            <FaCreditCard className="h-3 w-3" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Payment Information
          </h3>
        </div>
        {/* Payment status chip */}
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
          {statusLabel}
        </span>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-start">
          <span className="w-32 font-medium text-gray-600">Account Name</span>
          <span className="flex-1 font-semibold text-gray-900">
            : {accountName || 'MAHI M RAHMAN'}
          </span>
        </div>

        <div className="flex items-start">
          <span className="w-32 font-medium text-gray-600">Payment Method</span>
          <span className="flex-1 text-gray-900">
            : {getPaymentMethodLabel(paymentMethod)}
          </span>
        </div>

        <div className="flex items-start">
          <span className="w-32 font-medium text-gray-600">Bank Information</span>
          <span className="flex-1 text-gray-900">
            : {bankInfo || 'BRAC Bank PLC · MAHI M RAHMAN · A/C 1081267690001'}
          </span>
        </div>

        <div className="flex items-start">
          <span className="w-32 font-medium text-gray-600">Transaction Ref</span>
          <span className="flex-1 font-mono text-gray-900 text-[10px]">
            : {transactionRef || '____________________'}
          </span>
        </div>
      </div>
    </div>
  );
}
