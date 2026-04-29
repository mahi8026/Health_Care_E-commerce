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
      }
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
    body { margin:0; padding:0; font-family:'Plus Jakarta Sans',Arial,sans-serif; background:#F1F3F6; color:#1a1a2e; }
    .wrapper { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; }
    .header { background:#0B2545; padding:28px 32px; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:700; letter-spacing:0.5px; }
    .header p { margin:4px 0 0; color:#4DDBB8; font-size:13px; }
    .body { padding:28px 32px; }
    .footer { background:#F1F3F6; padding:16px 32px; font-size:12px; color:#666; text-align:center; }
    .btn { display:inline-block; background:#0E8A6E; color:#fff !important; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; margin:16px 0; }
    .badge { display:inline-block; background:#E1F5EE; color:#085041; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
    table.items { width:100%; border-collapse:collapse; margin:16px 0; }
    table.items th { background:#0B2545; color:#fff; padding:10px 12px; text-align:left; font-size:13px; }
    table.items td { padding:10px 12px; border-bottom:1px solid #eee; font-size:13px; }
    .total-row { background:#0B2545; color:#fff; font-weight:700; }
    .total-row td { padding:12px; }
    .info-row { display:flex; gap:24px; margin:16px 0; }
    .info-box { flex:1; background:#F1F3F6; border-radius:8px; padding:14px; }
    .info-box h4 { margin:0 0 6px; font-size:12px; color:#666; text-transform:uppercase; letter-spacing:0.5px; }
    .info-box p { margin:0; font-size:14px; font-weight:600; }
    .timeline { margin:20px 0; }
    .step { display:flex; align-items:center; gap:12px; margin:8px 0; }
    .dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
    .dot.done { background:#0E8A6E; }
    .dot.pending { background:#ccc; }
    .step-label { font-size:13px; }
  </style>
</head>
<body>
  <div style="padding:24px 16px;">
    <div class="wrapper">
      <div class="header">
        <h1>🏥 MedCore BD</h1>
        <p>Medical Equipment &amp; Supplies — Bangladesh</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>MedCore BD | DGDA Reg. No. DA-2024-0891 | BIN: 003456789-0101</p>
        <p>Dhaka, Bangladesh | +880 1700-000000 | support@medcorebd.com</p>
        <p style="margin-top:8px;color:#999;">This is an automated email. Please do not reply directly.</p>
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
      <td>${i.name || 'Product'}</td>
      <td>${i.sku || '-'}</td>
      <td>${i.qty || i.quantity || 1}</td>
      <td>৳${(i.price || 0).toLocaleString()}</td>
      <td>৳${((i.price || 0) * (i.qty || i.quantity || 1)).toLocaleString()}</td>
    </tr>`).join('');

  const html = wrapHtml(`
    <h2 style="color:#0B2545;margin-top:0;">Order Confirmed ✓</h2>
    <p>Hi ${user.name}, your order has been placed successfully.</p>
    <div class="info-row">
      <div class="info-box"><h4>Order Number</h4><p>${order.orderNumber || order.orderId}</p></div>
      <div class="info-box"><h4>Est. Delivery</h4><p>${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-BD') : '2–5 business days'}</p></div>
    </div>
    <table class="items">
      <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <table class="items">
      <tbody>
        <tr><td>Subtotal</td><td>৳${(order.subtotal || 0).toLocaleString()}</td></tr>
        ${order.b2bDiscount ? `<tr><td>B2B Discount</td><td>-৳${order.b2bDiscount.toLocaleString()}</td></tr>` : ''}
        <tr><td>Delivery</td><td>৳${(order.deliveryFee || 0).toLocaleString()}</td></tr>
        <tr><td>VAT (5%)</td><td>৳${(order.vatAmount || 0).toLocaleString()}</td></tr>
        <tr class="total-row"><td>Total Payable</td><td>৳${(order.totalAmount || order.total || 0).toLocaleString()}</td></tr>
      </tbody>
    </table>
    <p><strong>Delivery Address:</strong> ${order.deliveryAddress?.street}, ${order.deliveryAddress?.district}</p>
    <a href="${FRONTEND_URL}/track/${order.orderNumber || order.orderId}" class="btn">Track Your Order →</a>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD" <${FROM}>`,
    to: user.email,
    subject: `Order Confirmed — ${order.orderNumber || order.orderId}`,
    html
  });
  logger.info('Order confirmation sent:', nodemailer.getTestMessageUrl(info) || info.messageId);
  return info;
}

// ─── 2. Payment Receipt ──────────────────────────────────────────────────────
async function sendPaymentReceipt(order, user, pdfBuffer) {
  const t = await getTransporter();
  const html = wrapHtml(`
    <h2 style="color:#0B2545;margin-top:0;">Payment Receipt</h2>
    <p>Hi ${user.name}, we've received your payment. Thank you!</p>
    <div class="info-row">
      <div class="info-box"><h4>Transaction ID</h4><p style="font-family:monospace;">${order.transactionId || order.paymentDetails?.transactionId || 'N/A'}</p></div>
      <div class="info-box"><h4>Amount Paid</h4><p>৳${(order.totalAmount || order.total || 0).toLocaleString()}</p></div>
      <div class="info-box"><h4>Method</h4><p>${(order.paymentMethod || '').toUpperCase()}</p></div>
    </div>
    <p>Your invoice is attached to this email as a PDF.</p>
    <a href="${FRONTEND_URL}/track/${order.orderNumber || order.orderId}" class="btn">View Order →</a>
  `);

  const mailOptions = {
    from: `"MedCore BD" <${FROM}>`,
    to: user.email,
    subject: `Payment Receipt — ${order.orderNumber || order.orderId}`,
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
      <span class="step-label" style="color:${i <= currentStep ? '#0E8A6E' : '#999'};font-weight:${i === currentStep ? '700' : '400'}">${s}</span>
    </div>`).join('');

  const html = wrapHtml(`
    <h2 style="color:#0B2545;margin-top:0;">Your Order is on the Way! 🚚</h2>
    <p>Hi ${user.name}, your order has been dispatched.</p>
    <div class="info-row">
      <div class="info-box"><h4>Courier</h4><p>${order.tracking?.courier || 'Sundarban Courier'}</p></div>
      <div class="info-box"><h4>Tracking No.</h4><p style="font-family:monospace;">${order.tracking?.trackingNumber || order.trackingNumber || 'N/A'}</p></div>
    </div>
    <div class="timeline">${stepsHtml}</div>
    <a href="${FRONTEND_URL}/track/${order.orderNumber || order.orderId}" class="btn">Track Live →</a>
  `);

  const info = await t.sendMail({
    from: `"MedCore BD" <${FROM}>`,
    to: user.email,
    subject: `Shipped — ${order.orderNumber || order.orderId}`,
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
  sendNewsletterBroadcast
};
