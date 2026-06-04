const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  freeDeliveryThreshold: {
    type: Number,
    default: 50000,
    required: true,
  },
  returnPolicyDays: {
    type: Number,
    default: 30,
    required: true,
  },
  b2bMaxDiscount: {
    type: Number,
    default: 22,
    required: true,
    min: 0,
    max: 100,
  },
  b2bCreditDays: {
    type: Number,
    default: 90,
    required: true,
  },
  certifications: {
    type: [String],
    default: ['DGDA Registered', 'ISO 13485 Certified'],
  },
  supportHours: {
    type: String,
    default: '24/7',
  },
  contactPhone: {
    type: String,
    default: '+880 1646-886795',
  },
  contactEmail: {
    type: String,
    default: 'mahimrahman07@gmail.com',
  },
  companyName: {
    type: String,
    default: 'MedCore BD',
  },
  tagline: {
    type: String,
    default: "Bangladesh's Most Trusted Medical Equipment Supplier",
  },
  heroSlides: {
    type: [{
      imageUrl: { type: String, default: '' },
      altText: { type: String, default: 'Banner' },
      linkUrl: { type: String, default: '/products' },
      order: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
    }],
    default: [],
  },
  promoBanner: {
    imageUrl: { type: String, default: '' },
    altText: { type: String, default: 'Promo Banner' },
    linkUrl: { type: String, default: '/products' },
    isActive: { type: Boolean, default: true },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Update the updatedAt field on save
settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
