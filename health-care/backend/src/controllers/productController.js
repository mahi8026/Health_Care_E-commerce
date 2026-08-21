const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const mongoose = require('mongoose');
const { invalidateProductCache, invalidateProductListCache } = require('../services/cacheInvalidation');
const redisCache = require('../services/redisCache');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const { PAGINATION } = require('../config/constants');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const { getActiveDealEntries } = require('../services/flashDealPricing');

// Helper: escape special regex characters
function escapeRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// ── B4: composite keyset cursor pagination ────────────────────────────────────
// The cursor must encode BOTH the primary sort key value and the _id, because
// the pipeline sorts by `{ [sortKey]: dir, _id: 1 }`. Filtering by _id alone
// (the old code) skips/duplicates pages on any non-_id sort.

const SORT_CONFIGS = {
  'price-low': { key: 'price', dir: 1 },
  price_asc: { key: 'price', dir: 1 },
  'price-high': { key: 'price', dir: -1 },
  price_desc: { key: 'price', dir: -1 },
  name: { key: 'name', dir: 1 },
  name_asc: { key: 'name', dir: 1 },
  name_desc: { key: 'name', dir: -1 },
  newest: { key: 'createdAt', dir: -1 },
  rating: { key: 'rating.average', dir: -1 },
  popular: { key: 'soldCount', dir: -1 },
  topSelling: { key: 'soldCount', dir: -1 },
};
const DEFAULT_SORT = { key: 'createdAt', dir: -1 };

function encodeCursor(doc, sortKey) {
  const v = doc[sortKey] ?? null;
  const payload = JSON.stringify({ id: doc._id.toString(), v });
  return Buffer.from(payload).toString('base64url');
}

function decodeCursor(cursorStr) {
  if (typeof cursorStr !== 'string' || !cursorStr) {
return null;
}
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(cursorStr, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || !mongoose.isValidObjectId(parsed.id)) {
return null;
}
  if (parsed.v !== null && parsed.v !== undefined && typeof parsed.v !== 'string' && typeof parsed.v !== 'number' && typeof parsed.v !== 'boolean') {
return null;
}
  return { id: new mongoose.Types.ObjectId(parsed.id), v: parsed.v ?? null };
}

// Keyset filter for sort `{ [key]: dir, _id: 1 }` past the cursor doc.
// Handles null/missing values (nulls sort first ascending, last descending).
function applyCursorFilter(matchConditions, cursorState, sortKey, dir) {
  const { id, v } = cursorState;
  const byKey = {};
  byKey[sortKey] = v;
  const keyGt = {};
  keyGt[sortKey] = { $gt: v };
  const keyLt = {};
  keyLt[sortKey] = { $lt: v };
  const keyNull = {};
  keyNull[sortKey] = null;
  const keyNonNull = {};
  keyNonNull[sortKey] = { $ne: null };

  if (dir === 1) {
    if (v === null) {
      matchConditions.$or = [
        { ...keyNull, _id: { $gt: id } }, // rest of the null group
        keyNonNull // everything after the null group (ascending: nulls first)
      ];
    } else {
      matchConditions.$or = [
        keyGt,
        { ...byKey, _id: { $gt: id } } // ties broken by _id ascending
      ];
    }
  } else {
    if (v === null) {
      matchConditions.$or = [
        { ...keyNull, _id: { $gt: id } } // rest of the null group (nulls sort last descending)
      ];
    } else {
      matchConditions.$or = [
        keyLt,
        { ...byKey, _id: { $gt: id } },
        keyNull // nulls come after every non-null value in descending order
      ];
    }
  }
}

