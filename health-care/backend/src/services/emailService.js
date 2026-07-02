'use strict';

const nodemailer = require('nodemailer');

// ─── Transporter (lazy-initialized) ──────────────────────────────────────────
let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    // Use configured SMTP (Gmail on port 465 = SSL, works on Render.com)
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT) || 465,
      secure: (parseInt(process.env.SMTP_PORT) || 465) === 465, // true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      family: 4, // Force IPv4
      connectionTimeout: 15000,
      greetingTimeout:   10000,
      socketTimeout:     20000,
      tls: { rejectUnauthorized: false },
    });
  } else {
    // Fallback: Ethereal test account (dev only)
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[EmailService] Using Ethereal test account:', testAccount.user);
  }

  return _transporter;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const FROM_NAME  = process.env.EMAIL_FROM_NAME || 'MedCore BD';
const FROM_EMAIL = process.env.SMTP_USER       || 'noreply@medcorebd.com';
const FROM       = `"${FROM_NAME}" <${FROM_EMAIL}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL    || FROM_EMAIL;
const SITE_URL   = process.env.FRONTEND_URL    || 'https://health-care-e-commerce-murex.vercel.app';

// ─── Shared Layout ────────────────────────────────────────────────────────────
function emailLayout(title, bodyHtml) {
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
      <!-- Header -->
      <tr><td style="background:#0B2545;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
        <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
          MedCore<span style="color:#0E8A6E;">BD</span>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:1px;text-transform:uppercase;">
          Healthcare &amp; Medical Supplies · Bangladesh
        </div>
      </td></tr>
      <!-- Body -->
      <tr><td style="background:#fff;padding:32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
        ${bodyHtml}
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#F9FAFB;border-radius:0 0 12px 12px;border:1px solid #E5E7EB;border-top:none;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9CA3AF;">
          © ${new Date().getFullYear()} MedCore BD · Dhaka, Bangladesh<br/>
          <a href="${SITE_URL}" style="color:#0E8A6E;text-decoration:none;">Visit our store</a>
          &nbsp;·&nbsp;
          <a href="${SITE_URL}/track" style="color:#0E8A6E;text-decoration:none;">Track order</a>
          &nbsp;·&nbsp;
          <a href="mailto:${FROM_EMAIL}" style="color:#0E8A6E;text-decoration:none;">Contact us</a>
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
        ${item.name || 'Product'}
        ${item.sku ? `<span style="color:#9CA3AF;font-size:11px;"> (${item.sku})</span>` : ''}
      </td>
      <td style="padding:8px 0;text-align:center;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">
        ×${item.qty || item.quantity || 1}
      </td>
      <td style="padding:8px 0;text-align:right;font-size:13px;font-weight:600;color:#0B2545;border-bottom:1px solid #F3F4F6;">
        ৳${((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString()}
      </td>
    </tr>`).join('');
}

function orderSummaryBox(order) {
  const subtotal    = order.subtotal        || 0;
  const deliveryFee = order.deliveryFee     || 0;
  const couponDisc  = order.couponDiscount  || order.promoDiscount || 0;
  const loyaltyDisc = order.loyaltyDiscount || 0;
  const total       = order.totalAmount     || order.total || 0;

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;">
    <tr><td colspan="2" style="padding:12px 16px 8px;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Order Summary</td></tr>
    <tr><td colspan="2" style="padding:0 16px 8px;">
      <table width="100%">${itemRows(order.items || [])}</table>
    </td></tr>
    <tr><td colspan="2" style="padding:0 16px 12px;">
      <table width="100%" cellpadding="4">
        <tr><td style="font-size:12px;color:#6B7280;">Subtotal</td><td style="text-align:right;font-size:12px;color:#374151;">৳${subtotal.toLocaleString()}</td></tr>
        ${deliveryFee ? `<tr><td style="font-size:12px;color:#6B7280;">Delivery</td><td style="text-align:right;font-size:12px;color:#374151;">৳${deliveryFee.toLocaleString()}</td></tr>` : ''}
        ${couponDisc  ? `<tr><td style="font-size:12px;color:#0E8A6E;">Coupon discount</td><td style="text-align:right;font-size:12px;color:#0E8A6E;">−৳${couponDisc.toLocaleString()}</td></tr>` : ''}
        ${loyaltyDisc ? `<tr><td style="font-size:12px;color:#0E8A6E;">Loyalty discount</td><td style="text-align:right;font-size:12px;color:#0E8A6E;">−৳${loyaltyDisc.toLocaleString()}</td></tr>` : ''}
        <tr style="border-top:1px solid #E5E7EB;">
          <td style="font-size:14px;font-weight:700;color:#0B2545;padding-top:8px;">Total</td>
          <td style="text-align:right;font-size:14px;font-weight:700;color:#0B2545;padding-top:8px;">৳${total.toLocaleString()}</td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}

