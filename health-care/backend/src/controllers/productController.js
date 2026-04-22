const Product = require('../models/Product');
const CacheService = require('../services/cacheService');
const { invalidateProductCache, invalidateProductListCache } = require('../services/cacheInvalidation');
const logger = require('../utils/logger');

const cacheService = new CacheService();

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
      sortBy,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    let query = { isActive: true };

    if (category && category !== 'undefined') query.category = category;
    if (brand && brand !== 'undefined') query.brand = brand;
    
    // Only add price filter if valid numbers are provided
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
    
    if (search && search.trim() && search !== 'undefined') {
      // Escape special regex characters for safe search
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { $text: { $search: search } },
        { name: { $regex: escaped, $options: 'i' } },
        { brand: { $regex: escaped, $options: 'i' } }
      ];
    }

    let sort = {};
    if (sortBy === 'price-low') sort.price = 1;
    else if (sortBy === 'price-high') sort.price = -1;
    else if (sortBy === 'name') sort.name = 1;
    else sort.createdAt = -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    // HTTP cache for 5 minutes on public product list
    res.set('Cache-Control', 'public, max-age=300');

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
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const idOrSlug = req.params.id;
    const product = await Product.findOne({
      $or: [
        ...(mongoose.isValidObjectId(idOrSlug) ? [{ _id: idOrSlug }] : []),
        { slug: idOrSlug }
      ]
    }).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product, product });
  } catch (error) {
    logger.error(`[getProduct] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    logger.error(`[createProduct] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    invalidateProductCache(req.params.id);

    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    logger.error(`[updateProduct] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    logger.error(`[deleteProduct] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .limit(6)
      .sort({ createdAt: -1 })
      .lean();

    res.set('Cache-Control', 'public, max-age=300');
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    logger.error(`[getFeaturedProducts] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
