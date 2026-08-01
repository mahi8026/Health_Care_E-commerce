'use client';

/**
 * CODInfo — Cash on Delivery Information Component
 * 
 * Displays helpful information about COD payment method including
 * benefits, terms, and instructions for customers.
 */

import { FaCheckCircle, FaInfoCircle, FaShieldAlt } from 'react-icons/fa';

export default function CODInfo({ orderTotal }) {
  return (
    <div className="space-y-4">
      {/* Main Info Card */}
      <div className="p-4 rounded-xl bg-[var(--color-status-success-tint)] border border-[var(--color-status-success-tint)]">
        <div className="flex items-start gap-3">
          <span className="text-3xl">💵</span>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[var(--color-status-success)] mb-2">Cash on Delivery (COD)</h3>
            <p className="text-sm text-[var(--color-status-success)] leading-relaxed mb-3">
              Pay with cash when your order is delivered to your doorstep. You can inspect the products before making payment.
            </p>
            
            {/* Benefits */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[var(--color-status-success)]">
                <FaCheckCircle className="text-[var(--color-status-success)] flex-shrink-0" size={16} />
                <span>No need to pay online or share card details</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-status-success)]">
                <FaCheckCircle className="text-[var(--color-status-success)] flex-shrink-0" size={16} />
                <span>Verify product quality before payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-status-success)]">
                <FaCheckCircle className="text-[var(--color-status-success)] flex-shrink-0" size={16} />
                <span>Safe, secure, and convenient</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Amount to Keep Ready */}
      {orderTotal && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Amount to Keep Ready</h4>
              <div className="text-2xl font-semibold text-blue-900 mb-2">
                ৳{orderTotal.toLocaleString()}
              </div>
              <p className="text-xs text-blue-800">
                Please keep the exact amount ready for smooth delivery. Our delivery partner may not always have change.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      <div className="p-4 rounded-xl bg-[var(--color-background-secondary)] border border-[var(--color-border-primary)]">
        <div className="flex items-start gap-3">
          <FaShieldAlt className="text-[var(--color-text-secondary)] flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Terms & Conditions</h4>
            <ul className="space-y-1.5 text-xs text-[var(--color-text-primary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-text-secondary)] mt-0.5">•</span>
                <span>Payment must be made in cash to the delivery partner</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-text-secondary)] mt-0.5">•</span>
                <span>Please verify the product condition before making payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-text-secondary)] mt-0.5">•</span>
                <span>Keep exact amount ready - change may not be available</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-text-secondary)] mt-0.5">•</span>
                <span>Delivery partner will provide official receipt after payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-text-secondary)] mt-0.5">•</span>
                <span>If product is damaged/wrong, you can refuse delivery</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
        <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <span>📋</span>
          How Cash on Delivery Works
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-semibold flex items-center justify-center">
              1
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">Place your order</p>
              <p className="text-xs text-purple-700">Select Cash on Delivery as payment method</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-semibold flex items-center justify-center">
              2
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">We prepare your order</p>
              <p className="text-xs text-purple-700">Your order will be packed and shipped</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-semibold flex items-center justify-center">
              3
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">Delivery to your doorstep</p>
              <p className="text-xs text-purple-700">Delivery partner brings your order</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-semibold flex items-center justify-center">
              4
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">Inspect & Pay</p>
              <p className="text-xs text-purple-700">Check products and pay cash to delivery partner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Support */}
      <div className="p-3 rounded-lg bg-brand-teal-tint border border-brand-teal-tint">
        <p className="text-xs text-brand-teal">
          <span className="font-semibold">Need help?</span> Contact our support team at{' '}
          <a href="tel:+8801646886795" className="font-semibold text-brand-teal hover:underline">
            +880 1646886795
          </a>
          {' '}or{' '}
          <a href="mailto:support@MediportBD.com" className="font-semibold text-brand-teal hover:underline">
            support@MediportBD.com
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * CODInfoCompact — Compact version for inline display
 */
export function CODInfoCompact() {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-status-success-tint)] border border-[var(--color-status-success-tint)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">💵</span>
        <h4 className="text-sm font-semibold text-[var(--color-status-success)]">Cash on Delivery</h4>
      </div>
      <p className="text-xs text-[var(--color-status-success)] leading-relaxed">
        Pay with cash when your order arrives. No online payment needed. Verify products before payment.
      </p>
    </div>
  );
}