function addressBlock(addr = {}) {
  if (!addr || !addr.name) return '';
  return `
  <div style="margin-top:20px;padding:14px 16px;background:#F0FDF4;border-radius:8px;border:1px solid #BBF7D0;">
    <div style="font-size:11px;font-weight:700;color:#065F46;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Delivery Address</div>
    <div style="font-size:13px;color:#374151;line-height:1.7;">
      <strong>${addr.name}</strong><br/>
      ${addr.phone ? `📞 ${addr.phone}<br/>` : ''}
      ${[addr.street, addr.area, addr.thana, addr.district].filter(Boolean).join(', ')}
      ${addr.postcode || addr.postalCode ? ` – ${addr.postcode || addr.postalCode}` : ''}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE SEND
// ═══════════════════════════════════════════════════════════════════════════════

async function sendEmail({ to, subject, html, attachments }) {
  try {
    const transporter = await getTransporter();
    console.log('[EmailService] 📧 Sending to %s — %s', to, subject);

    const mailOptions = { from: FROM, to, subject, html };
    if (attachments) mailOptions.attachments = attachments;

    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] ✅ Sent to %s (ID: %s)', to, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] ❌ Failed to send to %s: %s', to, error.message);
    // Reset transporter on connection errors so it reconnects next time
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ENETUNREACH') {
      _transporter = null;
    }
    return { error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function sendOrderConfirmation(order, customer) {
  const name     = customer?.name?.split(' ')[0] || 'Valued Customer';
  const trackUrl = `${SITE_URL}/track/${order.orderNumber}`;

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Order Confirmed! 🎉</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">Hi ${name}, thank you for your order. We're preparing it now.</p>

    <div style="background:#0E8A6E15;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Order Number</div>
      <div style="font-size:22px;font-weight:800;color:#0B2545;letter-spacing:1px;">${order.orderNumber}</div>
    </div>

    ${orderSummaryBox(order)}
    ${addressBlock(order.deliveryAddress)}

    <div style="margin-top:20px;padding:14px 16px;background:#EFF6FF;border-radius:8px;border:1px solid #BFDBFE;">
      <div style="font-size:12px;color:#1D4ED8;">
        <strong>Payment:</strong> ${(order.paymentMethod || 'COD').toUpperCase().replace(/_/g, ' ')}<br/>
        <strong>Estimated delivery:</strong> 1–5 business days
      </div>
    </div>

    ${ctaButton('Track Your Order', trackUrl)}

    <p style="font-size:13px;color:#9CA3AF;text-align:center;margin:0;">
      Questions? Email us at <a href="mailto:${FROM_EMAIL}" style="color:#0E8A6E;">${FROM_EMAIL}</a>
    </p>`;

  return sendEmail({
    to:      customer.email,
    subject: `✅ Order Confirmed – ${order.orderNumber} | MedCore BD`,
    html:    emailLayout(`Order Confirmed – ${order.orderNumber}`, body),
  });
}

