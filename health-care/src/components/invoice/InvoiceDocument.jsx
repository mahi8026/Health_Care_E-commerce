'use client';

import InvoiceHeader from './InvoiceHeader';
import BillingShipping from './BillingShipping';
import InvoiceItemsTable from './InvoiceItemsTable';
import InvoiceTotals from './InvoiceTotals';
import PaymentInformation from './PaymentInformation';
import TermsAndConditions from './TermsAndConditions';
import WarrantyInformation from './WarrantyInformation';
import InvoiceFooter from './InvoiceFooter';
import { formatInvoiceDate } from '@/utils/invoiceHelpers';

/**
 * InvoiceDocument Component
 * Main invoice document container (A4 portrait)
 */
export default function InvoiceDocument({ invoiceData }) {
  const {
    invoiceNumber,
    orderNumber,
    invoiceDate,
    dueDate,
    billingInfo,
    shippingInfo,
    items,
    totals,
    paymentInfo,
    warranty,
    notes,
    terms,
    invoiceMeta,
  } = invoiceData;

  return (
    <div
      className="invoice-document mx-auto bg-white shadow-lg print:shadow-none"
      style={{
        width: '210mm',
        minHeight: '297mm',
      }}
    >
      {/* Invoice Content - Compact padding for print */}
      <div className="p-4 print:p-2">
        {/* Header */}
        <InvoiceHeader
          invoiceNumber={invoiceNumber}
          orderNumber={orderNumber}
          invoiceDate={invoiceDate}
          dueDate={dueDate}
        />

        {/* Revision strip — visible only for admin-edited invoices */}
        {invoiceMeta?.isEdited && (
          <div className="revised-invoice mt-2 flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 print:mt-1 print:py-0.5 print:text-[7pt]">
            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white print:px-1 print:text-[6pt]">
              Revised
            </span>
            <span>
              Revision {invoiceMeta.revision}
              {invoiceMeta.lastEditedAt
                ? ` · updated ${formatInvoiceDate(invoiceMeta.lastEditedAt)}`
                : ''}
            </span>
          </div>
        )}

        {/* Billing & Shipping */}
        <BillingShipping
          billingInfo={billingInfo}
          shippingInfo={shippingInfo}
        />

        {/* Items Table */}
        <InvoiceItemsTable items={items} warrantyMonths={warranty?.months} />

        {/* Terms & Conditions - Single Column, Compact */}
        <div className="mt-2 print:mt-1">
          <TermsAndConditions terms={terms} notes={notes} />
        </div>

        {/* Warranty & Service Policy */}
        <WarrantyInformation warranty={warranty} invoiceNumber={invoiceNumber} />

        {/* Totals */}
        <InvoiceTotals totals={totals} />
      </div>

      {/* Footer */}
      <InvoiceFooter />
    </div>
  );
}
