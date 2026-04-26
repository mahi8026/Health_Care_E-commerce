/**
 * Professional Export Service
 * Handles data export to various formats (CSV, Excel-compatible CSV, JSON)
 */

export class ExportService {
  /**
   * Export data to CSV format
   * @param {Array} data - Array of objects to export
   * @param {string} filename - Output filename
   * @param {Array} columns - Column definitions [{key, label}]
   */
  static exportToCSV(data, filename, columns) {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      // Create CSV header
      const headers = columns.map(col => col.label).join(',');
      
      // Create CSV rows
      const rows = data.map(item => {
        return columns.map(col => {
          let value = this.getNestedValue(item, col.key);
          
          // Format value
          if (col.format) {
            value = col.format(value, item);
          }
          
          // Escape and quote value
          return this.escapeCSVValue(value);
        }).join(',');
      });

      // Combine header and rows
      const csv = [headers, ...rows].join('\n');

      // Add BOM for Excel UTF-8 support
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csv;

      // Download file
      this.downloadFile(csvWithBOM, filename, 'text/csv;charset=utf-8;');
      
      return true;
    } catch (error) {
      console.error('CSV export error:', error);
      throw error;
    }
  }

  /**
   * Export orders to CSV
   * @param {Array} orders - Array of order objects
   * @param {string} filename - Output filename
   */
  static exportOrdersToCSV(orders, filename = 'orders-export.csv') {
    const columns = [
      { key: 'orderNumber', label: 'Order Number' },
      { key: 'createdAt', label: 'Date', format: (val) => val ? new Date(val).toLocaleDateString('en-BD') : '' },
      { key: 'user.name', label: 'Customer Name' },
      { key: 'user.email', label: 'Customer Email' },
      { key: 'status', label: 'Status', format: (val) => val?.toUpperCase() },
      { key: 'totalAmount', label: 'Total Amount (৳)', format: (val) => val?.toLocaleString() || '0' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'paymentStatus', label: 'Payment Status' },
      { key: 'items', label: 'Items Count', format: (val) => val?.length || 0 },
      { key: 'shippingAddress.city', label: 'City' },
      { key: 'trackingNumber', label: 'Tracking Number' },
      { key: 'courier', label: 'Courier' }
    ];

    return this.exportToCSV(orders, filename, columns);
  }

  /**
   * Export products to CSV
   * @param {Array} products - Array of product objects
   * @param {string} filename - Output filename
   */
  static exportProductsToCSV(products, filename = 'products-export.csv') {
    const columns = [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Product Name' },
      { key: 'brand', label: 'Brand' },
      { key: 'category', label: 'Category' },
      { key: 'price', label: 'Price (৳)', format: (val) => val?.toLocaleString() || '0' },
      { key: 'stock', label: 'Stock' },
      { key: 'lowStockThreshold', label: 'Low Stock Threshold' },
      { key: 'unit', label: 'Unit' },
      { key: 'isActive', label: 'Active', format: (val) => val ? 'Yes' : 'No' },
      { key: 'isFeatured', label: 'Featured', format: (val) => val ? 'Yes' : 'No' },
      { key: 'createdAt', label: 'Created Date', format: (val) => val ? new Date(val).toLocaleDateString('en-BD') : '' }
    ];

    return this.exportToCSV(products, filename, columns);
  }

  /**
   * Export customers to CSV
   * @param {Array} customers - Array of customer objects
   * @param {string} filename - Output filename
   */
  static exportCustomersToCSV(customers, filename = 'customers-export.csv') {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Type', format: (val) => val === 'b2b' ? 'B2B' : 'Retail' },
      { key: 'b2bTier', label: 'B2B Tier' },
      { key: 'b2bId', label: 'B2B ID' },
      { key: 'company', label: 'Company' },
      { key: 'isActive', label: 'Active', format: (val) => val ? 'Yes' : 'No' },
      { key: 'createdAt', label: 'Registration Date', format: (val) => val ? new Date(val).toLocaleDateString('en-BD') : '' }
    ];

    return this.exportToCSV(customers, filename, columns);
  }

  /**
   * Export analytics data to CSV
   * @param {Object} analytics - Analytics data object
   * @param {string} filename - Output filename
   */
  static exportAnalyticsToCSV(analytics, filename = 'analytics-export.csv') {
    // Convert analytics object to array format
    const data = [
      { metric: 'Total Revenue', value: `৳${(analytics.totalRevenue || 0).toLocaleString()}` },
      { metric: 'Total Orders', value: analytics.totalOrders || 0 },
      { metric: 'Active B2B Clients', value: analytics.activeB2B || 0 },
      { metric: 'Total Products', value: analytics.totalProducts || 0 },
      { metric: 'Low Stock Items', value: analytics.lowStockItems || 0 },
      { metric: 'Revenue Growth', value: `${analytics.revenueGrowth || 0}%` },
      { metric: 'Orders Growth', value: `${analytics.ordersGrowth || 0}%` }
    ];

    const columns = [
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' }
    ];

    return this.exportToCSV(data, filename, columns);
  }

  /**
   * Export data to JSON format
   * @param {any} data - Data to export
   * @param {string} filename - Output filename
   */
  static exportToJSON(data, filename) {
    try {
      const json = JSON.stringify(data, null, 2);
      this.downloadFile(json, filename, 'application/json');
      return true;
    } catch (error) {
      console.error('JSON export error:', error);
      throw error;
    }
  }

  /**
   * Get nested object value by path
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-notation path (e.g., 'user.name')
   * @returns {any} Value at path
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Escape and quote CSV value
   * @param {any} value - Value to escape
   * @returns {string} Escaped value
   */
  static escapeCSVValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Download file to user's computer
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate filename with timestamp
   * @param {string} prefix - Filename prefix
   * @param {string} extension - File extension
   * @returns {string} Filename with timestamp
   */
  static generateFilename(prefix, extension) {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}-${timestamp}.${extension}`;
  }
}

export default ExportService;
