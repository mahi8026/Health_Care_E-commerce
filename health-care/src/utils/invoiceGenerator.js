/**
 * Professional Invoice Generator
 * Generates PDF invoices for orders
 */

export class InvoiceGenerator {
  /**
   * Generate and download invoice PDF
   * @param {Object} order - Order object with all details
   */
  static async generateInvoice(order) {
    try {
      // Create invoice HTML
      const invoiceHTML = this.createInvoiceHTML(order);
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow popups to generate invoice');
      }

      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };

      return true;
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Invoice generation error:', error);
      throw error;
    }
  }

  /**
   * Create professional invoice HTML
   * @param {Object} order - Order details
   * @returns {string} HTML string
   */
  static createInvoiceHTML(order) {
    const currentDate = new Date().toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const orderDate = order.createdAt 
      ? new Date(order.createdAt).toLocaleDateString('en-BD', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : currentDate;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.orderNumber || order._id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: #fff;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 1px solid #ddd;
    }
    
    .invoice-header {
      background: linear-gradient(135deg, #0B2545 0%, #0d2d52 100%);
      color: white;
      padding: 30px;
      display: flex;
      justify-content: space-between;
      align-items: start;
    }
    
    .company-info h1 {
      font-size: 28px;
      margin-bottom: 5px;
      font-weight: 700;
    }
    
    .company-info p {
      font-size: 11px;
      opacity: 0.9;
      margin: 2px 0;
    }
    
    .invoice-title {
      text-align: right;
    }
    
    .invoice-title h2 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .invoice-title p {
      font-size: 11px;
      opacity: 0.9;
    }
    
    .invoice-details {
      padding: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .detail-section h3 {
      font-size: 11px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .detail-section p {
      margin: 5px 0;
      font-size: 12px;
    }
    
    .detail-section strong {
      font-weight: 600;
      color: #0B2545;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 5px;
    }
    
    .status-delivered { background: #D1FAE5; color: #065F46; }
    .status-shipped { background: #E0E7FF; color: #3730A3; }
    .status-processing { background: #E0E7FF; color: #3730A3; }
    .status-confirmed { background: #DBEAFE; color: #1E40AF; }
    .status-placed { background: #FEF3C7; color: #92400E; }
    .status-cancelled { background: #FEE2E2; color: #991B1B; }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    
    .items-table thead {
      background: #f8f9fa;
    }
    
    .items-table th {
      padding: 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      border-bottom: 2px solid #dee2e6;
    }
    
    .items-table td {
      padding: 15px 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 12px;
    }
    
    .items-table tbody tr:hover {
      background: #f8f9fa;
    }
    
    .item-name {
      font-weight: 600;
      color: #0B2545;
      margin-bottom: 3px;
    }
    
    .item-sku {
      font-size: 10px;
      color: #666;
    }
    
    .text-right {
      text-align: right;
    }
    
    .summary-section {
      padding: 0 30px 30px;
      display: flex;
      justify-content: flex-end;
    }
    
    .summary-table {
      width: 300px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
    }
    
    .summary-row.total {
      border-top: 2px solid #0B2545;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 16px;
      font-weight: 700;
      color: #0B2545;
    }
    
    .summary-row.discount {
      color: #0E8A6E;
    }
    
    .invoice-footer {
      background: #f8f9fa;
      padding: 20px 30px;
      border-top: 2px solid #dee2e6;
      text-align: center;
    }
    
    .invoice-footer p {
      font-size: 11px;
      color: #666;
      margin: 5px 0;
    }
    
    .invoice-footer strong {
      color: #0B2545;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .invoice-container {
        border: none;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-info">
        <h1>MedCore<sup style="font-size: 14px;">BD</sup></h1>
        <p>Medical Equipment & Supplies</p>
        <p>Dhaka, Bangladesh</p>
        <p>Phone: +880 1800-MED (633)</p>
        <p>Email: orders@medcorebd.com</p>
      </div>
      <div class="invoice-title">
        <h2>INVOICE</h2>
        <p>Date: ${currentDate}</p>
      </div>
    </div>
    
    <!-- Invoice Details -->
    <div class="invoice-details">
      <div class="detail-section">
        <h3>Invoice To</h3>
        <p><strong>${order.user?.name || order.customer || 'Customer'}</strong></p>
        ${order.user?.email ? `<p>${order.user.email}</p>` : ''}
        ${order.shippingAddress?.phone ? `<p>Phone: ${order.shippingAddress.phone}</p>` : ''}
        ${order.user?.role === 'b2b' ? `<p style="color: #0E8A6E; font-weight: 600;">B2B Customer</p>` : ''}
      </div>
      
      <div class="detail-section">
        <h3>Invoice Details</h3>
        <p><strong>Invoice #:</strong> ${order.orderNumber || order._id}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
        <p><strong>Status:</strong></p>
        <span class="status-badge status-${order.status}">${order.status}</span>
      </div>
    </div>
    
    ${order.shippingAddress ? `
    <div style="padding: 0 30px 20px;">
      <div class="detail-section">
        <h3>Shipping Address</h3>
        <p>${order.shippingAddress.street || ''}</p>
        <p>${order.shippingAddress.city || ''} ${order.shippingAddress.postalCode || ''}</p>
        <p>${order.shippingAddress.country || 'Bangladesh'}</p>
      </div>
    </div>
    ` : ''}
    
    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%;">Item</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(order.items || []).map(item => `
          <tr>
            <td>
              <div class="item-name">${item.product?.name || item.name || 'Product'}</div>
              ${item.sku ? `<div class="item-sku">SKU: ${item.sku}</div>` : ''}
              ${item.brand ? `<div class="item-sku">${item.brand}</div>` : ''}
            </td>
            <td class="text-right">${item.quantity || item.qty || 1}</td>
            <td class="text-right">৳${(item.price || 0).toLocaleString()}</td>
            <td class="text-right"><strong>৳${((item.quantity || item.qty || 1) * (item.price || 0)).toLocaleString()}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <!-- Summary -->
    <div class="summary-section">
      <div class="summary-table">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>৳${(order.subtotal || 0).toLocaleString()}</span>
        </div>
        ${order.discount > 0 ? `
        <div class="summary-row discount">
          <span>Discount:</span>
          <span>−৳${order.discount.toLocaleString()}</span>
        </div>
        ` : ''}
        <div class="summary-row">
          <span>Shipping:</span>
          <span>৳${(order.shippingCost || 0).toLocaleString()}</span>
        </div>
        <div class="summary-row total">
          <span>Total Amount:</span>
          <span>৳${(order.totalAmount || order.total || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="invoice-footer">
      <p><strong>Thank you for your business!</strong></p>
      <p>For any queries, please contact us at support@medcorebd.com or call +880 1800-MED (633)</p>
      <p style="margin-top: 15px; font-size: 10px;">This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Download invoice as PDF (browser print dialog)
   * @param {Object} order - Order object
   */
  static async downloadInvoice(order) {
    return this.generateInvoice(order);
  }
}

export default InvoiceGenerator;

