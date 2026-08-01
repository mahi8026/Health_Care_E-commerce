'use client';

import { useState } from 'react';
import BankTransferForm from './BankTransferForm';
import CODInfo from '@/components/payment/CODInfo';

const METHODS = [
  { 
    id: 'cod', 
    label: 'Cash on Delivery', 
    color: 'var(--color-status-success)', 
    bg: 'var(--color-status-success-tint)', 
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
    color: 'var(--color-brand-teal)', 
    bg: 'var(--color-status-success-tint)', 
    icon: '📱',
    disabled: false,
  },
  { 
    id: 'npsb', 
    label: 'Rocket', 
    color: 'var(--color-status-warning)', 
    bg: 'var(--color-status-warning-tint)', 
    icon: '🚀',
    disabled: true,
    disabledMessage: 'Rocket payment is temporarily unavailable. Please use Cash on Delivery, bKash, or Nagad instead.',
  },
  { 
    id: 'bank_transfer', 
    label: 'Bank', 
    color: 'var(--color-status-info)', 
    bg: 'var(--color-status-info-tint)', 
    icon: '🏦',
    disabled: true,
    disabledMessage: 'Bank transfer is temporarily unavailable. Please use Cash on Delivery, bKash, or Nagad instead.',
  },
  { 
    id: 'b2b_credit', 
    label: 'B2B', 
    color: 'var(--color-brand-teal)', 
    bg: 'var(--color-status-success-tint)', 
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
    <section className="bg-white rounded-2xl border border-[var(--color-border-primary)] p-4 sm:p-5">
      <div className="mb-4 pb-3 border-b border-[var(--color-border-tertiary)]">
        <h2 className="text-base font-semibold text-brand-navy m-0">Payment method</h2>
        <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
          How would you like to pay? 
          <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] text-xs font-semibold">
            💵 COD is most popular
          </span>
        </p>
      </div>

      {/* Disabled Payment Method Message */}
      {showDisabledMessage && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--color-status-warning-tint)] border border-[var(--color-status-warning-tint)] flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-xs text-[var(--color-status-warning)] font-medium mb-1">Payment Method Unavailable</p>
            <p className="text-xs text-[var(--color-status-warning)]">{showDisabledMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDisabledMessage(null)}
            className="flex-shrink-0 text-[var(--color-status-warning)] hover:text-[var(--color-status-warning)]"
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
              ? 'border-[var(--color-status-success)] bg-[var(--color-status-success-tint)] ring-2 ring-emerald-600/20'
              : 'border-[var(--color-status-success)] bg-emerald-50/50 hover:border-[var(--color-status-success)] hover:bg-[var(--color-status-success-tint)]'
          }`}
        >
          {/* Recommended Badge */}
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success text-white text-xs font-semibold shadow-sm">
              ⭐ RECOMMENDED
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Large Icon */}
            <div 
              className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm"
              style={{ background: 'var(--color-status-success-tint)', color: 'var(--color-status-success)' }}
            >
              💵
            </div>

            {/* Content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-base font-semibold ${selected === 'cod' ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-success)]'}`}>
                  Cash on Delivery
                </h3>
                {selected === 'cod' && (
                  <svg className="w-5 h-5 text-[var(--color-status-success)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-[var(--color-status-success)] font-medium">
                Most popular in Bangladesh • Pay with cash on delivery • Safe & Secure
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Divider with "Other Payment Options" */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-[var(--color-background-muted)]"></div>
        <span className="text-xs text-[var(--color-text-secondary)] font-medium">Other payment options</span>
        <div className="flex-1 h-px bg-[var(--color-background-muted)]"></div>
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
                  ? 'border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-brand-navy bg-[var(--color-background-secondary)] ring-1 ring-brand-navy/10'
                  : 'border-[var(--color-border-primary)] bg-white hover:border-[var(--color-border-primary)]'
              }`}
            >
              {isDisabled && (
                <span className="absolute top-1 right-1 text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded font-semibold">
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
              <span className={`block text-xs font-semibold ${
                isDisabled 
                  ? 'text-[var(--color-text-secondary)]' 
                  : isSelected 
                  ? 'text-brand-navy' 
                  : 'text-[var(--color-text-secondary)]'
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
