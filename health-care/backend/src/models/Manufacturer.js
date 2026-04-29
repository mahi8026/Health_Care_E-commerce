const mongoose = require('mongoose');
const slugify = require('slugify');

const manufacturerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a manufacturer name'],
    trim: true
  },
  slug: {
    type: String,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    url: String,
    publicId: String,
    alt: String
  },
  country: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate slug from name before saving
manufacturerSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Virtual for product count
manufacturerSchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'brand',
  count: true
});

// Indexes for performance
manufacturerSchema.index({ slug: 1 });
manufacturerSchema.index({ isActive: 1 });
manufacturerSchema.index({ name: 1 });

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
