'use client';

import InvoiceToolbar from './InvoiceToolbar';
import InvoiceDocument from './InvoiceDocument';
import {
  calculateInvoiceTotals,
  getInvoiceNumber,
  resolveInvoiceWarranty,
} from '@/utils/invoiceHelpers';

/**
 * B2B detection works on every population shape the API can return:
 * - order.isB2BOrder (authoritative, always present on B2B orders)
 * - user.b2bAccount boolean (getInvoiceData population)
 * - user.accountType === 'B2B' (both getInvoiceData and /auth/me)
 * - presence of user.b2bId / user.b2bTier (B2B profile fields)
 */
function isB2BOrder(order, user) {
  const u = user || {};
  return !!(
    order?.isB2BOrder ||
    u.b2bAccount === true ||
    u.b2bAccount === 'true' ||
    String(u.accountType || '').toUpperCase() === 'B2B' ||
    u.b2bId ||
    u.b2bTier
  );
}

/**
 * InvoicePage Component
 * Main invoice page with toolbar and document
 */
export default function InvoicePage({ order, user, invoice = null, canEdit = false }) {

  // Prepare invoice data
  const invoiceNumber = getInvoiceNumber(order);
  const orderNumber = order.orderNumber || order.orderId || '';
  const invoiceDate = order.invoiceDate || order.createdAt;
  const isB2B = isB2BOrder(order, user);

  // Due date: an admin override always wins; otherwise B2B payment terms apply.
  let dueDate = null;
  if (order.dueDate) {
    const override = new Date(order.dueDate);
    if (!Number.isNaN(override.getTime())) {
      dueDate = override;
    }
  } else if (isB2B && invoiceDate) {
    const terms = new Date(invoiceDate);
    if (!Number.isNaN(terms.getTime())) {
      terms.setDate(terms.getDate() + (Number(user?.paymentTerms) || 30));
      dueDate = terms;
    }
  }

  // Extract user info - handle both populated and unpopulated user references
  const userInfo = typeof order.user === 'object' ? order.user : user;
  // Admin edits take precedence over the stored profile.
  const customer = order.customer || {};

  // Billing Info
  const billingInfo = {
    name: customer.name || userInfo?.name || order.deliveryAddress?.name || 'Customer',
    email: customer.email || userInfo?.email || order.deliveryAddress?.email || '',
    phone: customer.phone || userInfo?.phone || order.deliveryAddress?.phone || '',
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

  // Warranty policy (period + covered dates + any item-specific warranties)
  const warranty = resolveInvoiceWarranty(order);

  // Payment Info — bank details match the backend PDF (BRAC Bank PLC) and the
  // transaction ref is the real payment reference, never a derived invoice number.
  const paymentInfo = {
    accountName: 'MAHI M RAHMAN',
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus || order.status || '—',
    bankInfo: 'BRAC Bank PLC · MAHI M RAHMAN · A/C 1081267690001',
    transactionRef: order.paymentReference || order.transactionId || '—',
  };

  // Prepare invoice data
  const invoiceData = {
    invoiceNumber,
    orderNumber,
    invoiceDate,
    dueDate,
    billingInfo,
    shippingInfo,
    items: order.items || [],
    totals,
    paymentInfo,
    warranty,
    notes: order.invoiceNotes || '',
    terms: Array.isArray(order.invoiceTerms) ? order.invoiceTerms : null,
    invoiceMeta: invoice,
    isB2B,
  };

  const handlePrint = () => {
    window.print();
  };

  // PDF download is intentionally not offered inline — Print → "Save as PDF" gives
  // pixel-identical output and avoids the previously reported stuck loading dialog.

  return (
    <div className="invoice-page min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="container mx-auto px-4">
        {/* Toolbar (hidden in print) */}
        <InvoiceToolbar
          orderId={order._id || order.id}
          onPrint={handlePrint}
          editHref={canEdit ? `/admin/orders/${order._id || order.id}/invoice` : null}
        />

        {/* Invoice Document */}
        <InvoiceDocument invoiceData={invoiceData} />
      </div>
    </div>
  );
}
