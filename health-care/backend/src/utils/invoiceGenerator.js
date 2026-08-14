const PDFDocument = require('pdfkit');

const NAVY = '#0B2545';
const TEAL = '#0E8A6E';
const MINT = '#4DDBB8';
const SLATE = '#64748B';
const TEXT = '#1E293B';
const BORDER = '#E2E8F0';
const ROW_ALT = '#F8FAFC';
const WHITE = '#FFFFFF';

const MARGIN = 48;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_RESERVE = 52;

/**
 * Draw text at fixed coordinates. PDFKit ignores fillColor/font in text() options —
 * must set doc.fillColor / doc.font first.
 */
function textAt(doc, str, x, y, opts = {}) {
  const { fillColor, font, fontSize, ...textOpts } = opts;
  if (font) {
doc.font(font);
}
  if (fontSize != null) {
doc.fontSize(fontSize);
}
  if (fillColor) {
doc.fillColor(fillColor);
}
  doc.text(String(str ?? ''), x, y, { lineBreak: false, ...textOpts });
}

function formatBdt(amount) {
  const n = Number(amount) || 0;
  return `BDT ${n.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
}

function formatDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function paymentLabel(method) {
  const labels = {
    bkash: 'bKash',
    nagad: 'Nagad',
    bank_transfer: 'Bank Transfer',
    beftn: 'BEFTN',
    npsb: 'NPSB',
    b2b_credit: 'B2B Credit',
    cheque: 'Cheque',
    credit_terms: 'Credit Terms',
    card: 'Card',
    cash: 'Cash',
  };
  return labels[method] || (method || 'N/A').replace(/_/g, ' ');
}

function itemLine(item) {
  const unit = Number(item.price || 0);
  const qty = Number(item.qty || item.quantity || 1);
  const disc = Number(item.discount || 0);
  return unit * qty * (1 - disc / 100);
}

function resolveItemName(item) {
  if (item.name) {
return item.name;
}
  if (item.product && typeof item.product === 'object') {
return item.product.name || 'Product';
}
  return 'Product';
}

function resolveItemSku(item) {
  if (item.sku) {
return item.sku;
}
  if (item.product && typeof item.product === 'object') {
return item.product.sku || '—';
}
  return '—';
}

function resolveBrand(item) {
  const brand = item.brand || item.product?.brand;
  if (!brand) {
return null;
}
  if (typeof brand === 'object') {
return brand.name || null;
}
  const s = String(brand).trim();
  if (/^[a-f0-9]{24}$/i.test(s)) {
return null;
}
  return s;
}

/** Build delivery lines for the ship-to box */
function formatShipLines(addr, user) {
  const lines = [];
  const name = addr.name || user?.name;
  if (name) {
lines.push(name);
}

  if (addr.street) {
lines.push(addr.street);
}

  const cityParts = [
    addr.thana || addr.area,
    addr.district || addr.city,
    addr.postcode || addr.postalCode,
  ].filter(Boolean);
  if (cityParts.length) {
lines.push(cityParts.join(', '));
}

  if (addr.phone) {
lines.push(`Tel: ${addr.phone}`);
}

  if (lines.length === 0) {
    lines.push(user?.name || 'Customer');
    lines.push('Address on file — contact customer for details');
  }

  return lines;
}

function generateInvoice(order, user) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const invoiceNo = order.invoiceNumber || order.orderNumber || order.orderId || '—';
    const orderDate = formatDate(order.createdAt);

    const drawPageHeader = () => {
      const headerH = 82;
      doc.rect(0, 0, PAGE_W, headerH).fill(NAVY);
      doc.rect(0, headerH - 3, PAGE_W, 3).fill(TEAL);

      textAt(doc, 'MediportBD', MARGIN, 26, {
        font: 'Helvetica-Bold',
        fontSize: 18,
        fillColor: WHITE,
      });
      textAt(doc, 'Medical Equipment & Laboratory Supplies', MARGIN, 48, {
        font: 'Helvetica',
        fontSize: 8,
        fillColor: MINT,
      });
      textAt(doc, 'Dhaka, Bangladesh  ·  +880 1646-886795  ·  mahimrahman07@gmail.com', MARGIN, 60, {
        fontSize: 7,
        fillColor: '#CBD5E1',
      });

      textAt(doc, 'INVOICE', MARGIN, 28, {
        width: CONTENT_W,
        align: 'right',
        font: 'Helvetica-Bold',
        fontSize: 20,
        fillColor: WHITE,
      });
      textAt(doc, `#${invoiceNo}`, MARGIN, 52, {
        width: CONTENT_W,
        align: 'right',
        font: 'Helvetica-Bold',
        fontSize: 10,
        fillColor: MINT,
      });
      textAt(doc, orderDate, MARGIN, 66, {
        width: CONTENT_W,
        align: 'right',
        fontSize: 8,
        fillColor: '#CBD5E1',
      });

      return headerH + 20;
    };

    let y = drawPageHeader();

    const ensureSpace = (needed) => {
      if (y + needed > PAGE_H - FOOTER_RESERVE) {
        doc.addPage();
        y = drawPageHeader();
      }
    };

    const colW = CONTENT_W / 2 - 10;

    textAt(doc, 'INVOICE DETAILS', MARGIN, y, {
      font: 'Helvetica-Bold',
      fontSize: 8,
      fillColor: SLATE,
    });
    textAt(doc, 'CUSTOMER', MARGIN + colW + 20, y, {
      font: 'Helvetica-Bold',
      fontSize: 8,
      fillColor: SLATE,
    });
    y += 12;

    let metaY = y;
    const meta = [
      ['Order date', orderDate],
      ['Payment', paymentLabel(order.paymentMethod)],
      ['Status', (order.paymentStatus || 'pending').replace(/^\w/, (c) => c.toUpperCase())],
    ];
    meta.forEach(([label, val]) => {
      textAt(doc, label, MARGIN, metaY, { fontSize: 8, fillColor: SLATE });
      textAt(doc, val, MARGIN + 68, metaY, { fontSize: 9, fillColor: TEXT });
      metaY += 13;
    });

    let custY = y;
    textAt(doc, user.name || 'Customer', MARGIN + colW + 20, custY, {
      font: 'Helvetica-Bold',
      fontSize: 10,
      fillColor: TEXT,
    });
    custY += 13;
    if (user.companyName || user.company) {
      textAt(doc, user.companyName || user.company, MARGIN + colW + 20, custY, {
        fontSize: 9,
        fillColor: '#475569',
      });
      custY += 12;
    }
    if (user.email) {
      textAt(doc, user.email, MARGIN + colW + 20, custY, { fontSize: 8, fillColor: '#475569' });
      custY += 11;
    }
    if (user.phone) {
      textAt(doc, user.phone, MARGIN + colW + 20, custY, { fontSize: 8, fillColor: '#475569' });
      custY += 11;
    }

    const isB2B = user.b2bAccount || user.accountType === 'B2B' || user.role === 'b2b';
    if (isB2B) {
      doc.roundedRect(MARGIN + colW + 20, custY, 36, 14, 3).fill(TEAL);
      textAt(doc, 'B2B', MARGIN + colW + 28, custY + 3, {
        font: 'Helvetica-Bold',
        fontSize: 7,
        fillColor: WHITE,
      });
      custY += 18;
    }

    y = Math.max(metaY, custY) + 14;

    // ── Deliver to (dynamic height) ───────────────────────────────────────────
    const addr = order.deliveryAddress || {};
    const shipLines = formatShipLines(addr, user);

    textAt(doc, 'DELIVER TO', MARGIN, y, {
      font: 'Helvetica-Bold',
      fontSize: 8,
      fillColor: SLATE,
    });
    y += 12;

    const shipPad = 10;
    const shipLineH = 12;
    const shipH = shipPad * 2 + shipLines.length * shipLineH;

    ensureSpace(shipH + 12);
    doc.roundedRect(MARGIN, y, CONTENT_W, shipH, 5).fill(ROW_ALT);
    doc.strokeColor(BORDER).lineWidth(0.5).roundedRect(MARGIN, y, CONTENT_W, shipH, 5).stroke();

    shipLines.forEach((line, i) => {
      textAt(doc, line, MARGIN + 12, y + shipPad + i * shipLineH, {
        font: i === 0 ? 'Helvetica-Bold' : 'Helvetica',
        fontSize: i === 0 ? 9 : 8,
        fillColor: i === 0 ? TEXT : '#475569',
      });
    });
    y += shipH + 12;

    // ── Table ─────────────────────────────────────────────────────────────────
    const col = {
      desc: { x: MARGIN + 8, w: 200 },
      sku: { x: MARGIN + 212, w: 88 },
      qty: { x: MARGIN + 308, w: 32 },
      unit: { x: MARGIN + 348, w: 68 },
      amt: { x: MARGIN + 424, w: CONTENT_W - 424 - 8 },
    };

    const drawTableHeader = (startY) => {
      const h = 20;
      doc.rect(MARGIN, startY, CONTENT_W, h).fill(NAVY);
      textAt(doc, 'Description', col.desc.x, startY + 6, {
        font: 'Helvetica-Bold',
        fontSize: 8,
        fillColor: WHITE,
      });
      textAt(doc, 'SKU', col.sku.x, startY + 6, {
        font: 'Helvetica-Bold',
        fontSize: 8,
        fillColor: WHITE,
      });
      textAt(doc, 'Qty', col.qty.x, startY + 6, {
        width: col.qty.w,
        align: 'center',
        font: 'Helvetica-Bold',
        fontSize: 8,
        fillColor: WHITE,
      });
      textAt(doc, 'Unit', col.unit.x, startY + 6, {
        width: col.unit.w,
        align: 'right',
        font: 'Helvetica-Bold',
        fontSize: 8,
        fillColor: WHITE,
      });
      textAt(doc, 'Amount', col.amt.x, startY + 6, {
        width: col.amt.w,
        align: 'right',
        font: 'Helvetica-Bold',
        fontSize: 8,
        fillColor: WHITE,
      });
      return startY + h;
    };

    y = drawTableHeader(y);

    const items = order.items || [];
    const rowH = 24;

    items.forEach((item, idx) => {
      if (y + rowH > PAGE_H - FOOTER_RESERVE) {
        doc.addPage();
        y = drawPageHeader();
        y = drawTableHeader(y);
      }

      if (idx % 2 === 1) {
doc.rect(MARGIN, y, CONTENT_W, rowH).fill(ROW_ALT);
}
      doc.strokeColor(BORDER).lineWidth(0.5);
      doc.moveTo(MARGIN, y + rowH).lineTo(MARGIN + CONTENT_W, y + rowH).stroke();

      const name = resolveItemName(item);
      const sku = resolveItemSku(item);
      const brandStr = resolveBrand(item);
      const qty = Number(item.qty || item.quantity || 1);
      const unit = Number(item.price || 0);
      const line = itemLine(item);

      textAt(doc, name, col.desc.x, y + 5, {
        width: col.desc.w,
        ellipsis: true,
        fontSize: 9,
        fillColor: TEXT,
      });
      if (brandStr) {
        textAt(doc, brandStr, col.desc.x, y + 15, {
          width: col.desc.w,
          ellipsis: true,
          fontSize: 7,
          fillColor: SLATE,
        });
      }
      textAt(doc, sku, col.sku.x, y + 8, {
        width: col.sku.w,
        ellipsis: true,
        fontSize: 8,
        fillColor: '#475569',
      });
      textAt(doc, String(qty), col.qty.x, y + 8, {
        width: col.qty.w,
        align: 'center',
        fontSize: 9,
        fillColor: TEXT,
      });
      textAt(doc, formatBdt(unit), col.unit.x, y + 8, {
        width: col.unit.w,
        align: 'right',
        fontSize: 8,
        fillColor: TEXT,
      });
      textAt(doc, formatBdt(line), col.amt.x, y + 8, {
        width: col.amt.w,
        align: 'right',
        font: 'Helvetica-Bold',
        fontSize: 9,
        fillColor: TEXT,
      });

      y += rowH;
    });

    y += 10;

    const subtotal = Number(order.subtotal || 0);
    const b2bDiscount = Number(order.b2bDiscount || order.discount || 0);
    const couponDiscount = Number(
      order.couponDiscount || order.promoDiscount || order.appliedCoupon?.discountAmount || 0
    );
    const deliveryFee = Number(order.deliveryFee || 0);
    const totalAmount = Number(order.totalAmount || order.total || 0);

    ensureSpace(110);
    const totalsX = MARGIN + 300;
    const labelW = 90;
    const valueW = 85;

    const addTotalRow = (label, value, accent = false) => {
      const color = accent ? TEAL : SLATE;
      const valColor = accent ? TEAL : TEXT;
      textAt(doc, label, totalsX, y, {
        width: labelW,
        align: 'right',
        fontSize: 9,
        fillColor: color,
      });
      textAt(doc, value, totalsX + labelW + 8, y, {
        width: valueW,
        align: 'right',
        font: 'Helvetica-Bold',
        fontSize: 9,
        fillColor: valColor,
      });
      y += 15;
    };

    addTotalRow('Subtotal', formatBdt(subtotal));
    if (b2bDiscount > 0) {
addTotalRow('B2B discount', `− ${formatBdt(b2bDiscount)}`, true);
}
    if (couponDiscount > 0) {
addTotalRow('Coupon', `− ${formatBdt(couponDiscount)}`, true);
}
    addTotalRow('Delivery', formatBdt(deliveryFee));

    y += 2;
    doc.rect(totalsX - 6, y, labelW + valueW + 14, 28).fill(NAVY);
    textAt(doc, 'TOTAL DUE', totalsX, y + 8, {
      width: labelW,
      align: 'right',
      font: 'Helvetica-Bold',
      fontSize: 10,
      fillColor: WHITE,
    });
    textAt(doc, formatBdt(totalAmount), totalsX + labelW + 8, y + 6, {
      width: valueW,
      align: 'right',
      font: 'Helvetica-Bold',
      fontSize: 12,
      fillColor: MINT,
    });
    y += 36;

    ensureSpace(58);
    doc.roundedRect(MARGIN, y, CONTENT_W, 48, 5).fill('#EFF6FF');
    doc.strokeColor('#BFDBFE').lineWidth(0.5).roundedRect(MARGIN, y, CONTENT_W, 48, 5).stroke();
    textAt(doc, 'Payment instructions', MARGIN + 12, y + 8, {
      font: 'Helvetica-Bold',
      fontSize: 8,
      fillColor: NAVY,
    });
    textAt(doc, 'BRAC Bank PLC  ·  MEDIPORT BANGLADESH LTD  ·  A/C 1081267690001', MARGIN + 12, y + 22, {
      fontSize: 8,
      fillColor: '#475569',
    });
    textAt(doc, `Ref: ${invoiceNo}  ·  ${paymentLabel(order.paymentMethod)}`, MARGIN + 12, y + 34, {
      fontSize: 8,
      fillColor: '#475569',
    });

    const range = doc.bufferedPageRange();
    const pageCount = range.count;
    for (let i = range.start; i < range.start + pageCount; i++) {
      doc.switchToPage(i);
      const footerY = PAGE_H - 36;
      doc.strokeColor(BORDER).lineWidth(0.5);
      doc.moveTo(MARGIN, footerY).lineTo(MARGIN + CONTENT_W, footerY).stroke();
      textAt(doc, 'Mediport Bangladesh Ltd  ·  DGDA Reg. DA-2024-0891  ·  www.MediportBD.com', MARGIN, footerY + 6, {
        width: CONTENT_W,
        align: 'center',
        fontSize: 7,
        fillColor: SLATE,
      });
      textAt(doc, 'Computer-generated invoice — no signature required.', MARGIN, footerY + 16, {
        width: CONTENT_W,
        align: 'center',
        fontSize: 7,
        fillColor: SLATE,
      });
    }

    doc.end();
  });
}

module.exports = { generateInvoice };
