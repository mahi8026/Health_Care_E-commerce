'use strict';

const { Resend } = require('resend');

// ─── Resend Client (lazy-initialized) ─────────────────────────────────────────
let resend = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

function isResendConfigured() {
  const hasKey = !!process.env.RESEND_API_KEY;
  if (!hasKey) {
    console.warn('[EmailService] ⚠️  RESEND_API_KEY not configured in environment');
  }
  return hasKey;
}

// ─── Brand Styles (lazy — env vars guaranteed available at call time) ─────────
const BRAND = {
  name:    process.env.EMAIL_FROM_NAME || 'MedCore BD',
  // Resend: use onboarding domain (noreply@...) or custom domain
  get from() {
    return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  },
  primary: '#0B2545',
  accent:  '#0E8A6E',
  site:    process.env.FRONTEND_URL || 'https://medcorebd.pages.dev',
};

// ─── Shared Layout ────────────────────────────────────────────────────────────
function emailLayout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:${BRAND.primary};border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
            MedCore<span style="color:${BRAND.accent}">BD</span>
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:4px;letter-spacing:1px;text-transform:uppercase;">
            Healthcare &amp; Medical Supplies
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
          ${bodyHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F9FAFB;border-radius:0 0 12px 12px;border:1px solid #E5E7EB;border-top:none;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;">
            © ${new Date().getFullYear()} ${BRAND.name} · Bangladesh<br/>
            <a href="${BRAND.site}" style="color:${BRAND.accent};text-decoration:none;">Visit our store</a>
            &nbsp;·&nbsp;
            <a href="${BRAND.site}/track" style="color:${BRAND.accent};text-decoration:none;">Track order</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Item Rows ─────────────────────────────────────────────────────────────────
function itemRows(items = []) {
  return items.map(item => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#374151;border-bottom:1px solid #F3F4F6;">
        ${item.name || 'Product'}
        ${item.sku ? `<span style="color:#9CA3AF;font-size:11px;"> (${item.sku})</span>` : ''}
      </td>
      <td style="padding:8px 0;text-align:center;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">×${item.qty || item.quantity || 1}</td>
      <td style="padding:8px 0;text-align:right;font-size:13px;font-weight:600;color:#0B2545;border-bottom:1px solid #F3F4F6;">
        ৳${((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString()}
      </td>
    </tr>`).join('');
}

// ─── Order Summary Box ────────────────────────────────────────────────────────
function orderSummaryBox(order) {
  const subtotal     = order.subtotal     || 0;
  const deliveryFee  = order.deliveryFee  || 0;
  const couponDisc   = order.couponDiscount || order.promoDiscount || 0;
  const loyaltyDisc  = order.loyaltyDiscount || 0;
  const total        = order.totalAmount  || order.total || 0;

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;padding:16px;">
    <tr>
      <td colspan="3" style="padding:0 16px 12px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Order Summary</td>
    </tr>
    <tr>
      <td colspan="3" style="padding:0 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${itemRows(order.items || [])}
        </table>
      </td>
    </tr>
    <tr><td colspan="3" style="padding:12px 16px 0;">
      <table width="100%" cellpadding="4" cellspacing="0" style="font-size:12px;">
        <tr>
          <td style="color:#6B7280;">Subtotal</td>
          <td style="text-align:right;color:#374151;">৳${subtotal.toLocaleString()}</td>
        </tr>
        ${deliveryFee ? `<tr><td style="color:#6B7280;">Delivery</td><td style="text-align:right;color:#374151;">৳${deliveryFee.toLocaleString()}</td></tr>` : ''}
        ${couponDisc  ? `<tr><td style="color:#0E8A6E;">Coupon discount</td><td style="text-align:right;color:#0E8A6E;">−৳${couponDisc.toLocaleString()}</td></tr>` : ''}
        ${loyaltyDisc ? `<tr><td style="color:#0E8A6E;">Loyalty discount</td><td style="text-align:right;color:#0E8A6E;">−৳${loyaltyDisc.toLocaleString()}</td></tr>` : ''}
        <tr>
          <td style="color:#0B2545;font-weight:700;font-size:14px;padding-top:8px;border-top:1px solid #E5E7EB;">Total</td>
          <td style="text-align:right;color:#0B2545;font-weight:700;font-size:14px;padding-top:8px;border-top:1px solid #E5E7EB;">৳${total.toLocaleString()}</td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}

// ─── Address Block ────────────────────────────────────────────────────────────
function addressBlock(addr = {}) {
  if (!addr || !addr.name) return '';
  return `
  <div style="margin-top:20px;padding:14px 16px;background:#F0FDF4;border-radius:8px;border:1px solid #BBF7D0;">
    <div style="font-size:11px;font-weight:700;color:#065F46;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Delivery Address</div>
    <div style="font-size:13px;color:#374151;line-height:1.6;">
      ${addr.name}<br/>
      ${addr.phone ? `📞 ${addr.phone}<br/>` : ''}
      ${[addr.street, addr.thana, addr.district].filter(Boolean).join(', ')}
      ${addr.postcode ? ` – ${addr.postcode}` : ''}
    </div>
  </div>`;
}

// ─── CTA Button ───────────────────────────────────────────────────────────────
function ctaButton(text, url) {
  return `
  <div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:${BRAND.accent};color:#ffffff;font-size:14px;font-weight:600;padding:13px 28px;border-radius:8px;text-decoration:none;">
      ${text}
    </a>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

function buildOrderConfirmation(order, customer) {
  const name = customer?.name?.split(' ')[0] || 'Valued Customer';
  const trackUrl = `${BRAND.site}/track/${order.orderNumber}`;

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:${BRAND.primary};">
      Order Confirmed! 🎉
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">Hi ${name}, thank you for your order.</p>

    <div style="background:${BRAND.accent}15;border-radius:8px;padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
      <div>
        <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Order Number</div>
        <div style="font-size:20px;font-weight:800;color:${BRAND.primary};letter-spacing:1px;">${order.orderNumber}</div>
      </div>
    </div>

    ${orderSummaryBox(order)}
    ${addressBlock(order.deliveryAddress)}

    <div style="margin-top:20px;padding:14px 16px;background:#EFF6FF;border-radius:8px;border:1px solid #BFDBFE;">
      <div style="font-size:12px;color:#1D4ED8;">
        <strong>Payment:</strong> ${(order.paymentMethod || 'COD').toUpperCase().replace(/_/g,' ')}<br/>
        <strong>Estimated delivery:</strong> 1–5 business days
      </div>
    </div>

    ${ctaButton('Track Your Order', trackUrl)}

    <p style="font-size:13px;color:#9CA3AF;text-align:center;margin:0;">
      Questions? Reply to this email or call <strong>+880 1800-MED-CORE</strong>
    </p>`;

  return {
    subject: `✅ Order Confirmed – ${order.orderNumber} | ${BRAND.name}`,
    html:    emailLayout(`Order Confirmed – ${order.orderNumber}`, body),
  };
}

function buildPaymentReceipt(order, customer) {
  const name = customer?.name?.split(' ')[0] || 'Valued Customer';
  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:${BRAND.primary};">
      Payment Receipt 💳
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">Hi ${name}, your payment has been received.</p>

    <div style="background:#F0FDF4;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;color:#065F46;text-transform:uppercase;letter-spacing:0.5px;">Order</div>
      <div style="font-size:18px;font-weight:800;color:${BRAND.primary};">${order.orderNumber}</div>
      <div style="font-size:13px;color:#6B7280;margin-top:4px;">
        Payment method: ${(order.paymentMethod || '').toUpperCase().replace(/_/g,' ')}
      </div>
    </div>

    ${orderSummaryBox(order)}

    <p style="font-size:13px;color:#9CA3AF;text-align:center;margin-top:20px;">
      Please keep this email as your payment receipt.
    </p>`;

  return {
    subject: `💳 Payment Receipt – ${order.orderNumber} | ${BRAND.name}`,
    html:    emailLayout(`Payment Receipt – ${order.orderNumber}`, body),
  };
}

function buildShippingNotification(order, customer) {
  const name = customer?.name?.split(' ')[0] || 'Valued Customer';
  const trackUrl = `${BRAND.site}/track/${order.orderNumber}`;
  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:${BRAND.primary};">
      Your order is on its way! 📦
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
      Hi ${name}, great news — your order <strong>${order.orderNumber}</strong> has been shipped via Steadfast Courier.
    </p>

    ${order.trackingNumber ? `
    <div style="background:#EFF6FF;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:11px;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.5px;">Courier Tracking ID</div>
      <div style="font-size:18px;font-weight:700;color:${BRAND.primary};">${order.trackingNumber}</div>
    </div>` : ''}

    ${addressBlock(order.deliveryAddress)}
    ${ctaButton('Track Your Order', trackUrl)}

    <p style="font-size:13px;color:#6B7280;text-align:center;">
      Expected delivery: 1–5 business days depending on your location.
    </p>`;

  return {
    subject: `📦 Shipped – ${order.orderNumber} | ${BRAND.name}`,
    html:    emailLayout(`Your order has shipped – ${order.orderNumber}`, body),
  };
}

function buildDeliveryConfirmation(order, customer) {
  const name = customer?.name?.split(' ')[0] || 'Valued Customer';
  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:${BRAND.primary};">
      Delivered Successfully! 🏠
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
      Hi ${name}, your order <strong>${order.orderNumber}</strong> has been delivered. We hope you enjoy your products!
    </p>

    ${orderSummaryBox(order)}

    <div style="margin-top:20px;padding:16px;background:#FFFBEB;border-radius:8px;border:1px solid #FDE68A;text-align:center;">
      <div style="font-size:14px;font-weight:600;color:#92400E;margin-bottom:8px;">How was your experience?</div>
      <a href="${BRAND.site}/products" style="font-size:13px;color:${BRAND.accent};text-decoration:none;">
        ⭐ Leave a review &amp; get loyalty points
      </a>
    </div>

    ${ctaButton('Shop Again', BRAND.site)}`;

  return {
    subject: `🏠 Delivered – ${order.orderNumber} | ${BRAND.name}`,
    html:    emailLayout(`Order Delivered – ${order.orderNumber}`, body),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEND HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function sendEmail({ to, subject, html }) {
  if (!isResendConfigured()) {
    console.warn('[EmailService] ⚠️  RESEND_API_KEY not configured — email to %s skipped', to);
    return { skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  const client = getResendClient();
  if (!client) {
    console.error('[EmailService] ❌ Failed to initialize Resend client');
    return { error: 'Resend client initialization failed' };
  }

  try {
    console.log('[EmailService] 📧 Sending email to %s (subject: %s)', to, subject);
    const response = await client.emails.send({
      from:    BRAND.from,
      to,
      subject,
      html,
    });

    if (response.error) {
      console.error('[EmailService] ❌ Resend error for %s: %O', to, response.error);
      return { error: response.error, errorMessage: response.error.message };
    }

    console.log('[EmailService] ✅ Email sent to %s (ID: %s)', to, response.data?.id);
    return { success: true, messageId: response.data?.id };
  } catch (error) {
    console.error('[EmailService] ❌ Exception sending to %s: %s', to, error.message);
    console.error('[EmailService] Stack trace:', error.stack);
    return { error: error.message, stack: error.stack };
  }
}

async function sendOrderConfirmation(order, customer) {
  const { subject, html } = buildOrderConfirmation(order, customer);
  return sendEmail({ to: customer.email, subject, html });
}

async function sendPaymentReceipt(order, customer) {
  const { subject, html } = buildPaymentReceipt(order, customer);
  return sendEmail({ to: customer.email, subject, html });
}

async function sendShippingNotification(order, customer) {
  const { subject, html } = buildShippingNotification(order, customer);
  return sendEmail({ to: customer.email, subject, html });
}

async function sendDeliveryConfirmation(order, customer) {
  const { subject, html } = buildDeliveryConfirmation(order, customer);
  return sendEmail({ to: customer.email, subject, html });
}

// Auto-sent on new order creation
async function sendNewOrderEmail(order, customer) {
  return sendOrderConfirmation(order, customer);
}

// Debug helper — sends a plain test email
async function sendTestEmail(to) {
  return sendEmail({
    to,
    subject: `✅ MedCore BD Email Test — ${new Date().toLocaleTimeString('en-BD')}`,
    html: emailLayout('Email Test', `
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0B2545;">Email is working! 🎉</h2>
      <p style="font-size:14px;color:#6B7280;">This is a test email from MedCore BD. Your Resend API is configured correctly.</p>
      <p style="font-size:12px;color:#9CA3AF;margin-top:16px;">
        Provider: Resend<br/>
        API Key: ${process.env.RESEND_API_KEY ? '✓ Configured' : '✗ Missing'}<br/>
        Sent at: ${new Date().toISOString()}
      </p>`),
  });
}

async function sendLowStockAlert(products) {
  if (!products || products.length === 0) {
    console.log('[EmailService] No low stock products to alert');
    return { skipped: true, reason: 'No products' };
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@medcorebd.com';
  
  // Build product rows
  const productRows = products.map(p => {
    const status = p.stock <= 3 ? 'CRITICAL' : 'LOW';
    const statusColor = p.stock <= 3 ? '#DC2626' : '#D97706';
    const statusBg = p.stock <= 3 ? '#FEE2E2' : '#FEF3C7';
    
    return `
    <tr>
      <td style="padding:10px 12px;font-size:13px;color:#374151;border-bottom:1px solid #F3F4F6;">
        <div style="font-weight:600;color:#0B2545;margin-bottom:2px;">${p.name}</div>
        <div style="font-size:11px;color:#9CA3AF;font-family:monospace;">${p.sku}</div>
      </td>
      <td style="padding:10px 12px;text-align:center;font-size:16px;font-weight:700;color:${statusColor};border-bottom:1px solid #F3F4F6;">
        ${p.stock}
      </td>
      <td style="padding:10px 12px;text-align:center;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">
        ${p.lowStockThreshold || p.minStock || 10}
      </td>
      <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #F3F4F6;">
        <span style="display:inline-block;padding:4px 12px;background:${statusBg};color:${statusColor};font-size:11px;font-weight:700;border-radius:12px;text-transform:uppercase;">
          ${status}
        </span>
      </td>
    </tr>`;
  }).join('');

  const criticalCount = products.filter(p => p.stock <= 3).length;
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#DC2626;">
      ⚠️ Stock Alert — Action Required
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
      ${products.length} product${products.length > 1 ? 's require' : ' requires'} restocking${criticalCount > 0 ? `, including ${criticalCount} critical alert${criticalCount > 1 ? 's' : ''}` : ''}.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#FFFFFF;border-radius:8px;border:1px solid #E5E7EB;overflow:hidden;">
      <thead>
        <tr style="background:#F9FAFB;">
          <th style="padding:12px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E5E7EB;">Product</th>
          <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E5E7EB;">Stock</th>
          <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E5E7EB;">Min Threshold</th>
          <th style="padding:12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E5E7EB;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
      </tbody>
    </table>

    ${criticalCount > 0 ? `
    <div style="background:#FEE2E2;border-radius:8px;padding:16px;margin-bottom:20px;border-left:4px solid #DC2626;">
      <div style="font-size:13px;color:#991B1B;font-weight:600;margin-bottom:4px;">⚠️ Critical Alert</div>
      <div style="font-size:12px;color:#7F1D1D;">${criticalCount} product${criticalCount > 1 ? 's have' : ' has'} critically low stock (≤3 units). Immediate action required to prevent stockouts.</div>
    </div>` : ''}

    ${ctaButton('Manage Inventory', `${BRAND.site}/admin/products`)}

    <div style="margin-top:20px;padding:14px 16px;background:#EFF6FF;border-radius:8px;border:1px solid #BFDBFE;">
      <div style="font-size:12px;color:#1D4ED8;">
        <strong>Recommendation:</strong> Review supplier orders and restock critical items within 24-48 hours to avoid order fulfillment delays.
      </div>
    </div>

    <p style="font-size:13px;color:#9CA3AF;text-align:center;margin:20px 0 0;">
      This is an automated alert from the MedCore BD inventory management system.
    </p>`;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `⚠️ Stock Alert — ${products.length} Product${products.length > 1 ? 's' : ''} Need${products.length === 1 ? 's' : ''} Restocking${criticalCount > 0 ? ` (${criticalCount} Critical)` : ''} | ${BRAND.name}`,
    html: emailLayout('Stock Alert', body),
  });
}

async function verifyConnection() {
  // Resend uses HTTP API — just check if key is configured
  return { success: isResendConfigured() };
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
  verifyConnection,
};
