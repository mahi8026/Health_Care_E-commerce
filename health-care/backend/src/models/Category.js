const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a category name'],
    unique: true,
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
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  image: {
    url: String,
    publicId: String,
    alt: String
  },
  banner: {
    url: String,
    publicId: String,
    alt: String
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0
  },
  // B2B Discount Settings
  b2bDiscountEnabled: {
    type: Boolean,
    default: true
  },
  b2bDiscountPct: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate slug from name before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Validate max 2 levels of nesting
categorySchema.pre('save', async function(next) {
  if (this.parentCategory) {
    const parent = await this.constructor.findById(this.parentCategory);
    if (parent && parent.parentCategory) {
      return next(new Error('Maximum category nesting depth is 2 levels (Category → Subcategory)'));
    }
  }
  next();
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Virtual for product count (replaced with actual field for performance)
// categorySchema.virtual('productCount', {
//   ref: 'Product',
//   localField: '_id',
//   foreignField: 'category',
//   count: true
// });

// Indexes for performance
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ isActive: 1, displayOrder: 1 });
categorySchema.index({ parentCategory: 1 });

// Static method to get category tree (nested structure)
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  
  // Build tree structure (max 2 levels)
  const categoryMap = {};
  const tree = [];
  
  // First pass: create map
  categories.forEach(cat => {
    categoryMap[cat._id.toString()] = { ...cat, children: [] };
  });
  
  // Second pass: build tree
  categories.forEach(cat => {
    if (cat.parentCategory) {
      const parent = categoryMap[cat.parentCategory.toString()];
      if (parent) {
        parent.children.push(categoryMap[cat._id.toString()]);
      }
    } else {
      tree.push(categoryMap[cat._id.toString()]);
    }
  });
  
  return tree;
};

// Static method to get all subcategories of a category
categorySchema.statics.getSubcategories = async function(categoryId) {
  return await this.find({ parentCategory: categoryId, isActive: true }).lean();
};

module.exports = mongoose.model('Category', categorySchema);
