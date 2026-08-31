'use client';

import { FaFileContract } from 'react-icons/fa';

/**
 * TermsAndConditions Component
 * Displays terms and conditions section
 */
export default function TermsAndConditions() {
  const terms = [
    'Products are subject to availability.',
    'Warranty applies according to the manufacturer\'s terms.',
    'Please verify the products upon delivery.',
    'Payment terms are as agreed between MediportBD and the customer.',
  ];

  return (
    <div className="terms-conditions rounded-lg bg-blue-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-white">
          <FaFileContract className="h-3 w-3" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
          Terms & Conditions
        </h3>
      </div>

      <ul className="space-y-1 text-xs text-gray-700">
        {terms.map((term, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-0.5 text-brand-teal">•</span>
            <span>{term}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
