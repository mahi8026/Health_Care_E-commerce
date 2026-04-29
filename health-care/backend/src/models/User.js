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
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number']
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
  b2bAccount: { type: Boolean, default: false },
  b2bTier: {
    type: String,
    enum: ['Silver', 'Gold', 'Platinum'],
    default: 'Silver'
  },
  b2bId: { type: String },
  accountManager: { type: String },
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
  refreshToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  phoneVerifiedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
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
userSchema.index({ b2bId: 1 }, { sparse: true });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
