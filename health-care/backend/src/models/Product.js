const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, uppercase: true },
  name: { type: String, required: [true, 'Please provide a product name'], trim: true },
  slug: { type: String },
  description: { type: String, required: [true, 'Please provide a description'] },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    required: [true, 'Please provide a brand']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please provide a category']
  },
  subcategory: { type: String },
  barcode: { type: String },
  price: { type: Number, required: [true, 'Please provide a price'], min: 0 },
  b2bPrice: { type: Number, min: 0 },
  discountPct: { type: Number, default: 0 },
  oldPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  minStock: { type: Number, default: 10 }, // legacy alias
  unit: { type: String, enum: ['piece', 'box', 'kit', 'pack', 'set'], default: 'piece' },
  minOrderQty: { type: Number, default: 1 },
  minOrder: { type: Number, default: 1 }, // legacy alias
  images: [
    {
      url:       { type: String, required: true },
      publicId:  { type: String, default: '' },
      isPrimary: { type: Boolean, default: false },
      alt:       { type: String, default: '' },
    }
  ],
  variants: {
    connectivity: [String],
    warranty: [String]
  },
  specifications: { type: Map, of: String },
  certifications: [{ type: String }], // Removed enum to allow any certification string
  storageTemp: { type: String, enum: ['room', 'cold', 'frozen', null] },
  temperature: { type: String, enum: ['cold', 'freeze', 'room', null] }, // legacy alias
  hazardClass: { type: String, enum: ['safe', 'biohazard', 'chemical', null] },
  hazard: { type: String, enum: ['bio', 'chem', 'safe', null] }, // legacy alias
  compatibleWith: [{ type: String }],
  documents: [{ type: { type: String }, url: String, filename: String }],
  tags: [{ type: String }],
  lotNumber: String,
  expiryDate: Date,
  expiry: Date, // legacy alias
  tests: String,
  hasAMC: { type: Boolean, default: false },
  badge: { type: String, enum: ['sale', 'new', 'bestseller', 'ce_certified', null] },
  rating: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, default: 0 },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  reviewsCount: { type: Number, default: 0 },
  // Legacy fields for backward compatibility
  reviewCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────────────────────
productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ name: 'text', description: 'text', tags: 'text' }, {
  weights: { name: 10, tags: 3, description: 1 },
  name: 'product_text_search'
});
// Compound indexes for common query patterns
productSchema.index({ category: 1, isActive: 1, price: 1 });  // category + price filter
productSchema.index({ brand: 1, isActive: 1 });                // brand filter
productSchema.index({ isFeatured: 1, isActive: 1 });           // featured products
productSchema.index({ stock: 1, isActive: 1 });                // stock filter
productSchema.index({ createdAt: -1, isActive: 1 });           // newest products
productSchema.index({ price: 1, isActive: 1 });                // price range filter
productSchema.index({ category: 1, brand: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1, isFeatured: 1 });
productSchema.index({ isActive: 1, price: 1 });

// ── Helper: Generate slug from name, brand, and SKU ──────────────────────────
const generateSlug = (name, brand, sku) => {
  const base = `${name}-${brand || ''}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')      // remove special chars
    .replace(/\s+/g, '-')          // spaces to hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '')         // trim hyphens
    .trim();
  // Append last 6 chars of SKU for uniqueness
  const suffix = sku ? `-${sku.slice(-6).toLowerCase()}` : '';
  return base + suffix;
};

// ── Pre-save hook: auto-generate slug + sync legacy aliases ──────────────────
productSchema.pre('save', async function (next) {
  // Generate slug if not set OR if name changed
  if (!this.slug || this.isModified('name')) {
    // Get brand name if it's an ObjectId reference
    let brandName = '';
    if (this.brand) {
      if (typeof this.brand === 'object' && this.brand.name) {
        brandName = this.brand.name;
      } else {
        // Populate brand to get name
        const populated = await this.populate('brand');
        brandName = populated.brand?.name || '';
      }
    }
    
    let slug = generateSlug(this.name, brandName, this.sku || '');
    
    // Ensure uniqueness — check if slug exists
    let exists = await mongoose.model('Product').findOne({
      slug,
      _id: { $ne: this._id }
    });
    let counter = 1;
    while (exists) {
      slug = `${generateSlug(this.name, brandName, this.sku || '')}-${counter}`;
      exists = await mongoose.model('Product').findOne({
        slug,
        _id: { $ne: this._id }
      });
      counter++;
    }
    this.slug = slug;
  }
  
  // Sync legacy aliases
  if (!this.lowStockThreshold && this.minStock) this.lowStockThreshold = this.minStock;
  if (!this.minStock && this.lowStockThreshold) this.minStock = this.lowStockThreshold;
  if (!this.minOrderQty && this.minOrder) this.minOrderQty = this.minOrder;
  if (!this.minOrder && this.minOrderQty) this.minOrder = this.minOrderQty;
  if (!this.storageTemp && this.temperature) {
    const map = { cold: 'cold', freeze: 'frozen', room: 'room' };
    this.storageTemp = map[this.temperature] || this.temperature;
  }
  if (!this.hazardClass && this.hazard) {
    const map = { bio: 'biohazard', chem: 'chemical', safe: 'safe' };
    this.hazardClass = map[this.hazard] || this.hazard;
  }
  if (!this.expiryDate && this.expiry) this.expiryDate = this.expiry;
  next();
});

// ── Virtual: stock status ────────────────────────────────────────────────────
productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'out';
  if (this.stock <= (this.lowStockThreshold || this.minStock || 10)) return 'low';
  return 'active';
});

module.exports = mongoose.model('Product', productSchema);
