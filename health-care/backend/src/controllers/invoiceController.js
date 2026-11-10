const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const { generateInvoice } = require('../utils/invoiceGenerator');
const {
  composeInvoice,
  buildDefaultInvoice,
  sanitizeInvoicePayload,
  isInvoiceNumberTaken,
} = require('../services/invoiceService');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseHelper');

const USER_FIELDS = 'name email phone companyName company b2bAccount accountType paymentTerms addresses';

/** A customer may read their own invoice; admins may read any invoice. */
function canAccessInvoice(user, order) {
  if (!user || !order) {
    return false;
  }
  if (user.role === 'admin') {
    return true;
  }
  const owner = order.user && (order.user._id || order.user);
  return String(owner) === String(user._id || user.id);
}

async function loadInvoiceContext(orderId, { populateProducts = false } = {}) {
  let query = Order.findById(orderId).populate('user', USER_FIELDS);
  if (populateProducts) {
    query = query.populate({
      path: 'items.product',
      select: 'name sku brand',
      populate: { path: 'brand', select: 'name' },
    });
  }

  const order = await query.lean();
  if (!order) {
    return null;
  }

  const invoice = await Invoice.findOne({ order: order._id }).lean();
  return { order, invoice };
}

function conflictResponse(res, message, code, extra = {}) {
  return res.status(409).json({ success: false, message, code, ...extra });
}

/**
 * Generate PDF invoice for an order
 * @route POST /api/orders/invoice/pdf
 */
exports.generateInvoicePDF = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return errorResponse(res, 'Order ID is required', 400);
    }

    const context = await loadInvoiceContext(orderId);
    if (!context) {
      return errorResponse(res, 'Order not found', 404);
    }

    const { order, invoice } = context;
    if (!canAccessInvoice(req.user, order)) {
      return errorResponse(res, 'Unauthorized to access this invoice', 403);
    }

    // Admin edits (if any) are merged into the order-shaped view the PDF renders.
    const { order: invoiceView, customer } = composeInvoice(order, order.user, invoice);
    const pdfBuffer = await generateInvoice(invoiceView, customer);
    const fileName = invoiceView.invoiceNumber || order.orderNumber || order._id;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${fileName}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    logger.info(`Invoice PDF generated for order ${order.orderNumber}`);
  } catch (error) {
    logger.error('Error generating invoice PDF:', error);
    return errorResponse(res, 'Failed to generate invoice PDF', 500);
  }
};

/**
 * Get invoice data for an order (JSON format)
 * @route GET /api/orders/:orderId/invoice
 */
exports.getInvoiceData = async (req, res) => {
  try {
    const { orderId } = req.params;

    const context = await loadInvoiceContext(orderId, { populateProducts: true });
    if (!context) {
      return errorResponse(res, 'Order not found', 404);
    }

    const { order, invoice } = context;
    if (!canAccessInvoice(req.user, order)) {
      return errorResponse(res, 'Unauthorized to access this invoice', 403);
    }

    // Return the merged invoice (order defaults + admin edits) for rendering.
    const { order: invoiceView, meta } = composeInvoice(order, order.user, invoice);

    res.json({
      success: true,
      order: invoiceView,
      invoice: meta,
      canEdit: req.user.role === 'admin',
    });

    logger.info(`Invoice data retrieved for order ${order.orderNumber}`);
  } catch (error) {
    logger.error('Error fetching invoice data:', error);
    return errorResponse(res, 'Failed to fetch invoice data', 500);
  }
};

/**
 * Get the editable invoice for an order (admin).
 * @route GET /api/invoices/order/:orderId
 */
exports.getAdminInvoice = async (req, res) => {
  try {
    const context = await loadInvoiceContext(req.params.orderId, { populateProducts: true });
    if (!context) {
      return errorResponse(res, 'Order not found', 404);
    }

    const { order, invoice } = context;
    const { order: invoiceView, meta } = composeInvoice(order, order.user, invoice);

    return res.json({
      success: true,
      order: invoiceView,
      invoice: meta,
      defaults: buildDefaultInvoice(order, order.user),
    });
  } catch (error) {
    logger.error('Error loading editable invoice:', error);
    return errorResponse(res, 'Failed to load invoice', 500);
  }
};

