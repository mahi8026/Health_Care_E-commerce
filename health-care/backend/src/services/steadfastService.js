const axios = require('axios');

const DEFAULT_BASE_URL = 'https://portal.packzy.com/api/v1';

class SteadfastError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'SteadfastError';
    this.status = status;
    this.body = body;
  }
}

function getConfig() {
  return {
    apiKey: process.env.STEADFAST_API_KEY,
    secretKey: process.env.STEADFAST_SECRET_KEY,
    baseUrl: (process.env.STEADFAST_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
  };
}

function isConfigured() {
  const { apiKey, secretKey } = getConfig();
  return Boolean(apiKey && secretKey && !apiKey.includes('YOUR_') && !secretKey.includes('YOUR_'));
}

function buildHeaders() {
  const { apiKey, secretKey } = getConfig();
  return {
    'Api-Key': apiKey,
    'Secret-Key': secretKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

async function request(path, options = {}) {
  if (!isConfigured()) {
    throw new SteadfastError('SteadFast is not configured', 500, null);
  }
  const { baseUrl } = getConfig();
  const { method = 'GET', data, params } = options;
  try {
    const response = await axios({
      method,
      url: `${baseUrl}${path}`,
      headers: buildHeaders(),
      data,
      params,
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    const status = error.response ? error.response.status : 0;
    const body = error.response ? error.response.data : null;
    const message = (body && (body.message || body.error)) || error.message;
    throw new SteadfastError(message, status, body);
  }
}

/**
 * Create a shipment (consignment).
 *
 * @param {object} payload
 * @param {string} payload.invoice - unique alphanumeric invoice (hyphens/underscores allowed)
 * @param {string} payload.recipientName
 * @param {string} payload.recipientPhone - 11-digit BD phone
 * @param {string} payload.recipientAddress
 * @param {string} [payload.recipientEmail]
 * @param {string} [payload.alternativePhone]
 * @param {string} [payload.itemDescription]
 * @param {number} payload.codAmount - cash to collect on delivery (0 for prepaid)
 * @param {string} [payload.note]
 * @param {number} payload.totalLot
 * @returns {Promise<object>} { consignment_id, invoice, tracking_code, status, ... }
 */
async function createShipment(payload) {
  const body = {
    invoice: payload.invoice,
    recipient_name: payload.recipientName,
    recipient_phone: payload.recipientPhone,
    recipient_address: payload.recipientAddress,
    recipient_email: payload.recipientEmail,
    alternative_phone: payload.alternativePhone,
    item_description: payload.itemDescription,
    cod_amount: String(payload.codAmount || 0),
    note: payload.note,
    total_lot: payload.totalLot || 1,
    delivery_type: 0
  };
  const data = await request('/create_order', { method: 'POST', data: body });
  if (data && data.consignment) {
    return data.consignment;
  }
  throw new SteadfastError((data && data.message) || 'SteadFast create order failed', 200, data);
}

async function getBalance() {
  const data = await request('/get_balance');
  return data && typeof data.current_balance === 'number' ? data.current_balance : 0;
}

async function getStatusByInvoice(invoice) {
  const data = await request(`/status_by_invoice/${encodeURIComponent(invoice)}`);
  return data;
}

async function getStatusByCid(consignmentId) {
  const data = await request(`/status_by_cid/${encodeURIComponent(consignmentId)}`);
  return data;
}

async function getStatusByTrackingCode(trackingCode) {
  const data = await request(`/status_by_trackingcode/${encodeURIComponent(trackingCode)}`);
  return data;
}

/**
 * Create a SteadFast return request for a previously booked consignment.
 *
 * @param {object} payload
 * @param {string} payload.consignmentId - original shipment consignment ID
 * @param {string} payload.recipientName - customer name for return pickup
 * @param {string} payload.recipientPhone - customer phone (normalized)
 * @param {string} payload.recipientAddress - pickup address for the return
 * @param {number} payload.codAmount - COD amount to collect on return pickup
 * @param {string} payload.reason - return reason
 * @param {string} [payload.reference] - optional internal reference
 * @returns {Promise<object>} { return_consignment, ... }
 */
async function createReturn(payload) {
  const body = {
    consignment_id: payload.consignmentId,
    recipient_name: payload.recipientName,
    recipient_phone: normalizePhone(payload.recipientPhone),
    recipient_address: payload.recipientAddress,
    cod_amount: String(payload.codAmount || 0),
    return_reason: (payload.reason || '').slice(0, 255),
    reference: payload.reference
  };
  const data = await request('/create_return', { method: 'POST', data: body });
  if (data && (data.data || data.return_consignment || data.consignment)) {
    return data;
  }
  throw new SteadfastError((data && data.message) || 'SteadFast create return failed', 200, data);
}

/**
 * Best-effort SteadFast fraud check for a phone number.
 * Throws SteadfastError when the account is unconfigured or the call fails —
 * callers that must not block on fraud should catch and continue.
 *
 * @param {string} phone - BD phone (normalized to 11 digits)
 * @returns {Promise<object>} { phone, status, fraud } — fraud is the reason
 *   string when the number is flagged, otherwise null
 */
async function checkFraud(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new SteadfastError('Invalid phone number for fraud check', 400, null);
  }
  const data = await request(`/check_fraud/${encodeURIComponent(normalized)}`);
  const info = (data && (data.data || data)) || {};
  return {
    phone: normalized,
    status: info.status || (data && data.status),
    fraud: info.fraud_reason || info.fraudReason || null
  };
}

/**
 * Normalize a BD phone number to 11 digits (0XXXXXXXXXX).
 */
function normalizePhone(phone) {
  if (!phone) {
    return '';
  }
  let digits = String(phone).replace(/[^\d]/g, '');
  if (digits.startsWith('880') && digits.length === 13) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('01')) {
    return digits;
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return `0${digits}`;
  }
  return '';
}

/**
 * Build the create_order payload from an Order document.
 */
function buildShipmentPayload(order) {
  const address = order.deliveryAddress || {};
  const parts = [address.street, address.thana || address.area, address.district || address.city].filter(Boolean);
  const isCod = order.paymentMethod === 'cod' && order.paymentStatus !== 'paid';
  const items = (order.items || []).map(item => `${item.name || item.product} x${item.qty || item.quantity || 1}`);
  return {
    invoice: order.orderNumber || order._id.toString(),
    recipientName: address.name,
    recipientPhone: normalizePhone(address.phone),
    recipientAddress: parts.join(', ') || address.street,
    recipientEmail: address.email,
    itemDescription: items.join(', ').slice(0, 200),
    codAmount: isCod ? (order.totalAmount || order.total || 0) : 0,
    note: (address.instructions || '').slice(0, 250),
    totalLot: (order.items || []).reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0)
  };
}

module.exports = {
  SteadfastError,
  isConfigured,
  createShipment,
  createReturn,
  getBalance,
  getStatusByInvoice,
  getStatusByCid,
  getStatusByTrackingCode,
  checkFraud,
  normalizePhone,
  buildShipmentPayload
};