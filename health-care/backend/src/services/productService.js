/**
 * Product Service
 * 
 * Business logic layer for product operations.
 * Handles complex calculations, data transformations, and multi-model operations.
 */

const { CACHE_KEYS } = require('./redisCache');
const redisCache = require('./redisCache');
const { invalidateProductListCache } = require('./cacheInvalidation');

/**
 * Category code mapping for SKU generation
 */
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
 * 
 * @param {string} categoryName - Category name
 * @returns {string} 2-letter category code
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
 * 
 * @param {string} brandName - Brand/manufacturer name
 * @returns {string} 3-letter brand code
 */
function getBrandCode(brandName = '') {
  const clean = brandName.replace(/[^A-Za-z\s]/g, '').trim();
  // Remove common filler words
  const words = clean.split(/\s+/).filter(w => 
    !['the','and','of','co','ltd','inc','corp','group'].includes(w.toLowerCase())
  );
  const joined = words.join('');
  return joined.substring(0, 3).toUpperCase() || 'GEN';
}

/**
 * Generate next available SKU for a category + brand combination
 * 
 * @param {Object} category - Category document with name
 * @param {Object} brand - Brand/manufacturer document with name
 * @param {Function} findExistingSKUs - Repository function to find existing SKUs
 * @returns {Promise<Object>} SKU details { sku, prefix, sequence }
 */
async function generateSKU(category, brand, findExistingSKUs) {
  const catCode = getCategoryCode(category.name);
  const brandCode = getBrandCode(brand.name);
  const prefix = `MC-${catCode}-${brandCode}-`;

  // Find the highest existing sequence number for this prefix
  const existing = await findExistingSKUs(prefix);

  let maxSeq = 0;
  for (const p of existing) {
    const seq = parseInt(p.sku.replace(prefix, ''), 10);
    if (!isNaN(seq) && seq > maxSeq) {
maxSeq = seq;
}
  }

  const nextSeq = maxSeq + 1;
  const sku = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  return { sku, prefix, sequence: nextSeq };
}

/**
 * Validate and normalize product price data
 * 
 * @param {Object} productData - Product data with price fields
 * @returns {Object} Normalized product data
 * @throws {Error} If price values are invalid
 */
function validateAndNormalizePrices(productData) {
  const normalized = { ...productData };

  if (normalized.price !== undefined) {
    const price = Number(normalized.price);
    if (isNaN(price)) {
      throw new Error('Invalid price value');
    }
    normalized.price = price;
  }

  if (normalized.oldPrice !== undefined) {
    const oldPrice = Number(normalized.oldPrice);
    if (isNaN(oldPrice)) {
      throw new Error('Invalid oldPrice value');
    }
    normalized.oldPrice = oldPrice;
  }

  if (normalized.stock !== undefined) {
    const stock = Number(normalized.stock);
    if (isNaN(stock)) {
      throw new Error('Invalid stock value');
    }
    normalized.stock = stock;
  }

  return normalized;
}

/**
 * Build product query filters from request parameters
 * 
 * @param {Object} params - Query parameters
 * @param {Object} user - Current user (for role-based filtering)
 * @param {Function} resolveCategoryId - Repository function to resolve category name to ID
 * @param {Function} resolveBrandId - Repository function to resolve brand name to ID
 * @returns {Promise<Object>} MongoDB query object
 */
async function buildProductQuery(params, user, resolveCategoryId, resolveBrandId) {
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
    isActive
  } = params;

  const query = {};

  // Active status filter
  if (isActive === 'true') {
    query.isActive = true;
  } else if (isActive === 'false') {
    query.isActive = false;
  } else if (!user || user.role !== 'admin') {
    // Public users only see active products
    query.isActive = true;
  }

  // Featured filter
  if (isFeatured === 'true') {
    query.isFeatured = true;
  }

  // Category filter
  if (category && category !== 'undefined' && category.trim() !== '') {
    const categoryId = await resolveCategoryId(category);
    if (categoryId === null) {
      // No matching category — return query that will match nothing
      query._id = { $in: [] };
      return query;
    }
    query.category = categoryId;
  }

  // Brand filter
  if (brand && brand !== 'undefined' && brand.trim() !== '') {
    const brandId = await resolveBrandId(brand);
    if (brandId) {
      query.brand = brandId;
    }
  }

  // Stock filters
  if (inStock === 'true') {
    query.stock = { $gt: 0 };
  } else if (lowStock === 'true') {
    query.$expr = {
      $and: [
        { $gt: ['$stock', 0] },
        { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }] }
      ]
    };
  } else if (outOfStock === 'true') {
    query.stock = 0;
  }

  // Price range filter
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

  // Search filter
  if (search && search.trim() && search !== 'undefined') {
    const searchTerm = search.trim();
    const escaped = searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    
    query.$or = [
      { sku: searchTerm.toUpperCase() },
      { name: { $regex: searchRegex } },
      { tags: { $in: [searchRegex] } },
      { description: { $regex: searchRegex } },
    ];
  }

  return query;
}

/**
 * Build sort options from sortBy parameter
 * 
 * @param {string} sortBy - Sort parameter
 * @returns {Object} MongoDB sort object
 */
function buildSortOptions(sortBy) {
  const sort = {};
  
  if (sortBy === 'price-low' || sortBy === 'price_asc') {
    sort.price = 1;
  } else if (sortBy === 'price-high' || sortBy === 'price_desc') {
    sort.price = -1;
  } else if (sortBy === 'name' || sortBy === 'name_asc') {
    sort.name = 1;
  } else if (sortBy === 'name_desc') {
    sort.name = -1;
  } else if (sortBy === 'newest') {
    sort.createdAt = -1;
  } else if (sortBy === 'rating') {
    sort['rating.average'] = -1;
  } else {
    sort.createdAt = -1;
  }

  return sort;
}

/**
 * Invalidate all product-related caches
 * 
 * @param {string} productSlug - Optional product slug for detail cache invalidation
 */
async function invalidateProductCaches(productSlug = null) {
  // Invalidate memory cache
  invalidateProductListCache();
  
  // Invalidate Redis cache
  const { invalidateCache } = require('../middleware/cache');
  await invalidateCache(`${CACHE_KEYS.PRODUCTS_LIST}:*`);
  
  if (productSlug) {
    const { generateProductDetailKey } = redisCache;
    await invalidateCache(generateProductDetailKey(productSlug));
  }
}

/**
 * Track product changes for activity logging
 * 
 * @param {Object} oldProduct - Product before update
 * @param {Object} newData - New product data
 * @returns {Object} Changes object with before/after
 */
function trackProductChanges(oldProduct, newData) {
  const changes = {};
  const fieldsToTrack = ['name', 'price', 'stock', 'isActive', 'category', 'images'];
  
  fieldsToTrack.forEach(field => {
    if (newData[field] !== undefined && String(oldProduct[field]) !== String(newData[field])) {
      if (!changes.before) {
changes.before = {};
}
      if (!changes.after) {
changes.after = {};
}
      changes.before[field] = oldProduct[field];
      changes.after[field] = newData[field];
    }
  });

  return Object.keys(changes).length > 0 ? changes : undefined;
}

module.exports = {
  generateSKU,
  validateAndNormalizePrices,
  buildProductQuery,
  buildSortOptions,
  invalidateProductCaches,
  trackProductChanges,
  getCategoryCode,
  getBrandCode
};