/**
 * Save admin edits to an invoice (creates revision N+1).
 * @route PUT /api/invoices/order/:orderId
 */
exports.updateAdminInvoice = async (req, res) => {
  try {
    const context = await loadInvoiceContext(req.params.orderId);
    if (!context) {
      return errorResponse(res, 'Order not found', 404);
    }

    const { order, invoice: existing } = context;

    // Optimistic locking — never overwrite an edit made from a stale screen.
    if (
      existing &&
      req.body.revision !== undefined &&
      req.body.revision !== null &&
      Number(req.body.revision) !== existing.revision
    ) {
      return conflictResponse(
        res,
        'This invoice was updated by someone else. Reload it before saving.',
        'INVOICE_REVISION_CONFLICT',
        { invoice: { revision: existing.revision } }
      );
    }

    const payload = sanitizeInvoicePayload(req.body, order, order.user);

    if (await isInvoiceNumberTaken(payload.invoiceNumber, order._id)) {
      return conflictResponse(
        res,
        `Invoice number ${payload.invoiceNumber} is already in use.`,
        'INVOICE_NUMBER_CONFLICT',
        { field: 'invoiceNumber' }
      );
    }

    let invoice = existing ? await Invoice.findOne({ order: order._id }) : null;
    const before = invoice ? invoice.toObject() : null;
    const isNew = !invoice;

    if (!invoice) {
      invoice = new Invoice({ order: order._id });
    }

    invoice.set(payload);
    invoice.revision = isNew ? 1 : invoice.revision + 1;
    invoice.editedBy = req.user._id || req.user.id;
    invoice.lastEditedAt = new Date();
    await invoice.save();

    logActivityAsync({
      user: req.user,
      action: ACTIONS.INVOICE.UPDATED,
      targetModel: 'Invoice',
      targetId: invoice._id,
      targetName: invoice.invoiceNumber,
      changes: { before, after: payload },
      req,
      metadata: { orderId: String(order._id), revision: invoice.revision },
    });

    const { order: invoiceView, meta } = composeInvoice(order, order.user, invoice.toObject());

    return res.json({
      success: true,
      message: `Invoice saved (revision ${invoice.revision})`,
      order: invoiceView,
      invoice: meta,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return conflictResponse(
        res,
        'That invoice number is already in use.',
        'INVOICE_NUMBER_CONFLICT',
        { field: 'invoiceNumber' }
      );
    }
    logger.error('Error updating invoice:', error);
    return errorResponse(res, 'Failed to save invoice', 500);
  }
};

/**
 * Discard admin edits and fall back to the order data.
 * @route DELETE /api/invoices/order/:orderId
 */
exports.resetAdminInvoice = async (req, res) => {
  try {
    const context = await loadInvoiceContext(req.params.orderId);
    if (!context) {
      return errorResponse(res, 'Order not found', 404);
    }

    const { order } = context;
    const removed = await Invoice.findOneAndDelete({ order: order._id });

    if (removed) {
      logActivityAsync({
        user: req.user,
        action: ACTIONS.INVOICE.RESET,
        targetModel: 'Invoice',
        targetId: removed._id,
        targetName: removed.invoiceNumber,
        changes: { before: removed.toObject(), after: null },
        req,
        metadata: { orderId: String(order._id) },
      });
    }

    const { order: invoiceView, meta } = composeInvoice(order, order.user, null);

    return res.json({
      success: true,
      message: removed ? 'Invoice reset to the order data.' : 'Invoice already uses the order data.',
      order: invoiceView,
      invoice: meta,
    });
  } catch (error) {
    logger.error('Error resetting invoice:', error);
    return errorResponse(res, 'Failed to reset invoice', 500);
  }
};
