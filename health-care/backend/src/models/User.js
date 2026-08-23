const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  street: String,
  thana: String,
  district: String,
  postcode: String,
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password not required for OAuth users
      return !this.googleId;
    },
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(v) {
        // Skip validation for OAuth users
        if (this.googleId) {
return true;
}
        // Require uppercase, lowercase, number, and special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    },
    select: false
  },
  phone: {
    type: String,
    required: function() {
      // Phone not required for OAuth users initially
      return !this.googleId;
    }
  },
  bkashPhone: { type: String },
  // OAuth fields
  googleId: {
    type: String
  },
  avatar: {
    type: String
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['customer', 'b2b_customer', 'admin'],
    default: 'customer'
  },
  accountType: {
    type: String,
    enum: ['Retail', 'B2B'],
    default: 'Retail'
  },
  // B2B specific fields
  companyName: { type: String },
  company: { type: String }, // alias kept for backward compat
  institutionType: { type: String },
  tradeLicense: { type: String }, // Trade license number
  taxId: { type: String }, // Tax identification number
  b2bAccount: { type: Boolean, default: false },
  b2bApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  b2bApprovedAt: { type: Date },
  b2bApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  b2bRejectedAt: { type: Date },
  b2bRejectionReason: { type: String },
  b2bTier: {
    type: String,
    enum: ['Silver', 'Gold', 'Platinum'],
    default: 'Silver'
  },
  b2bId: { type: String },
  accountManager: { type: String },
  // B2B discount — must be explicitly enabled by admin per user
  b2bDiscountEnabled: { type: Boolean, default: false },
  b2bDiscountPct: { type: Number, default: 0, min: 0, max: 100 },
  paymentTerms: {
    type: Number,
    enum: [30, 60, 90],
    default: 30
  },
  loyaltyPoints: { type: Number, default: 0 },
  addresses: [addressSchema],
  // Legacy single address kept for backward compat
  address: {
    street: String,
    city: String,
    area: String,
    postalCode: String
  },
  creditLimit: { type: Number, default: 0 },
  creditUsed: { type: Number, default: 0 },
  // ✅ Security Fix: Add credit transaction history for audit trail
  creditTransactions: [{
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: String,
    amount: Number,
    type: { type: String, enum: ['debit', 'credit', 'adjustment'] },
    timestamp: { type: Date, default: Date.now },
    note: String,
    previousBalance: Number,
    newBalance: Number
  }],
  refreshToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  phoneVerifiedAt: { type: Date },
  // Marketing segment (computed by n8n RFM workflow — see automation/docs)
  marketingSegment: {
    type: String,
    enum: ['vip', 'at_risk', 'dormant', 'new', 'active', null],
    default: null
  },
  segmentedAt: { type: Date },
  // Notification preferences
  notificationPreferences: {
    orderUpdates: { type: Boolean, default: true },
    deliveryAlerts: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    stockAlerts: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
    smsOrderUpdates: { type: Boolean, default: true },
    smsDeliveryAlerts: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get available credit
userSchema.methods.getAvailableCredit = function() {
  return this.creditLimit - this.creditUsed;
};

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ b2bId: 1 }, { unique: true, sparse: true }); // D6 — was non-unique; concurrent approvals could mint duplicate IDs
userSchema.index({ role: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
// Compound indexes for common query patterns
userSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);
