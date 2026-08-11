'use strict';

/**
 * Email Service — Brevo (HTTP API, works on Render.com free tier)
 *
 * Brevo free plan: 300 emails/day, no domain verification needed,
 * sends to ANY recipient email address.
 *
 * Required env vars on Render.com:
 *   BREVO_API_KEY   — get from app.brevo.com → Settings → API Keys
 *   BREVO_FROM_EMAIL — your verified sender email (e.g. mahimrahman07@gmail.com)
 *   BREVO_FROM_NAME  — (optional) sender name, defaults to "MediportBD"
 */

const axios = require('axios');
const logger = require('../utils/logger');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function getConfig() {
  return {
    apiKey:    process.env.BREVO_API_KEY,
    fromEmail: process.env.BREVO_FROM_EMAIL || process.env.SMTP_USER || 'mahimrahman07@gmail.com',
    fromName:  process.env.BREVO_FROM_NAME  || process.env.EMAIL_FROM_NAME || 'MediportBD',
    adminEmail: process.env.ADMIN_EMAIL     || process.env.BREVO_FROM_EMAIL || 'mahimrahman07@gmail.com',
    siteUrl:   process.env.FRONTEND_URL     || 'https://health-care-e-commerce-murex.vercel.app',
  };
}

function isConfigured() {
  const { apiKey } = getConfig();
  if (!apiKey) {
    logger.warn('[EmailService] ⚠️  BREVO_API_KEY not set — emails will be skipped');
    return false;
  }
  return true;
}

// ─── Core sender ──────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, attachments }) {
  const cfg = getConfig();

  if (!isConfigured()) {
    return { skipped: true, reason: 'BREVO_API_KEY not configured' };
  }

  const payload = {
    sender:  { name: cfg.fromName, email: cfg.fromEmail },
    to:      [{ email: to }],
    subject,
    htmlContent: html,
  };

  if (attachments && attachments.length) {
    payload.attachment = attachments.map(a => ({
      name:    a.filename,
      content: Buffer.isBuffer(a.content)
        ? a.content.toString('base64')
        : Buffer.from(a.content).toString('base64'),
    }));
  }

  try {
    logger.info('[EmailService] 📧 Sending to %s — %s', to, subject);
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        'api-key':      cfg.apiKey,
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      timeout: 15000,
    });

    const messageId = response.data?.messageId;
    logger.info('[EmailService] ✅ Sent to %s (ID: %s)', to, messageId);
    return { success: true, messageId };
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    const errCode = error.response?.status;
    logger.error('[EmailService] ❌ Failed to send to %s: [%s] %s', to, errCode, errMsg);
    return { error: errMsg, code: errCode };
  }
}

// ─── Layout helpers ───────────────────────────────────────────────────────────
function emailLayout(title, bodyHtml) {
  const { siteUrl, fromEmail } = getConfig();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#0B2545;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
        <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
          Mediport<span style="color:#0E8A6E;">BD</span>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:1px;text-transform:uppercase;">
          Healthcare &amp; Medical Supplies · Bangladesh
        </div>
      </td></tr>
      <tr><td style="background:#fff;padding:32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
        ${bodyHtml}
      </td></tr>
      <tr><td style="background:#F9FAFB;border-radius:0 0 12px 12px;border:1px solid #E5E7EB;border-top:none;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9CA3AF;">
          © ${new Date().getFullYear()} MediportBD · Dhaka, Bangladesh<br/>
          <a href="${siteUrl}" style="color:#0E8A6E;text-decoration:none;">Visit our store</a>
          &nbsp;·&nbsp;
          <a href="${siteUrl}/track" style="color:#0E8A6E;text-decoration:none;">Track order</a>
          &nbsp;·&nbsp;
          <a href="mailto:${fromEmail}" style="color:#0E8A6E;text-decoration:none;">Contact us</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function ctaButton(text, url) {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:#0E8A6E;color:#fff;font-size:14px;font-weight:600;padding:13px 28px;border-radius:8px;text-decoration:none;">
      ${text}
    </a>
  </div>`;
}

function itemRows(items = []) {
  return items.map(item => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#374151;border-bottom:1px solid #F3F4F6;">
        ${item.name || 'Product'}${item.sku ? ` <span style="color:#9CA3AF;font-size:11px;">(${item.sku})</span>` : ''}
      </td>
      <td style="padding:8px 0;text-align:center;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">
        &times;${item.qty || item.quantity || 1}
      </td>
      <td style="padding:8px 0;text-align:right;font-size:13px;font-weight:600;color:#0B2545;border-bottom:1px solid #F3F4F6;">
        &#2547;${((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString()}
      </td>
    </tr>`).join('');
}

