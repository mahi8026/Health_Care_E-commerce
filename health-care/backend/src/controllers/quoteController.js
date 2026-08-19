const Quote = require('../models/Quote');
const Product = require('../models/Product');
const pricingService = require('../services/pricingService');
const { sendQuotationReady } = require('../utils/emailService');
const logger = require('../utils/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

const VALID_STATUSES = ['pending', 'sent', 'approved', 'converted', 'expired', 'rejected'];
const VALID_TERMS = [30, 60, 90];

/**
 * Mark any quote past its validUntil as expired (idempotent, in-memory only).
 */
function expireIfStale(quote) {
  if (
    quote &&
    quote.validUntil &&
    quote.status !== 'expired' &&
    quote.status !== 'converted' &&
    quote.status !== 'rejected' &&
    new Date(quote.validUntil) < new Date()
  ) {
    quote.status = 'expired';
  }
  return quote;
}

// ── Customer: Submit quote request ──────────────────────────────────────────
// POST /api/quotes
exports.createQuote = async (req, res) => {
  try {
    const { items, notes, paymentTerms, requestedDelivery } = req.body;

    if (!items || !items.length) {
      return errorResponse(res, 'Quote must have at least one item', null, 400);
    }
    if (items.length > 100) {
      return errorResponse(res, 'A quotation can contain at most 100 line items', null, 400);
    }
    if (paymentTerms !== undefined && !VALID_TERMS.includes(Number(paymentTerms))) {
      return errorResponse(res, 'Invalid payment terms. Choose 30, 60 or 90 days', null, 400);
    }

    // Server-side pricing only — never trust client-supplied prices
    const quoted = await pricingService.quoteItems(items, req.user);

    let subtotal = 0;
    let totalSavings = 0;
    const quoteItems = quoted.map(({ product, qty, unitPrice, savings, sizeName, isB2BPrice }) => {
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;
      subtotal += lineTotal;
      totalSavings += Number(savings) || 0;
      return {
        product: product._id,
        name: product.name,
        sku: product.sku,
        brand: product.brand ? (typeof product.brand === 'object' ? product.brand.name : product.brand) : undefined,
        sizeName: sizeName || undefined,
        qty,
        unitPrice,
        originalPrice: Number(product.price) || 0,
        discount: 0,
        isB2BPrice: !!isB2BPrice,
        savings: Number(savings) || 0,
        lineTotal
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30); // valid for 30 days

    const quote = await Quote.create({
      user: req.user._id,
      items: quoteItems,
      subtotal,
      discountPct: 0,
      discountAmount: 0,
      vatAmount: 0,
      finalAmount: subtotal,
      validUntil,
      paymentTerms: paymentTerms !== undefined ? Number(paymentTerms) : (req.user.paymentTerms || 30),
      notes: notes || undefined,
      requestedDelivery: requestedDelivery || undefined,
      accountManager: req.user.accountManager || undefined
    });

    logger.info(`[createQuote] Quote ${quote.quoteNumber} created for user ${req.user._id} (${subtotal} BDT)`);
    return successResponse(res, quote, `Quote request ${quote.quoteNumber} submitted`, 201);
  } catch (error) {
    logger.error(`[createQuote] ${error.message}`);
    return errorResponse(res, error.message || 'Failed to create quote', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, error.statusCode || 500);
  }
};

// ── Customer: Get own quotes ─────────────────────────────────────────────────
// GET /api/quotes?page=&limit=&status=
exports.getMyQuotes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    // Auto-expire stale quotes on read
    await Quote.updateMany(
      { ...filter, status: { $nin: ['expired', 'converted', 'rejected'] }, validUntil: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );

    const [quotes, total] = await Promise.all([
      Quote.find(filter)
        .populate('items.product', 'name sku brand')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Quote.countDocuments(filter)
    ]);

    return paginatedResponse(res, quotes, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
      count: quotes.length
    });
  } catch (error) {
    logger.error(`[getMyQuotes] ${error.message}`);
    return errorResponse(res, 'Failed to fetch quotes', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── Customer: Get single quote ───────────────────────────────────────────────
// GET /api/quotes/:id
exports.getQuote = async (req, res) => {
  try {
    let quote = await Quote.findById(req.params.id)
      .populate('user', 'name email company companyName b2bId')
      .populate('items.product', 'name sku brand');

    if (!quote) {
      return errorResponse(res, 'Quote not found', null, 404);
    }

    const isAdmin = ['admin', 'manager'].includes(req.user.role);
    if (String(quote.user._id) !== String(req.user._id) && !isAdmin) {
      return errorResponse(res, 'Not authorized', null, 403);
    }

    expireIfStale(quote);
    if (quote.isModified('status')) {
      await quote.save();
    }

    return successResponse(res, quote);
  } catch (error) {
    logger.error(`[getQuote] ${error.message}`);
    return errorResponse(res, 'Failed to fetch quote', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── Customer: Accept a sent quote ────────────────────────────────────────────
// POST /api/quotes/:id/accept
exports.acceptQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return errorResponse(res, 'Quote not found', null, 404);
    }
    if (String(quote.user) !== String(req.user._id)) {
      return errorResponse(res, 'Not authorized', null, 403);
    }

    expireIfStale(quote);
    if (quote.status === 'expired') {
      return errorResponse(res, 'This quotation has expired. Please request a new one', null, 400);
    }
    if (quote.status === 'converted') {
      return errorResponse(res, 'This quotation has already been converted to an order', null, 400);
    }
    if (quote.status === 'approved') {
      return successResponse(res, quote, 'Quotation already approved');
    }
    if (quote.status === 'rejected') {
      return errorResponse(res, 'This quotation was rejected', null, 400);
    }

    quote.status = 'approved';
    quote.approvedAt = new Date();
    await quote.save();

    logger.info(`[acceptQuote] Quote ${quote.quoteNumber} accepted by customer ${req.user._id}`);
    return successResponse(res, quote, `Quotation ${quote.quoteNumber} approved`);
  } catch (error) {
    logger.error(`[acceptQuote] ${error.message}`);
    return errorResponse(res, 'Failed to accept quote', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── Customer: Reject a quote ─────────────────────────────────────────────────
// POST /api/quotes/:id/reject
exports.rejectQuote = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 3) {
      return errorResponse(res, 'A reason of at least 3 characters is required', null, 400);
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return errorResponse(res, 'Quote not found', null, 404);
    }
    if (String(quote.user) !== String(req.user._id)) {
      return errorResponse(res, 'Not authorized', null, 403);
    }
    if (['converted', 'rejected', 'expired'].includes(quote.status)) {
      return errorResponse(res, `This quotation cannot be rejected (${quote.status})`, null, 400);
    }

    quote.status = 'rejected';
    quote.rejectionReason = reason.trim();
    await quote.save();

    logger.info(`[rejectQuote] Quote ${quote.quoteNumber} rejected by customer ${req.user._id}`);
    return successResponse(res, quote, `Quotation ${quote.quoteNumber} rejected`);
  } catch (error) {
    logger.error(`[rejectQuote] ${error.message}`);
    return errorResponse(res, 'Failed to reject quote', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── Admin: Get all quotes ────────────────────────────────────────────────────
// GET /api/admin/quotes?status=&page=&limit=&search=
exports.getAllQuotes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { quoteNumber: { $regex: term, $options: 'i' } },
        { quoteId: { $regex: term, $options: 'i' } }
      ];
    }

    // Auto-expire stale quotes before listing
    await Quote.updateMany(
      { status: { $nin: ['expired', 'converted', 'rejected'] }, validUntil: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );

    const [quotes, total] = await Promise.all([
      Quote.find(filter)
        .populate('user', 'name email companyName company b2bTier b2bId')
        .populate('items.product', 'name sku')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Quote.countDocuments(filter)
    ]);

    return paginatedResponse(res, quotes, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
      count: quotes.length
    });
  } catch (error) {
    logger.error(`[getAllQuotes] ${error.message}`);
    return errorResponse(res, 'Failed to fetch quotes', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── Admin: Update quote status / pricing ─────────────────────────────────────
// PATCH /api/admin/quotes/:id
exports.updateQuote = async (req, res) => {
  try {
    const { status, discountPct, finalAmount, validUntil, notes, accountManager, rejectionReason, items } = req.body;

    const quote = await Quote.findById(req.params.id).populate('user', 'name email phone');
    if (!quote) {
      return errorResponse(res, 'Quote not found', null, 404);
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return errorResponse(res, `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`, null, 400);
      }
      quote.status = status;
      if (status === 'sent') quote.sentAt = quote.sentAt || new Date();
      if (status === 'approved') quote.approvedAt = quote.approvedAt || new Date();
      if (status === 'rejected' && rejectionReason) quote.rejectionReason = rejectionReason;
    }

    if (discountPct !== undefined) {
      const pct = Math.max(0, Math.min(100, Number(discountPct)));
      quote.discountPct = pct;
      quote.discountAmount = Math.round(quote.subtotal * (pct / 100) * 100) / 100;
      quote.finalAmount = Math.round((quote.subtotal - quote.discountAmount) * 100) / 100;
    }
    if (finalAmount !== undefined) {
      quote.finalAmount = Math.round(Number(finalAmount) * 100) / 100;
    }
    if (validUntil) {
      quote.validUntil = new Date(validUntil);
    }
    if (notes !== undefined) {
      quote.notes = notes;
    }
    if (accountManager) {
      quote.accountManager = accountManager;
    }
    if (rejectionReason !== undefined && quote.status === 'rejected') {
      quote.rejectionReason = rejectionReason;
    }

    // Admin may edit line items (price / qty). Recompute totals server-side.
    if (Array.isArray(items) && items.length) {
      quote.items = items.map((line) => {
        const existing = quote.items.find(i => String(i.product) === String(line.product)) || {};
        const qty = Math.max(1, Number(line.qty) || existing.qty || 1);
        const rawPrice = Number(line.unitPrice);
        const unitPrice = Number.isFinite(rawPrice)
          ? Math.max(0, rawPrice)
          : Math.max(0, Number(existing.unitPrice) || 0);
        const discount = Number(line.discount) || existing.discount || 0;
        const lineTotal = Math.round(unitPrice * qty * 100) / 100;
        return {
          ...existing,
          product: line.product || existing.product,
          name: line.name || existing.name,
          sku: line.sku || existing.sku,
          brand: line.brand || existing.brand,
          qty,
          unitPrice,
          discount,
          lineTotal
        };
      });
      quote.subtotal = Math.round(quote.items.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
      quote.discountAmount = Math.round(quote.subtotal * (quote.discountPct / 100) * 100) / 100;
      quote.finalAmount = Math.round((quote.subtotal - quote.discountAmount) * 100) / 100;
    }

    await quote.save();

    // Notify customer when a quote is sent to them
    if (status === 'sent') {
      try {
        await sendQuotationReady(quote, quote.user);
        logger.info(`[updateQuote] Quotation email sent for ${quote.quoteNumber}`);
      } catch (emailErr) {
        logger.error(`[updateQuote] Email failed for ${quote.quoteNumber}: ${emailErr.message}`);
      }
      if (quote.user && quote.user.phone) {
        const whatsappBot = require('../services/whatsappBot');
        whatsappBot.sendQuoteReady(quote, quote.user).catch(err =>
          logger.error(`[updateQuote] WhatsApp failed for ${quote.quoteNumber}: ${err.message}`)
        );
      }
    }

    return successResponse(res, quote, `Quotation ${quote.quoteNumber} updated`);
  } catch (error) {
    logger.error(`[updateQuote] ${error.message}`);
    return errorResponse(res, 'Failed to update quote', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// ── Admin: Convert quote to order ────────────────────────────────────────────
// POST /api/admin/quotes/:id/convert
exports.convertQuoteToOrder = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('user')
      .populate('items.product');

    if (!quote) {
      return errorResponse(res, 'Quote not found', null, 404);
    }
    if (quote.status === 'converted') {
      return errorResponse(res, 'Quote already converted', null, 400);
    }
    if (quote.status === 'expired') {
      return errorResponse(res, 'Cannot convert an expired quote', null, 400);
    }

    const Order = require('../models/Order');
    const { deliveryAddress, paymentMethod, deliveryType } = req.body;

    // Total without VAT (consistent with the main order flow)
    const totalAmount = quote.finalAmount;

    const order = await Order.create({
      user: quote.user._id,
      items: quote.items.map(i => ({
        product: i.product && i.product._id ? i.product._id : i.product,
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
      accountManager: quote.accountManager,
      notes: quote.notes
    });

    quote.status = 'converted';
    quote.convertedOrderId = order._id;
    await quote.save();

    logger.info(`[convertQuoteToOrder] Quote ${quote.quoteNumber} converted to order ${order._id}`);
    return successResponse(res, { order, quote }, `Quotation ${quote.quoteNumber} converted to order`, 201);
  } catch (error) {
    logger.error(`[convertQuoteToOrder] ${error.message}`);
    return errorResponse(res, 'Failed to convert quote', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};