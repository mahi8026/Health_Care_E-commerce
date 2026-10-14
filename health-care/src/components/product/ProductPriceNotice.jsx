"use client";

import { FaInfoCircle } from 'react-icons/fa';

/**
 * ProductPriceNotice Component
 * 
 * A professional notification box that informs customers about stock and delivery confirmation.
 * Displays a prominent notice about verifying product availability before ordering.
 * 
 * @param {Object} props
 * @param {string} props.message - Custom message text (optional, defaults to Bengali notice)
 * @param {string} props.className - Additional CSS classes (optional)
 */
export default function ProductPriceNotice({ 
  message = "অর্ডার করার পূর্বে কাস্টমার কেয়ার থেকে পণ্যের স্টক ও ডেলিভারি সম্পর্কে জেনে নেওয়ার অনুরোধ করা যাচ্ছে। পণ্যের মূল্য অস্থিতিশীল হওয়ার কারণে যেকোনো মুহূর্তে যেকোনো পণ্যের মূল্য পরিবর্তন হতে পারে।",
  className = "" 
}) {
  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-lg border ${className}`}
      style={{
        backgroundColor: '#FFF9E8',
        borderColor: '#F1DFA3',
        color: '#75652B'
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Info Icon */}
      <div 
        className="flex-shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <FaInfoCircle 
          size={20} 
          style={{ color: '#C9A227' }}
        />
      </div>
      
      {/* Message Text */}
      <p 
        className="text-sm leading-relaxed flex-1"
        style={{ color: '#75652B' }}
      >
        {message}
      </p>
    </div>
  );
}
