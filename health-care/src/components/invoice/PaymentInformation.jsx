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
    <div className="payment-information rounded-lg bg-blue-50 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-white">
          <FaCreditCard className="h-3 w-3" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
          Payment Information
        </h3>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-start">
          <span className="w-32 font-medium text-gray-600">Account Name</span>
          <span className="flex-1 font-semibold text-gray-900">
            : {accountName || 'MediportBD'}
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
            : {bankInfo || 'Dutch-Bangla Bank Ltd · A/C 1721 2030 5678'}
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
