"use client";

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import BankTransferForm from './BankTransferForm';
import B2BCreditForm from './B2BCreditForm';
import { PAYMENT_METHODS } from '@/utils/payment';

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
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <div className="text-5xl mb-3">💵</div>
              <h3 className="text-base font-bold text-green-900 mb-2">
                Cash on Delivery
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Pay <strong>৳{amount?.toLocaleString()}</strong> in cash when you receive your order
              </p>
              <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                <div className="text-xs text-gray-500 mb-2">How it works:</div>
                <div className="text-left text-sm text-gray-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Our delivery agent will bring your order</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Inspect the products before payment</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Pay the exact amount in cash</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Get your receipt and invoice</span>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                ⚠️ Please keep the exact amount ready. Our agents may not carry change.
              </div>
            </div>
            <button
              onClick={() => handleSuccess({ method: 'cod', orderId })}
              className="w-full py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
            >
              Confirm Cash on Delivery
            </button>
            <p className="text-xs text-center text-gray-500">
              Your order will be confirmed and delivered within 2-3 business days
            </p>
          </div>
        );

      case 'bkash':
      case 'nagad':
      case 'rocket':
        return (
          <div className="space-y-4">
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-5 text-center">
              <div className="text-5xl mb-3">📱</div>
              <h3 className="text-base font-bold text-pink-900 mb-2">
                {currentMethod === 'bkash' ? 'bKash' : currentMethod === 'nagad' ? 'Nagad' : 'Rocket'} Payment
              </h3>
              <p className="text-sm text-pink-700 mb-4">
                Please send <strong>৳{amount?.toLocaleString()}</strong> to our {currentMethod === 'bkash' ? 'bKash' : currentMethod === 'nagad' ? 'Nagad' : 'Rocket'} number:
              </p>
              <div className="bg-white rounded-lg p-4 border border-pink-200 mb-4">
                <div className="text-xs text-gray-500 mb-1">Send money to</div>
                <div className="text-2xl font-bold font-mono text-gray-900">
                  +880 1646-886795
                </div>
              </div>
              <div className="text-left bg-white rounded-lg p-4 space-y-2 border border-pink-200 text-sm">
                <div className="font-semibold text-gray-700 mb-2">Steps:</div>
                <div>1. Open your {currentMethod === 'bkash' ? 'bKash' : currentMethod === 'nagad' ? 'Nagad' : 'Rocket'} app</div>
                <div>2. Go to <strong>Send Money</strong></div>
                <div>3. Send exactly <strong>৳{amount?.toLocaleString()}</strong></div>
                <div>4. Use your Order ID as reference</div>
                <div>5. Take a screenshot and contact support</div>
              </div>
            </div>
            <button
              onClick={() => handleSuccess({ method: currentMethod, orderId, manual: true })}
              className="w-full py-3 rounded-xl bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 transition-colors"
            >
              I have sent the payment
            </button>
            <p className="text-xs text-center text-gray-500">
              Our team will verify and confirm your order within 1-2 hours
            </p>
          </div>
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
                <div><strong>Mediport Bangladesh Ltd</strong></div>
                <div>17/2/A Azad Tower, Shop-08, Topkhana Road</div>
                <div>Dhaka-1000, Bangladesh</div>
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
            ৳{amount?.toLocaleString()}
          </div>
        </div>

        {/* Payment Form */}
        {renderPaymentForm()}
      </div>
    </Modal>
  );
}
