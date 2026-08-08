/**
 * Browser invoice (print / preview) — premium MediportBD design
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

function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (/paid|completed|delivered|confirm|success/.test(s)) return 'green';
  if (/pending|processing|awaiting|due/.test(s)) return 'amber';
  if (/fail|cancel|refund|reject/.test(s)) return 'red';
  return 'gray';
}

function amountInWords(n) {
  const num = Math.floor(Math.abs(Number(n) || 0));
  if (num === 0) return 'Zero Taka Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (d) => (d < 20 ? ones[d] : `${tens[Math.floor(d / 10)]}${d % 10 ? ` ${ones[d % 10]}` : ''}`);
  const three = (d) => {
    const h = Math.floor(d / 100);
    const r = d % 100;
    return `${h ? `${ones[h]} Hundred` : ''}${h && r ? ' ' : ''}${r ? two(r) : ''}`;
  };
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;
  let s = '';
  if (crore) s += `${three(crore)} Crore`;
  if (lakh) s += `${s ? ' ' : ''}${two(lakh)} Lakh`;
  if (thousand) s += `${s ? ' ' : ''}${two(thousand)} Thousand`;
  if (rest) s += `${s ? ' ' : ''}${three(rest)}`;
  return `${s} Taka Only`;
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
    const paymentStatus = String(order.paymentStatus || order.status || '—');
    const statusClass = statusTone(paymentStatus);

    const rows = items
      .map((item, i) => {
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
            <div class="item-meta">${brandStr ? escapeHtml(brandStr) : ''}${brandStr && sku ? ' · ' : ''}${sku ? `SKU: ${sku}` : ''}</div>
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
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 11px;
      color: #1e293b;
      background: #e9eef4;
      padding: 28px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(11, 37, 69, 0.14);
      position: relative;
      display: flex;
      flex-direction: column;
    }
    /* ————— Header ————— */
    .head {
      background: linear-gradient(120deg, #0b2545 0%, #0d3162 55%, #123f7e 100%);
      color: #fff;
      padding: 26px 36px 22px;
      position: relative;
      overflow: hidden;
    }
    .head::after {
      content: '';
      position: absolute;
      right: -70px;
      top: -70px;
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(77, 219, 184, 0.16) 0%, rgba(77, 219, 184, 0.02) 60%, transparent 70%);
      pointer-events: none;
    }
    .head-inner { display: flex; justify-content: space-between; align-items: center; gap: 24px; position: relative; z-index: 1; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-mark {
      width: 52px; height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #4ddbb8, #1fa889);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 16px rgba(14, 138, 110, 0.4);
      flex-shrink: 0;
    }
    .brand-name { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
    .brand-name span { color: #4ddbb8; }
    .brand-tag { font-size: 9.5px; color: #a5b8d4; margin-top: 4px; letter-spacing: 0.02em; }
    .inv-label { text-align: right; }
    .inv-label .kicker { font-size: 9px; letter-spacing: 0.35em; color: #4ddbb8; font-weight: 700; text-transform: uppercase; }
    .inv-label h1 { font-size: 34px; font-weight: 800; letter-spacing: 0.02em; line-height: 1.05; margin-top: 4px; }
    .inv-meta { display: flex; gap: 18px; justify-content: flex-end; margin-top: 10px; font-size: 10px; color: #c5d3e8; }
    .inv-meta b { color: #fff; font-weight: 600; }
    .accent-bar { height: 5px; background: linear-gradient(90deg, #0e8a6e, #4ddbb8 60%, #0e8a6e); }
    /* ————— Body ————— */
    .body { padding: 26px 36px 20px; flex: 1; }
    .cards {
      display: grid;
      grid-template-columns: 1.15fr 1.15fr 0.9fr;
      gap: 14px;
      margin-bottom: 22px;
    }
    .card {
      background: #f7fafc;
      border: 1px solid #e4ebf2;
      border-radius: 10px;
      padding: 13px 15px;
      border-top: 3px solid #0e8a6e;
    }
    .card h3 {
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #0e8a6e;
      margin-bottom: 8px;
      font-weight: 800;
    }
    .card p { font-size: 10.5px; line-height: 1.55; color: #334155; }
    .card strong { color: #0b2545; }
    .card .sub { font-size: 9.5px; color: #64748b; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 9.5px; font-weight: 700;
      padding: 3px 10px; border-radius: 999px;
      margin-top: 6px;
    }
    .chip .dot { width: 6px; height: 6px; border-radius: 50%; }
    .chip.green { background: #d8f5e8; color: #0e7a5c; } .chip.green .dot { background: #14b57f; }
    .chip.amber { background: #fdf1d7; color: #9a6b06; } .chip.amber .dot { background: #eab308; }
    .chip.red { background: #fde4e4; color: #b3352f; } .chip.red .dot { background: #e0443c; }
    .chip.gray { background: #e9eef4; color: #475569; } .chip.gray .dot { background: #94a3b8; }
    /* ————— Table ————— */
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    thead th {
      background: #0b2545;
      color: #fff;
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 10px 14px;
      text-align: left;
      font-weight: 700;
    }
    thead th:first-child { border-radius: 8px 0 0 0; }
    thead th:last-child { border-radius: 0 8px 0 0; }
    thead th.num { text-align: right; }
    tbody td {
      padding: 11px 14px;
      border-bottom: 1px solid #eef2f7;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #fafcfd; }
    tbody tr:last-child td { border-bottom: 2px solid #0b2545; }
    .item-name { font-weight: 700; color: #0b2545; font-size: 11px; }
    .item-meta { font-size: 9px; color: #7c8ba1; margin-top: 3px; }
    .num { text-align: right; white-space: nowrap; }
    .strong { font-weight: 700; color: #0b2545; }
    /* ————— Totals ————— */
    .totals-row { display: flex; justify-content: space-between; gap: 26px; align-items: flex-start; margin-bottom: 18px; }
    .words {
      flex: 1;
      font-size: 10px;
      color: #64748b;
      line-height: 1.7;
      padding-top: 4px;
    }
    .words b { color: #0b2545; }
    .totals { width: 250px; margin-left: auto; }
    .t-line { display: flex; justify-content: space-between; padding: 4.5px 0; font-size: 10.5px; color: #64748b; }
    .t-line b { color: #1e293b; font-weight: 600; }
    .t-line.discount b { color: #0e8a6e; }
    .t-grand {
      display: flex; justify-content: space-between; align-items: center;
      background: linear-gradient(120deg, #0b2545, #0d3162);
      color: #fff;
      padding: 12px 16px;
      border-radius: 10px;
      margin-top: 6px;
      font-size: 11.5px;
      font-weight: 700;
    }
    .t-grand .amt { font-size: 17px; color: #4ddbb8; font-weight: 800; }
    /* ————— Payment / Footer ————— */
    .pay-box {
      background: #f0f8f4;
      border: 1px solid #cde9dd;
      border-left: 4px solid #0e8a6e;
      border-radius: 8px;
      padding: 13px 16px;
      margin-bottom: 16px;
      font-size: 10px;
      color: #334155;
      line-height: 1.7;
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .pay-box strong { color: #0b2545; }
    .pay-ref {
      text-align: right;
      font-size: 9px;
      color: #7c8ba1;
      white-space: nowrap;
    }
    .pay-ref b { display: block; color: #0b2545; font-size: 12px; letter-spacing: 0.06em; margin-top: 2px; }
    .foot {
      background: #0b2545;
      color: #aab8cc;
      padding: 14px 36px 16px;
      text-align: center;
      font-size: 9px;
      line-height: 1.7;
    }
    .foot strong { color: #fff; }
    .foot .reg { color: #4ddbb8; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; width: 100%; min-height: auto; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="head">
      <div class="head-inner">
        <div class="brand">
          <div class="brand-mark">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <rect x="10" y="4" width="4" height="16" rx="1.4" fill="#ffffff"/>
              <rect x="4" y="10" width="16" height="4" rx="1.4" fill="#ffffff"/>
            </svg>
          </div>
          <div>
            <div class="brand-name">Mediport<span>BD</span></div>
            <div class="brand-tag">Medical Equipment &amp; Laboratory Supplies · Dhaka, Bangladesh</div>
          </div>
        </div>
        <div class="inv-label">
          <div class="kicker">Tax Invoice</div>
          <h1>INVOICE</h1>
          <div class="inv-meta">
            <span>No. <b>${invoiceNo}</b></span>
            <span>Date <b>${orderDate}</b></span>
          </div>
        </div>
      </div>
    </header>
    <div class="accent-bar"></div>
    <div class="body">
      <div class="cards">
        <div class="card">
          <h3>Billed To</h3>
          <p><strong>${customerName}</strong></p>
          ${customerEmail ? `<p>${customerEmail}</p>` : ''}
        </div>
        <div class="card">
          <h3>Deliver To</h3>
          <p><strong>${escapeHtml(addr.name || customerName)}</strong></p>
          ${addr.street ? `<p>${escapeHtml(addr.street)}</p>` : ''}
          <p class="sub">${escapeHtml([addr.thana, addr.district, addr.postcode].filter(Boolean).join(', '))}</p>
          ${addr.phone ? `<p class="sub">Tel: ${escapeHtml(addr.phone)}</p>` : ''}
        </div>
        <div class="card">
          <h3>Payment</h3>
          <p><strong>${escapeHtml(paymentLabel(order.paymentMethod))}</strong></p>
          <p class="sub">${escapeHtml(order.paymentStatus || order.status || '—')}</p>
          <span class="chip ${statusClass}"><span class="dot"></span>${escapeHtml(paymentStatus)}</span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:52%">Description</th>
            <th class="num">Qty</th>
            <th class="num">Unit Price</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="4" style="color:#94a3b8">No items</td></tr>'}</tbody>
      </table>
      <div class="totals-row">
        <div class="words">
          <b>Amount in words:</b><br />${amountInWords(total)}
        </div>
        <div class="totals">
          <div class="t-line"><span>Subtotal</span><b>${formatBdt(subtotal)}</b></div>
          ${b2bDiscount > 0 ? `<div class="t-line discount"><span>B2B Discount</span><b>− ${formatBdt(b2bDiscount)}</b></div>` : ''}
          ${couponDiscount > 0 ? `<div class="t-line discount"><span>Coupon Discount</span><b>− ${formatBdt(couponDiscount)}</b></div>` : ''}
          <div class="t-line"><span>Delivery Fee</span><b>${formatBdt(deliveryFee)}</b></div>
          <div class="t-grand"><span>Total Due</span><span class="amt">${formatBdt(total)}</span></div>
        </div>
      </div>
      <div class="pay-box">
        <div>
          <strong>Payment instructions</strong><br />
          Dutch-Bangla Bank Ltd · Mediport Bangladesh Ltd · A/C 1721 2030 5678<br />
          ${escapeHtml(paymentLabel(order.paymentMethod))}
        </div>
        <div class="pay-ref">
          Reference
          <b>${invoiceNo}</b>
        </div>
      </div>
    </div>
    <footer class="foot">
      <p><strong>Mediport Bangladesh Ltd</strong>&nbsp;·&nbsp;<span class="reg">DGDA Reg. DA-2024-0891</span>&nbsp;·&nbsp;www.MediportBD.com · mahimrahman07@gmail.com</p>
      <p>Computer-generated invoice — no signature required. Thank you for shopping with MediportBD!</p>
    </footer>
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