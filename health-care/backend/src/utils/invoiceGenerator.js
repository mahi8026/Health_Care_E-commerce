const PDFDocument = require('pdfkit');

const NAVY = '#0B2545';
const TEAL = '#0E8A6E';
const LIGHT_TEAL = '#4DDBB8';
const BG = '#F1F3F6';
const WHITE = '#FFFFFF';

/**
 * Generate a branded PDF invoice for an order.
 * Returns a Buffer containing the PDF bytes.
 *
 * @param {Object} order  - Mongoose Order document (populated)
 * @param {Object} user   - Mongoose User document
 * @returns {Promise<Buffer>}
 */
function generateInvoice(order, user) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100; // accounting for margins

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(50, 50, doc.page.width - 100, 80).fill(NAVY);

    doc.fillColor(WHITE)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('MedCore BD', 70, 65);

    doc.fillColor(LIGHT_TEAL)
      .font('Helvetica')
      .fontSize(10)
      .text('Medical Equipment & Supplies — Bangladesh', 70, 92);

    doc.fillColor(WHITE)
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('INVOICE', doc.page.width - 150, 65, { align: 'right', width: 100 });

    doc.fillColor(LIGHT_TEAL)
      .font('Helvetica')
      .fontSize(10)
      .text(`#${order.invoiceNumber || order.orderNumber || order.orderId}`, doc.page.width - 150, 92, { align: 'right', width: 100 });

    doc.moveDown(4);

    // ── Invoice Meta ─────────────────────────────────────────────────────────
    const metaY = 150;
    doc.fillColor('#333')
      .font('Helvetica')
      .fontSize(10);

    const metaLeft = [
      ['Invoice Date:', new Date().toLocaleDateString('en-BD')],
      ['Due Date:', order.paymentTerms ? `Net ${order.paymentTerms} days` : 'Immediate'],
      ['Payment Method:', (order.paymentMethod || '').toUpperCase()],
      ['Payment Status:', (order.paymentStatus || 'pending').toUpperCase()]
    ];

    metaLeft.forEach(([label, value], i) => {
      doc.fillColor('#666').text(label, 50, metaY + i * 18, { continued: true });
      doc.fillColor('#111').font('Helvetica-Bold').text(` ${value}`).font('Helvetica');
    });

    if (order.poNumber) {
      doc.fillColor('#666').text('PO Number:', 50, metaY + 4 * 18, { continued: true });
      doc.fillColor('#111').font('Helvetica-Bold').text(` ${order.poNumber}`).font('Helvetica');
    }

    // B2B badge
    if (user.b2bAccount || user.accountType === 'B2B') {
      doc.rect(doc.page.width - 150, metaY, 100, 22).fill(TEAL);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
        .text('B2B ACCOUNT', doc.page.width - 148, metaY + 6, { width: 96, align: 'center' });
    }

    // ── Bill To / Ship To ────────────────────────────────────────────────────
    const addrY = metaY + 110;
    doc.rect(50, addrY, pageWidth / 2 - 10, 80).fill(BG);
    doc.rect(50 + pageWidth / 2 + 10, addrY, pageWidth / 2 - 10, 80).fill(BG);

    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
      .text('BILL TO', 60, addrY + 8);
    doc.fillColor('#333').font('Helvetica').fontSize(10)
      .text(user.name, 60, addrY + 22)
      .text(user.companyName || user.company || '', 60, addrY + 36)
      .text(user.email, 60, addrY + 50)
      .text(user.phone || '', 60, addrY + 64);

    const shipX = 60 + pageWidth / 2 + 10;
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
      .text('SHIP TO', shipX, addrY + 8);
    const addr = order.deliveryAddress || {};
    doc.fillColor('#333').font('Helvetica').fontSize(10)
      .text(addr.name || user.name, shipX, addrY + 22)
      .text(addr.street || '', shipX, addrY + 36)
      .text(`${addr.thana || addr.area || ''}, ${addr.district || addr.city || ''}`, shipX, addrY + 50)
      .text(addr.postcode || addr.postalCode || '', shipX, addrY + 64);

    // ── Items Table ──────────────────────────────────────────────────────────
    const tableY = addrY + 100;
    const cols = { name: 50, sku: 230, qty: 310, unitPrice: 370, disc: 430, total: 490 };

    // Table header
    doc.rect(50, tableY, pageWidth, 24).fill(NAVY);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9);
    doc.text('Product / Brand', cols.name + 4, tableY + 8);
    doc.text('SKU', cols.sku, tableY + 8);
    doc.text('Qty', cols.qty, tableY + 8);
    doc.text('Unit Price', cols.unitPrice, tableY + 8);
    doc.text('Disc%', cols.disc, tableY + 8);
    doc.text('Line Total', cols.total, tableY + 8);

    let rowY = tableY + 24;
    doc.font('Helvetica').fontSize(9);

    (order.items || []).forEach((item, idx) => {
      const bg = idx % 2 === 0 ? WHITE : BG;
      doc.rect(50, rowY, pageWidth, 22).fill(bg);
      doc.fillColor('#111')
        .text(item.name || 'Product', cols.name + 4, rowY + 7, { width: 175, ellipsis: true })
        .text(item.sku || '-', cols.sku, rowY + 7)
        .text(String(item.qty || item.quantity || 1), cols.qty, rowY + 7)
        .text(`৳${(item.price || 0).toLocaleString()}`, cols.unitPrice, rowY + 7)
        .text(`${item.discount || 0}%`, cols.disc, rowY + 7)
        .text(`৳${((item.price || 0) * (item.qty || item.quantity || 1) * (1 - (item.discount || 0) / 100)).toLocaleString()}`, cols.total, rowY + 7);
      rowY += 22;
    });

    // ── Totals ───────────────────────────────────────────────────────────────
    rowY += 10;
    const totals = [
      ['Subtotal', `৳${(order.subtotal || 0).toLocaleString()}`],
      ...(order.b2bDiscount ? [['B2B Discount', `-৳${order.b2bDiscount.toLocaleString()}`]] : []),
      ['Delivery Fee', `৳${(order.deliveryFee || 0).toLocaleString()}`],
      ['VAT (5%)', `৳${(order.vatAmount || 0).toLocaleString()}`]
    ];

    totals.forEach(([label, value]) => {
      doc.fillColor('#333').font('Helvetica').fontSize(10)
        .text(label, 380, rowY, { width: 100, align: 'right' })
        .text(value, 490, rowY, { width: 60, align: 'right' });
      rowY += 18;
    });

    // Total payable block
    rowY += 4;
    doc.rect(350, rowY, 200, 30).fill(NAVY);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(12)
      .text('TOTAL PAYABLE', 355, rowY + 9, { width: 100 })
      .text(`৳${(order.totalAmount || order.total || 0).toLocaleString()}`, 355, rowY + 9, { width: 190, align: 'right' });

    // ── Bank Transfer Details ────────────────────────────────────────────────
    rowY += 50;
    doc.rect(50, rowY, pageWidth, 60).fill(BG);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
      .text('Bank Transfer Details', 60, rowY + 8);
    doc.fillColor('#333').font('Helvetica').fontSize(9)
      .text('Bank: Dutch-Bangla Bank Limited  |  Account Name: MedCore BD Ltd.', 60, rowY + 22)
      .text('Account No: 1234567890  |  Routing: 090261539  |  Branch: Gulshan', 60, rowY + 36)
      .text('Reference: ' + (order.orderNumber || order.orderId), 60, rowY + 50);

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 80;
    doc.rect(50, footerY, pageWidth, 1).fill('#ddd');
    doc.fillColor('#666').font('Helvetica').fontSize(8)
      .text('MedCore BD Ltd. | DGDA Reg. No. DA-2024-0891 | BIN: 003456789-0101', 50, footerY + 8, { align: 'center', width: pageWidth })
      .text('Dhaka, Bangladesh | +880 1646-886795 | support@medcorebd.com | www.medcorebd.com', 50, footerY + 20, { align: 'center', width: pageWidth })
      .text('This is a computer-generated invoice and does not require a signature.', 50, footerY + 32, { align: 'center', width: pageWidth });

    doc.end();
  });
}

module.exports = { generateInvoice };
