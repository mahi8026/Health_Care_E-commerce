'use client';

import { FaShieldAlt } from 'react-icons/fa';
import { formatInvoiceDate, formatInvoiceNumber } from '@/utils/invoiceHelpers';

/**
 * WarrantyInformation Component
 * Displays the invoice warranty policy — period, coverage dates, what is
 * covered/excluded and how to raise a claim. Mirrors the backend PDF block so
 * the printed page and the downloaded invoice always agree.
 */
export default function WarrantyInformation({ warranty, invoiceNumber }) {
  if (!warranty) return null;

  const { months, label, endDate, note, itemWarranties = [] } = warranty;
  const expiry = endDate && !Number.isNaN(new Date(endDate).getTime())
    ? formatInvoiceDate(endDate)
    : null;
  const invoiceRef = invoiceNumber ? formatInvoiceNumber(invoiceNumber) : null;

  const itemOverrides = itemWarranties.filter((item) => item.months !== months);

  const notes = [
    'Covers manufacturing defects in materials and workmanship under normal use. MediportBD will repair or replace, at its discretion, any unit confirmed defective.',
    'Excludes consumables and reagents (covered by their printed shelf life), and damage caused by misuse, improper storage or unauthorised repair.',
    `Claims: email mediportbdofficial@gmail.com or call +880 1646-886795 within the coverage period${
      invoiceRef ? `, quoting Ref ${invoiceRef}` : ''
    }. Warranty is non-transferable.`,
    ...itemOverrides.map(
      (item) => `Item-specific warranty: ${item.name} (${item.label}).`
    ),
  ];

  return (
    <div className="warranty-information mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 print:mt-1 print:p-1.5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 print:mb-0.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-teal text-white print:h-4 print:w-4">
            <FaShieldAlt className="h-2.5 w-2.5 print:h-2 print:w-2" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy print:text-[8pt]">
            Warranty &amp; Service
          </h3>
        </div>

        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white print:px-1.5 print:text-[6.5pt] ${
            months > 0 ? 'bg-brand-teal' : 'bg-gray-500'
          }`}
        >
          {months > 0 ? label : 'No warranty'}
        </span>
      </div>

      <p className="text-xs font-semibold text-gray-800 print:text-[7.5pt]">
        {months > 0
          ? `Coverage: ${label} from the invoice date${expiry ? ` — valid until ${expiry}` : ''}.`
          : 'This invoice carries no product warranty coverage.'}
      </p>

      {note && (
        <p className="mt-1 whitespace-pre-line text-xs text-gray-700 print:mt-0.5 print:text-[7pt] print:leading-tight">
          <span className="font-semibold text-gray-800">Note:</span> {note}
        </p>
      )}

      <ul className="mt-1 space-y-0.5 text-xs text-gray-700 print:mt-0.5 print:space-y-0 print:text-[7pt] print:leading-tight">
        {notes.map((note, index) => (
          <li key={index} className="flex items-start gap-1.5 print:gap-1">
            <span className="text-brand-teal print:text-[6pt]">•</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
