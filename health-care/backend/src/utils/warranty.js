/**
 * Warranty period helpers for invoices.
 *
 * Warranty on an invoice is OPT-IN: it only exists when an administrator sets a
 * period on that invoice (Invoice.warranty.months). There is no default policy —
 * an invoice without an admin-selected period prints no warranty at all.
 * Per-line values can be entered by the admin in the invoice editor.
 */

/**
 * Parse a warranty value into a whole number of months.
 *
 * Accepts numbers (24), plain numeric strings ('24'), month values
 * ('18 months', '24 mo') and year values ('1 year', '2 yrs',
 * '1 year manufacturer warranty'). Returns 0 for explicit "no warranty"
 * values and null when the value is missing or not recognisable.
 *
 * @param {number|string|null|undefined} value
 * @returns {number|null}
 */
function parseWarrantyMonths(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  }

  const text = String(value).trim().toLowerCase();
  if (!text) {
    return null;
  }

  // Explicit "no warranty" statements
  if (/^(no|none|nil|without|not applicable|n\/a)\b/.test(text)) {
    return 0;
  }

  const yearMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|y)\b/);
  if (yearMatch) {
    return Math.round(parseFloat(yearMatch[1]) * 12);
  }

  const monthMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:months?|mos?)\b/);
  if (monthMatch) {
    return Math.round(parseFloat(monthMatch[1]));
  }

  const bareNumber = text.match(/^(\d+(?:\.\d+)?)$/);
  if (bareNumber) {
    return Math.round(parseFloat(bareNumber[1]));
  }

  return null;
}

/**
 * Human label for a warranty period, e.g. 12 -> "12 months".
 *
 * @param {number|null|undefined} months
 * @returns {string}
 */
function formatWarrantyLabel(months) {
  if (months === null || months === undefined || months === '') {
    return '—';
  }
  const value = Number(months);
  if (!Number.isFinite(value) || value < 0) {
    return '—';
  }
  if (value === 0) {
    return 'No warranty';
  }
  return `${value} ${value === 1 ? 'month' : 'months'}`;
}

/**
 * Add months to a date, clamping the day to the end of the target month
 * (31 Aug + 6 months -> 28/29 Feb) instead of overflowing into March.
 *
 * @param {Date|string|number} date
 * @param {number} months
 * @returns {Date|null}
 */
function addMonthsToDate(date, months) {
  const start = new Date(date);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

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
 * Warranty statement attached to a product, if any.
 * Supports both populated Mongoose Maps and plain objects (lean() results).
 *
 * @param {object|null|undefined} product
 * @returns {string|null}
 */
function productWarrantyValue(product) {
  if (!product) {
    return null;
  }

  const variants = product.variants && product.variants.warranty;
  if (Array.isArray(variants)) {
    const match = variants.find((v) => parseWarrantyMonths(v) !== null);
    if (match !== undefined) {
      return match;
    }
  }

  const specs = product.specifications;
  if (specs && typeof specs.get === 'function') {
    const mapValue = specs.get('warranty') || specs.get('Warranty');
    if (mapValue) {
      return mapValue;
    }
  } else if (specs && typeof specs === 'object') {
    const key = Object.keys(specs).find((k) => String(k).trim().toLowerCase() === 'warranty');
    if (key && specs[key]) {
      return specs[key];
    }
  }

  return null;
}

/**
 * Resolve the warranty attached to a single order line.
 *
 * Order-level snapshots win (item.warranty / item.warrantyMonths); populated
 * product data is the fallback for invoices rendered outside checkout.
 *
 * @param {object} item
 * @returns {{ months: number, label: string }|null}
 */
function resolveItemWarranty(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidates = [
    item.warranty,
    item.warrantyMonths,
    item.variant && item.variant.warranty,
    productWarrantyValue(item.product),
  ];

  for (const candidate of candidates) {
    const months = parseWarrantyMonths(candidate);
    if (months !== null) {
      return { months, label: formatWarrantyLabel(months) };
    }
  }

  return null;
}

/**
 * Normalised warranty label for a product, used to snapshot the warranty onto
 * order items at checkout. Returns null when the product states no warranty.
 *
 * @param {object|null|undefined} product
 * @returns {string|null}
 */
function resolveProductWarranty(product) {
  const months = parseWarrantyMonths(productWarrantyValue(product));
  return months === null ? null : formatWarrantyLabel(months);
}

/**
 * Warranty selected by the admin for this invoice.
 *
 * @param {object} order Composed invoice view (warrantyMonths comes from the
 *                       stored admin revision; null when nothing was selected).
 * @returns {{ months: number|null, label: string|null, startDate: Date,
 *             endDate: Date|null, note: string,
 *             itemWarranties: Array<{ name: string, months: number, label: string }> }}
 */
function resolveInvoiceWarranty(order) {
  const explicitMonths = parseWarrantyMonths(order && order.warrantyMonths);
  const months = explicitMonths; // null = the admin has not selected a warranty

  const startCandidate = new Date((order && (order.invoiceDate || order.createdAt)) || Date.now());
  const startDate = Number.isNaN(startCandidate.getTime()) ? new Date() : startCandidate;
  const endDate = months !== null && months > 0 ? addMonthsToDate(startDate, months) : null;

  const itemWarranties = [];
  const seen = new Set();

  for (const item of (order && order.items) || []) {
    const resolved = resolveItemWarranty(item);
    if (!resolved) {
      continue;
    }

    const product = item && typeof item.product === 'object' ? item.product : null;
    const name = item.name || (product && product.name) || 'Item';
    const key = `${name}|${resolved.months}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    itemWarranties.push({ name, months: resolved.months, label: resolved.label });
  }

  return {
    months,
    label: months === null ? null : formatWarrantyLabel(months),
    startDate,
    endDate,
    note: (order && order.warrantyNote) || '',
    itemWarranties,
  };
}

module.exports = {
  parseWarrantyMonths,
  formatWarrantyLabel,
  addMonthsToDate,
  resolveItemWarranty,
  productWarrantyValue,
  resolveProductWarranty,
  resolveInvoiceWarranty,
};