/**
 * Get paginated list of products with optional filters.
 * Supports filtering by category, brand, price range, stock status, and search.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route GET /api/products
 * @access Public
 */
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
      page = 1,
      limit = 20,
      cursor, // For cursor-based pagination
      fields, // For field filtering
      slug,   // Direct slug lookup for legacy slugs containing '/'
} = req.query;

    const sortBy = req.query.sortBy || req.query.sort;

    // ── Direct slug lookup (for legacy slugs containing forward slashes) ─────
    // When ?slug=some/slug/with/slashes is passed, return the single product.
    if (slug) {
      const product = await Product.findOne({ slug })
        .populate('category', 'name slug description')
        .populate('brand', 'name slug logo country website')
        .lean();
      if (!product) {
return errorResponse(res, 'Product not found', null, 404);
}
      return successResponse(res, product);
    }

    // Debug logging
    logger.info('[getProducts] Query params:', req.query);
    logger.info('[getProducts] User:', req.user ? { id: req.user._id, role: req.user.role } : 'No user');

    const pageNum = Math.max(1, parseInt(page) || PAGINATION.DEFAULT_PAGE);
    const limitNum = Math.min(PAGINATION.MAX_LIMIT, parseInt(limit) || PAGINATION.DEFAULT_LIMIT);

    // Build aggregation pipeline for better performance
    const pipeline = [];

    // ── Match stage: Build query conditions ──────────────────────────────────
    const matchConditions = {};

    // For admin, allow filtering by isActive status
    // For public, default to only active products
    if (isActive === 'true') {
      matchConditions.isActive = true;
    } else if (isActive === 'false') {
      matchConditions.isActive = false;
    } else if (!req.user || req.user.role !== 'admin') {
      // Public users only see active products
      matchConditions.isActive = true;
    }

    // Featured filter
    if (isFeatured === 'true') {
      matchConditions.isFeatured = true;
    }

    // Category filter — accepts: MongoDB ObjectId, category slug, or category name
    if (category && category !== 'undefined' && category.trim() !== '') {
      if (mongoose.isValidObjectId(category)) {
        // Direct ObjectId
        matchConditions.category = new mongoose.Types.ObjectId(category);
      } else {
        // Decode URL-encoded value and normalize spaces
        const categoryValue = decodeURIComponent(category.trim()).replace(/\+/g, ' ');

        // Try slug first (safer — no special chars like &)
        let categoryDoc = await Category.findOne({ slug: categoryValue }).lean();

        // Fallback: match by name (case-insensitive)
        if (!categoryDoc) {
          categoryDoc = await Category.findOne({
            name: { $regex: new RegExp('^' + escapeRegex(categoryValue) + '$', 'i') }
          }).lean();
        }

        if (categoryDoc) {
          matchConditions.category = categoryDoc._id;
        } else {
          // No matching category — return empty result gracefully
          return paginatedResponse(res, [], {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
            cursor: null
          });
        }
      }
    }

    // Brand filter
    if (brand && brand !== 'undefined' && brand.trim() !== '') {
      if (mongoose.isValidObjectId(brand)) {
        matchConditions.brand = new mongoose.Types.ObjectId(brand);
      } else {
        // Decode URL-encoded brand name and normalize spaces
        const brandName = decodeURIComponent(brand.trim()).replace(/\+/g, ' ');
        const brandDoc = await Manufacturer.findOne({
          name: { $regex: new RegExp('^' + escapeRegex(brandName) + '$', 'i') }
        }).lean();
        if (brandDoc) {
          matchConditions.brand = brandDoc._id;
        }
      }
    }

    // Stock filters
    if (inStock === 'true') {
      matchConditions.stock = { $gt: 0 };
    } else if (lowStock === 'true') {
      // Low stock: stock > 0 AND stock <= lowStockThreshold
      matchConditions.$expr = {
        $and: [
          { $gt: ['$stock', 0] },
          { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }] }
        ]
      };
    } else if (outOfStock === 'true') {
      matchConditions.stock = 0;
    }

    // Price range filter
    if ((minPrice && minPrice !== 'undefined') || (maxPrice && maxPrice !== 'undefined')) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && min >= 0) {
        matchConditions.price = matchConditions.price || {};
        matchConditions.price.$gte = min;
      }
      if (!isNaN(max) && max >= 0) {
        matchConditions.price = matchConditions.price || {};
        matchConditions.price.$lte = max;
      }
    }

    // Search filter
    if (search && search.trim() && search !== 'undefined') {
      const searchTerm = search.trim();
      const escaped = escapeRegex(searchTerm);
      const searchRegex = new RegExp(escaped, 'i');
      
      // Priority order: exact SKU match → name match → brand match → description match
      matchConditions.$or = [
        { sku: searchTerm.toUpperCase() },                    // exact SKU (highest priority)
        { name: { $regex: searchRegex } },                    // name contains search
        { tags: { $in: [searchRegex] } },                     // tags match
        { description: { $regex: searchRegex } },             // description (lower priority)
      ];
    }

    // ── Sort config (single source of truth for both the $sort stage and the
    //    keyset cursor filter) ────────────────────────────────────────────────
    const { key: sortKey, dir: sortDir } = SORT_CONFIGS[sortBy] || DEFAULT_SORT;

    // Cursor-based pagination: decode the composite cursor and add its keyset
    // filter (B4 — old code filtered by _id only, which was wrong for every
    // sort except _id ascending)
    let cursorState = null;
    if (cursor) {
      cursorState = decodeCursor(cursor);
      if (!cursorState) {
        return errorResponse(res, 'Invalid cursor', null, 400);
      }
      applyCursorFilter(matchConditions, cursorState, sortKey, sortDir);
    }

    // Add match stage
    pipeline.push({ $match: matchConditions });

    // ── Lookup stages: Replace populate with $lookup ─────────────────────────
    // Lookup category
    pipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true
      }
    });

    // Lookup brand
    pipeline.push({
      $lookup: {
        from: 'manufacturers',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$brand',
        preserveNullAndEmptyArrays: true
      }
    });

    // ── Sort stage ───────────────────────────────────────────────────────────
    const sortStage = { [sortKey]: sortDir, _id: 1 };
    pipeline.push({ $sort: sortStage });

    // ── Project stage: Select only needed fields ─────────────────────────────
    const projectStage = {
      _id: 1,
      name: 1,
      description: 1,
      price: 1,
      images: 1,
      stock: 1,
      discount: 1,
      badge: 1,
      slug: 1,
      isActive: 1,
      createdAt: 1,
      rating: 1,
      oldPrice: 1,
      sku: 1,
      b2bPrice: 1,
      unit: 1,
      minOrderQty: 1,
      certifications: 1,
      specifications: 1,
      storageTemp: 1,
      hazardClass: 1,
      compatibleWith: 1,
      tags: 1,
      lotNumber: 1,
      expiryDate: 1,
      hasAMC: 1,
      isFeatured: 1,
      lowStockThreshold: 1,
      subcategory: 1,
      discountPct: 1,
      soldCount: 1,
      viewCount: 1,
      variants: 1, // Include size variants and other variant types
      // Category fields
      'category._id': 1,
      'category.name': 1,
      'category.slug': 1,
      // Brand fields
      'brand._id': 1,
      'brand.name': 1,
      'brand.slug': 1,
      'brand.logo': 1
    };

    // If fields parameter is provided, filter projection
    if (fields && fields.trim()) {
      const requestedFields = fields.split(',').map(f => f.trim());
      const filteredProject = { _id: 1 }; // Always include _id
      
      requestedFields.forEach(field => {
        if (projectStage[field] !== undefined) {
          filteredProject[field] = 1;
        }
      });
      
      pipeline.push({ $project: filteredProject });
    } else {
      pipeline.push({ $project: projectStage });
    }

    // ── Facet stage: Get both data and count in single query ─────────────────
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: cursor ? 0 : (pageNum - 1) * limitNum }, // Skip for offset pagination
          { $limit: limitNum + 1 } // Get one extra to determine hasNext
        ]
      }
    });

    logger.info('[getProducts] Aggregation pipeline:', JSON.stringify(pipeline, null, 2));

    // Execute aggregation
    const [result] = await Product.aggregate(pipeline);

    const total = result.metadata[0]?.total || 0;
    const products = result.data || [];
    
    // Check if there are more results (for cursor pagination)
    const hasNext = products.length > limitNum;
    if (hasNext) {
      products.pop(); // Remove the extra item
    }

    // Get composite cursor for next page (sort key value + _id, so the keyset
    // filter on the next request is exact regardless of the chosen sort)
    const nextCursor = hasNext && products.length > 0
      ? encodeCursor(products[products.length - 1], sortKey)
      : null;

    logger.info('[getProducts] Found', products.length, 'products out of', total, 'total');

    // Log first product to verify description is included
    if (products.length > 0) {
      logger.info(`[getProducts] First product has description: ${!!products[0].description}, keys: ${Object.keys(products[0]).join(', ')}`);
    }

    // Remove null/undefined fields from response
    const cleanedProducts = products.map(product => {
      const cleaned = {};
      Object.keys(product).forEach(key => {
        if (product[key] != null) {
          cleaned[key] = product[key];
        }
      });
      return cleaned;
    });

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return paginatedResponse(res, cleanedProducts, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasNext: cursor ? hasNext : pageNum < Math.ceil(total / limitNum),
      hasPrev: cursor ? false : pageNum > 1, // Cursor pagination doesn't support hasPrev
      cursor: nextCursor // Include cursor for next page
    });
  } catch (error) {
    logger.error(`[getProducts] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Get single product by ID or slug.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route GET /api/products/:id
 * @access Public
 */
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
      return errorResponse(res, 'Product not found', null, 404);
    }

    // If accessed by _id, return slug for frontend to redirect (SEO)
    if (isObjectId && product.slug) {
      return successResponse(res, product, null, 200);
    }

    // Attach the active flash-deal (if any) so the product page shows the
    // same discounted price that cart/checkout will charge. Uses the same
    // criteria as the public /flash-deals/active endpoint.
    try {
      const dealEntries = await getActiveDealEntries([product._id]);
      const entry = dealEntries.get(String(product._id));
      if (entry && Number(entry.finalPrice) > 0 && Number(entry.finalPrice) < (Number(product.price) || 0)) {
        product.activeFlashDeal = {
          finalPrice: entry.finalPrice,
          discountPercentage: entry.discountPercentage,
          endTime: entry.endTime
        };
      }
    } catch (dealErr) {
      logger.error(`[getProduct] flash-deal enrichment failed (non-fatal): ${dealErr.message}`);
    }

    return successResponse(res, product);
  } catch (error) {
    logger.error(`[getProduct] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
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
  if (CATEGORY_CODES[lower]) {
return CATEGORY_CODES[lower];
}
  // Try partial match
  for (const [key, code] of Object.entries(CATEGORY_CODES)) {
    if (lower.includes(key) || key.includes(lower)) {
return code;
}
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

/**
 * Generate next available SKU for a category + brand combination.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route GET /api/products/generate-sku
 * @access Private/Admin
 */
exports.generateSku = async (req, res) => {
  try {
    const { categoryId, brandId } = req.query;

    if (!categoryId || !brandId) {
      return errorResponse(res, 'categoryId and brandId are required', null, 400);
    }

    // Fetch category and brand names
    const [category, brand] = await Promise.all([
      Category.findById(categoryId).select('name').lean(),
      Manufacturer.findById(brandId).select('name').lean(),
    ]);

    if (!category) {
return errorResponse(res, 'Category not found', null, 404);
}
    if (!brand)    {
return errorResponse(res, 'Brand not found', null, 404);
}

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
      if (!isNaN(seq) && seq > maxSeq) {
maxSeq = seq;
}
    }

    const nextSeq = maxSeq + 1;
    const sku = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    return successResponse(res, { sku, prefix, sequence: nextSeq });
  } catch (error) {
    logger.error(`[generateSku] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Create new product (admin only).
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route POST /api/products
 * @access Private/Admin
 */
exports.createProduct = async (req, res) => {
  try {
    if (req.body.price !== undefined) {
      const price = Number(req.body.price);
      if (isNaN(price)) {
return errorResponse(res, 'Invalid price value', null, 400);
}
      req.body.price = price;
    }
    if (req.body.oldPrice !== undefined) {
      const oldPrice = Number(req.body.oldPrice);
      if (isNaN(oldPrice)) {
return errorResponse(res, 'Invalid oldPrice value', null, 400);
}
      req.body.oldPrice = oldPrice;
    }
    if (req.body.stock !== undefined) {
      const stock = Number(req.body.stock);
      if (isNaN(stock)) {
return errorResponse(res, 'Invalid stock value', null, 400);
}
      req.body.stock = stock;
    }

    const allowedFields = ['name', 'slug', 'description', 'brand', 'category', 'price', 'oldPrice', 'stock', 'lowStockThreshold', 'minOrderQty', 'sku', 'images', 'specifications', 'variants', 'tags', 'badge', 'isActive', 'isFeatured', 'rating', 'reviewCount', 'certifications', 'hasAMC', 'storageTemp', 'hazardClass', 'lotNumber', 'expiryDate', 'tests', 'b2bPrice', 'discountPct', 'soldCount', 'viewCount'];
    const productData = Object.fromEntries(allowedFields.filter(f => req.body[f] !== undefined).map(f => [f, req.body[f]]));
    const product = await Product.create(productData);

    // ── Send success FIRST, then post-process async ────────────────────
    // Cache invalidation and logging happen after the response is sent
    // so they can NEVER mask a successful creation with a 500.
    const productJson = product.toObject();
    successResponse(res, productJson, 'Product created successfully', 201);

    // ── Non-blocking post-creation operations ─────────────────────────
    setImmediate(async () => {
      try {
        await redisCache.invalidateProductList();
        invalidateProductListCache();
      } catch (err) {
        logger.error(`[createProduct] Cache invalidation failed: ${err.message}`);
      }

      logActivityAsync({
        user: req.user,
        action: ACTIONS.PRODUCT.CREATED,
        targetModel: 'Product',
        targetId: product._id,
        targetName: product.name,
        req,
        metadata: { sku: product.sku, price: product.price, category: product.category }
      });
    });
  } catch (error) {
    logger.error(`[createProduct] ${error.message}`);

    // Mongoose validation error → 400 with field details
    if (error.name === 'ValidationError') {
      const errors = Object.entries(error.errors).map(([field, e]) => ({
        field,
        message: e.message
      }));
      const messages = errors.map(e => e.message);
      return errorResponse(res, messages.join('; '), errors, 400);
    }

    // Mongoose duplicate key (E11000) → 400 with field name
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      return errorResponse(res, `Duplicate value for ${field}: ${error.keyValue?.[field]}`, [{
        field,
        message: `This ${field} already exists`
      }], 400);
    }

    // Mongoose bad ObjectId → 400
    if (error.name === 'CastError') {
      return errorResponse(res, `Invalid ${error.path}: ${error.value}`, [{
        field: error.path,
        message: `Invalid value for ${error.path}`
      }], 400);
    }

    // Everything else → 500
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Update existing product (admin only).
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route PUT /api/products/:id
 * @access Private/Admin
 */
exports.updateProduct = async (req, res) => {
  try {
    if (req.body.price !== undefined) {
      const price = Number(req.body.price);
      if (isNaN(price)) {
return errorResponse(res, 'Invalid price value', null, 400);
}
      req.body.price = price;
    }
    if (req.body.oldPrice !== undefined) {
      const oldPrice = Number(req.body.oldPrice);
      if (isNaN(oldPrice)) {
return errorResponse(res, 'Invalid oldPrice value', null, 400);
}
      req.body.oldPrice = oldPrice;
    }
    if (req.body.stock !== undefined) {
      const stock = Number(req.body.stock);
      if (isNaN(stock)) {
return errorResponse(res, 'Invalid stock value', null, 400);
}
      req.body.stock = stock;
    }

    const oldProduct = await Product.findById(req.params.id).lean();
    if (!oldProduct) {
      return errorResponse(res, 'Product not found', null, 404);
    }

    const allowedFields = ['name', 'slug', 'description', 'brand', 'category', 'price', 'oldPrice', 'stock', 'lowStockThreshold', 'minOrderQty', 'images', 'specifications', 'variants', 'tags', 'badge', 'isActive', 'isFeatured', 'rating', 'reviewCount', 'certifications', 'hasAMC', 'storageTemp', 'hazardClass', 'lotNumber', 'expiryDate', 'tests', 'b2bPrice', 'discountPct'];
    const updateData = Object.fromEntries(allowedFields.filter(f => req.body[f] !== undefined).map(f => [f, req.body[f]]));
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    
    // Invalidate caches using centralized Redis cache service
    await redisCache.invalidateProductList();
    if (product.slug) {
      await redisCache.invalidateProductDetail(product.slug);
    }
    
    // Keep legacy cache invalidation for backward compatibility
    invalidateProductCache(req.params.id);
    invalidateProductListCache();

    const changes = {};
    const fieldsToTrack = ['name', 'price', 'stock', 'isActive', 'category', 'images'];
    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined && String(oldProduct[field]) !== String(req.body[field])) {
        if (!changes.before) {
changes.before = {};
}
        if (!changes.after) {
changes.after = {};
}
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

    logger.info(`[updateProduct] Product ${product._id} updated, cache invalidated`);

    return successResponse(res, product, 'Product updated successfully');
  } catch (error) {
    logger.error(`[updateProduct] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Delete product (admin only).
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route DELETE /api/products/:id
 * @access Private/Admin
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return errorResponse(res, 'Product not found', null, 404);
    }

    // Invalidate caches using centralized Redis cache service
    await redisCache.invalidateProductList();
    if (product.slug) {
      await redisCache.invalidateProductDetail(product.slug);
    }
    
    // Keep legacy cache invalidation for backward compatibility
    invalidateProductCache(req.params.id);
    invalidateProductListCache();

    logActivityAsync({
      user: req.user,
      action: ACTIONS.PRODUCT.DELETED,
      targetModel: 'Product',
      targetId: product._id,
      targetName: product.name,
      req,
      metadata: { sku: product.sku, price: product.price }
    });

    logger.info(`[deleteProduct] Product ${product._id} deleted, cache invalidated`);

    return successResponse(res, null, 'Product deleted successfully');
  } catch (error) {
    logger.error(`[deleteProduct] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Get featured products for homepage.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route GET /api/products/featured
 * @access Public
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    // Use aggregation pipeline for better performance
    const products = await Product.aggregate([
      // Match featured and active products
      {
        $match: {
          isFeatured: true,
          isActive: true
        }
      },
      // Sort by creation date (newest first)
      {
        $sort: { createdAt: -1 }
      },
      // Limit to 6 products
      {
        $limit: 6
      },
      // Lookup category
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup brand
      {
        $lookup: {
          from: 'manufacturers',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand'
        }
      },
      {
        $unwind: {
          path: '$brand',
          preserveNullAndEmptyArrays: true
        }
      },
      // Project only needed fields
      {
        $project: {
          name: 1,
          price: 1,
          images: 1,
          stock: 1,
          discount: 1,
          badge: 1,
          slug: 1,
          isActive: 1,
          createdAt: 1,
          rating: 1,
          oldPrice: 1,
          sku: 1,
          'category._id': 1,
          'category.name': 1,
          'category.slug': 1,
          'brand._id': 1,
          'brand.name': 1,
          'brand.slug': 1,
          'brand.logo': 1
        }
      }
    ]);

    res.set('Cache-Control', 'public, max-age=300');
    return successResponse(res, products);
  } catch (error) {
    logger.error(`[getFeaturedProducts] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Get product counts by category.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route GET /api/products/category-counts
 * @access Public
 */
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
    return successResponse(res, result);
  } catch (error) {
    logger.error(`[getCategoryCounts] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};
