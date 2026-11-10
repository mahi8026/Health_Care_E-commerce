const mongoose = require('mongoose');

/**
 * Admin-editable invoice snapshot.
 *
 * An invoice is generated from an Order by default. When an admin edits it, the
 * editable document is stored here (one document per order) and every renderer
 * (PDF + printable page) reads the merged result. Totals are never stored as
 * trusted input — they are recomputed from items + charges on read.
 */

const invoiceItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    sku: { type: String, trim: true, maxlength: 80 },
    brand: { type: String, trim: true, maxlength: 120 },
    qty: { type: Number, required: true, min: 1, max: 1000 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    warranty: { type: String, trim: true, maxlength: 80 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    invoiceNumber: { type: String, required: true, trim: true, maxlength: 40 },

    issueDate: { type: Date, required: true },
    dueDate: { type: Date, default: null },

    customer: {
      name: { type: String, trim: true, maxlength: 120 },
      companyName: { type: String, trim: true, maxlength: 160 },
      email: { type: String, trim: true, lowercase: true, maxlength: 160 },
      phone: { type: String, trim: true, maxlength: 40 },
    },

    deliveryAddress: {
      name: { type: String, trim: true, maxlength: 120 },
      phone: { type: String, trim: true, maxlength: 40 },
      street: { type: String, trim: true, maxlength: 240 },
      thana: { type: String, trim: true, maxlength: 120 },
      district: { type: String, trim: true, maxlength: 120 },
      postcode: { type: String, trim: true, maxlength: 20 },
    },

    items: { type: [invoiceItemSchema], default: undefined },

    charges: {
      b2bDiscount: { type: Number, default: 0, min: 0 },
      couponDiscount: { type: Number, default: 0, min: 0 },
      vatAmount: { type: Number, default: 0, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
    },

    payment: {
      method: { type: String, trim: true, maxlength: 40 },
      status: { type: String, trim: true, maxlength: 40 },
      reference: { type: String, trim: true, maxlength: 120 },
      instructions: { type: String, trim: true, maxlength: 600 },
    },

    warranty: {
      months: { type: Number, min: 0, max: 120 },
      note: { type: String, trim: true, maxlength: 500 },
    },

    notes: { type: String, trim: true, maxlength: 2000 },
    terms: { type: [String], default: undefined },

    // Audit trail — optimistic locking uses revision.
    revision: { type: Number, default: 1, min: 1 },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastEditedAt: { type: Date },
  },
  { timestamps: true }
);

// Invoice numbers must be unique across admin-edited invoices.
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
