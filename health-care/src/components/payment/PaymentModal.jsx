"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Modal from '@/components/ui/Modal';
import BkashPaymentForm from './BkashPaymentForm';
import BankTransferForm from './BankTransferForm';
import B2BCreditForm from './B2BCreditForm';
import PaymentSkeleton from './PaymentSkeleton';
import { PAYMENT_METHODS } from '@/utils/payment';

// Lazy-load the Stripe wrapper so @stripe/react-stripe-js and loadStripe are
// only downloaded when the user actually selects the Stripe payment method.
const StripePaymentWrapper = dynamic(
  () => import('./StripePaymentWrapper'),
  { loading: () => <PaymentSkeleton /> }
);

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  orderId, 
  selectedMethod = 'bank',
  onSuccess,
  onError 
}) {
  const [currentMethod, setCurrentMethod] = useState(selectedMethod);

  const handleSuccess = (response) => {
    onSuccess && onSuccess(response);
    onClose();
  };

  const handleError = (error) => {
    onError && onError(error);
  };

  const renderPaymentForm = () => {
    switch (currentMethod) {
      case 'stripe':
        return (
          <StripePaymentWrapper
            amount={amount}
            orderId={orderId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        );
      
      case 'bkash':
      case 'nagad':
        return (
          <BkashPaymentForm
            amount={amount}
            orderId={orderId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        );
      
      case 'bank':
      case 'npsb':
        return (
          <BankTransferForm
            amount={amount}
            orderId={orderId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        );
      
      case 'credit':
        return (
          <B2BCreditForm
            amount={amount}
            orderId={orderId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        );
      
      case 'cheque':
        return (
          <div className="space-y-4">
            <div className="bg-[#EEEDFE] border-[0.5px] border-[#534AB7] rounded-lg p-4 text-center">
              <div className="text-[32px] mb-2">📝</div>
              <h3 className="text-[14px] font-semibold mb-2 text-[#534AB7]">
                Cheque Payment
              </h3>
              <p className="text-[12px] text-[var(--color-text-secondary)] mb-3">
                Please send your company cheque to:
              </p>
              <div className="bg-white rounded-lg p-3 text-[12px] text-left space-y-1">
                <div><strong>MedCore Bangladesh Ltd</strong></div>
                <div>House 45, Road 12, Gulshan-1</div>
                <div>Dhaka 1212, Bangladesh</div>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-3">
                Write order ID <span className="font-mono font-semibold">{orderId}</span> on the back of the cheque
              </p>
            </div>
            <button
              onClick={() => handleSuccess({ method: 'cheque', orderId })}
              className="w-full bg-[#534AB7] text-white px-4 py-3 rounded-lg text-[13px] font-semibold hover:bg-[#4A42A5] transition-colors"
            >
              Confirm Cheque Payment
            </button>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-8 text-[var(--color-text-secondary)]">
            Payment method not available
          </div>
        );
    }
  };

  const methodInfo = PAYMENT_METHODS[currentMethod] || PAYMENT_METHODS.bank;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment">
      <div className="space-y-4">
        {/* Payment Method Selector */}
        <div className="bg-[var(--color-background-secondary)] rounded-lg p-3">
          <label className="block text-[11px] font-medium mb-2 text-[var(--color-text-secondary)]">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(PAYMENT_METHODS).map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setCurrentMethod(method.id)}
                className={`p-2 rounded-lg border-[0.5px] text-[11px] font-medium transition-all ${
                  currentMethod === method.id
                    ? 'border-[#0B2545] bg-[#E6F1FB] text-[#0B2545]'
                    : 'border-[var(--color-border-secondary)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-primary)]'
                }`}
              >
                <div className="text-[16px] mb-1">{method.icon}</div>
                <div>{method.label.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Method Info */}
        <div className="flex items-center gap-3 p-3 bg-[var(--color-background-secondary)] rounded-lg">
          <div className="text-[24px]">{methodInfo.icon}</div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">{methodInfo.label}</div>
            <div className="text-[11px] text-[var(--color-text-secondary)]">
              {methodInfo.description}
            </div>
          </div>
          <div className="text-[14px] font-semibold">
            ৳{amount.toLocaleString()}
          </div>
        </div>

        {/* Payment Form */}
        {renderPaymentForm()}
      </div>
    </Modal>
  );
}
