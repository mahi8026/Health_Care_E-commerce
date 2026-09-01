'use client';

import InvoiceHeader from './InvoiceHeader';
import BillingShipping from './BillingShipping';
import InvoiceItemsTable from './InvoiceItemsTable';
import InvoiceTotals from './InvoiceTotals';
import PaymentInformation from './PaymentInformation';
import TermsAndConditions from './TermsAndConditions';
import InvoiceFooter from './InvoiceFooter';

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

        {/* Billing & Shipping */}
        <BillingShipping
          billingInfo={billingInfo}
          shippingInfo={shippingInfo}
        />

        {/* Items Table */}
        <InvoiceItemsTable items={items} />

        {/* Terms & Conditions - Single Column, Compact */}
        <div className="mt-2 print:mt-1">
          <TermsAndConditions />
        </div>

        {/* Totals */}
        <InvoiceTotals totals={totals} />
      </div>

      {/* Footer */}
      <InvoiceFooter />
    </div>
  );
}
