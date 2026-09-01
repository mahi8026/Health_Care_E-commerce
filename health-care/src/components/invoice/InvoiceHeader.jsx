'use client';

import Image from 'next/image';
import { formatInvoiceDate, formatInvoiceNumber } from '@/utils/invoiceHelpers';

/**
 * InvoiceHeader Component
 * Displays invoice header with logo and invoice metadata
 */
export default function InvoiceHeader({ invoiceNumber, orderNumber, invoiceDate, dueDate }) {
  const invoiceDateStr = invoiceDate ? formatInvoiceDate(invoiceDate) : '';
  const dueDateStr =
    dueDate && !Number.isNaN(new Date(dueDate).getTime()) ? formatInvoiceDate(dueDate) : '';

  return (
    <header className="invoice-header flex items-start justify-between border-b-2 border-brand-teal pb-2 mb-2 print:pb-1 print:mb-1">
      {/* LEFT SIDE - Logo and Branding */}
      <div className="flex-1">
        <div className="relative mb-1 h-8 w-32 print:h-6 print:w-28">
          <Image
            src="/Mediport_Logo.png"
            alt="MediportBD Logo"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
        <p className="text-xs text-gray-600 print:text-[7pt] print:leading-tight">
          Medical Equipment & Healthcare Solutions
        </p>
      </div>

      {/* RIGHT SIDE - Invoice Title and Details */}
      <div className="text-right">
        <h1 className="mb-1 text-4xl font-bold text-brand-navy print:text-3xl print:mb-0.5">
          INVOICE
        </h1>
        <div className="inline-block border-t-2 border-brand-teal pt-1 print:pt-0.5">
          <div className="mb-0.5 flex items-center justify-between gap-6 text-xs print:gap-3 print:text-[7pt] print:mb-0">
            <span className="font-medium text-gray-600">Invoice No.</span>
            <span className="font-bold text-brand-navy">
              : {formatInvoiceNumber(invoiceNumber)}
            </span>
          </div>
          {orderNumber && (
            <div className="mb-0.5 flex items-center justify-between gap-6 text-xs print:gap-3 print:text-[7pt] print:mb-0">
              <span className="font-medium text-gray-600">Order No.</span>
              <span className="font-semibold text-gray-800">
                : {orderNumber}
              </span>
            </div>
          )}
          {invoiceDateStr && (
            <div className="mb-0.5 flex items-center justify-between gap-6 text-xs print:gap-3 print:text-[7pt] print:mb-0">
              <span className="font-medium text-gray-600">Invoice Date</span>
              <span className="font-semibold text-gray-800">
                : {invoiceDateStr}
              </span>
            </div>
          )}
          {dueDateStr && (
            <div className="flex items-center justify-between gap-6 text-xs print:gap-3 print:text-[7pt]">
              <span className="font-medium text-gray-600">Due Date</span>
              <span className="font-semibold text-gray-800">
                : {dueDateStr}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
