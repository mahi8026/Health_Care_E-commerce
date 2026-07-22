'use client';

import { useState } from 'react';
import BankTransferForm from './BankTransferForm';
import CODInfo from '@/components/payment/CODInfo';

const METHODS = [
  { 
    id: 'cod', 
    label: 'Cash on Delivery', 
    color: '#059669', 
    bg: '#ECFDF5', 
    icon: '💵',
    recommended: true,
    popular: true,
    description: 'Most popular in Bangladesh',
    disabled: false,
  },
  { 
    id: 'bkash', 
    label: 'bKash', 
    color: '#E2136E', 
    bg: '#FDF2F8', 
    icon: '📱',
    disabled: false,
  },
  { 
    id: 'nagad', 
    label: 'Nagad', 
    color: '#0E8A6E', 
    bg: '#ECFDF5', 
    icon: '📱',
    disabled: false,
  },
  { 
    id: 'npsb', 
    label: 'Rocket', 
    color: '#B45309', 
    bg: '#FFFBEB', 
    icon: '🚀',
    disabled: true,
    disabledMessage: 'Rocket payment is temporarily unavailable. Please use Cash on Delivery, bKash, or Nagad instead.',
  },
  { 
    id: 'bank_transfer', 
    label: 'Bank', 
    color: '#185FA5', 
    bg: '#EFF6FF', 
    icon: '🏦',
    disabled: true,
    disabledMessage: 'Bank transfer is temporarily unavailable. Please use Cash on Delivery, bKash, or Nagad instead.',
  },
  { 
    id: 'b2b_credit', 
    label: 'B2B', 
    color: '#0E8A6E', 
    bg: '#ECFDF5', 
    icon: '💼',
    disabled: true,
    disabledMessage: 'B2B Credit is temporarily unavailable. Please contact sales team for credit terms.',
  },
  { 
    id: 'cheque', 
    label: 'Cheque', 
    color: '#6D28D9', 
    bg: '#F5F3FF', 
    icon: '📝',
    disabled: true,
    disabledMessage: 'Cheque payment is temporarily unavailable. Please use Cash on Delivery, bKash, or Nagad instead.',
  },
];

export default function PaymentMethods({ selected, onSelect, orderNumber, orderTotal }) {
  const [showDisabledMessage, setShowDisabledMessage] = useState(null);

  const handleMethodClick = (method) => {
    if (method.disabled) {
      setShowDisabledMessage(method.disabledMessage);
      // Auto-hide message after 5 seconds
      setTimeout(() => setShowDisabledMessage(null), 5000);
    } else {
      onSelect(method.id);
      setShowDisabledMessage(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5">
      <div className="mb-4 pb-3 border-b border-[#F3F4F6]">
        <h2 className="text-[15px] font-bold text-[#0B2545] m-0">Payment method</h2>
        <p className="text-[12px] text-[#6B7280] m-0 mt-0.5">
          How would you like to pay? 
          <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
            💵 COD is most popular
          </span>
        </p>
      </div>

      {/* Disabled Payment Method Message */}
      {showDisabledMessage && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-xs text-amber-900 font-medium mb-1">Payment Method Unavailable</p>
            <p className="text-xs text-amber-700">{showDisabledMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDisabledMessage(null)}
            className="flex-shrink-0 text-amber-600 hover:text-amber-800"
            aria-label="Close message"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* COD Featured Card - Full Width, Highly Visible */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => onSelect('cod')}
          className={`w-full rounded-xl p-4 border-2 transition-all relative overflow-hidden ${
            selected === 'cod'
              ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20'
              : 'border-emerald-300 bg-emerald-50/50 hover:border-emerald-500 hover:bg-emerald-50'
          }`}
        >
          {/* Recommended Badge */}
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow-sm">
              ⭐ RECOMMENDED
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Large Icon */}
            <div 
              className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm"
              style={{ background: '#ECFDF5', color: '#059669' }}
            >
              💵
            </div>

            {/* Content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-base font-bold ${selected === 'cod' ? 'text-emerald-900' : 'text-emerald-800'}`}>
                  Cash on Delivery
                </h3>
                {selected === 'cod' && (
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-emerald-700 font-medium">
                Most popular in Bangladesh • Pay with cash on delivery • Safe & Secure
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Divider with "Other Payment Options" */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-[11px] text-gray-500 font-medium">Other payment options</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {METHODS.slice(1).map((method) => {
          const isSelected = selected === method.id;
          const isDisabled = method.disabled;
          
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleMethodClick(method)}
              disabled={isDisabled && isSelected}
              className={`rounded-xl p-3 border-2 text-center transition-all min-h-[72px] relative ${
                isDisabled
                  ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-[#0B2545] bg-[#F8FAFC] ring-1 ring-[#0B2545]/10'
                  : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
              }`}
            >
              {isDisabled && (
                <span className="absolute top-1 right-1 text-[9px] bg-gray-600 text-white px-1.5 py-0.5 rounded font-semibold">
                  N/A
                </span>
              )}
              <span
                className={`inline-flex w-9 h-9 rounded-lg items-center justify-center text-lg mb-1.5 ${
                  isDisabled ? 'grayscale' : ''
                }`}
                style={{ background: method.bg, color: method.color }}
              >
                {method.icon}
              </span>
              <span className={`block text-[11px] font-semibold ${
                isDisabled 
                  ? 'text-gray-400' 
                  : isSelected 
                  ? 'text-[#0B2545]' 
                  : 'text-[#6B7280]'
              }`}>
                {method.label}
              </span>
            </button>
          );
        })}
      </div>

      {selected === 'cod' && (
        <CODInfo orderTotal={orderTotal} />
      )}

      {selected === 'bank_transfer' && (
        <BankTransferForm orderNumber={orderNumber} />
      )}
    </section>
  );
}
