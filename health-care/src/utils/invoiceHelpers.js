/**
 * Invoice Helper Functions
 * Utility functions for invoice calculations and formatting
 */

/**
 * Format currency in BDT
 */
export function formatBdt(amount) {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date in DD/MM/YYYY format
 */
export function formatInvoiceDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculate item total
 */
export function calculateItemTotal(item) {
  const quantity = Number(item.qty || item.quantity || 1);
  const unitPrice = Number(item.price || 0);
  const discount = Number(item.discount || 0);
  
  const subtotal = quantity * unitPrice;
  const discountAmount = (subtotal * discount) / 100;
  
  return subtotal - discountAmount;
}

/**
 * Convert number to words (BDT)
 */
export function numberToWords(num) {
  if (!num || num === 0) return 'Zero Taka Only';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numToWords = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    return '';
  };
  
  const amount = Math.floor(Math.abs(num));
  const paisa = Math.round((Math.abs(num) - amount) * 100);
  
  let result = '';
  
  // Crore (10,000,000)
  if (amount >= 10000000) {
    const crore = Math.floor(amount / 10000000);
    result += numToWords(crore) + ' Crore ';
  }
  
  // Lakh (100,000)
  const remaining1 = amount % 10000000;
  if (remaining1 >= 100000) {
    const lakh = Math.floor(remaining1 / 100000);
    result += numToWords(lakh) + ' Lakh ';
  }
  
  // Thousand (1,000)
  const remaining2 = remaining1 % 100000;
  if (remaining2 >= 1000) {
    const thousand = Math.floor(remaining2 / 1000);
    result += numToWords(thousand) + ' Thousand ';
  }
  
  // Hundreds
  const remaining3 = remaining2 % 1000;
  if (remaining3 > 0) {
    result += numToWords(remaining3) + ' ';
  }
  
  result = result.trim();
  
  // Add Taka
  result += ' Taka';
  
  // Add Paisa if exists
  if (paisa > 0) {
    result += ' and ' + numToWords(paisa) + ' Paisa';
  }
  
  result += ' Only';
  
  return result;
}

/**
 * Get payment method label
 */
export function getPaymentMethodLabel(method) {
  const labels = {
    cod: 'Cash on Delivery',
    beftn: 'BEFTN',
    bkash: 'bKash',
    nagad: 'Nagad',
    npsb: 'NPSB',
    cheque: 'Cheque',
    b2b_credit: 'B2B Credit / Credit Terms',
    bank_transfer: 'Bank Transfer',
    credit_terms: 'Credit Terms',
    card: 'Credit/Debit Card',
    cash: 'Cash',
  };
  
  return labels[method] || (method || 'N/A').replace(/_/g, ' ');
}

/**
 * Resolve product name from item
 */
export function resolveItemName(item) {
  if (item.name) return item.name;
  if (item.product && typeof item.product === 'object') {
    return item.product.name || 'Product';
  }
  return 'Product';
}

/**
 * Resolve brand from item
 */
export function resolveItemBrand(item) {
  const brand = item.brand || (item.product?.brand);
  if (!brand) return '';
  
  if (typeof brand === 'object') {
    return brand.name || '';
  }
  
  const brandStr = String(brand).trim();
  // Filter out MongoDB IDs
  if (/^[a-f0-9]{24}$/i.test(brandStr)) {
    return '';
  }
  
  return brandStr;
}

/**
 * Resolve model/SKU from item
 */
export function resolveItemModel(item) {
  if (item.sku) return item.sku;
  if (item.product && typeof item.product === 'object') {
    return item.product.sku || '';
  }
  return '';
}

/**
 * Format delivery address
 */
export function formatAddress(address) {
  if (!address) return [];
  
  const lines = [];
  
  if (address.street) {
    lines.push(address.street);
  }
  
  const cityParts = [
    address.thana || address.area,
    address.district || address.city,
  ].filter(Boolean);
  
  if (cityParts.length > 0) {
    lines.push(cityParts.join(', '));
  }
  
  if (address.postcode || address.postalCode) {
    lines.push(`Dhaka-${address.postcode || address.postalCode}`);
  }
  
  if (!lines.length && (address.district || address.city)) {
    lines.push(address.district || address.city);
  }
  
  lines.push('Bangladesh');
  
  return lines;
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(order) {
  const items = order.items || [];
  
  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => {
    return sum + calculateItemTotal(item);
  }, 0);
  
  // Get discounts
  const discount = Number(order.b2bDiscount || order.discount || 0);
  const discountPct = Number(order.b2bDiscountPct || 0);
  
  // Get VAT
  const vat = Number(order.vatAmount || 0);
  
  // Get shipping
  const shipping = Number(order.deliveryFee || 0);
  
  // Calculate grand total
  const grandTotal = subtotal - discount + vat + shipping;
  
  return {
    subtotal,
    discount,
    discountPct,
    vat,
    shipping,
    grandTotal,
  };
}

/**
 * Generate invoice number if not present
 */
export function getInvoiceNumber(order) {
  return order.invoiceNumber || order.orderNumber || order.orderId || order._id || '000000';
}

/**
 * Format invoice number for display
 */
export function formatInvoiceNumber(invoiceNumber) {
  if (!invoiceNumber) return 'MPBD-INV-000000';
  
  // Convert to string and trim
  const invStr = String(invoiceNumber).trim();
  
  // If it already has proper MPBD-INV format, use as is
  if (invStr.startsWith('MPBD-INV-')) {
    return invStr;
  }
  
  // If it's an order number starting with MC-, convert to invoice format
  if (invStr.startsWith('MC-')) {
    return invStr.replace('MC-', 'MPBD-INV-');
  }
  
  // Otherwise, prefix with MPBD-INV-
  return `MPBD-INV-${invStr}`;
}
