const Quote = require('../models/Quote');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendQuotationReady } = require('../utils/emailService');
const logger = require('../utils/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

// ── Customer: Submit quote request ──────────────────────────────────────────
// POST /api/quotes
exports.createQuote = async (req, res) => {
  try {
    const { items, notes, paymentTerms } = req.body;

    if (!items || !items.length) {
      return errorResponse(res, 'Quote must have at least one item', null, 400);
    }

    let subtotal = 0;
    const quoteItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return errorResponse(res, `Product not found: ${item.product}`, null, 404);
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

    return successResponse(res, quote, 'Quote request submitted', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create quote', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Customer: Get own quotes ─────────────────────────────────────────────────
// GET /api/quotes
exports.getMyQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find({ user: req.user._id })
      .populate('items.product', 'name sku brand')
      .sort('-createdAt');
    return successResponse(res, { count: quotes.length, quotes });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch quotes', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Customer: Get single quote ───────────────────────────────────────────────
// GET /api/quotes/:id
exports.getQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('user', 'name email company companyName')
      .populate('items.product', 'name sku brand');

    if (!quote) return errorResponse(res, 'Quote not found', null, 404);

    if (quote.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized', null, 403);
    }

    return successResponse(res, quote);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch quote', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
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

    return paginatedResponse(res, quotes, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: parseInt(page) < Math.ceil(total / limit),
      hasPrev: parseInt(page) > 1,
      count: quotes.length
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch quotes', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Admin: Update quote status ───────────────────────────────────────────────
// PATCH /api/admin/quotes/:id
exports.updateQuote = async (req, res) => {
  try {
    const { status, discountPct, finalAmount, validUntil, notes, accountManager } = req.body;

    const quote = await Quote.findById(req.params.id).populate('user', 'name email');
    if (!quote) return errorResponse(res, 'Quote not found', null, 404);

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

      // Send WhatsApp notification when quote is ready (non-blocking)
      if (quote.user && quote.user.phone) {
        const whatsappBot = require('../services/whatsappBot');
        whatsappBot.sendQuoteReady(quote, quote.user).catch(err =>
          logger.error(`[updateQuote] WhatsApp failed: ${err.message}`)
        );
      }
    }

    return successResponse(res, quote, 'Quote updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update quote', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Admin: Convert quote to order ────────────────────────────────────────────
// POST /api/admin/quotes/:id/convert
exports.convertQuoteToOrder = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('user')
      .populate('items.product');

    if (!quote) return errorResponse(res, 'Quote not found', null, 404);
    if (quote.status === 'converted') {
      return errorResponse(res, 'Quote already converted', null, 400);
    }
    if (quote.status === 'expired') {
      return errorResponse(res, 'Cannot convert expired quote', null, 400);
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

    return successResponse(res, { order, quote }, 'Quote converted to order', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to convert quote', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
