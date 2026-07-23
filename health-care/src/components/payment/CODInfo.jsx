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
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <div className="flex items-start gap-3">
          <span className="text-3xl">💵</span>
          <div className="flex-1">
            <h3 className="text-base font-bold text-emerald-900 mb-2">Cash on Delivery (COD)</h3>
            <p className="text-sm text-emerald-800 leading-relaxed mb-3">
              Pay with cash when your order is delivered to your doorstep. You can inspect the products before making payment.
            </p>
            
            {/* Benefits */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-900">
                <FaCheckCircle className="text-emerald-600 flex-shrink-0" size={16} />
                <span>No need to pay online or share card details</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-900">
                <FaCheckCircle className="text-emerald-600 flex-shrink-0" size={16} />
                <span>Verify product quality before payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-900">
                <FaCheckCircle className="text-emerald-600 flex-shrink-0" size={16} />
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
              <h4 className="text-sm font-bold text-blue-900 mb-1">Amount to Keep Ready</h4>
              <div className="text-2xl font-bold text-blue-900 mb-2">
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
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-start gap-3">
          <FaShieldAlt className="text-gray-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">Terms & Conditions</h4>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Payment must be made in cash to the delivery partner</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Please verify the product condition before making payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Keep exact amount ready - change may not be available</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Delivery partner will provide official receipt after payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>If product is damaged/wrong, you can refuse delivery</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
        <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
          <span>📋</span>
          How Cash on Delivery Works
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
              1
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">Place your order</p>
              <p className="text-xs text-purple-700">Select Cash on Delivery as payment method</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
              2
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">We prepare your order</p>
              <p className="text-xs text-purple-700">Your order will be packed and shipped</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
              3
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">Delivery to your doorstep</p>
              <p className="text-xs text-purple-700">Delivery partner brings your order</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
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
      <div className="p-3 rounded-lg bg-teal-50 border border-teal-200">
        <p className="text-xs text-teal-900">
          <span className="font-semibold">Need help?</span> Contact our support team at{' '}
          <a href="tel:+8801646886795" className="font-bold text-teal-700 hover:underline">
            +880 1646886795
          </a>
          {' '}or{' '}
          <a href="mailto:support@MediportBD.com" className="font-bold text-teal-700 hover:underline">
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
    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">💵</span>
        <h4 className="text-sm font-bold text-emerald-900">Cash on Delivery</h4>
      </div>
      <p className="text-xs text-emerald-800 leading-relaxed">
        Pay with cash when your order arrives. No online payment needed. Verify products before payment.
      </p>
    </div>
  );
}
