/**
 * PDF Export Utility
 *
 * Uses jspdf and jspdf-autotable to generate PDF documents from tabular data.
 * This module is intentionally NOT imported at the top level of any component.
 * It must be loaded via a dynamic import() inside a click handler so that
 * jspdf and jspdf-autotable are excluded from the initial bundle.
 *
 * Requirements: 3.4, 3.5
 */

/**
 * Export tabular data as a PDF file.
 *
 * @param {Object} options
 * @param {string}   options.title      - Document title shown at the top of the PDF
 * @param {string[]} options.columns    - Column header labels
 * @param {Array<string[]>} options.rows - Row data (each row is an array of cell strings)
 * @param {string}   [options.filename] - Output filename (without extension). Defaults to "export"
 */
export async function exportTableToPDF({ title, columns, rows, filename = 'export' }) {
  // Dynamic imports keep jspdf out of the initial bundle.
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 40, 40);

  // Timestamp
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

  // Table
  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 70,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [11, 37, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Export orders data as a PDF.
 *
 * @param {Array<Object>} orders - Array of order objects
 */
export async function exportOrdersToPDF(orders = []) {
  const columns = ['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Status'];

  const rows = orders.map((order) => [
    order._id || order.id || '—',
    order.customerName || order.customer || '—',
    order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—',
    String(order.itemCount ?? order.items?.length ?? '—'),
    order.total != null ? `৳${Number(order.total).toLocaleString()}` : '—',
    order.status || '—',
  ]);

  await exportTableToPDF({
    title: 'Orders Report — MedCore BD',
    columns,
    rows,
    filename: `orders-${Date.now()}`,
  });
}

/**
 * Export analytics / sales report data as a PDF.
 *
 * @param {Object} reportData
 * @param {Array<Object>} [reportData.topProducts]  - Top products array
 * @param {Array<Object>} [reportData.topCustomers] - Top customers array
 */
export async function exportReportToPDF(reportData = {}) {
  const { topProducts = [], topCustomers = [] } = reportData;

  // Build a combined table: products section then customers section
  const columns = ['#', 'Name', 'Metric', 'Value'];

  const rows = [
    ...topProducts.map((p, i) => [
      String(i + 1),
      p.name || '—',
      'Revenue',
      p.revenue != null ? `৳${Number(p.revenue).toLocaleString()}` : '—',
    ]),
    ...topCustomers.map((c, i) => [
      String(i + 1),
      c.name || '—',
      'Spent',
      c.spent != null ? `৳${Number(c.spent).toLocaleString()}` : '—',
    ]),
  ];

  await exportTableToPDF({
    title: 'Analytics Report — MedCore BD',
    columns,
    rows,
    filename: `report-${Date.now()}`,
  });
}
