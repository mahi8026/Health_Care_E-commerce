'use client';

import { FaFileContract } from 'react-icons/fa';

/**
 * TermsAndConditions Component
 * Displays terms and conditions section. Admin-edited terms/notes replace the
 * defaults, keeping the printed invoice and the PDF in sync.
 */
export default function TermsAndConditions({ terms, notes }) {
  const defaultTerms = [
    'Products are subject to availability.',
    'Warranty applies according to the manufacturer\'s terms.',
    'Please verify the products upon delivery.',
    'Payment terms are as agreed between MediportBD and the customer.',
  ];
  const list = Array.isArray(terms) && terms.length ? terms : defaultTerms;
  const noteText = typeof notes === 'string' ? notes.trim() : '';

  return (
    <div className="terms-conditions rounded-lg bg-blue-50 p-2 print:p-1.5">
      <div className="mb-1 flex items-center gap-2 print:mb-0.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-teal text-white print:h-4 print:w-4">
          <FaFileContract className="h-2.5 w-2.5 print:h-2 print:w-2" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy print:text-[8pt]">
          Terms &amp; Conditions
        </h3>
      </div>

      {noteText && (
        <p className="mb-1 whitespace-pre-line text-xs font-medium text-gray-800 print:mb-0.5 print:text-[7.5pt] print:leading-tight">
          {noteText}
        </p>
      )}

      <ul className="space-y-0.5 text-xs text-gray-700 print:space-y-0 print:text-[7pt] print:leading-tight">
        {list.map((term, index) => (
          <li key={index} className="flex items-start gap-1.5 print:gap-1">
            <span className="text-brand-teal print:text-[6pt]">•</span>
            <span>{term}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
