'use client';

import { FaCreditCard } from 'react-icons/fa';
import { getPaymentMethodLabel } from '@/utils/invoiceHelpers';

/**
 * PaymentInformation Component
 * Displays payment information section
 */
export default function PaymentInformation({ paymentInfo }) {
  const { accountName, paymentMethod, bankInfo, transactionRef } = paymentInfo;

  return (
    <div className="payment-information mt-6 rounded-lg bg-blue-50 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal text-white">
          <FaCreditCard className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-navy">
          Payment Information
        </h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start">
          <span className="w-40 font-medium text-gray-600">Account Name</span>
          <span className="flex-1 font-semibold text-gray-900">
            : {accountName || 'MediportBD'}
          </span>
        </div>

        <div className="flex items-start">
          <span className="w-40 font-medium text-gray-600">Payment Method</span>
          <span className="flex-1 text-gray-900">
            : {getPaymentMethodLabel(paymentMethod)}
          </span>
        </div>

        <div className="flex items-start">
          <span className="w-40 font-medium text-gray-600">Bank Information</span>
          <span className="flex-1 text-gray-900">
            : {bankInfo || 'Dutch-Bangla Bank Ltd · A/C 1721 2030 5678'}
          </span>
        </div>

        <div className="flex items-start">
          <span className="w-40 font-medium text-gray-600">Transaction Reference</span>
          <span className="flex-1 font-mono text-gray-900">
            : {transactionRef || '____________________'}
          </span>
        </div>
      </div>
    </div>
  );
}
