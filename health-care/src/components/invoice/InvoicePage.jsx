'use client';

import { useState } from 'react';
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Call backend API to generate PDF
      const response = await fetch('/api/orders/invoice/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order._id || order.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${formatInvoiceNumber(invoiceNumber)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try printing instead.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="invoice-page min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="container mx-auto px-4">
        {/* Toolbar (hidden in print) */}
        <InvoiceToolbar
          orderId={order._id || order.id}
          onDownloadPDF={handleDownloadPDF}
          onPrint={handlePrint}
        />

        {/* Invoice Document */}
        <InvoiceDocument invoiceData={invoiceData} />

        {/* Loading Overlay for PDF Generation */}
        {isGeneratingPDF && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="rounded-lg bg-white p-6 text-center shadow-xl">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-teal border-t-transparent mx-auto"></div>
              <p className="text-lg font-semibold text-gray-900">
                Generating PDF...
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we prepare your invoice
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
