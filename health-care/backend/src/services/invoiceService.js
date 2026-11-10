/**
 * Invoice composition service.
 *
 * One place builds the invoice that both the PDF and the printable page render:
 * the stored Order supplies the defaults, an optional admin-edited Invoice
 * document supplies overrides, and totals are always recomputed server-side.
 */

const mongoose = require('mongoose');
const { resolveInvoiceWarranty } = require('../utils/warranty');

const DEFAULT_TERMS = [
  'Products are subject to availability.',
  "Warranty applies according to the manufacturer's terms.",
  'Please verify the products upon delivery.',
  'Payment terms are as agreed between MediportBD and the customer.',
];

const MAX_ITEMS = 100;

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toText(value, maxLength = 240) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().slice(0, maxLength);
}

function objectIdOrNull(value) {
  if (!value) {
    return null;
  }
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(String(value));
  }
  return null;
}

function resolveItemName(item) {
  if (!item) {
    return 'Item';
  }
  if (item.name) {
    return String(item.name);
  }
  if (item.product && typeof item.product === 'object' && item.product.name) {
    return String(item.product.name);
  }
  return 'Item';
}

function resolveItemSku(item) {
  if (!item) {
    return '';
  }
  if (item.sku) {
    return String(item.sku);
  }
  if (item.product && typeof item.product === 'object' && item.product.sku) {
    return String(item.product.sku);
  }
  return '';
}

function resolveItemBrand(item) {
  const brand = item && (item.brand || (item.product && item.product.brand));
  if (!brand) {
    return '';
  }
  if (typeof brand === 'object') {
    return brand.name ? String(brand.name) : '';
  }
  const text = String(brand).trim();
  // ObjectIds are not useful on an invoice — the PDF exporter does the same.
  return /^[a-f0-9]{24}$/i.test(text) ? '' : text;
}

/** Line total after the per-line discount percentage. */
function computeItemTotal(item) {
  const qty = toNumber(item && item.qty, 1);
  const price = toNumber(item && item.price, 0);
  const discount = toNumber(item && item.discount, 0);
  return round2(qty * price * (1 - discount / 100));
}

/** Authoritative totals for an invoice — never taken from the client. */
function computeTotals(items = [], charges = {}) {
  // Round each line first so the printed line totals always add up to the
  // printed subtotal (no half-paisa drift).
  const subtotal = round2(items.reduce((sum, item) => sum + computeItemTotal(item), 0));

  const b2bDiscount = round2(Math.max(0, toNumber(charges.b2bDiscount, 0)));
  const couponDiscount = round2(Math.max(0, toNumber(charges.couponDiscount, 0)));
  const vatAmount = round2(Math.max(0, toNumber(charges.vatAmount, 0)));
  const deliveryFee = round2(Math.max(0, toNumber(charges.deliveryFee, 0)));

  const totalAmount = round2(
    Math.max(0, subtotal - b2bDiscount - couponDiscount + vatAmount + deliveryFee)
  );

  return {
    subtotal,
    b2bDiscount,
    couponDiscount,
    vatAmount,
    deliveryFee,
    totalAmount,
  };
}

/** Items as they should appear on the editable invoice. */
function mapOrderItems(order) {
  return ((order && order.items) || []).map((item) => ({
    product: item && item.product && typeof item.product === 'object'
      ? item.product._id
      : item && item.product,
    name: resolveItemName(item),
    sku: resolveItemSku(item),
    brand: resolveItemBrand(item),
    qty: toNumber(item && (item.qty ?? item.quantity), 1) || 1,
    price: toNumber(item && item.price, 0),
    discount: toNumber(item && item.discount, 0),
    warranty: toText(item && item.warranty, 80),
  }));
}

function orderCharges(order) {
  return {
    b2bDiscount: toNumber(order && (order.b2bDiscount ?? order.discount), 0),
    couponDiscount: toNumber(order && order.couponDiscount, 0),
    vatAmount: toNumber(order && order.vatAmount, 0),
    deliveryFee: toNumber(order && order.deliveryFee, 0),
  };
}

function orderTotals(order) {
  const charges = orderCharges(order);
  return {
    ...charges,
    subtotal: toNumber(order && order.subtotal, 0),
    totalAmount: toNumber(order && (order.totalAmount ?? order.total), 0),
  };
}

function deliveryDefaults(order, user) {
  const address = (order && order.deliveryAddress) || {};
  return {
    name: toText(address.name || (user && user.name), 120),
    phone: toText(address.phone || (user && user.phone), 40),
    street: toText(address.street || address.address, 240),
    thana: toText(address.thana || address.area, 120),
    district: toText(address.district || address.city, 120),
    postcode: toText(address.postcode || address.postalCode, 20),
  };
}

