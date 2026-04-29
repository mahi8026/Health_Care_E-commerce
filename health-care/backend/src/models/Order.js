const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  sku: String,
  brand: String,
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  qty: { type: Number, required: true, min: 1 },
  // legacy field alias
  quantity: { type: Number },
  variant: {
    connectivity: String,
    warranty: String
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
  },
  // legacy alias
  orderId: { type: String },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  b2bDiscount: { type: Number, default: 0 },
  b2bDiscountPct: { type: Number, default: 0 },
  // legacy alias
  discount: { type: Number, default: 0 },
  promoDiscount: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  appliedCoupon: {
    code: String,
    type: String,
    discountAmount: Number
  },
  deliveryFee: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
  totalAmount: { type: Number },
  // legacy alias
  total: { type: Number },
  deliveryAddress: {
    name: String,
    phone: String,
    email: String,
    street: String,
    thana: String,
    district: String,
    postcode: String,
    // legacy aliases
    city: String,
    area: String,
    postalCode: String,
    instructions: String
  },
  deliveryType: {
    type: String,
    enum: ['standard', 'express', 'nationwide', 'cold_chain'],
    default: 'standard'
  },
  // legacy alias
  deliveryMethod: { type: String },
  paymentMethod: {
    type: String,
    enum: ['beftn', 'bkash', 'nagad', 'npsb', 'cheque', 'b2b_credit', 'stripe', 'bank_transfer', 'credit_terms', 'card', 'cash'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  transactionId: { type: String },
  paymentDetails: { type: mongoose.Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled',
           // legacy aliases
           'pending'],
    default: 'placed'
  },
  statusTimestamps: {
    placed: Date,
    confirmed: Date,
    processing: Date,
    shipped: Date,
    out_for_delivery: Date,
    delivered: Date
  },
  tracking: {
    courier: String,
    trackingNumber: String,
    dispatchedAt: Date
  },
  // legacy alias
  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },
  receivedBy: { type: String },
  notes: { type: String },
  notesHistory: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  poNumber: { type: String },
  invoiceNumber: { type: String },
  accountManager: { type: String },
  coldChain: { type: Boolean, default: false },
  hasAMC: { type: Boolean, default: false },
  promoCode: { type: String }
}, {
  timestamps: true
});

// Auto-generate orderNumber before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(5, '0')}`;
    this.orderId = this.orderNumber; // keep legacy alias in sync
  }
  // Sync legacy aliases
  if (!this.total && this.totalAmount) this.total = this.totalAmount;
  if (!this.totalAmount && this.total) this.totalAmount = this.total;
  if (!this.statusTimestamps) this.statusTimestamps = {};
  if (this.isNew) this.statusTimestamps.placed = new Date();
  next();
});

// Update statusTimestamps when status changes
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (!this.statusTimestamps) this.statusTimestamps = {};
    const now = new Date();
    const statusMap = {
      confirmed: 'confirmed',
      processing: 'processing',
      shipped: 'shipped',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered'
    };
    if (statusMap[this.status]) {
      this.statusTimestamps[statusMap[this.status]] = now;
    }
    if (this.status === 'delivered') {
      this.deliveredAt = now;
    }
  }
  next();
});

// ── Indexes ──────────────────────────────────────────────────────────────────
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
