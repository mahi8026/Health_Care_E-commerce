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
manufacturerSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const base = slugify(this.name, { lower: true, strict: true });
    let slug = base;
    let count = 1;
    // Ensure slug is unique (append -2, -3, etc. if needed)
    while (true) {
      const existing = await mongoose.model('Manufacturer').findOne({
        slug,
        _id: { $ne: this._id }
      }).lean();
      if (!existing) break;
      slug = `${base}-${++count}`;
    }
    this.slug = slug;
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
// NOTE: Unique constraint is enforced at application level (pre-save hook + controller)
// until existing duplicate data is cleaned up via POST /api/manufacturers/deduplicate
manufacturerSchema.index({ slug: 1 }, { sparse: true });
manufacturerSchema.index({ isActive: 1 });
manufacturerSchema.index({ name: 1 });

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
