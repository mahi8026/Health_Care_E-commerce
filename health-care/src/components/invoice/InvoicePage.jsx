'use client';

import InvoiceToolbar from './InvoiceToolbar';
import InvoiceDocument from './InvoiceDocument';
import {
  calculateInvoiceTotals,
  getInvoiceNumber,
  formatInvoiceNumber,
} from '@/utils/invoiceHelpers';

/**
 * InvoicePage Component
 * Main invoice page with toolbar and document
 */
export default function InvoicePage({ order, user }) {

  // Prepare invoice data
  const invoiceNumber = getInvoiceNumber(order);
  const invoiceDate = order.createdAt;
  
  // Calculate due date (30 days from invoice date for B2B, immediate for others)
  const dueDate = new Date(invoiceDate);
  const isB2B = user?.b2bAccount || user?.accountType === 'B2B' || order.isB2BOrder;
  if (isB2B) {
    dueDate.setDate(dueDate.getDate() + (user?.paymentTerms || 30));
  }

  // Extract user info - handle both populated and unpopulated user references
  const userInfo = typeof order.user === 'object' ? order.user : user;
  
  // Billing Info
  const billingInfo = {
    name: userInfo?.name || order.deliveryAddress?.name || 'Customer',
    email: userInfo?.email || order.deliveryAddress?.email || '',
    phone: userInfo?.phone || order.deliveryAddress?.phone || '',
    address: userInfo?.addresses?.[0] || order.deliveryAddress || {},
  };

  // Shipping Info
  const deliveryAddress = order.deliveryAddress || {};
  const shippingInfo = {
    name: deliveryAddress.name || billingInfo.name,
    phone: deliveryAddress.phone || billingInfo.phone,
    email: deliveryAddress.email || billingInfo.email,
    address: deliveryAddress,
  };

  // Calculate totals
  const totals = calculateInvoiceTotals(order);

  // Payment Info
  const paymentInfo = {
    accountName: 'MediportBD',
    paymentMethod: order.paymentMethod,
    bankInfo: 'Dutch-Bangla Bank Ltd · A/C 1721 2030 5678',
    transactionRef: order.transactionId || formatInvoiceNumber(invoiceNumber),
  };

  // Prepare invoice data
  const invoiceData = {
    invoiceNumber,
    invoiceDate,
    dueDate: isB2B ? dueDate : null,
    billingInfo,
    shippingInfo,
    items: order.items || [],
    totals,
    paymentInfo,
    isB2B,
  };

  const handlePrint = () => {
    window.print();
  };

  // Removed PDF download functionality - users can use Print -> Save as PDF instead

  return (
    <div className="invoice-page min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="container mx-auto px-4">
        {/* Toolbar (hidden in print) */}
        <InvoiceToolbar
          orderId={order._id || order.id}
          onPrint={handlePrint}
        />

        {/* Invoice Document */}
        <InvoiceDocument invoiceData={invoiceData} />
      </div>
    </div>
  );
}
