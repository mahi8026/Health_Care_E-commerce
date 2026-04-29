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
    const products = await Product.find({});
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
          product.category = category._id;
          await product.save();
          details.push(`✅ Fixed: ${product.name} -> ${category.name}`);
          fixed++;
        } else {
          product.category = null;
          await product.save();
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
      error: error.message
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
    const products = await Product.find({});
    let fixed = 0;
    let skipped = 0;
    const details = [];

    for (const product of products) {
      if (product.brand && typeof product.brand === 'string') {
        const manufacturer = await Manufacturer.findOne({
          name: { $regex: new RegExp(`^${product.brand}$`, 'i') }
        });

        if (manufacturer) {
          product.brand = manufacturer._id;
          await product.save();
          details.push(`✅ Fixed: ${product.name} -> ${manufacturer.name}`);
          fixed++;
        } else {
          product.brand = null;
          await product.save();
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
      error: error.message
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
    const products = await Product.find({}).limit(10);
    const analysis = products.map(p => ({
      name: p.name,
      category: {
        value: p.category,
        type: typeof p.category,
        isObjectId: mongoose.isValidObjectId(p.category)
      },
      brand: {
        value: p.brand,
        type: typeof p.brand,
        isObjectId: mongoose.isValidObjectId(p.brand)
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
      error: error.message
    });
  }
});

module.exports = router;