/** Editable defaults derived from the order — the editor's starting point. */
function buildDefaultInvoice(order, user) {
  const warranty = resolveInvoiceWarranty(order);
  const address = deliveryDefaults(order, user);

  return {
    invoiceNumber: toText((order && order.invoiceNumber) || (order && order.orderNumber), 40),
    issueDate: (order && order.createdAt) || new Date(),
    dueDate: null,
    customer: {
      name: toText(address.name || 'Customer', 120),
      companyName: toText((user && (user.companyName || user.company)) || '', 160),
      email: toText((user && user.email) || '', 160),
      phone: toText(address.phone || (user && user.phone), 40),
    },
    deliveryAddress: address,
    items: mapOrderItems(order),
    charges: orderCharges(order),
    payment: {
      method: toText(order && order.paymentMethod, 40),
      status: toText((order && order.paymentStatus) || 'pending', 40),
      reference: toText(order && order.transactionId, 120),
      instructions: '',
    },
    warranty: { months: warranty.months, note: '' },
    notes: '',
    terms: DEFAULT_TERMS,
  };
}

function sanitizeItems(items) {
  if (!Array.isArray(items)) {
    return null;
  }
  return items.slice(0, MAX_ITEMS).map((item) => ({
    product: objectIdOrNull(item && item.product),
    name: toText(item && item.name, 200) || 'Item',
    sku: toText(item && item.sku, 80),
    brand: toText(item && item.brand, 120),
    qty: Math.min(1000, Math.max(1, Math.round(toNumber(item && (item.qty ?? item.quantity), 1)))),
    price: Math.max(0, toNumber(item && item.price, 0)),
    discount: Math.min(100, Math.max(0, toNumber(item && item.discount, 0))),
    warranty: toText(item && item.warranty, 80),
  }));
}

/**
 * Normalise an admin payload into the stored invoice shape.
 * Express-validator rejects malformed input; this function coerces types and
 * applies hard limits so a missing validator can never corrupt a document.
 */
function sanitizeInvoicePayload(body = {}, order, user) {
  const defaults = buildDefaultInvoice(order, user);
  const source = body && typeof body === 'object' ? body : {};

  const issueDate = new Date(source.issueDate || defaults.issueDate);
  const dueRaw = source.dueDate ? new Date(source.dueDate) : null;
  const dueDate = dueRaw && !Number.isNaN(dueRaw.getTime()) ? dueRaw : null;

  const items = sanitizeItems(source.items);
  const chargesSource = source.charges || {};
  const paymentSource = source.payment || {};
  const warrantySource = source.warranty || {};
  const customerSource = source.customer || {};
  const addressSource = source.deliveryAddress || {};

  return {
    invoiceNumber: toText(source.invoiceNumber || defaults.invoiceNumber, 40).toUpperCase(),
    issueDate: Number.isNaN(issueDate.getTime()) ? defaults.issueDate : issueDate,
    dueDate,
    customer: {
      name: toText(customerSource.name || defaults.customer.name, 120),
      companyName: toText(customerSource.companyName, 160),
      email: toText(customerSource.email, 160),
      phone: toText(customerSource.phone, 40),
    },
    deliveryAddress: {
      name: toText(addressSource.name || defaults.deliveryAddress.name, 120),
      phone: toText(addressSource.phone || defaults.deliveryAddress.phone, 40),
      street: toText(addressSource.street, 240),
      thana: toText(addressSource.thana, 120),
      district: toText(addressSource.district, 120),
      postcode: toText(addressSource.postcode, 20),
    },
    items: items || defaults.items,
    charges: {
      b2bDiscount: Math.max(0, toNumber(chargesSource.b2bDiscount, 0)),
      couponDiscount: Math.max(0, toNumber(chargesSource.couponDiscount, 0)),
      vatAmount: Math.max(0, toNumber(chargesSource.vatAmount, 0)),
      deliveryFee: Math.max(0, toNumber(chargesSource.deliveryFee, 0)),
    },
    payment: {
      method: toText(paymentSource.method || defaults.payment.method, 40),
      status: toText(paymentSource.status || defaults.payment.status, 40),
      reference: toText(paymentSource.reference, 120),
      instructions: toText(paymentSource.instructions, 600),
    },
    warranty: {
      months: Math.min(120, Math.max(0, Math.round(toNumber(warrantySource.months, defaults.warranty.months)))),
      note: toText(warrantySource.note, 500),
    },
    notes: toText(source.notes, 2000),
    terms: Array.isArray(source.terms)
      ? source.terms.slice(0, 20).map((term) => toText(term, 300)).filter(Boolean)
      : defaults.terms,
  };
}

