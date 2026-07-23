/**
 * Browser invoice (print / preview) — matches MediportBD PDF branding
 */

function formatBdt(n) {
  return `৳${(Number(n) || 0).toLocaleString('en-BD')}`;
}

function formatDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function paymentLabel(method) {
  const map = {
    bkash: 'bKash',
    nagad: 'Nagad',
    bank_transfer: 'Bank Transfer',
    b2b_credit: 'B2B Credit',
    npsb: 'NPSB',
    cheque: 'Cheque',
  };
  return map[method] || (method || 'N/A').replace(/_/g, ' ');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export class InvoiceGenerator {
  static createInvoiceHTML(order) {
    const invoiceNo = escapeHtml(order.orderNumber || order._id);
    const orderDate = formatDate(order.createdAt);
    const addr = order.deliveryAddress || order.shippingAddress || {};
    const items = order.items || [];
    const subtotal = Number(order.subtotal || 0);
    const b2bDiscount = Number(order.b2bDiscount || order.discount || 0);
    const couponDiscount = Number(
      order.couponDiscount || order.promoDiscount || order.appliedCoupon?.discountAmount || 0
    );
    const deliveryFee = Number(order.deliveryFee || order.shippingCost || 0);
    const total = Number(order.totalAmount || order.total || 0);
    const customerName = escapeHtml(order.user?.name || order.customer || addr.name || 'Customer');
    const customerEmail = order.user?.email ? escapeHtml(order.user.email) : '';

    const rows = items
      .map((item) => {
        const qty = item.qty || item.quantity || 1;
        const price = item.price || 0;
        const name = escapeHtml(item.name || item.product?.name || 'Product');
        const sku = escapeHtml(item.sku || item.product?.sku || '');
        const brand = item.brand || item.product?.brand;
        const brandStr = brand ? escapeHtml(typeof brand === 'object' ? brand.name : brand) : '';
        return `
        <tr>
          <td>
            <div class="item-name">${name}</div>
            ${brandStr ? `<div class="item-meta">${brandStr}</div>` : ''}
            ${sku ? `<div class="item-meta">SKU: ${sku}</div>` : ''}
          </td>
          <td class="num">${qty}</td>
          <td class="num">${formatBdt(price)}</td>
          <td class="num strong">${formatBdt(price * qty)}</td>
        </tr>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoiceNo}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 11px;
      color: #1e293b;
      background: #f1f5f9;
      padding: 24px;
    }
    .sheet {
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(11, 37, 69, 0.08);
    }
    .head {
      background: linear-gradient(135deg, #0b2545 0%, #0d3162 100%);
      color: #fff;
      padding: 28px 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 4px solid #0e8a6e;
    }
    .logo { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
    .logo span { color: #4ddbb8; }
    .tagline { font-size: 10px; color: #94a3b8; margin-top: 6px; line-height: 1.5; }
    .inv-title { text-align: right; }
    .inv-title h1 { font-size: 28px; font-weight: 700; letter-spacing: 0.04em; }
    .inv-title .no { font-size: 12px; color: #4ddbb8; margin-top: 4px; font-weight: 600; }
    .inv-title .date { font-size: 10px; color: #94a3b8; margin-top: 4px; }
    .body { padding: 28px 32px 32px; }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .block h3 {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .block p { font-size: 11px; line-height: 1.55; color: #334155; }
    .block strong { color: #0b2545; }
    .ship-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead th {
      background: #0b2545;
      color: #fff;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
    }
    thead th.num { text-align: right; }
    tbody td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .item-name { font-weight: 600; color: #0b2545; font-size: 11px; }
    .item-meta { font-size: 9px; color: #64748b; margin-top: 2px; }
    .num { text-align: right; white-space: nowrap; }
    .strong { font-weight: 700; color: #0b2545; }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-inner { width: 260px; }
    .t-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 11px;
      color: #64748b;
    }
    .t-row span:last-child { color: #1e293b; font-weight: 500; }
    .t-row.discount span:last-child { color: #0e8a6e; }
    .t-grand {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0b2545;
      color: #fff;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 8px;
      font-size: 13px;
      font-weight: 700;
    }
    .t-grand .amt { font-size: 16px; color: #4ddbb8; }
    .pay-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 20px;
      font-size: 10px;
      color: #334155;
      line-height: 1.6;
    }
    .pay-box strong { color: #0b2545; }
    .foot {
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #94a3b8;
      line-height: 1.6;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="head">
      <div>
        <div class="logo">Mediport<span>BD</span></div>
        <p class="tagline">Medical Equipment & Laboratory Supplies<br />Dhaka, Bangladesh · mahimrahman07@gmail.com</p>
      </div>
      <div class="inv-title">
        <h1>INVOICE</h1>
        <div class="no">#${invoiceNo}</div>
        <div class="date">${orderDate}</div>
      </div>
    </header>
    <div class="body">
      <div class="grid-2">
        <div class="block">
          <h3>Bill to</h3>
          <p><strong>${customerName}</strong></p>
          ${customerEmail ? `<p>${customerEmail}</p>` : ''}
        </div>
        <div class="block">
          <h3>Invoice details</h3>
          <p><strong>Payment:</strong> ${escapeHtml(paymentLabel(order.paymentMethod))}</p>
          <p><strong>Status:</strong> ${escapeHtml(order.paymentStatus || order.status || '—')}</p>
        </div>
      </div>
      <div class="ship-box">
        <h3 style="margin-bottom:6px">Deliver to</h3>
        <p><strong>${escapeHtml(addr.name || customerName)}</strong></p>
        ${addr.street ? `<p>${escapeHtml(addr.street)}</p>` : ''}
        <p>${escapeHtml([addr.thana, addr.district, addr.postcode].filter(Boolean).join(', '))}</p>
        ${addr.phone ? `<p>Tel: ${escapeHtml(addr.phone)}</p>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:50%">Description</th>
            <th class="num">Qty</th>
            <th class="num">Unit</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="4">No items</td></tr>'}</tbody>
      </table>
      <div class="totals">
        <div class="totals-inner">
          <div class="t-row"><span>Subtotal</span><span>${formatBdt(subtotal)}</span></div>
          ${b2bDiscount > 0 ? `<div class="t-row discount"><span>B2B discount</span><span>−${formatBdt(b2bDiscount)}</span></div>` : ''}
          ${couponDiscount > 0 ? `<div class="t-row discount"><span>Coupon</span><span>−${formatBdt(couponDiscount)}</span></div>` : ''}
          <div class="t-row"><span>Delivery</span><span>${formatBdt(deliveryFee)}</span></div>
          <div class="t-grand"><span>Total due</span><span class="amt">${formatBdt(total)}</span></div>
        </div>
      </div>
      <div class="pay-box">
        <strong>Payment instructions</strong><br />
        Dutch-Bangla Bank Ltd · Mediport Bangladesh Ltd · A/C 1721 2030 5678<br />
        Reference: ${invoiceNo} · ${escapeHtml(paymentLabel(order.paymentMethod))}
      </div>
      <footer class="foot">
        <p><strong>Mediport Bangladesh Ltd</strong> · DGDA Reg. DA-2024-0891 · www.MediportBD.com</p>
        <p>Computer-generated invoice — no signature required.</p>
      </footer>
    </div>
  </div>
</body>
</html>`;
  }

  static async generateInvoice(order) {
    const html = this.createInvoiceHTML(order);
    const win = window.open('', '_blank');
    if (!win) throw new Error('Please allow popups to open the invoice');
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
    return true;
  }

  static async downloadInvoice(order) {
    return this.generateInvoice(order);
  }
}

export default InvoiceGenerator;
