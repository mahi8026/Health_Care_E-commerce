"use client";

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import BankTransferForm from './BankTransferForm';
import B2BCreditForm from './B2BCreditForm';
import BkashPaymentForm from './BkashPaymentForm';
import NagadPaymentForm from './NagadPaymentForm';
import { PAYMENT_METHODS, TEMPORARILY_ENABLED_PAYMENT_METHODS } from '@/utils/payment';

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
      case 'cod':
        return (
          <div className="space-y-4">
            <div className="bg-[var(--color-status-success-tint)] border border-[var(--color-status-success-tint)] rounded-xl p-5 text-center">
              <div className="text-5xl mb-3">💵</div>
              <h3 className="text-base font-semibold text-[var(--color-status-success)] mb-2">
                Cash on Delivery
              </h3>
              <p className="text-sm text-[var(--color-status-success)] mb-4">
                Pay <strong>৳{amount?.toLocaleString()}</strong> in cash when you receive your order
              </p>
              <div className="bg-white rounded-lg p-4 border border-[var(--color-status-success-tint)] mb-4">
                <div className="text-xs text-[var(--color-text-secondary)] mb-2">How it works:</div>
                <div className="text-left text-sm text-[var(--color-text-primary)] space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--color-status-success)] mt-0.5">✓</span>
                    <span>Our delivery agent will bring your order</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--color-status-success)] mt-0.5">✓</span>
                    <span>Inspect the products before payment</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--color-status-success)] mt-0.5">✓</span>
                    <span>Pay the exact amount in cash</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--color-status-success)] mt-0.5">✓</span>
                    <span>Get your receipt and invoice</span>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--color-status-warning-tint)] border border-[var(--color-status-warning-tint)] rounded-lg p-3 text-xs text-[var(--color-status-warning)]">
                ⚠️ Please keep the exact amount ready. Our agents may not carry change.
              </div>
            </div>
            <button
              onClick={() => handleSuccess({ method: 'cod', orderId })}
              className="w-full py-3 rounded-xl bg-success text-white text-sm font-semibold hover:bg-success transition-colors"
            >
              Confirm Cash on Delivery
            </button>
            <p className="text-xs text-center text-[var(--color-text-secondary)]">
              Your order will be confirmed and delivered within 2-3 business days
            </p>
          </div>
        );

      case 'bkash':
        return (
          <BkashPaymentForm
            amount={amount}
            orderId={orderId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        );

      case 'nagad':
        return (
          <NagadPaymentForm
            amount={amount}
            orderId={orderId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        );

      // FIX-017: Rocket's method id is 'npsb' (set in PaymentMethods.jsx).
      // The old 'rocket' case never matched — renamed to 'npsb' so it works
      // when Rocket is re-enabled. The duplicate 'case npsb' for bank has
      // been removed to avoid unreachable code.
      case 'npsb':
        return (
          <div className="space-y-4">
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-5 text-center">
              <div className="text-5xl mb-3">📱</div>
              <h3 className="text-base font-semibold text-pink-900 mb-2">
                Rocket Payment
              </h3>
              <p className="text-sm text-pink-700 mb-4">
                Please send <strong>৳{amount?.toLocaleString()}</strong> to our Rocket number:
              </p>
              <div className="bg-white rounded-lg p-4 border border-pink-200 mb-4">
                <div className="text-xs text-[var(--color-text-secondary)] mb-1">Send money to</div>
                <div className="text-2xl font-semibold font-mono text-[var(--color-text-primary)]">
                  +880 1646-886795
                </div>
              </div>
              <div className="text-left bg-white rounded-lg p-4 space-y-2 border border-pink-200 text-sm">
                <div className="font-semibold text-[var(--color-text-primary)] mb-2">Steps:</div>
                <div>1. Open your Rocket app</div>
                <div>2. Go to <strong>Send Money</strong></div>
                <div>3. Send exactly <strong>৳{amount?.toLocaleString()}</strong></div>
                <div>4. Use your Order ID as reference</div>
                <div>5. Take a screenshot and contact support</div>
              </div>
            </div>
            <button
              onClick={() => handleSuccess({ method: 'npsb', orderId, manual: true })}
              className="w-full py-3 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-700 transition-colors"
            >
              I have sent the payment
            </button>
            <p className="text-xs text-center text-[var(--color-text-secondary)]">
              Our team will verify and confirm your order within 1-2 hours
            </p>
          </div>
        );

      case 'bank':
        return (
          <BankTransferForm
            amount={amount}
            orderId={orderId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        );

      case 'credit':
      case 'b2b_credit':
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
              <div className="text-4xl mb-2">📝</div>
              <h3 className="text-sm font-semibold mb-2 text-[#534AB7]">
                Cheque Payment
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                Please send your company cheque to:
              </p>
              <div className="bg-white rounded-lg p-3 text-xs text-left space-y-1">
                <div><strong>Mediport Bangladesh Ltd</strong></div>
                <div>17/2/A Azad Tower, Shop-08, Topkhana Road</div>
                <div>Dhaka-1000, Bangladesh</div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-3">
                Write order ID <span className="font-mono font-semibold">{orderId}</span> on the back of the cheque
              </p>
            </div>
            <button
              onClick={() => handleSuccess({ method: 'cheque', orderId })}
              className="w-full bg-[#534AB7] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#4A42A5] transition-colors"
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
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(PAYMENT_METHODS)
              .filter((method) => TEMPORARILY_ENABLED_PAYMENT_METHODS.includes(method.id))
              .map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setCurrentMethod(method.id)}
                className={`p-2 rounded-lg border-[0.5px] text-xs font-medium transition-all ${
                  currentMethod === method.id
                    ? 'border-brand-navy bg-[var(--color-status-info-tint)] text-brand-navy'
                    : 'border-[var(--color-border-secondary)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-primary)]'
                }`}
              >
                <div className="text-base mb-1">{method.icon}</div>
                <div>{method.label.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Method Info */}
        <div className="flex items-center gap-3 p-3 bg-[var(--color-background-secondary)] rounded-lg">
          <div className="text-2xl">{methodInfo.icon}</div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{methodInfo.label}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {methodInfo.description}
            </div>
          </div>
          <div className="text-sm font-semibold">
            ৳{amount?.toLocaleString()}
          </div>
        </div>

        {/* Payment Form */}
        {renderPaymentForm()}
      </div>
    </Modal>
  );
}
