const Quote = require('../models/Quote');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendQuotationReady } = require('../utils/emailService');
const logger = require('../utils/logger');

// ── Customer: Submit quote request ──────────────────────────────────────────
// POST /api/quotes
exports.createQuote = async (req, res) => {
  try {
    const { items, notes, paymentTerms } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Quote must have at least one item' });
    }

    let subtotal = 0;
    const quoteItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }
      const unitPrice = item.unitPrice || product.price;
      const discount = item.discount || 0;
      subtotal += unitPrice * item.qty;
      quoteItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        brand: product.brand,
        qty: item.qty,
        unitPrice,
        discount
      });
    }

    // B2B tier discount
    const user = req.user;
    let discountPct = 0;
    if (user.b2bTier === 'Silver') discountPct = 10;
    else if (user.b2bTier === 'Gold') discountPct = 22;
    else if (user.b2bTier === 'Platinum') discountPct = 30;

    const discountAmount = subtotal * (discountPct / 100);
    const finalAmount = subtotal - discountAmount;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30); // valid for 30 days

    const quote = await Quote.create({
      user: user._id,
      items: quoteItems,
      subtotal,
      discountPct,
      discountAmount,
      finalAmount,
      validUntil,
      paymentTerms: paymentTerms || user.paymentTerms || 30,
      notes,
      accountManager: user.accountManager
    });

    res.status(201).json({ success: true, message: 'Quote request submitted', quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Customer: Get own quotes ─────────────────────────────────────────────────
// GET /api/quotes
exports.getMyQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find({ user: req.user._id })
      .populate('items.product', 'name sku brand')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: quotes.length, quotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Customer: Get single quote ───────────────────────────────────────────────
// GET /api/quotes/:id
exports.getQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('user', 'name email company companyName')
      .populate('items.product', 'name sku brand');

    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

    if (quote.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: Get all quotes ────────────────────────────────────────────────────
// GET /api/admin/quotes
exports.getAllQuotes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const quotes = await Quote.find(filter)
      .populate('user', 'name email companyName company b2bTier b2bId')
      .populate('items.product', 'name sku')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Quote.countDocuments(filter);

    res.status(200).json({ success: true, count: quotes.length, total, quotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: Update quote status ───────────────────────────────────────────────
// PATCH /api/admin/quotes/:id
exports.updateQuote = async (req, res) => {
  try {
    const { status, discountPct, finalAmount, validUntil, notes, accountManager } = req.body;

    const quote = await Quote.findById(req.params.id).populate('user', 'name email');
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

    if (status) quote.status = status;
    if (discountPct !== undefined) {
      quote.discountPct = discountPct;
      quote.discountAmount = quote.subtotal * (discountPct / 100);
      quote.finalAmount = quote.subtotal - quote.discountAmount;
    }
    if (finalAmount !== undefined) quote.finalAmount = finalAmount;
    if (validUntil) quote.validUntil = new Date(validUntil);
    if (notes) quote.notes = notes;
    if (accountManager) quote.accountManager = accountManager;

    await quote.save();

    // Send email when quote is sent to customer
    if (status === 'sent') {
      try {
        await sendQuotationReady(quote, quote.user);
      } catch (emailErr) {
        logger.error('Failed to send quotation email:', emailErr.message);
      }
    }

    res.status(200).json({ success: true, message: 'Quote updated', quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: Convert quote to order ────────────────────────────────────────────
// POST /api/admin/quotes/:id/convert
exports.convertQuoteToOrder = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('user')
      .populate('items.product');

    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    if (quote.status === 'converted') {
      return res.status(400).json({ success: false, message: 'Quote already converted' });
    }
    if (quote.status === 'expired') {
      return res.status(400).json({ success: false, message: 'Cannot convert expired quote' });
    }

    const Order = require('../models/Order');
    const { deliveryAddress, paymentMethod, deliveryType } = req.body;

    // Total without VAT
    const totalAmount = quote.finalAmount;

    const order = await Order.create({
      user: quote.user._id,
      items: quote.items.map(i => ({
        product: i.product._id,
        name: i.name,
        sku: i.sku,
        brand: i.brand,
        price: i.unitPrice,
        discount: i.discount,
        qty: i.qty,
        quantity: i.qty
      })),
      subtotal: quote.subtotal,
      b2bDiscount: quote.discountAmount,
      b2bDiscountPct: quote.discountPct,
      discount: quote.discountAmount,
      deliveryFee: 0,
      vatAmount: 0,
      totalAmount,
      total: totalAmount,
      deliveryAddress: deliveryAddress || {},
      deliveryType: deliveryType || 'standard',
      paymentMethod: paymentMethod || 'b2b_credit',
      paymentStatus: 'pending',
      status: 'confirmed',
      poNumber: quote.quoteId,
      accountManager: quote.accountManager
    });

    quote.status = 'converted';
    quote.convertedOrderId = order._id;
    await quote.save();

    res.status(201).json({ success: true, message: 'Quote converted to order', order, quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
