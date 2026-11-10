/**
 * Invoice Helper Functions
 * Utility functions for invoice calculations and formatting
 */

/**
 * Format currency in BDT.
 * Whole taka renders without trailing ".00" (matches the backend PDF); amounts
 * with fractional parts keep 2 decimals so real paisa values are never hidden.
 */
export function formatBdt(amount) {
  const num = Number(amount) || 0;
  const opts = Number.isInteger(num)
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return num.toLocaleString('en-BD', opts);
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
 * Default invoice warranty policy — must stay aligned with the backend
 * (backend/src/utils/warranty.js). Override per deployment with
 * NEXT_PUBLIC_INVOICE_WARRANTY_MONTHS.
 */
export const DEFAULT_WARRANTY_MONTHS = 12;

/**
 * Parse a warranty value into whole months.
 * Accepts numbers, '18 months', '24 mo', '1 year', '2 yrs' and explicit
 * "No warranty" statements (0). Returns null when the value is unusable.
 */
export function parseWarrantyMonths(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  }

  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (/^(no|none|nil|without|not applicable|n\/a)\b/.test(text)) return 0;

  const yearMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|y)\b/);
  if (yearMatch) return Math.round(parseFloat(yearMatch[1]) * 12);

  const monthMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:months?|mos?)\b/);
  if (monthMatch) return Math.round(parseFloat(monthMatch[1]));

  const bareNumber = text.match(/^(\d+(?:\.\d+)?)$/);
  if (bareNumber) return Math.round(parseFloat(bareNumber[1]));

  return null;
}

/**
 * Human label for a warranty period, e.g. 12 -> "12 months".
 */
export function formatWarrantyLabel(months) {
  if (months === null || months === undefined || months === '') return '—';
  const value = Number(months);
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value === 0) return 'No warranty';
  return `${value} ${value === 1 ? 'month' : 'months'}`;
}

/**
 * Add months to a date, clamping the day to the end of the target month.
 */
export function addMonthsToDate(date, months) {
  const start = new Date(date);
  if (Number.isNaN(start.getTime())) return null;

  const wholeMonths = Math.trunc(Number(months) || 0);
  const target = new Date(start.getTime());
  const day = target.getDate();

  target.setDate(1);
  target.setMonth(target.getMonth() + wholeMonths);

  const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDayOfTargetMonth));

  return target;
}

/**
 * Warranty value advertised on a product (variants.warranty or a
 * specifications "Warranty" entry).
 */
function productWarrantyValue(product) {
  if (!product || typeof product !== 'object') return null;

  if (Array.isArray(product.variants?.warranty)) {
    const match = product.variants.warranty.find((v) => parseWarrantyMonths(v) !== null);
    if (match !== undefined) return match;
  }

  const specs = product.specifications;
  if (specs && typeof specs.get === 'function') {
    return specs.get('warranty') || specs.get('Warranty') || null;
  }
  if (specs && typeof specs === 'object') {
    const key = Object.keys(specs).find((k) => String(k).trim().toLowerCase() === 'warranty');
    if (key && specs[key]) return specs[key];
  }

  return null;
}

/**
 * Warranty recorded on a single invoice line, if any.
 * Returns { months, label } or null.
 */
export function resolveItemWarranty(item) {
  if (!item || typeof item !== 'object') return null;

  const candidates = [
    item.warranty,
    item.warrantyMonths,
    item.variant?.warranty,
    productWarrantyValue(item.product),
  ];

  for (const candidate of candidates) {
    const months = parseWarrantyMonths(candidate);
    if (months !== null) return { months, label: formatWarrantyLabel(months) };
  }

  return null;
}

/**
 * Warranty policy for an invoice: period label, covered dates and any
 * product-level warranties that differ from the standard policy.
 */
export function resolveInvoiceWarranty(order) {
  const explicitMonths = parseWarrantyMonths(order?.warrantyMonths);
  const envMonths = parseWarrantyMonths(process.env.NEXT_PUBLIC_INVOICE_WARRANTY_MONTHS);
  const months = explicitMonths !== null
    ? explicitMonths
    : envMonths === null
      ? DEFAULT_WARRANTY_MONTHS
      : envMonths;

  const startCandidate = new Date(order?.invoiceDate || order?.createdAt || Date.now());
  const startDate = Number.isNaN(startCandidate.getTime()) ? new Date() : startCandidate;
  const endDate = months > 0 ? addMonthsToDate(startDate, months) : null;

  const itemWarranties = [];
  const seen = new Set();

  for (const item of order?.items || []) {
    const resolved = resolveItemWarranty(item);
    if (!resolved) continue;

    const name = item.name || item.product?.name || 'Item';
    const key = `${name}|${resolved.months}`;
    if (seen.has(key)) continue;
    seen.add(key);

    itemWarranties.push({ name, months: resolved.months, label: resolved.label });
  }

  return {
    months,
    label: formatWarrantyLabel(months),
    startDate,
    endDate,
    note: order?.warrantyNote || '',
    itemWarranties,
  };
}

