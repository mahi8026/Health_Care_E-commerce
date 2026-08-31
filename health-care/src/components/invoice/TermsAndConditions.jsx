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
    <div className="terms-conditions mt-6 rounded-lg bg-blue-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal text-white">
          <FaFileContract className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-navy">
          Terms & Conditions
        </h3>
      </div>

      <ul className="space-y-2 text-sm text-gray-700">
        {terms.map((term, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-1 text-brand-teal">•</span>
            <span>{term}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