/**
 * Merge an order with its admin-edited invoice document.
 *
 * Returns an order-shaped view (so the PDF generator and the printable page can
 * consume it unchanged), the effective customer profile and edit metadata.
 */
function composeInvoice(order, user, invoiceDoc) {
  const baseItems = mapOrderItems(order);
  const doc = invoiceDoc || null;

  const items = doc && Array.isArray(doc.items) && doc.items.length
    ? doc.items.map((item) => ({
        name: item.name,
        sku: item.sku || '',
        brand: item.brand || '',
        qty: toNumber(item.qty, 1),
        price: toNumber(item.price, 0),
        discount: toNumber(item.discount, 0),
        warranty: item.warranty || '',
      }))
    : baseItems;

  // With an edited invoice the totals are recomputed from the edited document;
  // otherwise the order's recorded totals remain authoritative (unchanged
  // behaviour for invoices nobody has edited).
  const totals = doc ? computeTotals(items, doc.charges || {}) : orderTotals(order);

  const addressDefaults = deliveryDefaults(order, user);
  const address = doc
    ? {
        ...addressDefaults,
        ...Object.fromEntries(
          Object.entries(doc.deliveryAddress || {}).filter(([, value]) => value)
        ),
      }
    : addressDefaults;

  const customer = {
    name: (doc && doc.customer && doc.customer.name) || addressDefaults.name,
    companyName: (doc && doc.customer && doc.customer.companyName) || (user && (user.companyName || user.company)) || '',
    email: (doc && doc.customer && doc.customer.email) || (user && user.email) || '',
    phone: (doc && doc.customer && doc.customer.phone) || addressDefaults.phone,
  };

  const customerUser = {
    ...(user || {}),
    name: customer.name,
    companyName: customer.companyName,
    email: customer.email,
    phone: customer.phone,
  };

  const view = {
    ...order,
    invoiceNumber: (doc && doc.invoiceNumber) || order.invoiceNumber,
    createdAt: (doc && doc.issueDate) || order.createdAt,
    invoiceDate: (doc && doc.issueDate) || order.createdAt,
    dueDate: (doc && doc.dueDate) || null,
    customer,
    deliveryAddress: address,
    items,
    subtotal: totals.subtotal,
    b2bDiscount: totals.b2bDiscount,
    couponDiscount: totals.couponDiscount,
    vatAmount: totals.vatAmount,
    deliveryFee: totals.deliveryFee,
    totalAmount: totals.totalAmount,
    paymentMethod: (doc && doc.payment && doc.payment.method) || order.paymentMethod,
    paymentStatus: (doc && doc.payment && doc.payment.status) || order.paymentStatus,
    paymentReference:
      (doc && doc.payment && doc.payment.reference) || order.transactionId || '',
    paymentInstructions: (doc && doc.payment && doc.payment.instructions) || '',
    warrantyMonths: doc && doc.warranty ? doc.warranty.months : null,
    warrantyNote: (doc && doc.warranty && doc.warranty.note) || '',
    invoiceNotes: (doc && doc.notes) || '',
    invoiceTerms: doc && Array.isArray(doc.terms) && doc.terms.length ? doc.terms : null,
    invoiceRevision: doc ? doc.revision : 0,
    invoiceEditedAt: doc ? doc.lastEditedAt || doc.updatedAt : null,
  };

  const meta = {
    isEdited: Boolean(doc),
    revision: doc ? doc.revision : 0,
    lastEditedAt: doc ? doc.lastEditedAt || doc.updatedAt || null : null,
    editedBy: doc && doc.editedBy ? String(doc.editedBy) : null,
  };

  return { order: view, customer: customerUser, totals, meta };
}

/**
 * An invoice number must be unique across every invoice in the system: both the
 * order's own number and any admin-edited invoice number count.
 *
 * @returns {Promise<boolean>} true when another document already uses the number
 */
async function isInvoiceNumberTaken(invoiceNumber, orderId) {
  const Order = require('../models/Order');
  const Invoice = require('../models/Invoice');
  const value = toText(invoiceNumber, 40);
  if (!value) {
    return false;
  }

  const [orderClash, invoiceClash] = await Promise.all([
    Order.exists({ invoiceNumber: value, _id: { $ne: orderId } }),
    Invoice.exists({ invoiceNumber: value, order: { $ne: orderId } }),
  ]);

  return Boolean(orderClash || invoiceClash);
}

module.exports = {
  DEFAULT_TERMS,
  MAX_ITEMS,
  computeItemTotal,
  computeTotals,
  mapOrderItems,
  buildDefaultInvoice,
  sanitizeInvoicePayload,
  composeInvoice,
  isInvoiceNumberTaken,
};
