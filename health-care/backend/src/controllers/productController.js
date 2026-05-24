const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const mongoose = require('mongoose');
const CacheService = require('../services/cacheService');
const { invalidateProductCache, invalidateProductListCache } = require('../services/cacheInvalidation');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const { PAGINATION } = require('../config/constants');

const cacheService = new CacheService();

// Helper: escape special regex characters
function escapeRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      inStock,
      lowStock,
      outOfStock,
      isFeatured,
      isActive,
      sortBy,
      page = 1,
      limit = 20
    } = req.query;

    // Debug logging
    logger.info('[getProducts] Query params:', req.query);
    logger.info('[getProducts] User:', req.user ? { id: req.user._id, role: req.user.role } : 'No user');

    const pageNum = Math.max(1, parseInt(page) || PAGINATION.DEFAULT_PAGE);
    const limitNum = Math.min(PAGINATION.MAX_LIMIT, parseInt(limit) || PAGINATION.DEFAULT_LIMIT);

    // For admin, allow filtering by isActive status
    // For public, default to only active products
    let query = {};
    if (isActive === 'true') {
      query.isActive = true;
    } else if (isActive === 'false') {
      query.isActive = false;
    } else if (!req.user || req.user.role !== 'admin') {
      // Public users only see active products
      query.isActive = true;
    }

    logger.info('[getProducts] Initial query:', query);

    // ── Featured filter ──────────────────────────────────────────────────────
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }

    // ── Category filter ──────────────────────────────────────────────────────
    // category field on Product is an ObjectId ref — must resolve name → _id
    if (category && category !== 'undefined' && category.trim() !== '') {
      if (mongoose.isValidObjectId(category)) {
        query.category = new mongoose.Types.ObjectId(category);
      } else {
        // Decode URL-encoded category name and normalize spaces
        const categoryName = decodeURIComponent(category.trim()).replace(/\+/g, ' ');
        const categoryDoc = await Category.findOne({
          name: { $regex: new RegExp('^' + escapeRegex(categoryName) + '$', 'i') }
        }).lean();
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          // No matching category — return empty result gracefully
          return res.status(200).json({
            success: true, count: 0, total: 0,
            page: pageNum, pages: 0, products: []
          });
        }
      }
    }

    // ── Brand filter ─────────────────────────────────────────────────────────
    // brand field on Product is an ObjectId ref — must resolve name → _id
    if (brand && brand !== 'undefined' && brand.trim() !== '') {
      if (mongoose.isValidObjectId(brand)) {
        query.brand = new mongoose.Types.ObjectId(brand);
      } else {
        // Decode URL-encoded brand name and normalize spaces
        const brandName = decodeURIComponent(brand.trim()).replace(/\+/g, ' ');
        const brandDoc = await Manufacturer.findOne({
          name: { $regex: new RegExp('^' + escapeRegex(brandName) + '$', 'i') }
        }).lean();
        if (brandDoc) {
          query.brand = brandDoc._id;
        }
        // If brand not found, just ignore the filter (don't crash)
      }
    }

    // ── Stock filters ────────────────────────────────────────────────────────
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    } else if (lowStock === 'true') {
      // Low stock: stock > 0 AND stock <= lowStockThreshold
      query.$expr = {
        $and: [
          { $gt: ['$stock', 0] },
          { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }] }
        ]
      };
    } else if (outOfStock === 'true') {
      query.stock = 0;
    }

    // ── Price range filter ───────────────────────────────────────────────────
    if ((minPrice && minPrice !== 'undefined') || (maxPrice && maxPrice !== 'undefined')) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && min >= 0) {
        query.price = query.price || {};
        query.price.$gte = min;
      }
      if (!isNaN(max) && max >= 0) {
        query.price = query.price || {};
        query.price.$lte = max;
      }
    }

    // ── Search filter ────────────────────────────────────────────────────────
    if (search && search.trim() && search !== 'undefined') {
      const searchTerm = search.trim();
      const escaped = escapeRegex(searchTerm);
      const searchRegex = new RegExp(escaped, 'i');
      
      // Priority order: exact SKU match → name match → brand match → description match
      query.$or = [
        { sku: searchTerm.toUpperCase() },                    // exact SKU (highest priority)
        { name: { $regex: searchRegex } },                    // name contains search
        { tags: { $in: [searchRegex] } },                     // tags match
        { description: { $regex: searchRegex } },             // description (lower priority)
      ];
    }

    // ── Sort ─────────────────────────────────────────────────────────────────
    let sort = {};
    if (sortBy === 'price-low' || sortBy === 'price_asc') sort.price = 1;
    else if (sortBy === 'price-high' || sortBy === 'price_desc') sort.price = -1;
    else if (sortBy === 'name' || sortBy === 'name_asc') sort.name = 1;
    else if (sortBy === 'name_desc') sort.name = -1;
    else if (sortBy === 'newest') sort.createdAt = -1;
    else if (sortBy === 'rating') sort['rating.average'] = -1;
    else sort.createdAt = -1;

    logger.info('[getProducts] Final query:', JSON.stringify(query, null, 2));
    logger.info('[getProducts] Sort:', sort);

    const [products, total] = await Promise.all([
      Product.find(query)
        .select('name description price images brand category stock discount badge slug isActive createdAt rating oldPrice sku b2bPrice unit minOrderQty certifications specifications storageTemp hazardClass compatibleWith tags lotNumber expiryDate hasAMC isFeatured lowStockThreshold subcategory discountPct')
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .sort(sort)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    logger.info('[getProducts] Found', products.length, 'products out of', total, 'total');

    // Log first product to verify description is included
    if (products.length > 0) {
      logger.info(`[getProducts] First product has description: ${!!products[0].description}, keys: ${Object.keys(products[0]).join(', ')}`);
    }

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      products
    });
  } catch (error) {
    logger.error(`[getProducts] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    
    // Check if it's a MongoDB ObjectId
    const isObjectId = mongoose.isValidObjectId(idOrSlug) && /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    
    const product = await Product.findOne({
      $or: [
        ...(isObjectId ? [{ _id: idOrSlug }] : []),
        { slug: idOrSlug }
      ]
    })
    .populate('category', 'name slug description')
    .populate('brand', 'name slug logo country website')
    .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // If accessed by _id, return slug for frontend to redirect (SEO)
    if (isObjectId && product.slug) {
      return res.json({
        success: true,
        data: product,
        product,
        shouldRedirect: true,
        slugUrl: product.slug
      });
    }

    res.status(200).json({ success: true, data: product, product });
  } catch (error) {
    logger.error(`[getProduct] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ── SKU category code map ─────────────────────────────────────────────────────
const CATEGORY_CODES = {
  'diagnostic':        'DX',
  'diagnostics':       'DX',
  'diagnostic equipment': 'DX',
  'surgical':          'SG',
  'surgical instruments': 'SG',
  'laboratory':        'LB',
  'lab equipment':     'LB',
  'lab':               'LB',
  'reagent':           'RG',
  'reagents':          'RG',
  'laboratory reagents': 'RG',
  'hospital':          'HM',
  'hospital machines': 'HM',
  'ppe':               'PP',
  'ppe & safety':      'PP',
  'safety':            'PP',
  'dental':            'DN',
  'dental equipment':  'DN',
  'implants':          'IM',
  'implants & ortho':  'IM',
  'ortho':             'IM',
  'orthopedic':        'IM',
};

/**
 * Derive a 2-letter category code from a category name.
 * Falls back to the first 2 uppercase letters of the name.
 */
function getCategoryCode(categoryName = '') {
  const lower = categoryName.toLowerCase().trim();
  if (CATEGORY_CODES[lower]) return CATEGORY_CODES[lower];
  // Try partial match
  for (const [key, code] of Object.entries(CATEGORY_CODES)) {
    if (lower.includes(key) || key.includes(lower)) return code;
  }
  // Fallback: first 2 letters
  return categoryName.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase() || 'XX';
}

/**
 * Derive a 3-letter brand code from a manufacturer name.
 * Uses first 3 consonants/letters, skipping common words.
 */
function getBrandCode(brandName = '') {
  const clean = brandName.replace(/[^A-Za-z\s]/g, '').trim();
  // Remove common filler words
  const words = clean.split(/\s+/).filter(w => !['the','and','of','co','ltd','inc','corp','group'].includes(w.toLowerCase()));
  const joined = words.join('');
  return joined.substring(0, 3).toUpperCase() || 'GEN';
}

// @desc    Generate next available SKU for a category + brand combination
// @route   GET /api/products/generate-sku
// @access  Private/Admin
exports.generateSku = async (req, res) => {
  try {
    const { categoryId, brandId } = req.query;

    if (!categoryId || !brandId) {
      return res.status(400).json({ success: false, message: 'categoryId and brandId are required' });
    }

    // Fetch category and brand names
    const [category, brand] = await Promise.all([
      Category.findById(categoryId).select('name').lean(),
      Manufacturer.findById(brandId).select('name').lean(),
    ]);

    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    if (!brand)    return res.status(404).json({ success: false, message: 'Brand not found' });

    const catCode   = getCategoryCode(category.name);
    const brandCode = getBrandCode(brand.name);
    const prefix    = `MC-${catCode}-${brandCode}-`;

    // Find the highest existing sequence number for this prefix
    const existing = await Product.find(
      { sku: { $regex: `^${prefix}\\d+$` } },
      { sku: 1 }
    ).lean();

    let maxSeq = 0;
    for (const p of existing) {
      const seq = parseInt(p.sku.replace(prefix, ''), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }

    const nextSeq = maxSeq + 1;
    const sku = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    res.status(200).json({ success: true, sku, prefix, sequence: nextSeq });
  } catch (error) {
    logger.error(`[generateSku] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    if (req.body.price !== undefined) {
      const price = Number(req.body.price);
      if (isNaN(price)) return res.status(400).json({ success: false, message: 'Invalid price value' });
      req.body.price = price;
    }
    if (req.body.oldPrice !== undefined) {
      const oldPrice = Number(req.body.oldPrice);
      if (isNaN(oldPrice)) return res.status(400).json({ success: false, message: 'Invalid oldPrice value' });
      req.body.oldPrice = oldPrice;
    }
    if (req.body.stock !== undefined) {
      const stock = Number(req.body.stock);
      if (isNaN(stock)) return res.status(400).json({ success: false, message: 'Invalid stock value' });
      req.body.stock = stock;
    }

    const product = await Product.create(req.body);
    invalidateProductListCache();
    
    // Also clear Redis cache
    const { invalidateCache } = require('../middleware/cache');
    await invalidateCache('products:*');

    logActivityAsync({
      user: req.user,
      action: ACTIONS.PRODUCT.CREATED,
      targetModel: 'Product',
      targetId: product._id,
      targetName: product.name,
      req,
      metadata: { sku: product.sku, price: product.price, category: product.category }
    });

    logger.info(`[createProduct] Product ${product._id} created, cache cleared`);

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    logger.error(`[createProduct] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    if (req.body.price !== undefined) {
      const price = Number(req.body.price);
      if (isNaN(price)) return res.status(400).json({ success: false, message: 'Invalid price value' });
      req.body.price = price;
    }
    if (req.body.oldPrice !== undefined) {
      const oldPrice = Number(req.body.oldPrice);
      if (isNaN(oldPrice)) return res.status(400).json({ success: false, message: 'Invalid oldPrice value' });
      req.body.oldPrice = oldPrice;
    }
    if (req.body.stock !== undefined) {
      const stock = Number(req.body.stock);
      if (isNaN(stock)) return res.status(400).json({ success: false, message: 'Invalid stock value' });
      req.body.stock = stock;
    }

    const oldProduct = await Product.findById(req.params.id).lean();
    if (!oldProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    // Invalidate both memory cache and Redis cache
    invalidateProductCache(req.params.id);
    invalidateProductListCache();
    
    // Also clear Redis cache directly
    const { invalidateCache } = require('../middleware/cache');
    await invalidateCache('products:*');

    const changes = {};
    const fieldsToTrack = ['name', 'price', 'stock', 'isActive', 'category', 'images'];
    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined && String(oldProduct[field]) !== String(req.body[field])) {
        if (!changes.before) changes.before = {};
        if (!changes.after) changes.after = {};
        changes.before[field] = oldProduct[field];
        changes.after[field] = req.body[field];
      }
    });

    logActivityAsync({
      user: req.user,
      action: ACTIONS.PRODUCT.UPDATED,
      targetModel: 'Product',
      targetId: product._id,
      targetName: product.name,
      req,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      metadata: { sku: product.sku }
    });

    logger.info(`[updateProduct] Product ${product._id} updated, cache cleared`);

    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    logger.error(`[updateProduct] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    invalidateProductCache(req.params.id);
    invalidateProductListCache();
    
    // Also clear Redis cache
    const { invalidateCache } = require('../middleware/cache');
    await invalidateCache('products:*');

    logActivityAsync({
      user: req.user,
      action: ACTIONS.PRODUCT.DELETED,
      targetModel: 'Product',
      targetId: product._id,
      targetName: product.name,
      req,
      metadata: { sku: product.sku, price: product.price }
    });

    logger.info(`[deleteProduct] Product ${product._id} deleted, cache cleared`);

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    logger.error(`[deleteProduct] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .select('name price images brand category stock discount badge slug isActive createdAt rating oldPrice sku')
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .limit(6)
      .sort({ createdAt: -1 })
      .lean();

    res.set('Cache-Control', 'public, max-age=300');
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    logger.error(`[getFeaturedProducts] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get product counts by category
// @route   GET /api/products/category-counts
// @access  Public
exports.getCategoryCounts = async (req, res) => {
  try {
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const result = counts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.set('Cache-Control', 'public, max-age=600');
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error(`[getCategoryCounts] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
