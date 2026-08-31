'use client';

import Image from 'next/image';
import { formatInvoiceDate, formatInvoiceNumber } from '@/utils/invoiceHelpers';

/**
 * InvoiceHeader Component
 * Displays invoice header with logo and invoice metadata
 */
export default function InvoiceHeader({ invoiceNumber, invoiceDate, dueDate }) {
  return (
    <header className="invoice-header flex items-start justify-between border-b-2 border-brand-teal pb-3 mb-3">
      {/* LEFT SIDE - Logo and Branding */}
      <div className="flex-1">
        <div className="relative mb-2 h-10 w-40">
          <Image
            src="/Mediport_Logo.png"
            alt="MediportBD Logo"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
        <p className="text-xs text-gray-600">
          Medical Equipment & Healthcare Solutions
        </p>
      </div>

      {/* RIGHT SIDE - Invoice Title and Details */}
      <div className="text-right">
        <h1 className="mb-2 text-4xl font-bold text-brand-navy">
          INVOICE
        </h1>
        <div className="inline-block border-t-2 border-brand-teal pt-1">
          <div className="mb-1 flex items-center justify-between gap-6 text-xs">
            <span className="font-medium text-gray-600">Invoice No.</span>
            <span className="font-bold text-brand-navy">
              : {formatInvoiceNumber(invoiceNumber)}
            </span>
          </div>
          <div className="mb-1 flex items-center justify-between gap-6 text-xs">
            <span className="font-medium text-gray-600">Invoice Date</span>
            <span className="font-semibold text-gray-800">
              : {formatInvoiceDate(invoiceDate)}
            </span>
          </div>
          {dueDate && (
            <div className="flex items-center justify-between gap-6 text-xs">
              <span className="font-medium text-gray-600">Due Date</span>
              <span className="font-semibold text-gray-800">
                : {formatInvoiceDate(dueDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
