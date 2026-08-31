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
      {/* Invoice Content - Reduced padding for compact layout */}
      <div className="p-4">
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

        {/* Two Column Layout: Payment Info & Terms */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <PaymentInformation paymentInfo={paymentInfo} />
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