function orderSummaryBox(order) {
  const subtotal    = order.subtotal       || 0;
  const deliveryFee = order.deliveryFee    || 0;
  const couponDisc  = order.couponDiscount || order.promoDiscount || 0;
  const loyaltyDisc = order.loyaltyDiscount || 0;
  const total       = order.totalAmount    || order.total || 0;

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;">
    <tr><td colspan="2" style="padding:12px 16px 8px;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Order Summary</td></tr>
    <tr><td colspan="2" style="padding:0 16px 8px;">
      <table width="100%">${itemRows(order.items || [])}</table>
    </td></tr>
    <tr><td colspan="2" style="padding:0 16px 12px;">
      <table width="100%" cellpadding="4">
        <tr><td style="font-size:12px;color:#6B7280;">Subtotal</td><td style="text-align:right;font-size:12px;color:#374151;">&#2547;${subtotal.toLocaleString()}</td></tr>
        ${deliveryFee ? `<tr><td style="font-size:12px;color:#6B7280;">Delivery</td><td style="text-align:right;font-size:12px;color:#374151;">&#2547;${deliveryFee.toLocaleString()}</td></tr>` : ''}
        ${couponDisc  ? `<tr><td style="font-size:12px;color:#0E8A6E;">Coupon discount</td><td style="text-align:right;font-size:12px;color:#0E8A6E;">-&#2547;${couponDisc.toLocaleString()}</td></tr>` : ''}
        ${loyaltyDisc ? `<tr><td style="font-size:12px;color:#0E8A6E;">Loyalty discount</td><td style="text-align:right;font-size:12px;color:#0E8A6E;">-&#2547;${loyaltyDisc.toLocaleString()}</td></tr>` : ''}
        <tr><td style="font-size:14px;font-weight:700;color:#0B2545;padding-top:8px;border-top:1px solid #E5E7EB;">Total</td>
            <td style="text-align:right;font-size:14px;font-weight:700;color:#0B2545;padding-top:8px;border-top:1px solid #E5E7EB;">&#2547;${total.toLocaleString()}</td></tr>
      </table>
    </td></tr>
  </table>`;
}

function addressBlock(addr = {}) {
  if (!addr || !addr.name) {
return '';
}
  return `
  <div style="margin-top:20px;padding:14px 16px;background:#F0FDF4;border-radius:8px;border:1px solid #BBF7D0;">
    <div style="font-size:11px;font-weight:700;color:#065F46;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Delivery Address</div>
    <div style="font-size:13px;color:#374151;line-height:1.7;">
      <strong>${addr.name}</strong><br/>
      ${addr.phone ? `&#128222; ${addr.phone}<br/>` : ''}
      ${[addr.street, addr.area, addr.thana, addr.district].filter(Boolean).join(', ')}
      ${addr.postcode || addr.postalCode ? ` - ${addr.postcode || addr.postalCode}` : ''}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function sendOrderConfirmation(order, customer) {
  const { siteUrl, fromEmail } = getConfig();
  const name     = customer?.name?.split(' ')[0] || 'Valued Customer';
  const trackUrl = `${siteUrl}/track/${order.orderNumber}`;

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Order Confirmed! &#127881;</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">Hi ${name}, thank you for your order. We are preparing it now.</p>

    <div style="background:#E6F4F0;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Order Number</div>
      <div style="font-size:22px;font-weight:800;color:#0B2545;letter-spacing:1px;">${order.orderNumber}</div>
    </div>

    ${orderSummaryBox(order)}
    ${addressBlock(order.deliveryAddress)}

    <div style="margin-top:20px;padding:14px 16px;background:#EFF6FF;border-radius:8px;border:1px solid #BFDBFE;">
      <div style="font-size:12px;color:#1D4ED8;">
        <strong>Payment:</strong> ${(order.paymentMethod || 'COD').toUpperCase().replace(/_/g, ' ')}<br/>
        <strong>Estimated delivery:</strong> 1-5 business days
      </div>
    </div>

    ${ctaButton('Track Your Order', trackUrl)}

    <p style="font-size:13px;color:#9CA3AF;text-align:center;margin:0;">
      Questions? Email us at <a href="mailto:${fromEmail}" style="color:#0E8A6E;">${fromEmail}</a>
    </p>`;

  return sendEmail({
    to:      customer.email,
    subject: `Order Confirmed - ${order.orderNumber} | MediportBD`,
    html:    emailLayout(`Order Confirmed - ${order.orderNumber}`, body),
  });
}

async function sendPaymentReceipt(order, customer, pdfBuffer) {
  const name = customer?.name?.split(' ')[0] || 'Valued Customer';

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Payment Receipt &#128179;</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">Hi ${name}, your payment has been received.</p>

    <div style="background:#F0FDF4;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;color:#065F46;text-transform:uppercase;letter-spacing:0.5px;">Order</div>
      <div style="font-size:20px;font-weight:800;color:#0B2545;">${order.orderNumber}</div>
      <div style="font-size:13px;color:#6B7280;margin-top:4px;">
        Method: ${(order.paymentMethod || '').toUpperCase().replace(/_/g, ' ')}
      </div>
    </div>

    ${orderSummaryBox(order)}

    <p style="font-size:13px;color:#9CA3AF;text-align:center;margin-top:20px;">
      Please keep this email as your payment receipt.
    </p>`;

  return sendEmail({
    to:          customer.email,
    subject:     `Payment Receipt - ${order.orderNumber} | MediportBD`,
    html:        emailLayout(`Payment Receipt - ${order.orderNumber}`, body),
    attachments: pdfBuffer ? [{ filename: `Invoice-${order.orderNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }] : undefined,
  });
}

async function sendShippingNotification(order, customer) {
  const { siteUrl } = getConfig();
  const name     = customer?.name?.split(' ')[0] || 'Valued Customer';
  const trackUrl = `${siteUrl}/track/${order.orderNumber}`;

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Your Order is on its Way! &#128230;</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
      Hi ${name}, your order <strong>${order.orderNumber}</strong> has been shipped.
    </p>

    ${order.trackingNumber ? `
    <div style="background:#EFF6FF;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.5px;">Tracking Number</div>
      <div style="font-size:18px;font-weight:700;color:#0B2545;">${order.trackingNumber}</div>
    </div>` : ''}

    ${addressBlock(order.deliveryAddress)}
    ${ctaButton('Track Your Order', trackUrl)}

    <p style="font-size:13px;color:#6B7280;text-align:center;">
      Expected delivery: 1-5 business days.
    </p>`;

  return sendEmail({
    to:      customer.email,
    subject: `Shipped - ${order.orderNumber} | MediportBD`,
    html:    emailLayout(`Your Order Has Shipped - ${order.orderNumber}`, body),
  });
}

async function sendDeliveryConfirmation(order, customer) {
  const { siteUrl } = getConfig();
  const name = customer?.name?.split(' ')[0] || 'Valued Customer';

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Delivered Successfully! &#127968;</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
      Hi ${name}, your order <strong>${order.orderNumber}</strong> has been delivered!
    </p>

    ${orderSummaryBox(order)}

    <div style="margin-top:20px;padding:16px;background:#FFFBEB;border-radius:8px;border:1px solid #FDE68A;text-align:center;">
      <div style="font-size:14px;font-weight:600;color:#92400E;margin-bottom:8px;">How was your experience?</div>
      <a href="${siteUrl}/products" style="font-size:13px;color:#0E8A6E;text-decoration:none;">
        Leave a review and earn loyalty points
      </a>
    </div>

    ${ctaButton('Shop Again', siteUrl)}`;

  return sendEmail({
    to:      customer.email,
    subject: `Delivered - ${order.orderNumber} | MediportBD`,
    html:    emailLayout(`Order Delivered - ${order.orderNumber}`, body),
  });
}

async function sendQuotationReady(quote, user) {
  const { siteUrl } = getConfig();
  const name     = user?.name?.split(' ')[0] || 'Valued Customer';
  const quoteUrl = `${siteUrl}/b2b?tab=quotes`;

  const rows = (quote.items || []).map(item => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#374151;border-bottom:1px solid #F3F4F6;">${item.name || item.product?.name || 'Product'}</td>
      <td style="padding:8px 0;text-align:center;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${item.qty || item.quantity || 1}</td>
      <td style="padding:8px 0;text-align:right;font-size:13px;font-weight:600;color:#0B2545;border-bottom:1px solid #F3F4F6;">
        &#2547;${((item.unitPrice || item.price || 0) * (item.qty || item.quantity || 1) * (1 - (item.discount || 0) / 100)).toLocaleString()}
      </td>
    </tr>`).join('');

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Your Quotation is Ready &#128203;</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">Hi ${name}, your quotation has been prepared.</p>

    <div style="background:#E6F4F0;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Quote ID</div>
      <div style="font-size:20px;font-weight:800;color:#0B2545;font-family:monospace;">${quote.quoteId || quote._id}</div>
      ${quote.validUntil ? `<div style="font-size:12px;color:#6B7280;margin-top:4px;">Valid until: ${new Date(quote.validUntil).toLocaleDateString('en-BD')}</div>` : ''}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <thead><tr style="background:#F9FAFB;">
        <th style="padding:10px 0;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Product</th>
        <th style="padding:10px 0;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Qty</th>
        <th style="padding:10px 0;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="text-align:right;background:#F9FAFB;border-radius:8px;padding:14px 16px;">
      <div style="font-size:11px;color:#6B7280;text-transform:uppercase;">Quoted Total</div>
      <div style="font-size:22px;font-weight:800;color:#0B2545;">&#2547;${(quote.finalAmount || quote.totalAmount || 0).toLocaleString()}</div>
    </div>

    ${ctaButton('Review and Approve Quotation', quoteUrl)}`;

  return sendEmail({
    to:      user.email,
    subject: `Quotation Ready - ${quote.quoteId || quote._id} | MediportBD`,
    html:    emailLayout(`Quotation Ready - ${quote.quoteId || quote._id}`, body),
  });
}

async function sendLowStockAlert(products) {
  if (!products || !products.length) {
return { skipped: true };
}
  const { adminEmail, siteUrl } = getConfig();

  const rows = products.map(p => {
    const isCritical = p.stock <= 3;
    return `
    <tr>
      <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #F3F4F6;">
        <div style="font-weight:600;color:#0B2545;">${p.name}</div>
        <div style="font-size:11px;color:#9CA3AF;font-family:monospace;">${p.sku}</div>
      </td>
      <td style="padding:10px 12px;text-align:center;font-size:16px;font-weight:700;color:${isCritical ? '#DC2626' : '#D97706'};border-bottom:1px solid #F3F4F6;">${p.stock}</td>
      <td style="padding:10px 12px;text-align:center;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${p.lowStockThreshold || 10}</td>
      <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #F3F4F6;">
        <span style="padding:4px 10px;background:${isCritical ? '#FEE2E2' : '#FEF3C7'};color:${isCritical ? '#DC2626' : '#D97706'};font-size:11px;font-weight:700;border-radius:10px;">
          ${isCritical ? 'CRITICAL' : 'LOW'}
        </span>
      </td>
    </tr>`;
  }).join('');

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#DC2626;">Stock Alert - Action Required</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">${products.length} product(s) require restocking.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;border:1px solid #E5E7EB;">
      <thead><tr style="background:#F9FAFB;">
        <th style="padding:12px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;border-bottom:2px solid #E5E7EB;">Product</th>
        <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;border-bottom:2px solid #E5E7EB;">Stock</th>
        <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;border-bottom:2px solid #E5E7EB;">Min</th>
        <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;border-bottom:2px solid #E5E7EB;">Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    ${ctaButton('Go to Inventory', `${siteUrl}/admin/products`)}`;

  return sendEmail({
    to:      adminEmail,
    subject: `Stock Alert - ${products.length} Product(s) Need Restocking | MediportBD`,
    html:    emailLayout('Stock Alert', body),
  });
}

async function sendNewOrderEmail(order, customer) {
  return sendOrderConfirmation(order, customer);
}

async function sendNewOrderAdminEmail(order, customer) {
  const cfg = getConfig();
  const total = order.totalAmount || order.total || 0;
  const items = (order.items || []).map(item => {
    const name = item.name || item.product?.name || 'Product';
    const qty = item.qty || item.quantity || 1;
    const price = item.price || 0;
    return `
    <tr>
      <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #F3F4F6;">${name}</td>
      <td style="padding:8px 12px;text-align:center;font-size:13px;border-bottom:1px solid #F3F4F6;">${qty}</td>
      <td style="padding:8px 12px;text-align:right;font-size:13px;border-bottom:1px solid #F3F4F6;">৳${price.toLocaleString('en-BD')}</td>
    </tr>`;
  }).join('');

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">New Order Received! &#128230;</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#6B7280;">
      Customer: <strong>${customer?.name || 'Unknown'}</strong> (${customer?.email || 'No email'})
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
      Phone: ${customer?.phone || 'N/A'} &nbsp;|&nbsp;
      Payment: ${(order.paymentMethod || 'COD').toUpperCase().replace(/_/g, ' ')}
    </p>

    <div style="background:#E6F4F0;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Order Number</div>
      <div style="font-size:22px;font-weight:800;color:#0B2545;letter-spacing:1px;">${order.orderNumber}</div>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:16px;">
      <thead><tr style="background:#F9FAFB;">
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Item</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Qty</th>
        <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Price</th>
      </tr></thead>
      <tbody>${items}</tbody>
    </table>

    <div style="text-align:right;font-size:18px;font-weight:700;color:#0B2545;margin-bottom:20px;">
      Total: ৳${total.toLocaleString('en-BD')}
    </div>

    ${order.deliveryAddress ? addressBlock(order.deliveryAddress) : ''}

    ${ctaButton('View Order in Admin', `${cfg.siteUrl}/admin/orders`)}`;

  return sendEmail({
    to:      cfg.adminEmail,
    subject: `New Order #${order.orderNumber} - ৳${total.toLocaleString('en-BD')} | MediportBD`,
    html:    emailLayout('New Order', body),
  });
}

async function sendPasswordResetEmail(user, resetUrl) {
  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Password Reset Request</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
      We received a request to reset your password. Click the button below to proceed.
    </p>
    ${ctaButton('Reset Password', resetUrl)}
    <p style="margin-top:24px;font-size:12px;color:#9CA3AF;">
      This link will expire in 1 hour.<br/>
      If you didn't request this, please ignore this email.
    </p>`;

  return sendEmail({
    to:      user.email,
    subject: 'Password Reset | MediportBD',
    html:    emailLayout('Password Reset', body),
  });
}

async function sendAbandonedCartEmail(cart, user) {
  const cfg   = getConfig();
  const items = (cart.items || []).map(item => {
    const p = item.product || {};
    const img = p.images?.[0] || `${cfg.siteUrl}/images/placeholder.png`;
    return `
    <tr>
      <td style="padding:8px;">
        <img src="${img}" alt="${p.name}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;" />
      </td>
      <td style="padding:8px;font-size:13px;color:#0B2545;">${p.name}</td>
      <td style="padding:8px;text-align:center;font-size:13px;color:#6B7280;">${item.quantity}</td>
      <td style="padding:8px;text-align:right;font-size:14px;font-weight:600;color:#0B2545;">৳${(item.price || 0).toLocaleString('en-BD')}</td>
    </tr>`;
  }).join('');

  const subtotal = (cart.items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">You Left Something Behind!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#6B7280;">
      Hi ${user.name}, your cart is still waiting. Complete your order before items sell out!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:16px;">
      <thead><tr style="background:#F9FAFB;">
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Item</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Product</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Qty</th>
        <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Price</th>
      </tr></thead>
      <tbody>${items}</tbody>
    </table>
    <div style="text-align:right;font-size:16px;font-weight:700;color:#0B2545;margin-bottom:20px;">
      Subtotal: ৳${subtotal.toLocaleString('en-BD')}
    </div>
    ${ctaButton('Complete Order', `${cfg.siteUrl}/cart`)}
    <p style="margin-top:16px;font-size:12px;color:#9CA3AF;">
      Your items are reserved, but they may go out of stock if someone else purchases them first.
    </p>`;

  return sendEmail({
    to:      user.email,
    subject: 'Your Cart is Waiting | MediportBD',
    html:    emailLayout('Abandoned Cart', body),
  });
}

async function sendTestEmail(to) {
  return sendEmail({
    to,
    subject: `Email Test - ${new Date().toLocaleTimeString('en-BD')} | MediportBD`,
    html: emailLayout('Email Test', `
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0B2545;">Email is Working!</h2>
      <p style="font-size:14px;color:#6B7280;">This is a test email from MediportBD via Brevo API.</p>
      <p style="font-size:12px;color:#9CA3AF;margin-top:16px;">
        Provider: Brevo HTTP API<br/>
        Sent at: ${new Date().toISOString()}<br/>
        Recipient: ${to}
      </p>`),
  });
}

async function verifyConnection() {
  return { success: isConfigured() };
}

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendShippingNotification,
  sendDeliveryConfirmation,
  sendNewOrderEmail,
  sendNewOrderAdminEmail,
  sendTestEmail,
  sendLowStockAlert,
  sendPasswordResetEmail,
  sendAbandonedCartEmail,
  sendQuotationReady,
  verifyConnection,
};
