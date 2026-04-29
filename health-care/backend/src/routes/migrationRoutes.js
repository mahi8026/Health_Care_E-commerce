const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const mongoose = require('mongoose');

/**
 * @route   GET /api/migration/fix-categories
 * @desc    Fix products with category names instead of ObjectIds
 * @access  Public (should be protected in production)
 */
router.get('/fix-categories', async (req, res) => {
  try {
    const products = await Product.find({}).lean(); // Use .lean() to get plain objects
    let fixed = 0;
    let skipped = 0;
    let errors = 0;
    const details = [];

    for (const product of products) {
      if (product.category && typeof product.category === 'string') {
        const category = await Category.findOne({
          name: { $regex: new RegExp(`^${product.category}$`, 'i') }
        });

        if (category) {
          await Product.updateOne(
            { _id: product._id },
            { $set: { category: category._id } }
          );
          details.push(`✅ Fixed: ${product.name} -> ${category.name}`);
          fixed++;
        } else {
          await Product.updateOne(
            { _id: product._id },
            { $set: { category: null } }
          );
          details.push(`⚠️ Not found: ${product.name} (category: ${product.category})`);
          errors++;
        }
      } else {
        skipped++;
      }
    }

    res.json({
      success: true,
      summary: { fixed, skipped, errors, total: products.length },
      details
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @route   GET /api/migration/fix-brands
 * @desc    Fix products with brand names instead of ObjectIds
 * @access  Public (should be protected in production)
 */
router.get('/fix-brands', async (req, res) => {
  try {
    const products = await Product.find({}).lean(); // Use .lean() to get plain objects
    let fixed = 0;
    let skipped = 0;
    const details = [];

    for (const product of products) {
      if (product.brand && typeof product.brand === 'string') {
        const manufacturer = await Manufacturer.findOne({
          name: { $regex: new RegExp(`^${product.brand}$`, 'i') }
        });

        if (manufacturer) {
          await Product.updateOne(
            { _id: product._id },
            { $set: { brand: manufacturer._id } }
          );
          details.push(`✅ Fixed: ${product.name} -> ${manufacturer.name}`);
          fixed++;
        } else {
          await Product.updateOne(
            { _id: product._id },
            { $set: { brand: null } }
          );
          details.push(`⚠️ Not found: ${product.name} (brand: ${product.brand})`);
        }
      } else {
        skipped++;
      }
    }

    res.json({
      success: true,
      summary: { fixed, skipped, total: products.length },
      details
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @route   GET /api/migration/status
 * @desc    Check database status
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const products = await Product.find({}).limit(10).lean();
    const analysis = products.map(p => ({
      name: p.name,
      category: {
        value: p.category,
        type: typeof p.category,
        isObjectId: mongoose.isValidObjectId(p.category),
        isString: typeof p.category === 'string'
      },
      brand: {
        value: p.brand,
        type: typeof p.brand,
        isObjectId: mongoose.isValidObjectId(p.brand),
        isString: typeof p.brand === 'string'
      }
    }));

    res.json({
      success: true,
      totalProducts: await Product.countDocuments(),
      sample: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @route   GET /api/migration/test-query
 * @desc    Test product query to see exact error
 * @access  Public
 */
router.get('/test-query', async (req, res) => {
  try {
    // Test 1: Get products without populate
    const productsRaw = await Product.find({ isActive: true }).limit(2).lean();
    
    // Test 2: Try to populate
    let productsPopulated = null;
    let populateError = null;
    try {
      productsPopulated = await Product.find({ isActive: true })
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .limit(2)
        .lean();
    } catch (err) {
      populateError = {
        message: err.message,
        stack: err.stack
      };
    }

    res.json({
      success: true,
      test1_raw: productsRaw,
      test2_populated: productsPopulated,
      test2_error: populateError
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
