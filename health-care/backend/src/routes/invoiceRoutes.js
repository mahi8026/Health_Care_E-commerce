const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const { generateInvoice } = require('../utils/invoiceGenerator');
const logger = require('../utils/logger');

// GET /api/invoices/:orderId — download PDF invoice
router.get('/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.product', 'name sku brand')
      .lean();

    // Normalize items for PDF (names from populated product)
    if (order?.items) {
      order.items = order.items.map((item) => {
        let brand = item.brand || item.product?.brand;
        if (brand && typeof brand === 'object') brand = brand.name;
        if (brand && /^[a-f0-9]{24}$/i.test(String(brand))) brand = null;
        return {
          ...item,
          name: item.name || item.product?.name,
          sku: item.sku || item.product?.sku,
          brand,
        };
      });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only the order owner or admin can download
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(order.user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const pdfBuffer = await generateInvoice(order, user);
    const filename = `Invoice-${order.orderNumber || order.orderId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Invoice generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
