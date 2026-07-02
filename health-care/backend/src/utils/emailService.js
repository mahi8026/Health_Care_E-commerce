const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter — uses SMTP env vars, falls back to Ethereal for dev
let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // Force IPv4 to avoid IPv6 connectivity issues on some hosts
      family: 4,
      // Add connection timeout and retry settings
      connectionTimeout: 30000,  // Increased to 30 seconds
      greetingTimeout: 15000,    // Increased to 15 seconds
      socketTimeout: 45000,      // Increased to 45 seconds
      // Connection pooling settings
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
      // Force TLS
      requireTLS: true,
      tls: {
        rejectUnauthorized: false,  // Don't reject self-signed certificates
        minVersion: 'TLSv1.2'
      },
      // Retry on error
      retry: 3,
      // Add debug logging
      logger: process.env.NODE_ENV === 'development',
      debug: process.env.NODE_ENV === 'development'
    });
  } else {
    // Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || testAccount.user,
        pass: process.env.ETHEREAL_PASS || testAccount.pass
      }
    });
    logger.info('Using Ethereal test email: ' + testAccount.user);
  }

  return transporter;
}

const FROM = process.env.SMTP_FROM || 'noreply@medcorebd.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@medcorebd.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Shared HTML wrapper ────────────────────────────────────────────────────
function wrapHtml(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MedCore BD</title>
  <style>
    body { margin:0; padding:0; font-family:'Segoe UI',Arial,sans-serif; background:#f5f7fa; color:#1a1a2e; }
    .wrapper { max-width:650px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header { background:linear-gradient(135deg, #0B2545 0%, #134074 100%); padding:32px 40px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:28px; font-weight:700; letter-spacing:0.5px; }
    .header p { margin:8px 0 0; color:#4DDBB8; font-size:14px; font-weight:500; }
    .body { padding:32px 40px; line-height:1.6; }
    .footer { background:#f8f9fa; padding:24px 40px; font-size:12px; color:#6c757d; text-align:center; border-top:1px solid #e9ecef; }
    .btn { display:inline-block; background:linear-gradient(135deg, #0E8A6E 0%, #0a6b56 100%); color:#fff !important; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px; margin:20px 0; box-shadow:0 4px 12px rgba(14,138,110,0.3); transition:all 0.3s; }
    .btn:hover { box-shadow:0 6px 16px rgba(14,138,110,0.4); transform:translateY(-2px); }
    .badge { display:inline-block; background:#E1F5EE; color:#085041; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; }
    table.items { width:100%; border-collapse:collapse; margin:20px 0; border:1px solid #e9ecef; border-radius:8px; overflow:hidden; }
    table.items th { background:#0B2545; color:#fff; padding:14px 16px; text-align:left; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
    table.items td { padding:14px 16px; border-bottom:1px solid #e9ecef; font-size:14px; }
    table.items tr:last-child td { border-bottom:none; }
    .total-row { background:#f8f9fa; font-weight:700; font-size:16px; }
    .total-row td { padding:16px; border-top:2px solid #0B2545; }
    .info-row { display:flex; gap:16px; margin:24px 0; }
    .info-box { flex:1; background:#f8f9fa; border-radius:12px; padding:18px; border-left:4px solid #0E8A6E; }
    .info-box h4 { margin:0 0 8px; font-size:11px; color:#6c757d; text-transform:uppercase; letter-spacing:0.8px; font-weight:600; }
    .info-box p { margin:0; font-size:16px; font-weight:700; color:#0B2545; }
    .timeline { margin:24px 0; }
    .step { display:flex; align-items:center; gap:14px; margin:10px 0; }
    .dot { width:14px; height:14px; border-radius:50%; flex-shrink:0; }
    .dot.done { background:#0E8A6E; box-shadow:0 0 0 4px rgba(14,138,110,0.2); }
    .dot.pending { background:#dee2e6; }
    .step-label { font-size:14px; }
    .highlight { background:#fff3cd; padding:16px; border-radius:8px; border-left:4px solid #ffc107; margin:20px 0; }
    .success-box { background:#d4edda; padding:16px; border-radius:8px; border-left:4px solid #28a745; margin:20px 0; color:#155724; }
  </style>
</head>
<body>
  <div style="padding:32px 16px;">
    <div class="wrapper">
      <div class="header">
        <h1>🏥 MedCore BD</h1>
        <p>Medical Equipment &amp; Supplies — Bangladesh</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p style="margin:0 0 8px;font-weight:600;color:#495057;">MedCore BD</p>
        <p style="margin:4px 0;">DGDA Reg. No. DA-2024-0891 | BIN: 003456789-0101</p>
        <p style="margin:4px 0;">📍 Dhaka, Bangladesh</p>
        <p style="margin:4px 0;">📞 +880 1646-886795 | 📧 mahimrahman07@gmail.com</p>
        <p style="margin-top:16px;color:#adb5bd;font-size:11px;">This is an automated email. Please do not reply directly to this message.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── 1. Order Confirmation ───────────────────────────────────────────────────
async function sendOrderConfirmation(order, user) {
  const t = await getTransporter();
  const itemRows = order.items.map(i => `
    <tr>
      <td style="font-weight:500;">${i.name || 'Product'}</td>
      <td style="color:#6c757d;">${i.sku || '-'}</td>
      <td style="text-align:center;">${i.qty || i.quantity || 1}</td>
      <td style="text-align:right;">৳${(i.price || 0).toLocaleString()}</td>
      <td style="text-align:right;font-weight:600;">৳${((i.price || 0) * (i.qty || i.quantity || 1)).toLocaleString()}</td>
    </tr>`).join('');

  const html = wrapHtml(`
    <div class="success-box">
      <h2 style="color:#155724;margin:0 0 8px;font-size:20px;">✓ Order Confirmed Successfully!</h2>
      <p style="margin:0;font-size:14px;">Hi <strong>${user.name}</strong>, thank you for your order. We're preparing your items for shipment.</p>
    </div>
    
    <div class="info-row">
      <div class="info-box">
        <h4>Order Number</h4>
        <p>${order.orderNumber || order.orderId}</p>
      </div>
      <div class="info-box">
        <h4>Order Date</h4>
        <p>${new Date(order.createdAt || Date.now()).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </div>
      <div class="info-box">
        <h4>Est. Delivery</h4>
        <p>${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' }) : '2–5 days'}</p>
      </div>
    </div>

    <h3 style="color:#0B2545;margin:28px 0 16px;font-size:18px;">📦 Order Items</h3>
    <table class="items">
      <thead>
        <tr>
          <th>Product</th>
          <th>SKU</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Price</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table class="items" style="margin-top:8px;">
      <tbody>
        <tr><td style="color:#6c757d;">Subtotal</td><td style="text-align:right;font-weight:600;">৳${(order.subtotal || 0).toLocaleString()}</td></tr>
        ${order.b2bDiscount ? `<tr><td style="color:#28a745;">B2B Discount (${order.b2bDiscountPct || 0}%)</td><td style="text-align:right;font-weight:600;color:#28a745;">-৳${order.b2bDiscount.toLocaleString()}</td></tr>` : ''}
        ${order.couponDiscount ? `<tr><td style="color:#28a745;">Coupon Discount${order.appliedCoupon?.code ? ` (${order.appliedCoupon.code})` : ''}</td><td style="text-align:right;font-weight:600;color:#28a745;">-৳${order.couponDiscount.toLocaleString()}</td></tr>` : ''}
        <tr><td style="color:#6c757d;">Delivery Fee</td><td style="text-align:right;font-weight:600;">৳${(order.deliveryFee || 0).toLocaleString()}</td></tr>
        <tr class="total-row">
          <td style="color:#0B2545;">Total Payable</td>
          <td style="text-align:right;color:#0B2545;">৳${(order.totalAmount || order.total || 0).toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <h3 style="color:#0B2545;margin:28px 0 16px;font-size:18px;">🚚 Delivery Information</h3>
    <div style="background:#f8f9fa;padding:18px;border-radius:12px;border-left:4px solid #0E8A6E;">
      <p style="margin:0 0 8px;"><strong>Delivery Address:</strong></p>
      <p style="margin:0;color:#495057;line-height:1.6;">
        ${order.deliveryAddress?.street || 'N/A'}<br/>
        ${order.deliveryAddress?.area ? order.deliveryAddress.area + '<br/>' : ''}
        ${order.deliveryAddress?.district || ''}, ${order.deliveryAddress?.postalCode || ''}<br/>
        ${order.deliveryAddress?.phone ? '📞 ' + order.deliveryAddress.phone : ''}
      </p>
      <p style="margin:12px 0 0;"><strong>Delivery Method:</strong> <span class="badge">${(order.deliveryType || order.deliveryMethod || 'Standard').toUpperCase()}</span></p>
    </div>

    <h3 style="color:#0B2545;margin:28px 0 16px;font-size:18px;">💳 Payment Information</h3>
    <div style="background:#f8f9fa;padding:18px;border-radius:12px;border-left:4px solid #0E8A6E;">
      <p style="margin:0;"><strong>Payment Method:</strong> <span class="badge">${(order.paymentMethod || 'N/A').toUpperCase().replace('_', ' ')}</span></p>
      <p style="margin:8px 0 0;"><strong>Payment Status:</strong> <span class="badge" style="${order.paymentStatus === 'paid' ? 'background:#d4edda;color:#155724;' : 'background:#fff3cd;color:#856404;'}">${(order.paymentStatus || 'Pending').toUpperCase()}</span></p>
    </div>

    <div style="text-align:center;margin:32px 0;">
      <a href="${FRONTEND_URL}/track/${order.orderNumber || order.orderId}" class="btn">Track Your Order →</a>
    </div>

    <div class="highlight">
      <p style="margin:0 0 8px;font-weight:600;color:#856404;">📋 What's Next?</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• You'll receive a shipping notification once your order is dispatched</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• Track your order anytime using the button above</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• Contact us at mahimrahman07@gmail.com for any questions</p>
    </div>

    <p style="margin-top:24px;color:#6c757d;font-size:13px;text-align:center;">Thank you for choosing MedCore BD! 🙏</p>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD" <${FROM}>`,
    to: user.email,
    subject: `✓ Order Confirmed — ${order.orderNumber || order.orderId}`,
    html
  });
  logger.info('Order confirmation sent:', nodemailer.getTestMessageUrl(info) || info.messageId);
  return info;
}

// ─── 2. Payment Receipt ──────────────────────────────────────────────────────
async function sendPaymentReceipt(order, user, pdfBuffer) {
  const t = await getTransporter();
  const html = wrapHtml(`
    <div class="success-box">
      <h2 style="color:#155724;margin:0 0 8px;font-size:20px;">✓ Payment Received Successfully!</h2>
      <p style="margin:0;font-size:14px;">Hi <strong>${user.name}</strong>, we've received your payment. Thank you!</p>
    </div>
    
    <div class="info-row">
      <div class="info-box">
        <h4>Transaction ID</h4>
        <p style="font-family:monospace;font-size:14px;">${order.transactionId || order.paymentDetails?.transactionId || 'N/A'}</p>
      </div>
      <div class="info-box">
        <h4>Amount Paid</h4>
        <p style="color:#28a745;">৳${(order.totalAmount || order.total || 0).toLocaleString()}</p>
      </div>
      <div class="info-box">
        <h4>Payment Method</h4>
        <p>${(order.paymentMethod || 'N/A').toUpperCase().replace('_', ' ')}</p>
      </div>
    </div>

    <div style="background:#f8f9fa;padding:20px;border-radius:12px;margin:24px 0;border-left:4px solid #28a745;">
      <h3 style="color:#0B2545;margin:0 0 12px;font-size:16px;">📄 Invoice Details</h3>
      <p style="margin:4px 0;color:#495057;"><strong>Order Number:</strong> ${order.orderNumber || order.orderId}</p>
      <p style="margin:4px 0;color:#495057;"><strong>Payment Date:</strong> ${new Date().toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p style="margin:12px 0 0;font-size:13px;color:#6c757d;">Your invoice is attached to this email as a PDF document.</p>
    </div>

    <div style="text-align:center;margin:32px 0;">
      <a href="${FRONTEND_URL}/orders/${order._id}" class="btn">View Order Details →</a>
    </div>

    <div class="highlight">
      <p style="margin:0 0 8px;font-weight:600;color:#856404;">📋 What's Next?</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• Your order is being prepared for shipment</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• You'll receive a shipping notification with tracking details</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• Keep this email for your records</p>
    </div>

    <p style="margin-top:24px;color:#6c757d;font-size:13px;text-align:center;">Thank you for your payment! 🙏</p>
  `);

  const mailOptions = {
    from: `"MedCore BD" <${FROM}>`,
    to: user.email,
    subject: `✓ Payment Receipt — ${order.orderNumber || order.orderId}`,
    html
  };

  if (pdfBuffer) {
    mailOptions.attachments = [{
      filename: `Invoice-${order.orderNumber || order.orderId}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }];
  }

  const info = await t.sendMail(mailOptions);
  logger.info('Payment receipt sent:', nodemailer.getTestMessageUrl(info) || info.messageId);
  return info;
}

// ─── 3. Shipping Notification ────────────────────────────────────────────────
async function sendShippingNotification(order, user) {
  const t = await getTransporter();
  const steps = ['Order Placed', 'Confirmed', 'Processing', 'Dispatched', 'Out for Delivery', 'Delivered'];
  const currentStep = 3; // Dispatched
  const stepsHtml = steps.map((s, i) => `
    <div class="step">
      <div class="dot ${i <= currentStep ? 'done' : 'pending'}"></div>
      <span class="step-label" style="color:${i <= currentStep ? '#0E8A6E' : '#adb5bd'};font-weight:${i === currentStep ? '700' : '400'}">${s}</span>
    </div>`).join('');

  const html = wrapHtml(`
    <div class="success-box">
      <h2 style="color:#155724;margin:0 0 8px;font-size:20px;">🚚 Your Order is on the Way!</h2>
      <p style="margin:0;font-size:14px;">Hi <strong>${user.name}</strong>, great news! Your order has been dispatched and is on its way to you.</p>
    </div>
    
    <div class="info-row">
      <div class="info-box">
        <h4>Order Number</h4>
        <p>${order.orderNumber || order.orderId}</p>
      </div>
      <div class="info-box">
        <h4>Courier Partner</h4>
        <p>${order.tracking?.courier || 'Sundarban Courier'}</p>
      </div>
      <div class="info-box">
        <h4>Tracking Number</h4>
        <p style="font-family:monospace;font-size:14px;">${order.tracking?.trackingNumber || order.trackingNumber || 'N/A'}</p>
      </div>
    </div>

    <h3 style="color:#0B2545;margin:28px 0 16px;font-size:18px;">📍 Delivery Status</h3>
    <div style="background:#f8f9fa;padding:20px;border-radius:12px;">
      <div class="timeline">${stepsHtml}</div>
    </div>

    <div style="background:#e7f3ff;padding:18px;border-radius:12px;margin:24px 0;border-left:4px solid #0d6efd;">
      <p style="margin:0 0 8px;font-weight:600;color:#084298;">📦 Delivery Information</p>
      <p style="margin:4px 0;color:#084298;font-size:13px;">• Estimated delivery: <strong>${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-BD', { day: 'numeric', month: 'long' }) : '2-3 business days'}</strong></p>
      <p style="margin:4px 0;color:#084298;font-size:13px;">• Delivery address: ${order.deliveryAddress?.street}, ${order.deliveryAddress?.district}</p>
      <p style="margin:4px 0;color:#084298;font-size:13px;">• Contact: ${order.deliveryAddress?.phone || 'N/A'}</p>
    </div>

    <div style="text-align:center;margin:32px 0;">
      <a href="${FRONTEND_URL}/track/${order.orderNumber || order.orderId}" class="btn">Track Live Location →</a>
    </div>

    <div class="highlight">
      <p style="margin:0 0 8px;font-weight:600;color:#856404;">💡 Delivery Tips</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• Please keep your phone accessible for delivery updates</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• Ensure someone is available to receive the package</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• Check the package condition before accepting delivery</p>
    </div>

    <p style="margin-top:24px;color:#6c757d;font-size:13px;text-align:center;">Your order will arrive soon! 📦</p>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD" <${FROM}>`,
    to: user.email,
    subject: `🚚 Shipped — ${order.orderNumber || order.orderId}`,
    html
  });
  logger.info('Shipping notification sent:', nodemailer.getTestMessageUrl(info) || info.messageId);
  return info;
}

// ─── 4. Delivery Confirmation ────────────────────────────────────────────────
async function sendDeliveryConfirmation(order, user) {
  const t = await getTransporter();
  const html = wrapHtml(`
    <h2 style="color:#0B2545;margin-top:0;">Order Delivered ✓</h2>
    <p>Hi ${user.name}, your order has been delivered successfully.</p>
    <div class="info-row">
      <div class="info-box"><h4>Delivered At</h4><p>${order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('en-BD') : new Date().toLocaleString('en-BD')}</p></div>
      ${order.receivedBy ? `<div class="info-box"><h4>Received By</h4><p>${order.receivedBy}</p></div>` : ''}
    </div>
    <p>We hope you're satisfied with your purchase. Please leave a review!</p>
    <a href="${FRONTEND_URL}/orders/${order._id}" class="btn">Review &amp; Reorder →</a>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD" <${FROM}>`,
    to: user.email,
    subject: `Delivered — ${order.orderNumber || order.orderId}`,
    html
  });
  logger.info('Delivery confirmation sent:', nodemailer.getTestMessageUrl(info) || info.messageId);
  return info;
}

// ─── 5. Quotation Ready ──────────────────────────────────────────────────────
async function sendQuotationReady(quote, user) {
  const t = await getTransporter();
  const itemRows = quote.items.map(i => `
    <tr>
      <td>${i.name || 'Product'}</td>
      <td>${i.qty}</td>
      <td>৳${(i.unitPrice || 0).toLocaleString()}</td>
      <td>${i.discount || 0}%</td>
      <td>৳${((i.unitPrice || 0) * i.qty * (1 - (i.discount || 0) / 100)).toLocaleString()}</td>
    </tr>`).join('');

  const html = wrapHtml(`
    <h2 style="color:#0B2545;margin-top:0;">Your Quotation is Ready</h2>
    <p>Hi ${user.name}, your quotation has been prepared.</p>
    <div class="info-row">
      <div class="info-box"><h4>Quote ID</h4><p style="font-family:monospace;">${quote.quoteId}</p></div>
      <div class="info-box"><h4>Valid Until</h4><p>${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('en-BD') : 'N/A'}</p></div>
      <div class="info-box"><h4>Total</h4><p>৳${(quote.finalAmount || 0).toLocaleString()}</p></div>
    </div>
    <table class="items">
      <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Line Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <a href="${FRONTEND_URL}/b2b?tab=quotes" class="btn">Approve Quotation →</a>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD" <${FROM}>`,
    to: user.email,
    subject: `Quotation Ready — ${quote.quoteId}`,
    html
  });
  logger.info('Quotation ready sent:', nodemailer.getTestMessageUrl(info) || info.messageId);
  return info;
}

// ─── 6. Low Stock Alert (internal) ──────────────────────────────────────────
async function sendLowStockAlert(products) {
  const t = await getTransporter();
  const rows = products.map(p => `
    <tr>
      <td>${p.name}</td>
      <td style="font-family:monospace;">${p.sku}</td>
      <td style="color:${p.stock <= 3 ? '#791F1F' : '#633806'};font-weight:700;">${p.stock}</td>
      <td>${p.lowStockThreshold || p.minStock || 10}</td>
      <td><span class="badge" style="${p.stock <= 3 ? 'background:#FCEBEB;color:#791F1F' : ''}">${p.stock <= 3 ? 'CRITICAL' : 'LOW'}</span></td>
    </tr>`).join('');

  const html = wrapHtml(`
    <h2 style="color:#0B2545;margin-top:0;">⚠️ Stock Alert — Action Required</h2>
    <p>The following products require restocking:</p>
    <table class="items">
      <thead><tr><th>Product</th><th>SKU</th><th>Current Stock</th><th>Min Threshold</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <a href="${process.env.ADMIN_URL || FRONTEND_URL + '/admin'}?tab=products" class="btn">Go to Inventory →</a>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD" <${FROM}>`,
    to: ADMIN_EMAIL,
    subject: `⚠️ Stock Alert — ${products.length} product(s) need restocking`,
    html
  });
  logger.info('Stock alert sent:', nodemailer.getTestMessageUrl(info) || info.messageId);
  return info;
}

// ─── 7. Password Reset ───────────────────────────────────────────────────────
async function sendPasswordResetEmail(user, resetUrl) {
  const t = await getTransporter();
  const html = wrapHtml(`
    <h2 style="color:#0B2545;margin-top:0;">Reset Your Password</h2>
    <p>Hi ${user.name}, we received a request to reset your password.</p>
    <p>Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
    <a href="${resetUrl}" class="btn">Reset Password →</a>
    <p style="margin-top:16px;font-size:12px;color:#666;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
    <p style="font-size:12px;color:#666;">Or copy this link: <span style="font-family:monospace;word-break:break-all;">${resetUrl}</span></p>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD" <${FROM}>`,
    to: user.email,
    subject: 'Password Reset Request — MedCore BD',
    html
  });
  logger.info('Password reset email sent: ' + (nodemailer.getTestMessageUrl(info) || info.messageId));
  return info;
}

// ─── 8. Abandoned Cart Recovery ──────────────────────────────────────────────
async function sendAbandonedCartEmail(cart, user) {
  const t = await getTransporter();
  
  // Build product rows
  const itemRows = cart.items.map(item => {
    const product = item.product;
    const imageUrl = product.images?.[0]?.url || product.images?.[0] || '';
    return `
    <tr>
      <td style="padding:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;background:#F3F4F6;" />` : '<div style="width:60px;height:60px;background:#F3F4F6;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;">🏥</div>'}
          <div>
            <div style="font-weight:600;font-size:13px;color:#0B2545;margin-bottom:2px;">${product.name}</div>
            <div style="font-size:11px;color:#666;">Qty: ${item.quantity}</div>
          </div>
        </div>
      </td>
      <td style="padding:12px;text-align:right;font-weight:600;color:#0B2545;">৳${(item.price * item.quantity).toLocaleString()}</td>
    </tr>`;
  }).join('');

  const html = wrapHtml(`
    <h2 style="color:#0B2545;margin-top:0;">You left something in your cart! 🛒</h2>
    <p>Hi ${user.name}, we noticed you left ${cart.items.length} item${cart.items.length > 1 ? 's' : ''} in your cart.</p>
    <p style="color:#666;font-size:13px;">Complete your purchase now before stock runs out!</p>
    
    <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr style="background:#F9FAFB;">
          <td style="padding:14px;font-weight:700;font-size:14px;color:#0B2545;">Subtotal</td>
          <td style="padding:14px;text-align:right;font-weight:700;font-size:16px;color:#0B2545;">৳${cart.subtotal.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>

    <a href="${FRONTEND_URL}/cart" class="btn">Complete Your Purchase →</a>
    
    <div style="margin-top:24px;padding:16px;background:#F1F3F6;border-radius:8px;font-size:12px;color:#666;">
      <p style="margin:0 0 8px;"><strong>Why shop with us?</strong></p>
      <p style="margin:4px 0;">✓ Free delivery in Dhaka metro area</p>
      <p style="margin:4px 0;">✓ 30-day return & replacement policy</p>
      <p style="margin:4px 0;">✓ Genuine products with warranty</p>
      <p style="margin:4px 0;">✓ Same-day dispatch for orders before 12 PM</p>
    </div>

    <p style="margin-top:20px;font-size:11px;color:#999;">
      Not interested? <a href="${FRONTEND_URL}/cart" style="color:#0E8A6E;text-decoration:none;">Clear your cart</a> or simply ignore this email.
    </p>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD" <${FROM}>`,
    to: user.email,
    subject: `You left ${cart.items.length} item${cart.items.length > 1 ? 's' : ''} in your cart! 🛒`,
    html
  });
  logger.info('Abandoned cart email sent:', nodemailer.getTestMessageUrl(info) || info.messageId);
  return info;
}

// ─── 9. Newsletter Welcome Email ─────────────────────────────────────────────
async function sendNewsletterWelcomeEmail(email, name, unsubscribeToken) {
  const t = await getTransporter();
  const unsubscribeUrl = `${FRONTEND_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

  const html = wrapHtml(`
    <h2 style="color:#0B2545;margin-top:0;">Welcome to MedCore BD Newsletter! 🏥</h2>
    <p>Hi ${name || 'there'}, thank you for subscribing to our newsletter!</p>
    
    <div style="background:#E1F5EE;border-left:4px solid #0E8A6E;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="margin:0 0 8px;font-weight:600;color:#0B2545;">What you'll receive:</p>
      <p style="margin:4px 0;font-size:13px;color:#666;">✓ Latest medical equipment and product updates</p>
      <p style="margin:4px 0;font-size:13px;color:#666;">✓ Exclusive offers and discounts</p>
      <p style="margin:4px 0;font-size:13px;color:#666;">✓ Industry news and healthcare insights</p>
      <p style="margin:4px 0;font-size:13px;color:#666;">✓ New product launches and innovations</p>
    </div>

    <p>We promise to send only valuable content and never spam your inbox.</p>
    
    <a href="${FRONTEND_URL}/products" class="btn">Browse Our Products →</a>

    <p style="margin-top:24px;font-size:11px;color:#999;">
      You can <a href="${unsubscribeUrl}" style="color:#0E8A6E;text-decoration:none;">unsubscribe</a> at any time.
    </p>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD" <${FROM}>`,
    to: email,
    subject: 'Welcome to MedCore BD Newsletter! 🏥',
    html
  });
  logger.info('Newsletter welcome email sent:', nodemailer.getTestMessageUrl(info) || info.messageId);
  return info;
}

// ─── 10. Newsletter Broadcast ────────────────────────────────────────────────
async function sendNewsletterBroadcast(email, name, subject, htmlContent, unsubscribeToken) {
  const t = await getTransporter();
  const unsubscribeUrl = `${FRONTEND_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

  // Wrap custom content with unsubscribe footer
  const html = wrapHtml(`
    ${htmlContent}
    
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #E5E7EB;">
      <p style="font-size:11px;color:#999;margin:0;">
        You're receiving this email because you subscribed to MedCore BD newsletter.
        <a href="${unsubscribeUrl}" style="color:#0E8A6E;text-decoration:none;">Unsubscribe</a>
      </p>
    </div>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD Newsletter" <${FROM}>`,
    to: email,
    subject: subject,
    html
  });
  logger.info('Newsletter broadcast sent to:', email);
  return info;
}

// ─── 11. WhatsApp Conversation Alert (Admin) ─────────────────────────────────
async function sendWhatsAppConversationAlert(conversation, user) {
  const t = await getTransporter();
  
  const categoryBadge = {
    order_status: { color: '#0d6efd', label: 'Order Status' },
    product_inquiry: { color: '#0E8A6E', label: 'Product Inquiry' },
    quote_request: { color: '#6f42c1', label: 'Quote Request' },
    support: { color: '#dc3545', label: 'Support' },
    general: { color: '#6c757d', label: 'General' }
  };

  const badge = categoryBadge[conversation.category] || categoryBadge.general;
  
  // Get recent messages (last 5)
  const recentMessages = conversation.messages.slice(-5).map(msg => `
    <div style="margin:8px 0;padding:10px;background:${msg.direction === 'inbound' ? '#f8f9fa' : '#e7f3ff'};border-radius:8px;border-left:3px solid ${msg.direction === 'inbound' ? '#6c757d' : '#0d6efd'};">
      <div style="font-size:11px;color:#6c757d;margin-bottom:4px;">
        <strong>${msg.direction === 'inbound' ? '👤 Customer' : '🤖 Bot'}</strong> • ${new Date(msg.timestamp).toLocaleString('en-BD', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div style="font-size:13px;color:#212529;">${msg.text}</div>
    </div>
  `).join('');

  const html = wrapHtml(`
    <div style="background:#fff3cd;padding:16px;border-radius:8px;border-left:4px solid #ffc107;margin-bottom:20px;">
      <h2 style="color:#856404;margin:0 0 8px;font-size:18px;">🔔 New WhatsApp Conversation Escalated</h2>
      <p style="margin:0;font-size:14px;color:#856404;">A customer has requested to speak with a human agent.</p>
    </div>
    
    <div class="info-row">
      <div class="info-box">
        <h4>Customer Name</h4>
        <p>${user?.name || 'Unknown'}</p>
      </div>
      <div class="info-box">
        <h4>Phone Number</h4>
        <p style="font-family:monospace;font-size:14px;">${conversation.phoneNumber}</p>
      </div>
      <div class="info-box">
        <h4>Category</h4>
        <p><span class="badge" style="background:${badge.color}20;color:${badge.color};">${badge.label}</span></p>
      </div>
    </div>

    <h3 style="color:#0B2545;margin:28px 0 16px;font-size:18px;">💬 Conversation Details</h3>
    <div style="background:#f8f9fa;padding:18px;border-radius:12px;border-left:4px solid #0E8A6E;">
      <p style="margin:0 0 8px;"><strong>Conversation ID:</strong> <span style="font-family:monospace;font-size:13px;">${conversation.conversationId}</span></p>
      <p style="margin:0 0 8px;"><strong>Started:</strong> ${new Date(conversation.createdAt).toLocaleString('en-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      <p style="margin:0 0 8px;"><strong>Status:</strong> <span class="badge" style="background:#dc354520;color:#dc3545;">${conversation.status.toUpperCase()}</span></p>
      <p style="margin:0;"><strong>Bot Stage:</strong> ${conversation.botStage || 'N/A'}</p>
    </div>

    ${conversation.relatedOrder ? `
    <div style="background:#e7f3ff;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #0d6efd;">
      <p style="margin:0;font-weight:600;color:#084298;">📦 Related Order</p>
      <p style="margin:4px 0;color:#084298;font-size:13px;">Order ID: <span style="font-family:monospace;">${conversation.relatedOrder}</span></p>
    </div>
    ` : ''}

    ${conversation.relatedProducts && conversation.relatedProducts.length > 0 ? `
    <div style="background:#d4edda;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #28a745;">
      <p style="margin:0;font-weight:600;color:#155724;">🔍 Related Products</p>
      <p style="margin:4px 0;color:#155724;font-size:13px;">${conversation.relatedProducts.length} product(s) discussed</p>
    </div>
    ` : ''}

    <h3 style="color:#0B2545;margin:28px 0 16px;font-size:18px;">📝 Recent Messages</h3>
    <div style="background:#fff;padding:16px;border-radius:12px;border:1px solid #e9ecef;">
      ${recentMessages || '<p style="color:#6c757d;font-size:13px;margin:0;">No messages yet</p>'}
    </div>

    ${user?.email ? `
    <h3 style="color:#0B2545;margin:28px 0 16px;font-size:18px;">👤 Customer Information</h3>
    <div style="background:#f8f9fa;padding:18px;border-radius:12px;border-left:4px solid #0E8A6E;">
      <p style="margin:0 0 8px;"><strong>Name:</strong> ${user.name}</p>
      <p style="margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${user.email}" style="color:#0E8A6E;text-decoration:none;">${user.email}</a></p>
      <p style="margin:0 0 8px;"><strong>Phone:</strong> ${user.phone || conversation.phoneNumber}</p>
      ${user.role === 'b2b' ? '<p style="margin:0;"><span class="badge" style="background:#6f42c120;color:#6f42c1;">B2B Customer</span></p>' : ''}
    </div>
    ` : ''}

    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.ADMIN_URL || FRONTEND_URL + '/admin'}?tab=whatsapp&conversation=${conversation.conversationId}" class="btn">View Conversation →</a>
    </div>

    <div class="highlight">
      <p style="margin:0 0 8px;font-weight:600;color:#856404;">⚡ Action Required</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• Respond to the customer via WhatsApp as soon as possible</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• Review the conversation history before responding</p>
      <p style="margin:4px 0;font-size:13px;color:#856404;">• Update the conversation status after resolution</p>
    </div>

    <p style="margin-top:24px;color:#6c757d;font-size:13px;text-align:center;">
      💡 Tip: Quick response improves customer satisfaction!
    </p>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD WhatsApp Bot" <${FROM}>`,
    to: ADMIN_EMAIL,
    subject: `🔔 WhatsApp Escalation — ${user?.name || conversation.phoneNumber}`,
    html,
    priority: 'high' // Mark as high priority
  });
  
  logger.info(`WhatsApp conversation alert sent to admin: ${conversation.conversationId}`);
  return info;
}

module.exports = {
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendShippingNotification,
  sendDeliveryConfirmation,
  sendQuotationReady,
  sendLowStockAlert,
  sendPasswordResetEmail,
  sendAbandonedCartEmail,
  sendNewsletterWelcomeEmail,
  sendNewsletterBroadcast,
  sendWhatsAppConversationAlert
};