async function sendPaymentReceipt(order, customer, pdfBuffer) {
  const name = customer?.name?.split(' ')[0] || 'Valued Customer';

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Payment Receipt 💳</h2>
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
    subject:     `💳 Payment Receipt – ${order.orderNumber} | MedCore BD`,
    html:        emailLayout(`Payment Receipt – ${order.orderNumber}`, body),
    attachments: pdfBuffer ? [{ filename: `Invoice-${order.orderNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }] : undefined,
  });
}

async function sendShippingNotification(order, customer) {
  const name     = customer?.name?.split(' ')[0] || 'Valued Customer';
  const trackUrl = `${SITE_URL}/track/${order.orderNumber}`;

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Your Order is on its Way! 📦</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
      Hi ${name}, great news — order <strong>${order.orderNumber}</strong> has been shipped.
    </p>

    ${order.trackingNumber ? `
    <div style="background:#EFF6FF;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.5px;">Tracking Number</div>
      <div style="font-size:18px;font-weight:700;color:#0B2545;">${order.trackingNumber}</div>
    </div>` : ''}

    ${addressBlock(order.deliveryAddress)}
    ${ctaButton('Track Your Order', trackUrl)}

    <p style="font-size:13px;color:#6B7280;text-align:center;">
      Expected delivery: 1–5 business days depending on your location.
    </p>`;

  return sendEmail({
    to:      customer.email,
    subject: `📦 Shipped – ${order.orderNumber} | MedCore BD`,
    html:    emailLayout(`Your Order Has Shipped – ${order.orderNumber}`, body),
  });
}

async function sendDeliveryConfirmation(order, customer) {
  const name = customer?.name?.split(' ')[0] || 'Valued Customer';

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Delivered Successfully! 🏠</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
      Hi ${name}, your order <strong>${order.orderNumber}</strong> has been delivered. We hope you enjoy your products!
    </p>

    ${orderSummaryBox(order)}

    <div style="margin-top:20px;padding:16px;background:#FFFBEB;border-radius:8px;border:1px solid #FDE68A;text-align:center;">
      <div style="font-size:14px;font-weight:600;color:#92400E;margin-bottom:8px;">How was your experience?</div>
      <a href="${SITE_URL}/products" style="font-size:13px;color:#0E8A6E;text-decoration:none;">
        ⭐ Leave a review &amp; earn loyalty points
      </a>
    </div>

    ${ctaButton('Shop Again', SITE_URL)}`;

  return sendEmail({
    to:      customer.email,
    subject: `🏠 Delivered – ${order.orderNumber} | MedCore BD`,
    html:    emailLayout(`Order Delivered – ${order.orderNumber}`, body),
  });
}

async function sendQuotationReady(quote, user) {
  const name     = user?.name?.split(' ')[0] || 'Valued Customer';
  const quoteUrl = `${SITE_URL}/b2b?tab=quotes`;

  const itemRows = (quote.items || []).map(item => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#374151;border-bottom:1px solid #F3F4F6;">${item.name || item.product?.name || 'Product'}</td>
      <td style="padding:8px 0;text-align:center;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${item.qty || item.quantity || 1}</td>
      <td style="padding:8px 0;text-align:right;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">৳${(item.unitPrice || item.price || 0).toLocaleString()}</td>
      <td style="padding:8px 0;text-align:right;font-size:13px;font-weight:600;color:#0B2545;border-bottom:1px solid #F3F4F6;">
        ৳${((item.unitPrice || item.price || 0) * (item.qty || item.quantity || 1) * (1 - (item.discount || 0) / 100)).toLocaleString()}
      </td>
    </tr>`).join('');

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0B2545;">Your Quotation is Ready 📋</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">Hi ${name}, your quotation has been prepared and is ready for review.</p>

    <div style="background:#0E8A6E15;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Quote ID</div>
      <div style="font-size:20px;font-weight:800;color:#0B2545;font-family:monospace;">${quote.quoteId || quote._id}</div>
      ${quote.validUntil ? `<div style="font-size:12px;color:#6B7280;margin-top:4px;">Valid until: ${new Date(quote.validUntil).toLocaleDateString('en-BD')}</div>` : ''}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <thead>
        <tr style="background:#F9FAFB;">
          <th style="padding:10px 0;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Product</th>
          <th style="padding:10px 0;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Qty</th>
          <th style="padding:10px 0;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Unit Price</th>
          <th style="padding:10px 0;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="text-align:right;background:#F9FAFB;border-radius:8px;padding:14px 16px;">
      <div style="font-size:11px;color:#6B7280;text-transform:uppercase;">Quoted Total</div>
      <div style="font-size:22px;font-weight:800;color:#0B2545;">৳${(quote.finalAmount || quote.totalAmount || 0).toLocaleString()}</div>
    </div>

    ${ctaButton('Review & Approve Quotation', quoteUrl)}`;

  return sendEmail({
    to:      user.email,
    subject: `📋 Quotation Ready – ${quote.quoteId || quote._id} | MedCore BD`,
    html:    emailLayout(`Quotation Ready – ${quote.quoteId || quote._id}`, body),
  });
}

async function sendLowStockAlert(products) {
  if (!products || !products.length) return { skipped: true };

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
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#DC2626;">⚠️ Stock Alert — Action Required</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">${products.length} product(s) require restocking.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;border:1px solid #E5E7EB;">
      <thead>
        <tr style="background:#F9FAFB;">
          <th style="padding:12px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;border-bottom:2px solid #E5E7EB;">Product</th>
          <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;border-bottom:2px solid #E5E7EB;">Stock</th>
          <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;border-bottom:2px solid #E5E7EB;">Min</th>
          <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;border-bottom:2px solid #E5E7EB;">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${ctaButton('Go to Inventory', `${SITE_URL}/admin/products`)}`;

  return sendEmail({
    to:      ADMIN_EMAIL,
    subject: `⚠️ Stock Alert — ${products.length} Product(s) Need Restocking | MedCore BD`,
    html:    emailLayout('Stock Alert', body),
  });
}

// Auto-sent on new order creation
async function sendNewOrderEmail(order, customer) {
  return sendOrderConfirmation(order, customer);
}

// Debug helper
async function sendTestEmail(to) {
  return sendEmail({
    to,
    subject: `✅ Email Test — ${new Date().toLocaleTimeString('en-BD')} | MedCore BD`,
    html: emailLayout('Email Test', `
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0B2545;">Email is Working! 🎉</h2>
      <p style="font-size:14px;color:#6B7280;">This is a test email from MedCore BD.</p>
      <p style="font-size:12px;color:#9CA3AF;margin-top:16px;">
        Provider: Gmail SMTP<br/>
        Sent at: ${new Date().toISOString()}<br/>
        Recipient: ${to}
      </p>`),
  });
}

async function verifyConnection() {
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendShippingNotification,
  sendDeliveryConfirmation,
  sendNewOrderEmail,
  sendTestEmail,
  sendLowStockAlert,
  sendQuotationReady,
  verifyConnection,
};