/**
 * Totals for the admin invoice editor — mirrors the backend recomputation so the
 * live preview matches exactly what will be stored and printed.
 */
export function computeInvoiceTotals(items = [], charges = {}) {
  const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const num = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const subtotal = round2(
    items.reduce((sum, item) => {
      const qty = num(item?.qty, 1);
      const price = num(item?.price, 0);
      const discount = num(item?.discount, 0);
      return sum + round2(qty * price * (1 - discount / 100));
    }, 0)
  );

  const b2bDiscount = round2(Math.max(0, num(charges.b2bDiscount, 0)));
  const couponDiscount = round2(Math.max(0, num(charges.couponDiscount, 0)));
  const vatAmount = round2(Math.max(0, num(charges.vatAmount, 0)));
  const deliveryFee = round2(Math.max(0, num(charges.deliveryFee, 0)));
  const totalAmount = round2(
    Math.max(0, subtotal - b2bDiscount - couponDiscount + vatAmount + deliveryFee)
  );

  return { subtotal, b2bDiscount, couponDiscount, vatAmount, deliveryFee, totalAmount };
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
  
  // Postcode as its own line — no hardcoded "Dhaka-" prefix so orders shipped
  // outside Dhaka (e.g. Chittagong-4000) are printed correctly.
  const postcode = address.postcode || address.postalCode;
  if (postcode) {
    lines.push(String(postcode));
  }
  
  if (!lines.length && (address.district || address.city)) {
    lines.push(address.district || address.city);
  }
  
  lines.push('Bangladesh');
  
  return lines;
}

/**
 * Calculate invoice totals.
 *
 * Accuracy rules:
 * - Subtotal comes from the stored `order.subtotal` when present (single source
 *   of truth); it is only recomputed from line items as a fallback.
 * - Coupon/promo discounts are included — previously they were silently dropped,
 *   inflating the displayed grand total for coupon orders.
 * - The grand total prefers the authoritative recorded `order.totalAmount` and
 *   only recomputes when that value is missing.
 */
export function calculateInvoiceTotals(order) {
  const items = order.items || [];
  
  const storedSubtotal = Number(order.subtotal);
  const subtotal = Number.isFinite(storedSubtotal) && storedSubtotal >= 0
    ? storedSubtotal
    : items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  
  const b2bDiscount = Number(order.b2bDiscount || order.discount || 0);
  const b2bDiscountPct = Number(order.b2bDiscountPct || 0);
  const couponDiscount = Number(
    order.couponDiscount || order.promoDiscount || order.appliedCoupon?.discountAmount || 0
  );
  
  // VAT
  const vat = Number(order.vatAmount || 0);
  const vatRate = order.vatRate ? Number(order.vatRate) : 0;
  
  // Shipping
  const shipping = Number(order.deliveryFee || order.shippingCost || 0);
  
  // Grand total — the recorded total is authoritative when present.
  const recordedTotal = Number(order.totalAmount || order.total);
  const recomputed = subtotal - b2bDiscount - couponDiscount + vat + shipping;
  const grandTotal = Number.isFinite(recordedTotal) && recordedTotal >= 0
    ? recordedTotal
    : recomputed;
  
  return {
    subtotal,
    b2bDiscount,
    b2bDiscountPct,
    couponDiscount,
    vat,
    vatRate,
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
 * Format invoice number for display.
 * Normalizes MC- order numbers and already-prefixed values, strips a raw Mongo
 * ObjectId (never a valid invoice number), and avoids double prefixes.
 */
export function formatInvoiceNumber(invoiceNumber) {
  if (!invoiceNumber) return 'MPBD-INV-000000';
  
  // Convert to string and trim
  let invStr = String(invoiceNumber).trim();
  
  // Raw Mongo ObjectIds are never valid invoice numbers
  if (/^[a-f0-9]{24}$/i.test(invStr)) return 'MPBD-INV-000000';
  
  // Normalize prefixes (case-insensitive) and avoid double-prefixing
  invStr = invStr
    .replace(/^MC-/i, 'MPBD-INV-')
    .replace(/^MPBD-INV-/i, 'MPBD-INV-')
    .replace(/^INV-/i, '');
  
  if (invStr.startsWith('MPBD-INV-')) return invStr;
  
  // Otherwise, prefix with MPBD-INV-
  return `MPBD-INV-${invStr}`;
}
